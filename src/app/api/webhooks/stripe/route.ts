import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendOrderConfirmationEmail, sendSellerNewOrderEmail } from "@/lib/emails";
import Stripe from "stripe";

export async function POST(req: Request) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeKey || !webhookSecret) {
    return NextResponse.json(
      { error: "Stripe is not configured" },
      { status: 503 }
    );
  }

  const stripe = new Stripe(stripeKey, { typescript: true });
  let event: Stripe.Event;

  try {
    const body = await req.text();
    const sig = req.headers.get("stripe-signature")!;
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("[STRIPE_WEBHOOK] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.orderId;

        if (!orderId) {
          console.error("[STRIPE_WEBHOOK] No orderId in session metadata");
          break;
        }

        // Update order status to CONFIRMED
        const order = await prisma.order.update({
          where: { id: orderId },
          data: {
            status: "CONFIRMED",
            stripePaymentId: session.id,
          },
          include: {
            buyer: { select: { email: true, name: true } },
            address: true,
            items: {
              include: {
                product: { select: { title: true } },
                variant: { select: { name: true } },
                seller: {
                  select: {
                    id: true,
                    shopName: true,
                    user: { select: { email: true } },
                  },
                },
              },
            },
          },
        });

        // Update order items status
        await prisma.orderItem.updateMany({
          where: { orderId: order.id },
          data: { status: "CONFIRMED" },
        });

        // Decrement stock for each item
        for (const item of order.items) {
          if (item.variantId && item.variant) {
            await prisma.productVariant.update({
              where: { id: item.variantId },
              data: { stock: { decrement: item.quantity } },
            });
          } else {
            await prisma.product.update({
              where: { id: item.productId },
              data: { stock: { decrement: item.quantity } },
            });
          }
        }

        // Increment seller total sales
        const sellerIds = [...new Set(order.items.map((i) => i.sellerId))];
        for (const sellerId of sellerIds) {
          const sellerItemsCount = order.items
            .filter((i) => i.sellerId === sellerId)
            .reduce((sum, i) => sum + i.quantity, 0);

          await prisma.sellerProfile.update({
            where: { id: sellerId },
            data: { totalSales: { increment: sellerItemsCount } },
          });
        }

        // Clear buyer's cart
        const userId = session.metadata?.userId;
        if (userId) {
          await prisma.cartItem.deleteMany({ where: { userId } });
        }

        // ── Send confirmation email to buyer ──
        await sendOrderConfirmationEmail({
          buyerEmail: order.buyer.email,
          buyerName: order.buyer.name || "Client",
          orderNumber: order.orderNumber,
          orderId: order.id,
          items: order.items.map((item) => ({
            title: item.product.title,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.subtotal,
            sellerName: item.seller.shopName,
            variantName: item.variant?.name,
          })),
          subtotal: order.subtotal,
          shippingTotal: order.shippingTotal,
          total: order.total,
          address: {
            firstName: order.address.firstName,
            lastName: order.address.lastName,
            street: order.address.street,
            street2: order.address.street2,
            city: order.address.city,
            zip: order.address.zip,
            country: order.address.country,
          },
        });

        // ── Send notification to each seller ──
        const sellerGroups = new Map<string, typeof order.items>();
        for (const item of order.items) {
          const group = sellerGroups.get(item.sellerId) || [];
          group.push(item);
          sellerGroups.set(item.sellerId, group);
        }

        for (const [, items] of sellerGroups) {
          const seller = items[0].seller;
          await sendSellerNewOrderEmail({
            sellerEmail: seller.user.email,
            sellerName: seller.shopName,
            orderNumber: order.orderNumber,
            items: items.map((item) => ({
              title: item.product.title,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              variantName: item.variant?.name,
            })),
            buyerCity: order.address.city,
          });
        }

        console.log(`[STRIPE_WEBHOOK] Order ${order.orderNumber} confirmed + emails sent`);
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.orderId;

        if (orderId) {
          await prisma.order.update({
            where: { id: orderId },
            data: { status: "CANCELLED" },
          });
          console.log(`[STRIPE_WEBHOOK] Order ${orderId} cancelled (session expired)`);
        }
        break;
      }

      case "account.updated": {
        const account = event.data.object as Stripe.Account;
        if (account.id) {
          const isOnboarded = !!(account.charges_enabled && account.details_submitted);
          await prisma.sellerProfile.updateMany({
            where: { stripeAccountId: account.id },
            data: { stripeOnboarded: isOnboarded },
          });
          console.log(`[STRIPE_WEBHOOK] Account ${account.id} updated, onboarded: ${isOnboarded}`);
        }
        break;
      }

      default:
        // Unhandled event type
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[STRIPE_WEBHOOK] Error processing event:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}

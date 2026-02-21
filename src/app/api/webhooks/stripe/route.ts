import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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
            items: {
              include: {
                product: true,
                variant: true,
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

        console.log(`[STRIPE_WEBHOOK] Order ${order.orderNumber} confirmed`);
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

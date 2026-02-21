import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { generateOrderNumber } from "@/lib/utils";
import { z } from "zod";

const checkoutSchema = z.object({
  addressId: z.string().min(1),
  notes: z.string().optional(),
  address: z
    .object({
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      street: z.string().min(1),
      street2: z.string().optional(),
      city: z.string().min(1),
      zip: z.string().min(1),
      country: z.string().default("FR"),
      phone: z.string().optional(),
    })
    .optional(),
});

const COMMISSION_RATE = 0.20; // 20% platform commission

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message ?? "Données invalides" },
        { status: 400 }
      );
    }

    let { addressId } = parsed.data;
    const { notes, address: inlineAddress } = parsed.data;

    // If inline address provided (not saved), create it
    if (inlineAddress && !addressId) {
      const newAddr = await prisma.address.create({
        data: { userId: user.id, ...inlineAddress },
      });
      addressId = newAddr.id;
    }

    // Verify address belongs to user
    const address = await prisma.address.findFirst({
      where: { id: addressId, userId: user.id },
    });
    if (!address) {
      return NextResponse.json(
        { success: false, error: "Adresse non trouvée" },
        { status: 404 }
      );
    }

    // Get cart items
    const cartItems = await prisma.cartItem.findMany({
      where: { userId: user.id },
      include: {
        product: {
          include: {
            seller: { select: { id: true, shopName: true, commission: true } },
          },
        },
        variant: true,
      },
    });

    if (cartItems.length === 0) {
      return NextResponse.json(
        { success: false, error: "Votre panier est vide" },
        { status: 400 }
      );
    }

    // Validate stock and calculate totals
    let subtotal = 0;
    const orderItemsData = [];

    for (const item of cartItems) {
      if (item.product.status !== "ACTIVE") {
        return NextResponse.json(
          { success: false, error: `"${item.product.title}" n'est plus disponible` },
          { status: 400 }
        );
      }

      const stockAvailable = item.variant ? item.variant.stock : item.product.stock;
      if (item.quantity > stockAvailable) {
        return NextResponse.json(
          {
            success: false,
            error: `Stock insuffisant pour "${item.product.title}" (${stockAvailable} disponible${stockAvailable > 1 ? "s" : ""})`,
          },
          { status: 400 }
        );
      }

      const unitPrice = item.variant?.price ?? item.product.price;
      const itemSubtotal = unitPrice * item.quantity;
      const commission = itemSubtotal * (item.product.seller.commission ?? COMMISSION_RATE);

      subtotal += itemSubtotal;

      orderItemsData.push({
        productId: item.product.id,
        variantId: item.variantId,
        sellerId: item.product.seller.id,
        quantity: item.quantity,
        unitPrice,
        subtotal: itemSubtotal,
        commission,
      });
    }

    const shippingTotal = subtotal >= 150 ? 0 : 9.90;
    const total = subtotal + shippingTotal;
    const commissionTotal = orderItemsData.reduce((sum, i) => sum + i.commission, 0);

    // Check if Stripe is configured
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    const hasStripe = stripeKey && stripeKey.length > 10;

    if (hasStripe) {
      // Dynamic import Stripe only when configured
      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(stripeKey, { typescript: true });

      // Create order in PENDING status
      const order = await prisma.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          buyerId: user.id,
          addressId,
          subtotal,
          shippingTotal,
          total,
          commissionTotal,
          notes,
          items: {
            create: orderItemsData,
          },
        },
      });

      // Build Stripe line items
      const lineItems = cartItems.map((item) => {
        const unitPrice = item.variant?.price ?? item.product.price;
        return {
          price_data: {
            currency: "eur",
            product_data: {
              name: item.product.title + (item.variant ? ` — ${item.variant.name}` : ""),
              images: item.product.images.length > 0 ? [item.product.images[0]] : undefined,
              metadata: {
                productId: item.product.id,
                variantId: item.variantId || "",
              },
            },
            unit_amount: Math.round(unitPrice * 100), // Stripe uses cents
          },
          quantity: item.quantity,
        };
      });

      // Add shipping if not free
      if (shippingTotal > 0) {
        lineItems.push({
          price_data: {
            currency: "eur",
            product_data: {
              name: "Frais de livraison",
              images: undefined,
              metadata: { productId: "", variantId: "" },
            },
            unit_amount: Math.round(shippingTotal * 100),
          },
          quantity: 1,
        });
      }

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3006";

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        line_items: lineItems,
        customer_email: user.email,
        metadata: {
          orderId: order.id,
          userId: user.id,
        },
        success_url: `${appUrl}/checkout/confirmation?order=${order.id}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appUrl}/cart`,
      });

      // Save Stripe payment ID
      await prisma.order.update({
        where: { id: order.id },
        data: { stripePaymentId: session.id },
      });

      return NextResponse.json({
        success: true,
        data: { url: session.url, orderId: order.id },
      });
    } else {
      // Demo mode: create order directly as CONFIRMED (no Stripe)
      const order = await prisma.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          buyerId: user.id,
          addressId,
          status: "CONFIRMED",
          subtotal,
          shippingTotal,
          total,
          commissionTotal,
          notes,
          items: {
            create: orderItemsData.map((item) => ({
              ...item,
              status: "CONFIRMED",
            })),
          },
        },
      });

      // Decrement stock
      for (const item of cartItems) {
        if (item.variantId) {
          await prisma.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { decrement: item.quantity } },
          });
        } else {
          await prisma.product.update({
            where: { id: item.product.id },
            data: { stock: { decrement: item.quantity } },
          });
        }
      }

      // Clear cart
      await prisma.cartItem.deleteMany({ where: { userId: user.id } });

      return NextResponse.json({
        success: true,
        data: { orderId: order.id },
      });
    }
  } catch (error) {
    console.error("[CHECKOUT_POST]", error);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const addToCartSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().nullable().optional(),
  quantity: z.number().int().min(1).max(20).default(1),
});

/* ── GET /api/cart — Récupérer le panier ── */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 });
    }

    const items = await prisma.cartItem.findMany({
      where: { userId: user.id },
      include: {
        product: {
          include: {
            seller: {
              select: { id: true, shopName: true, slug: true },
            },
          },
        },
        variant: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Map to CartItem shape for the store
    const cartItems = items.map((item) => ({
      id: item.id,
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
      product: {
        id: item.product.id,
        title: item.product.title,
        slug: item.product.slug,
        price: item.product.price,
        comparePrice: item.product.comparePrice,
        images: item.product.images,
        seller: item.product.seller,
      },
      variant: item.variant
        ? { id: item.variant.id, name: item.variant.name, price: item.variant.price }
        : null,
    }));

    return NextResponse.json({ success: true, data: cartItems });
  } catch (error) {
    console.error("[CART_GET]", error);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}

/* ── POST /api/cart — Ajouter au panier ── */
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = addToCartSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message ?? "Données invalides" },
        { status: 400 }
      );
    }

    const { productId, variantId, quantity } = parsed.data;

    // Verify product exists and is active
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        seller: { select: { id: true, shopName: true, slug: true } },
        variants: true,
      },
    });

    if (!product || product.status !== "ACTIVE") {
      return NextResponse.json(
        { success: false, error: "Produit non disponible" },
        { status: 404 }
      );
    }

    // Verify variant if provided
    let variant = null;
    if (variantId) {
      variant = product.variants.find((v) => v.id === variantId);
      if (!variant) {
        return NextResponse.json(
          { success: false, error: "Variante non trouvée" },
          { status: 404 }
        );
      }
    }

    // Check stock
    const stockAvailable = variantId && variant ? variant.stock : product.stock;
    if (stockAvailable < quantity) {
      return NextResponse.json(
        { success: false, error: `Stock insuffisant (${stockAvailable} disponible${stockAvailable > 1 ? "s" : ""})` },
        { status: 400 }
      );
    }

    // Check if item already exists in cart
    const existing = await prisma.cartItem.findFirst({
      where: {
        userId: user.id,
        productId,
        variantId: variantId ?? null,
      },
    });

    let cartItemId: string;

    if (existing) {
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: { increment: quantity } },
      });
      cartItemId = existing.id;
    } else {
      const created = await prisma.cartItem.create({
        data: {
          userId: user.id,
          productId,
          variantId: variantId ?? null,
          quantity,
        },
      });
      cartItemId = created.id;
    }

    // Fetch the full cart item with relations
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: {
        product: {
          include: {
            seller: { select: { id: true, shopName: true, slug: true } },
          },
        },
        variant: true,
      },
    });

    if (!cartItem) {
      return NextResponse.json({ success: false, error: "Erreur interne" }, { status: 500 });
    }

    const result = {
      id: cartItem.id,
      productId: cartItem.productId,
      variantId: cartItem.variantId,
      quantity: cartItem.quantity,
      product: {
        id: cartItem.product.id,
        title: cartItem.product.title,
        slug: cartItem.product.slug,
        price: cartItem.product.price,
        comparePrice: cartItem.product.comparePrice,
        images: cartItem.product.images,
        seller: cartItem.product.seller,
      },
      variant: cartItem.variant
        ? { id: cartItem.variant.id, name: cartItem.variant.name, price: cartItem.variant.price }
        : null,
    };

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("[CART_POST]", error);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}

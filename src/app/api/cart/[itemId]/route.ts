import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const updateCartSchema = z.object({
  quantity: z.number().int().min(1).max(20),
});

/* ── PATCH /api/cart/[itemId] — Modifier la quantité ── */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 });
    }

    const { itemId } = await params;
    const body = await req.json();
    const parsed = updateCartSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Quantité invalide" },
        { status: 400 }
      );
    }

    // Verify ownership
    const cartItem = await prisma.cartItem.findFirst({
      where: { id: itemId, userId: user.id },
      include: { product: true, variant: true },
    });

    if (!cartItem) {
      return NextResponse.json(
        { success: false, error: "Article non trouvé" },
        { status: 404 }
      );
    }

    // Check stock
    const stockAvailable = cartItem.variant ? cartItem.variant.stock : cartItem.product.stock;
    if (parsed.data.quantity > stockAvailable) {
      return NextResponse.json(
        { success: false, error: `Stock insuffisant (${stockAvailable} disponible${stockAvailable > 1 ? "s" : ""})` },
        { status: 400 }
      );
    }

    const updated = await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity: parsed.data.quantity },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("[CART_PATCH]", error);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}

/* ── DELETE /api/cart/[itemId] — Supprimer un article ── */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 });
    }

    const { itemId } = await params;

    // Verify ownership then delete
    const cartItem = await prisma.cartItem.findFirst({
      where: { id: itemId, userId: user.id },
    });

    if (!cartItem) {
      return NextResponse.json(
        { success: false, error: "Article non trouvé" },
        { status: 404 }
      );
    }

    await prisma.cartItem.delete({ where: { id: itemId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[CART_DELETE]", error);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}

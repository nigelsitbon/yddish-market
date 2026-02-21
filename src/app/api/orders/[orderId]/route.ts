import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

/* ── GET /api/orders/[orderId] — Détail d'une commande ── */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 });
    }

    const { orderId } = await params;

    const order = await prisma.order.findFirst({
      where: { id: orderId, buyerId: user.id },
      include: {
        address: true,
        items: {
          include: {
            product: {
              select: { title: true, slug: true, images: true },
            },
            variant: {
              select: { name: true },
            },
            seller: {
              select: { shopName: true, slug: true },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Commande non trouvée" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: order });
  } catch (error) {
    console.error("[ORDER_GET]", error);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

/* ── GET /api/orders — List buyer's orders ── */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 });
    }

    const orders = await prisma.order.findMany({
      where: { buyerId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
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

    return NextResponse.json({ success: true, data: orders });
  } catch (error) {
    console.error("[ORDERS_LIST]", error);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}

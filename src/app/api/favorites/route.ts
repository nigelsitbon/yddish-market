import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

/* ── GET /api/favorites — Liste des favoris de l'utilisateur ── */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 });
    }

    const favorites = await prisma.favorite.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            slug: true,
            price: true,
            comparePrice: true,
            images: true,
            seller: {
              select: {
                shopName: true,
                slug: true,
                verified: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: favorites });
  } catch (error) {
    console.error("[FAVORITES_GET]", error);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}

/* ── POST /api/favorites — Toggle favori (ajouter/retirer) ── */
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 });
    }

    const { productId } = await req.json();
    if (!productId || typeof productId !== "string") {
      return NextResponse.json({ success: false, error: "productId requis" }, { status: 400 });
    }

    // Check if favorite already exists
    const existing = await prisma.favorite.findUnique({
      where: {
        userId_productId: {
          userId: user.id,
          productId,
        },
      },
    });

    if (existing) {
      // Remove favorite
      await prisma.favorite.delete({
        where: { id: existing.id },
      });
      return NextResponse.json({ success: true, favorited: false });
    } else {
      // Add favorite
      await prisma.favorite.create({
        data: {
          userId: user.id,
          productId,
        },
      });
      return NextResponse.json({ success: true, favorited: true });
    }
  } catch (error) {
    console.error("[FAVORITES_POST]", error);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}

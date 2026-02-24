import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

/* ── POST /api/reviews — Submit a review ── */
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 });
    }

    const body = await req.json();
    const { productId, rating, comment } = body;

    // Validate
    if (!productId || typeof productId !== "string") {
      return NextResponse.json({ success: false, error: "Produit invalide" }, { status: 400 });
    }

    if (!rating || typeof rating !== "number" || rating < 1 || rating > 5) {
      return NextResponse.json({ success: false, error: "Note invalide (1-5)" }, { status: 400 });
    }

    // Check product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, sellerId: true },
    });

    if (!product) {
      return NextResponse.json({ success: false, error: "Produit introuvable" }, { status: 404 });
    }

    // Check if user is the seller (sellers can't review their own products)
    if (user.sellerProfile?.id === product.sellerId) {
      return NextResponse.json(
        { success: false, error: "Vous ne pouvez pas noter vos propres produits" },
        { status: 403 }
      );
    }

    // Check if buyer has purchased this product (verified review)
    const hasPurchased = await prisma.orderItem.findFirst({
      where: {
        productId,
        order: {
          buyerId: user.id,
          status: { in: ["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"] },
        },
      },
    });

    // Check if already reviewed
    const existingReview = await prisma.review.findUnique({
      where: { userId_productId: { userId: user.id, productId } },
    });

    if (existingReview) {
      // Update existing review
      const updated = await prisma.review.update({
        where: { id: existingReview.id },
        data: {
          rating,
          comment: comment?.trim() || null,
          verified: !!hasPurchased,
        },
        include: {
          user: { select: { name: true } },
        },
      });

      // Recalculate seller rating
      await updateSellerRating(product.sellerId);

      return NextResponse.json({ success: true, data: updated });
    }

    // Create new review
    const review = await prisma.review.create({
      data: {
        userId: user.id,
        productId,
        rating,
        comment: comment?.trim() || null,
        verified: !!hasPurchased,
      },
      include: {
        user: { select: { name: true } },
      },
    });

    // Update seller rating
    await updateSellerRating(product.sellerId);

    return NextResponse.json({ success: true, data: review });
  } catch (error) {
    console.error("[REVIEW_POST]", error);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}

/* ── Helper: Recalculate seller's average rating ── */
async function updateSellerRating(sellerId: string) {
  const result = await prisma.review.aggregate({
    where: {
      product: { sellerId },
    },
    _avg: { rating: true },
  });

  if (result._avg.rating !== null) {
    await prisma.sellerProfile.update({
      where: { id: sellerId },
      data: { rating: Math.round(result._avg.rating * 10) / 10 },
    });
  }
}

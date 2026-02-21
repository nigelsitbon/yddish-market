import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

/* ── GET /api/dashboard/payouts — Liste des versements vendeur ── */
export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user?.sellerProfile) {
      return NextResponse.json({ success: false, error: "Non autorisé" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { sellerId: user.sellerProfile.id };
    if (status && ["PENDING", "PROCESSING", "COMPLETED", "FAILED"].includes(status)) {
      where.status = status;
    }

    const [payouts, total] = await Promise.all([
      prisma.payout.findMany({
        where,
        include: {
          orderItem: {
            select: {
              id: true,
              quantity: true,
              unitPrice: true,
              subtotal: true,
              shippingAmount: true,
              order: { select: { orderNumber: true } },
              product: { select: { title: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.payout.count({ where }),
    ]);

    // Summary stats
    const stats = await prisma.payout.groupBy({
      by: ["status"],
      where: { sellerId: user.sellerProfile.id },
      _sum: { amount: true },
      _count: true,
    });

    const summary = {
      totalCompleted: 0,
      totalPending: 0,
      countCompleted: 0,
      countPending: 0,
      countFailed: 0,
    };

    for (const s of stats) {
      if (s.status === "COMPLETED") {
        summary.totalCompleted = s._sum.amount ?? 0;
        summary.countCompleted = s._count;
      } else if (s.status === "PENDING") {
        summary.totalPending = s._sum.amount ?? 0;
        summary.countPending = s._count;
      } else if (s.status === "FAILED") {
        summary.countFailed = s._count;
      }
    }

    return NextResponse.json({
      success: true,
      data: { payouts, total, page, limit, summary },
    });
  } catch (error) {
    console.error("[DASHBOARD_PAYOUTS_GET]", error);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}

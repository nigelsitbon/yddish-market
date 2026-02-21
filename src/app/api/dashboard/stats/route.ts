import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user?.sellerProfile) {
      return NextResponse.json({ success: false, error: "Non autorisé" }, { status: 403 });
    }

    const sellerId = user.sellerProfile.id;

    // Parallel queries for stats
    const [
      totalProducts,
      activeProducts,
      totalOrderItems,
      pendingOrderItems,
      revenueResult,
      recentOrders,
    ] = await Promise.all([
      prisma.product.count({ where: { sellerId } }),
      prisma.product.count({ where: { sellerId, status: "ACTIVE" } }),
      prisma.orderItem.count({ where: { sellerId } }),
      prisma.orderItem.count({
        where: { sellerId, status: { in: ["PENDING", "CONFIRMED", "PROCESSING"] } },
      }),
      prisma.orderItem.aggregate({
        where: { sellerId, status: { notIn: ["CANCELLED", "REFUNDED"] } },
        _sum: { subtotal: true, commission: true },
      }),
      prisma.orderItem.findMany({
        where: { sellerId },
        include: {
          order: { select: { orderNumber: true, createdAt: true } },
          product: { select: { title: true, slug: true, images: true } },
          variant: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

    const totalRevenue = (revenueResult._sum.subtotal ?? 0) - (revenueResult._sum.commission ?? 0);
    const totalSales = revenueResult._sum.subtotal ?? 0;

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalProducts,
          activeProducts,
          totalOrders: totalOrderItems,
          pendingOrders: pendingOrderItems,
          totalRevenue,
          totalSales,
          commission: revenueResult._sum.commission ?? 0,
        },
        recentOrders,
      },
    });
  } catch (error) {
    console.error("[DASHBOARD_STATS]", error);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}

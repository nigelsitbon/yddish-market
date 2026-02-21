import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalUsers,
      totalSellers,
      totalOrders,
      revenueResult,
      commissionResult,
      totalProducts,
      newUsersThisMonth,
      pendingOrders,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.sellerProfile.count(),
      prisma.order.count(),
      prisma.order.aggregate({
        _sum: { total: true },
        where: {
          status: { notIn: ["CANCELLED", "REFUNDED"] },
        },
      }),
      prisma.order.aggregate({
        _sum: { commissionTotal: true },
      }),
      prisma.product.count(),
      prisma.user.count({
        where: { createdAt: { gte: firstDayOfMonth } },
      }),
      prisma.order.count({
        where: { status: { in: ["PENDING", "CONFIRMED"] } },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalUsers,
        totalSellers,
        totalOrders,
        totalRevenue: revenueResult._sum.total ?? 0,
        totalCommission: commissionResult._sum.commissionTotal ?? 0,
        totalProducts,
        newUsersThisMonth,
        pendingOrders,
      },
    });
  } catch (error) {
    console.error("[ADMIN_STATS]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

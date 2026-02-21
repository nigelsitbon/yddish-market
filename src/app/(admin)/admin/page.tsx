import { AdminOverview } from "@/components/admin/admin-overview";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata = { title: "Administration — YDDISH MARKET" };

async function getAdminStats() {
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
      where: { status: { notIn: ["CANCELLED", "REFUNDED"] } },
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

  return {
    totalUsers,
    totalSellers,
    totalOrders,
    totalRevenue: revenueResult._sum.total ?? 0,
    totalCommission: commissionResult._sum.commissionTotal ?? 0,
    totalProducts,
    newUsersThisMonth,
    pendingOrders,
  };
}

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    redirect("/");
  }

  const stats = await getAdminStats();

  return <AdminOverview stats={stats} />;
}

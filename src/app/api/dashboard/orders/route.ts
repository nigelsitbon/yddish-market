import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user?.sellerProfile) {
      return NextResponse.json({ success: false, error: "Non autorisé" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 20;

    const where: Record<string, unknown> = { sellerId: user.sellerProfile.id };
    if (status && status !== "all") {
      where.status = status;
    }

    const [items, total] = await Promise.all([
      prisma.orderItem.findMany({
        where,
        include: {
          order: {
            select: {
              orderNumber: true,
              createdAt: true,
              buyer: { select: { name: true, email: true } },
              address: {
                select: {
                  firstName: true,
                  lastName: true,
                  city: true,
                  country: true,
                },
              },
            },
          },
          product: { select: { title: true, slug: true, images: true } },
          variant: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.orderItem.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: { orders: items, total, page, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("[DASHBOARD_ORDERS_GET]", error);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}

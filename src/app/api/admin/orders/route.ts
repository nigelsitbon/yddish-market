import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    const { searchParams } = request.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
    const status = searchParams.get("status") as OrderStatus | null;
    const search = searchParams.get("search") ?? undefined;

    const where = {
      ...(status && { status }),
      ...(search && {
        orderNumber: { contains: search, mode: "insensitive" as const },
      }),
    };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        select: {
          id: true,
          orderNumber: true,
          status: true,
          total: true,
          commissionTotal: true,
          createdAt: true,
          buyer: {
            select: { name: true, email: true },
          },
          items: {
            select: {
              id: true,
              quantity: true,
              unitPrice: true,
              subtotal: true,
              commission: true,
              status: true,
              seller: {
                select: { shopName: true },
              },
              product: {
                select: { id: true, title: true, slug: true, images: true },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        orders,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("[ADMIN_ORDERS_GET]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

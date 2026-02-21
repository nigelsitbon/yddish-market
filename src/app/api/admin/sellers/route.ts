import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
    const search = searchParams.get("search") ?? undefined;
    const verifiedParam = searchParams.get("verified");

    const where = {
      ...(search && {
        shopName: { contains: search, mode: "insensitive" as const },
      }),
      ...(verifiedParam !== null &&
        verifiedParam !== undefined && {
          verified: verifiedParam === "true",
        }),
    };

    const [sellers, total] = await Promise.all([
      prisma.sellerProfile.findMany({
        where,
        select: {
          id: true,
          shopName: true,
          slug: true,
          verified: true,
          rating: true,
          totalSales: true,
          commission: true,
          createdAt: true,
          user: {
            select: { name: true, email: true },
          },
          _count: { select: { products: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.sellerProfile.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        sellers,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("[ADMIN_SELLERS_GET]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { sellerId, verified, commission } = body as {
      sellerId: string;
      verified?: boolean;
      commission?: number;
    };

    if (!sellerId) {
      return NextResponse.json(
        { success: false, error: "sellerId is required" },
        { status: 400 }
      );
    }

    const data: Record<string, unknown> = {};
    if (typeof verified === "boolean") data.verified = verified;
    if (typeof commission === "number") {
      if (commission < 0 || commission > 1) {
        return NextResponse.json(
          { success: false, error: "Commission must be between 0 and 1" },
          { status: 400 }
        );
      }
      data.commission = commission;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { success: false, error: "No fields to update" },
        { status: 400 }
      );
    }

    const updatedSeller = await prisma.sellerProfile.update({
      where: { id: sellerId },
      data,
      select: {
        id: true,
        shopName: true,
        verified: true,
        commission: true,
      },
    });

    return NextResponse.json({ success: true, data: updatedSeller });
  } catch (error) {
    console.error("[ADMIN_SELLERS_PATCH]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

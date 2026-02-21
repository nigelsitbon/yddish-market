import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProductStatus } from "@prisma/client";

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
    const status = searchParams.get("status") as ProductStatus | null;
    const search = searchParams.get("search") ?? undefined;
    const featuredParam = searchParams.get("featured");

    const where = {
      ...(status && { status }),
      ...(search && {
        title: { contains: search, mode: "insensitive" as const },
      }),
      ...(featuredParam !== null &&
        featuredParam !== undefined && {
          featured: featuredParam === "true",
        }),
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        select: {
          id: true,
          title: true,
          slug: true,
          price: true,
          stock: true,
          status: true,
          featured: true,
          images: true,
          createdAt: true,
          seller: {
            select: { shopName: true },
          },
          categories: {
            select: { category: { select: { name: true } } },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        products,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("[ADMIN_PRODUCTS_GET]", error);
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
    const { productId, status, featured } = body as {
      productId: string;
      status?: ProductStatus;
      featured?: boolean;
    };

    if (!productId) {
      return NextResponse.json(
        { success: false, error: "productId is required" },
        { status: 400 }
      );
    }

    const data: Record<string, unknown> = {};
    if (status) {
      if (!["DRAFT", "ACTIVE", "PAUSED", "ARCHIVED"].includes(status)) {
        return NextResponse.json(
          { success: false, error: "Invalid product status" },
          { status: 400 }
        );
      }
      data.status = status;
    }
    if (typeof featured === "boolean") data.featured = featured;

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { success: false, error: "No fields to update" },
        { status: 400 }
      );
    }

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data,
      select: {
        id: true,
        title: true,
        status: true,
        featured: true,
      },
    });

    return NextResponse.json({ success: true, data: updatedProduct });
  } catch (error) {
    console.error("[ADMIN_PRODUCTS_PATCH]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

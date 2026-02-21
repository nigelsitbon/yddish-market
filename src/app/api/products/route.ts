import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

/**
 * GET /api/products — public endpoint for storefront
 * Supports: category (slug), sort, price range, search, pagination
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(48, Math.max(1, parseInt(searchParams.get("limit") ?? "24", 10)));
    const categorySlug = searchParams.get("category") ?? undefined;
    const sort = searchParams.get("sort") ?? "newest";
    const priceRange = searchParams.get("price") ?? undefined;
    const featured = searchParams.get("featured") === "true";
    const search = searchParams.get("q") ?? undefined;

    // Build where clause — only ACTIVE products
    const where: Prisma.ProductWhereInput = {
      status: "ACTIVE",
    };

    // Category filter (supports parent or child slug, many-to-many)
    if (categorySlug) {
      const category = await prisma.category.findUnique({
        where: { slug: categorySlug },
        include: { children: { select: { id: true } } },
      });
      if (category) {
        const catIds = category.children.length > 0
          ? [category.id, ...category.children.map((c) => c.id)]
          : [category.id];
        where.categories = { some: { categoryId: { in: catIds } } };
      }
    }

    // Price range filter
    if (priceRange) {
      const [min, max] = priceRange.split("-");
      if (min && max) {
        where.price = { gte: parseFloat(min), lte: parseFloat(max) };
      } else if (min && !max) {
        where.price = { gte: parseFloat(min) };
      } else if (!min && max) {
        where.price = { lte: parseFloat(max) };
      }
    }

    // Featured filter
    if (featured) {
      where.featured = true;
    }

    // Search (basic — will be replaced by Meilisearch later)
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { tags: { hasSome: [search.toLowerCase()] } },
      ];
    }

    // Sort order
    let orderBy: Prisma.ProductOrderByWithRelationInput;
    switch (sort) {
      case "price-asc":
        orderBy = { price: "asc" };
        break;
      case "price-desc":
        orderBy = { price: "desc" };
        break;
      case "trending":
        // TODO: add totalSold field or use order items count
        orderBy = { createdAt: "desc" };
        break;
      case "newest":
      default:
        orderBy = { createdAt: "desc" };
        break;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        select: {
          id: true,
          slug: true,
          title: true,
          price: true,
          comparePrice: true,
          images: true,
          status: true,
          featured: true,
          createdAt: true,
          seller: {
            select: {
              shopName: true,
              slug: true,
              verified: true,
            },
          },
          categories: {
            select: {
              category: { select: { name: true, slug: true } },
            },
          },
        },
        orderBy,
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
    console.error("[PRODUCTS_GET]", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

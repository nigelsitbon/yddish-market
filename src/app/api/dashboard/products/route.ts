import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { createProductSchema } from "@/lib/validators/product";
import { slugify } from "@/lib/utils";

/* ── GET /api/dashboard/products — Liste des produits du vendeur ── */
export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user?.sellerProfile) {
      return NextResponse.json({ success: false, error: "Non autorisé" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 20;

    const where: Record<string, unknown> = { sellerId: user.sellerProfile.id };
    if (status && status !== "all") {
      where.status = status;
    }
    if (search) {
      where.title = { contains: search, mode: "insensitive" };
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          categories: { select: { category: { select: { id: true, name: true, slug: true } } } },
          variants: true,
          _count: { select: { reviews: true, orderItems: true, favorites: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: { products, total, page, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("[DASHBOARD_PRODUCTS_GET]", error);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}

/* ── POST /api/dashboard/products — Créer un produit ── */
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user?.sellerProfile) {
      return NextResponse.json({ success: false, error: "Non autorisé" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = createProductSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues.map((i) => i.message).join(", ");
      return NextResponse.json(
        { success: false, error: msg || "Données invalides" },
        { status: 400 }
      );
    }

    const { variants, categoryIds, metadata, title, description, price, images, stock, status, tags, ...rest } = parsed.data;

    // Generate unique slug
    let slug = slugify(title);
    const existingSlug = await prisma.product.findUnique({ where: { slug } });
    if (existingSlug) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    // Verify all categories exist
    const categoriesCount = await prisma.category.count({ where: { id: { in: categoryIds } } });
    if (categoriesCount !== categoryIds.length) {
      return NextResponse.json(
        { success: false, error: "Une ou plusieurs catégories invalides" },
        { status: 400 }
      );
    }

    // Build explicit data to avoid passing unexpected fields to Prisma
    const product = await prisma.product.create({
      data: {
        title,
        description,
        price,
        comparePrice: rest.comparePrice ?? undefined,
        images,
        stock,
        status: status ?? "DRAFT",
        tags,
        slug,
        sku: rest.sku || undefined,
        weight: rest.weight ?? undefined,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
        seller: { connect: { id: user.sellerProfile.id } },
        categories: {
          create: categoryIds.map((catId) => ({ categoryId: catId })),
        },
        variants: variants.length > 0
          ? { create: variants }
          : undefined,
      },
      include: {
        categories: { select: { category: { select: { id: true, name: true, slug: true } } } },
        variants: true,
      },
    });

    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    console.error("[DASHBOARD_PRODUCTS_POST]", error);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { updateProductSchema } from "@/lib/validators/product";
import { slugify } from "@/lib/utils";

/* ── GET /api/dashboard/products/[productId] — Détail produit ── */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user?.sellerProfile) {
      return NextResponse.json({ success: false, error: "Non autorisé" }, { status: 403 });
    }

    const { productId } = await params;

    const product = await prisma.product.findFirst({
      where: { id: productId, sellerId: user.sellerProfile.id },
      include: {
        categories: { select: { category: { select: { id: true, name: true, slug: true } } } },
        variants: true,
        _count: { select: { reviews: true, orderItems: true, favorites: true } },
      },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Produit non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    console.error("[DASHBOARD_PRODUCT_GET]", error);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}

/* ── PATCH /api/dashboard/products/[productId] — Modifier produit ── */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user?.sellerProfile) {
      return NextResponse.json({ success: false, error: "Non autorisé" }, { status: 403 });
    }

    const { productId } = await params;

    // Verify ownership
    const existing = await prisma.product.findFirst({
      where: { id: productId, sellerId: user.sellerProfile.id },
      include: { variants: true },
    });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Produit non trouvé" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const parsed = updateProductSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message ?? "Données invalides" },
        { status: 400 }
      );
    }

    const { variants, title, categoryIds, metadata, ...updateData } = parsed.data;

    // Build update object
    const prismaUpdate: Record<string, unknown> = { ...updateData };

    // Handle metadata
    if (metadata !== undefined) {
      prismaUpdate.metadata = metadata ? JSON.parse(JSON.stringify(metadata)) : null;
    }

    // Handle categories change (many-to-many)
    if (categoryIds && categoryIds.length > 0) {
      // Delete old links and create new ones
      await prisma.productCategory.deleteMany({ where: { productId } });
      await prisma.productCategory.createMany({
        data: categoryIds.map((catId) => ({ productId, categoryId: catId })),
      });
    }

    // Update slug if title changed
    if (title && title !== existing.title) {
      let newSlug = slugify(title);
      const slugExists = await prisma.product.findFirst({
        where: { slug: newSlug, id: { not: productId } },
      });
      if (slugExists) newSlug = `${newSlug}-${Date.now().toString(36)}`;
      prismaUpdate.title = title;
      prismaUpdate.slug = newSlug;
    } else if (title) {
      prismaUpdate.title = title;
    }

    // Handle variants update
    if (variants !== undefined) {
      await prisma.productVariant.deleteMany({ where: { productId } });
      if (variants.length > 0) {
        await prisma.productVariant.createMany({
          data: variants.map((v) => ({ ...v, productId })),
        });
      }
    }

    const product = await prisma.product.update({
      where: { id: productId },
      data: prismaUpdate,
      include: {
        categories: { select: { category: { select: { id: true, name: true, slug: true } } } },
        variants: true,
      },
    });

    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    console.error("[DASHBOARD_PRODUCT_PATCH]", error);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}

/* ── DELETE /api/dashboard/products/[productId] — Archiver produit ── */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user?.sellerProfile) {
      return NextResponse.json({ success: false, error: "Non autorisé" }, { status: 403 });
    }

    const { productId } = await params;

    const product = await prisma.product.findFirst({
      where: { id: productId, sellerId: user.sellerProfile.id },
    });
    if (!product) {
      return NextResponse.json(
        { success: false, error: "Produit non trouvé" },
        { status: 404 }
      );
    }

    // Archive instead of hard delete (preserves order history)
    await prisma.product.update({
      where: { id: productId },
      data: { status: "ARCHIVED" },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DASHBOARD_PRODUCT_DELETE]", error);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}

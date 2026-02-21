import { NextRequest, NextResponse } from "next/server";
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

    const categories = await prisma.category.findMany({
      include: {
        children: {
          include: {
            _count: { select: { products: true } },
          },
          orderBy: { order: "asc" },
        },
        _count: { select: { products: true } },
      },
      where: { parentId: null },
      orderBy: { order: "asc" },
    });

    return NextResponse.json({ success: true, data: categories });
  } catch (error) {
    console.error("[ADMIN_CATEGORIES_GET]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, slug, parentId, icon, image } = body as {
      name: string;
      slug: string;
      parentId?: string;
      icon?: string;
      image?: string;
    };

    if (!name || !slug) {
      return NextResponse.json(
        { success: false, error: "name and slug are required" },
        { status: 400 }
      );
    }

    // Check slug uniqueness
    const existing = await prisma.category.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "A category with this slug already exists" },
        { status: 409 }
      );
    }

    // If parentId provided, verify it exists
    if (parentId) {
      const parent = await prisma.category.findUnique({ where: { id: parentId } });
      if (!parent) {
        return NextResponse.json(
          { success: false, error: "Parent category not found" },
          { status: 404 }
        );
      }
    }

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        parentId: parentId ?? null,
        icon: icon ?? null,
        image: image ?? null,
      },
    });

    return NextResponse.json({ success: true, data: category }, { status: 201 });
  } catch (error) {
    console.error("[ADMIN_CATEGORIES_POST]", error);
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
    const { categoryId, name, slug, icon, image, order } = body as {
      categoryId: string;
      name?: string;
      slug?: string;
      icon?: string;
      image?: string;
      order?: number;
    };

    if (!categoryId) {
      return NextResponse.json(
        { success: false, error: "categoryId is required" },
        { status: 400 }
      );
    }

    // If slug is being changed, check uniqueness
    if (slug) {
      const existing = await prisma.category.findUnique({ where: { slug } });
      if (existing && existing.id !== categoryId) {
        return NextResponse.json(
          { success: false, error: "A category with this slug already exists" },
          { status: 409 }
        );
      }
    }

    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name;
    if (slug !== undefined) data.slug = slug;
    if (icon !== undefined) data.icon = icon;
    if (image !== undefined) data.image = image;
    if (typeof order === "number") data.order = order;

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { success: false, error: "No fields to update" },
        { status: 400 }
      );
    }

    const updated = await prisma.category.update({
      where: { id: categoryId },
      data,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("[ADMIN_CATEGORIES_PATCH]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { categoryId } = body as { categoryId: string };

    if (!categoryId) {
      return NextResponse.json(
        { success: false, error: "categoryId is required" },
        { status: 400 }
      );
    }

    // Check if the category has linked products (via many-to-many)
    const productCount = await prisma.productCategory.count({
      where: { categoryId },
    });

    if (productCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete category: ${productCount} product(s) are still linked to it`,
        },
        { status: 409 }
      );
    }

    // Also check for children categories
    const childCount = await prisma.category.count({
      where: { parentId: categoryId },
    });

    if (childCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete category: ${childCount} child categor(ies) still exist`,
        },
        { status: 409 }
      );
    }

    await prisma.category.delete({ where: { id: categoryId } });

    return NextResponse.json({ success: true, data: { deleted: categoryId } });
  } catch (error) {
    console.error("[ADMIN_CATEGORIES_DELETE]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

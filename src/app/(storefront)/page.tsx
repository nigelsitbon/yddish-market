import { Suspense } from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { ProductCard, type ProductCardData } from "@/components/storefront/product-card";
import { CatalogFilters } from "@/components/storefront/catalog-filters";
import { unstable_cache } from "next/cache";
import { OrganizationJsonLd, WebSiteJsonLd } from "@/components/seo/json-ld";

// ISR: rebuild page in background every 300s — products change rarely
export const revalidate = 300;

/* ── Cached data fetching ── */

const getCategories = unstable_cache(
  async () => {
    return prisma.category.findMany({
      where: { parentId: null },
      include: {
        children: {
          orderBy: { order: "asc" },
          select: { id: true, name: true, slug: true },
        },
      },
      orderBy: { order: "asc" },
    });
  },
  ["storefront-categories"],
  { revalidate: 300, tags: ["categories"] }
);

const getProducts = unstable_cache(async (params: {
  category?: string;
  sort?: string;
  price?: string;
  page?: number;
  q?: string;
}): Promise<{ products: ProductCardData[]; total: number }> => {
  const { category, sort = "newest", price, page = 1, q } = params;
  const limit = 24;

  const where: Prisma.ProductWhereInput = {
    status: "ACTIVE",
  };

  // Search filter
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { tags: { hasSome: [q.toLowerCase()] } },
    ];
  }

  // Category filter
  if (category) {
    const cat = await prisma.category.findUnique({
      where: { slug: category },
      include: { children: { select: { id: true } } },
    });
    if (cat) {
      const catIds = cat.children.length > 0
        ? [cat.id, ...cat.children.map((c) => c.id)]
        : [cat.id];
      where.categories = { some: { categoryId: { in: catIds } } };
    }
  }

  // Price range filter
  if (price) {
    const [min, max] = price.split("-");
    if (min && max) {
      where.price = { gte: parseFloat(min), lte: parseFloat(max) };
    } else if (min && !max) {
      where.price = { gte: parseFloat(min) };
    }
  }

  // Sort
  let orderBy: Prisma.ProductOrderByWithRelationInput;
  switch (sort) {
    case "price-asc":
      orderBy = { price: "asc" };
      break;
    case "price-desc":
      orderBy = { price: "desc" };
      break;
    case "trending":
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
        slug: true,
        title: true,
        price: true,
        comparePrice: true,
        images: true,
        seller: { select: { shopName: true, slug: true, verified: true } },
        categories: { select: { category: { select: { name: true, slug: true } } } },
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    products: products.map((p) => ({
      ...p,
      categories: p.categories.map((pc) => pc.category),
    })),
    total,
  };
  },
  ["storefront-products"],
  { revalidate: 300, tags: ["products"] }
);

/* ── Page ── */

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const category = typeof params.category === "string" ? params.category : undefined;
  const sort = typeof params.sort === "string" ? params.sort : undefined;
  const price = typeof params.price === "string" ? params.price : undefined;
  const page = typeof params.page === "string" ? parseInt(params.page, 10) : 1;
  const q = typeof params.q === "string" ? params.q : undefined;

  const [categories, { products, total }] = await Promise.all([
    getCategories(),
    getProducts({ category, sort, price, page, q }),
  ]);

  // Find active category name
  let categoryName: string | undefined;
  if (category) {
    for (const cat of categories) {
      if (cat.slug === category) {
        categoryName = cat.name;
        break;
      }
      const sub = cat.children.find((c) => c.slug === category);
      if (sub) {
        categoryName = sub.name;
        break;
      }
    }
  }

  const totalPages = Math.ceil(total / 24);

  const title = q
    ? `Résultats pour "${q}"`
    : categoryName ?? "Tous les produits";

  return (
    <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12">
      {/* SEO: Structured Data */}
      <OrganizationJsonLd />
      <WebSiteJsonLd />

      {/* Header */}
      <div className="pt-6 pb-2">
        <h1 className="text-[22px] font-light text-foreground">{title}</h1>
      </div>

      <Suspense fallback={null}>
        <CatalogFilters categories={categories} />
      </Suspense>

      {/* Results count */}
      <div className="py-4">
        <p className="text-[12px] text-muted-foreground">
          {total} article{total > 1 ? "s" : ""}
        </p>
      </div>

      {/* Products grid */}
      {products.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 pb-8">
          {products.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      ) : (
        <div className="py-24 text-center">
          <p className="text-[11px] tracking-[0.3em] text-muted-foreground uppercase mb-4">
            {q || category ? "Aucun résultat" : "Bientôt disponible"}
          </p>
          <h2 className="text-[24px] font-light text-foreground mb-4">
            {q || category
              ? "Aucun produit trouvé pour cette sélection"
              : "Les premières pièces arrivent"}
          </h2>
          <p className="text-[14px] text-muted-foreground max-w-md mx-auto">
            {q || category
              ? "Essayez avec d'autres filtres ou explorez toute la collection."
              : "Nos artisans préparent leurs collections. Revenez bientôt pour découvrir des objets Judaica d'exception."}
          </p>
          {(q || category) && (
            <Link
              href="/"
              className="inline-block mt-6 text-[13px] text-foreground border-b border-foreground pb-0.5 hover:opacity-60 transition-opacity"
            >
              Voir tous les produits
            </Link>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 py-8 pb-16">
          {page > 1 && (
            <Link
              href={`/?${new URLSearchParams({
                ...(category ? { category } : {}),
                ...(sort ? { sort } : {}),
                ...(price ? { price } : {}),
                ...(q ? { q } : {}),
                page: String(page - 1),
              }).toString()}`}
              className="px-5 py-2 text-[13px] border border-border text-foreground hover:border-foreground transition-all duration-200 rounded-xl"
            >
              Précédent
            </Link>
          )}
          <span className="text-[13px] text-muted-foreground px-4">
            Page {page} sur {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/?${new URLSearchParams({
                ...(category ? { category } : {}),
                ...(sort ? { sort } : {}),
                ...(price ? { price } : {}),
                ...(q ? { q } : {}),
                page: String(page + 1),
              }).toString()}`}
              className="px-5 py-2 text-[13px] border border-border text-foreground hover:border-foreground transition-all duration-200 rounded-xl"
            >
              Suivant
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

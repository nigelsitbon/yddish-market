import { Suspense } from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { ProductCard, type ProductCardData } from "@/components/storefront/product-card";
import { CatalogFilters } from "@/components/storefront/catalog-filters";
import { unstable_cache } from "next/cache";

// ISR: revalidate every 300s — products change rarely
export const revalidate = 300;

export const metadata = {
  title: "Tous les produits",
  description:
    "Explorez notre collection d'objets Judaica : objets rituels, bijoux, mezouzot, art et décoration, mode, livres et alimentaire casher.",
};

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

  // Search filter (basic — will be replaced by Meilisearch later)
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { tags: { hasSome: [q.toLowerCase()] } },
    ];
  }

  // Category filter — supports parent or child slug (many-to-many)
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
        id: true,
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

/* ── Sub-components ── */

function CatalogHeader({
  categoryName,
  parentName,
  searchQuery,
}: {
  categoryName?: string;
  parentName?: string;
  searchQuery?: string;
}) {
  const title = searchQuery
    ? `Résultats pour "${searchQuery}"`
    : categoryName ?? "Tous les produits";

  return (
    <div className="pt-6 pb-2">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-[12px] text-muted-foreground mb-4">
        <Link href="/" className="hover:text-foreground transition-colors">
          Accueil
        </Link>
        <span>&gt;</span>
        {parentName ? (
          <>
            <Link href="/products" className="hover:text-foreground transition-colors">
              Produits
            </Link>
            <span>&gt;</span>
            <span className="text-foreground">{categoryName}</span>
          </>
        ) : (
          <span className="text-foreground">{title}</span>
        )}
      </nav>
      <h1 className="text-[22px] font-light text-foreground">{title}</h1>
    </div>
  );
}

/* ── Page ── */

export default async function ProductsPage({
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

  // Find active category name for breadcrumb
  let categoryName: string | undefined;
  let parentName: string | undefined;
  if (category) {
    for (const cat of categories) {
      if (cat.slug === category) {
        categoryName = cat.name;
        break;
      }
      const sub = cat.children.find((c) => c.slug === category);
      if (sub) {
        categoryName = sub.name;
        parentName = cat.name;
        break;
      }
    }
  }

  const totalPages = Math.ceil(total / 24);

  return (
    <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12">
      <CatalogHeader categoryName={categoryName} parentName={parentName} searchQuery={q} />

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
          <p className="text-[14px] text-muted-foreground">
            Aucun produit trouvé pour cette sélection.
          </p>
          <Link
            href="/products"
            className="inline-block mt-4 text-[13px] text-foreground border-b border-foreground pb-0.5 hover:opacity-60 transition-opacity"
          >
            Voir tous les produits
          </Link>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 py-8 pb-16">
          {page > 1 && (
            <Link
              href={`/products?${new URLSearchParams({
                ...(category ? { category } : {}),
                ...(sort ? { sort } : {}),
                ...(price ? { price } : {}),
                page: String(page - 1),
              }).toString()}`}
              className="px-4 py-2 text-[13px] border border-border text-foreground hover:border-foreground transition-colors"
            >
              Précédent
            </Link>
          )}
          <span className="text-[13px] text-muted-foreground px-4">
            Page {page} sur {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/products?${new URLSearchParams({
                ...(category ? { category } : {}),
                ...(sort ? { sort } : {}),
                ...(price ? { price } : {}),
                page: String(page + 1),
              }).toString()}`}
              className="px-4 py-2 text-[13px] border border-border text-foreground hover:border-foreground transition-colors"
            >
              Suivant
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

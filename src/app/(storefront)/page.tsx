import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ProductCard, type ProductCardData } from "@/components/storefront/product-card";

export const dynamic = "force-dynamic";

/* ── Data fetching ── */

async function getFeaturedProducts(): Promise<ProductCardData[]> {
  const products = await prisma.product.findMany({
    where: { status: "ACTIVE" },
    select: {
      slug: true,
      title: true,
      price: true,
      comparePrice: true,
      images: true,
      seller: { select: { shopName: true, slug: true, verified: true } },
      categories: { select: { category: { select: { name: true, slug: true } } } },
    },
    orderBy: { createdAt: "desc" },
    take: 8,
  });
  return products.map((p) => ({
    ...p,
    categories: p.categories.map((pc) => pc.category),
  }));
}

async function getCategories() {
  return prisma.category.findMany({
    where: { parentId: null },
    select: { name: true, slug: true, image: true },
    orderBy: { order: "asc" },
    take: 8,
  });
}

/* ── Page ── */

export default async function HomePage() {
  const [products, categories] = await Promise.all([
    getFeaturedProducts(),
    getCategories(),
  ]);

  // Split products for the two grids
  const featuredProducts = products.slice(0, 4);
  const trendingProducts = products.slice(4, 8);

  // Pick 3 categories for editorial banners
  const editorialCategories = [
    { name: "Bijoux", slug: "bijoux", subtitle: "Bracelets, colliers, bagues" },
    { name: "Art & Accessoires", slug: "art-accessoires", subtitle: "Hanoukia, mézouza, bougeoir" },
    { name: "Fêtes", slug: "fetes", subtitle: "Chabbat, Hanouka, Pessah" },
  ];

  // Bottom category row
  const bottomCategories = [
    { name: "Vêtements", slug: "vetements" },
    { name: "Livres", slug: "livres" },
    { name: "Épicerie Fine", slug: "epicerie-fine" },
  ];

  const hasProducts = products.length > 0;

  return (
    <div>
      {/* ── Hero: Editorial split layout ── */}
      <section className="grid grid-cols-1 lg:grid-cols-2">
        {/* Left: Image */}
        <div className="relative aspect-[4/5] lg:aspect-auto bg-[#E8E4DE]">
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs text-[#A09A90] tracking-[0.3em] uppercase">
              Collection image
            </span>
          </div>
        </div>
        {/* Right: Content */}
        <div className="flex flex-col items-center justify-center px-8 py-16 lg:py-0 lg:px-16 bg-[#FAF9F7]">
          <div className="max-w-md text-center">
            <p className="text-[11px] tracking-[0.3em] text-muted-foreground uppercase mb-6">
              Nouvelle collection
            </p>
            <h2 className="text-[28px] sm:text-[34px] font-light leading-[1.2] text-foreground">
              L&apos;art de la tradition,
              <br />
              réinventé
            </h2>
            <p className="mt-5 text-[14px] text-muted-foreground leading-relaxed">
              Des pièces uniques créées par des artisans d&apos;exception. Découvrez une sélection
              d&apos;objets Judaica entre héritage et modernité.
            </p>
            <Link
              href="/products"
              className="inline-block mt-8 text-[13px] tracking-wide text-foreground border-b border-foreground pb-1 hover:opacity-60 transition-opacity"
            >
              Voir la sélection
            </Link>
          </div>
        </div>
      </section>

      {/* ── Featured products grid ── */}
      {hasProducts && (
        <section className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12 py-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-[15px] font-medium tracking-wide text-foreground uppercase">
              Nouveautés
            </h2>
            <Link
              href="/products?sort=newest"
              className="text-[13px] text-muted-foreground hover:text-foreground transition-colors"
            >
              Voir tout
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-8">
            {featuredProducts.map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* ── Editorial banner: Categories ── */}
      <section className="grid grid-cols-1 md:grid-cols-3 border-t border-border">
        {editorialCategories.map((cat, i) => (
          <Link
            key={cat.slug}
            href={`/products?category=${cat.slug}`}
            className={`group relative aspect-[4/3] bg-[#F0EFEB] flex items-center justify-center ${
              i < 2 ? "md:border-r border-border" : ""
            }`}
          >
            <div className="text-center z-10">
              <p className="text-[11px] tracking-[0.3em] text-muted-foreground uppercase mb-2">
                {cat.subtitle}
              </p>
              <p className="text-[18px] font-light text-foreground group-hover:underline">
                {cat.name}
              </p>
            </div>
          </Link>
        ))}
      </section>

      {/* ── Trending section ── */}
      {trendingProducts.length > 0 && (
        <section className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12 py-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-[15px] font-medium tracking-wide text-foreground uppercase">
              À découvrir
            </h2>
            <Link
              href="/products"
              className="text-[13px] text-muted-foreground hover:text-foreground transition-colors"
            >
              Voir tout
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-8">
            {trendingProducts.map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* ── Empty state when no products ── */}
      {!hasProducts && (
        <section className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12 py-24 text-center">
          <p className="text-[11px] tracking-[0.3em] text-muted-foreground uppercase mb-4">
            Bientôt disponible
          </p>
          <h2 className="text-[24px] font-light text-foreground mb-4">
            Les premières pièces arrivent
          </h2>
          <p className="text-[14px] text-muted-foreground max-w-md mx-auto">
            Nos artisans préparent leurs collections. Revenez bientôt pour découvrir des objets
            Judaica d&apos;exception.
          </p>
        </section>
      )}

      {/* ── Editorial: Full-width split ── */}
      <section className="grid grid-cols-1 lg:grid-cols-2 border-t border-border">
        <div className="relative aspect-[4/3] lg:aspect-auto bg-[#E2DFD8]">
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs text-[#A09A90] tracking-[0.3em] uppercase">
              Artisan image
            </span>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center px-8 py-16 lg:py-0 lg:px-16">
          <div className="max-w-sm text-center">
            <p className="text-[11px] tracking-[0.3em] text-muted-foreground uppercase mb-6">
              Nos artisans
            </p>
            <h2 className="text-[24px] sm:text-[28px] font-light leading-[1.3] text-foreground">
              Chaque objet raconte une histoire
            </h2>
            <p className="mt-4 text-[14px] text-muted-foreground leading-relaxed">
              Derrière chaque pièce, un artisan passionné. Découvrez leurs ateliers et leur
              savoir-faire.
            </p>
            <Link
              href="/sellers"
              className="inline-block mt-8 text-[13px] tracking-wide text-foreground border-b border-foreground pb-1 hover:opacity-60 transition-opacity"
            >
              Découvrir les artisans
            </Link>
          </div>
        </div>
      </section>

      {/* ── Bottom categories row ── */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12 py-16">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {bottomCategories.map((cat) => (
              <Link key={cat.slug} href={`/products?category=${cat.slug}`} className="group">
                <div className="aspect-square bg-[#F5F5F5] mb-3 flex items-center justify-center">
                  <span className="text-[11px] text-muted-foreground tracking-widest uppercase">
                    Photo
                  </span>
                </div>
                <p className="text-[13px] text-foreground group-hover:underline text-center">
                  {cat.name}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

import Link from "next/link";
import Image from "next/image";
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

/* ── Images Unsplash (placeholders premium — à remplacer par les vraies photos) ── */

const IMAGES = {
  hero: "https://images.unsplash.com/photo-1611944212129-29977ae1398c?w=1200&q=80&fit=crop",
  bijoux: "https://images.unsplash.com/photo-1515562141589-67f0d569b6f5?w=800&q=80&fit=crop",
  artAccessoires: "https://images.unsplash.com/photo-1545378889-08b7944e1639?w=800&q=80&fit=crop",
  fetes: "https://images.unsplash.com/photo-1482575832494-771f74bf6857?w=800&q=80&fit=crop",
  artisan: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=1200&q=80&fit=crop",
  vetements: "https://images.unsplash.com/photo-1558171813-4c088753af8f?w=600&q=80&fit=crop",
  livres: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&q=80&fit=crop",
  epicerieFine: "https://images.unsplash.com/photo-1474722883778-792e7990302f?w=600&q=80&fit=crop",
};

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
    { name: "Bijoux", slug: "bijoux", subtitle: "Bracelets, colliers, bagues", image: IMAGES.bijoux },
    { name: "Art & Accessoires", slug: "art-accessoires", subtitle: "Hanoukia, mézouza, bougeoir", image: IMAGES.artAccessoires },
    { name: "Fêtes", slug: "fetes", subtitle: "Chabbat, Hanouka, Pessah", image: IMAGES.fetes },
  ];

  // Bottom category row
  const bottomCategories = [
    { name: "Vêtements", slug: "vetements", image: IMAGES.vetements },
    { name: "Livres", slug: "livres", image: IMAGES.livres },
    { name: "Épicerie Fine", slug: "epicerie-fine", image: IMAGES.epicerieFine },
  ];

  const hasProducts = products.length > 0;

  return (
    <div>
      {/* ── Hero: Editorial split layout ── */}
      <section className="grid grid-cols-1 lg:grid-cols-2">
        {/* Left: Image */}
        <div className="relative aspect-[4/5] lg:aspect-auto lg:min-h-[600px] bg-[#1A1A2E]">
          <Image
            src={IMAGES.hero}
            alt="Collection Judaica — objets rituels artisanaux"
            fill
            className="object-cover"
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
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
            className={`group relative aspect-[4/3] overflow-hidden flex items-center justify-center ${
              i < 2 ? "md:border-r border-border" : ""
            }`}
          >
            <Image
              src={cat.image}
              alt={cat.name}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
            <div className="absolute inset-0 bg-black/30" />
            <div className="text-center z-10">
              <p className="text-[11px] tracking-[0.3em] text-white/80 uppercase mb-2">
                {cat.subtitle}
              </p>
              <p className="text-[18px] font-light text-white group-hover:underline underline-offset-4">
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
        <div className="relative aspect-[4/3] lg:aspect-auto lg:min-h-[500px] bg-[#1A1A2E]">
          <Image
            src={IMAGES.artisan}
            alt="Artisan joaillier au travail"
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
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
                <div className="relative aspect-square overflow-hidden mb-3">
                  <Image
                    src={cat.image}
                    alt={cat.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, 25vw"
                  />
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

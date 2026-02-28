import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProductCard, type ProductCardData } from "@/components/storefront/product-card";
import { Star } from "@/components/ui/icons";
import { unstable_cache } from "next/cache";

// ISR: revalidate every 300s — seller data cached on CDN
export const revalidate = 300;

/* ── Cached data fetching ── */

const getSellerBySlug = unstable_cache(
  async (slug: string) => {
    return prisma.sellerProfile.findUnique({
      where: { slug },
      select: {
        id: true,
        shopName: true,
        slug: true,
        description: true,
        logo: true,
        banner: true,
        verified: true,
        rating: true,
        totalSales: true,
      },
    });
  },
  ["seller-profile"],
  { revalidate: 300, tags: ["sellers"] }
);

const getSellerProducts = unstable_cache(
  async (sellerId: string) => {
    const rawProducts = await prisma.product.findMany({
      where: { sellerId, status: "ACTIVE" },
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
      orderBy: { createdAt: "desc" },
      take: 24,
    });
    return rawProducts.map((p) => ({
      ...p,
      categories: p.categories.map((pc) => pc.category),
    }));
  },
  ["seller-products"],
  { revalidate: 300, tags: ["products", "sellers"] }
);

/* ── Metadata ── */

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const seller = await getSellerBySlug(slug);
  if (!seller) return { title: "Vendeur introuvable" };
  const description = seller.description?.slice(0, 160) ?? `Découvrez la boutique ${seller.shopName} sur YDDISH MARKET.`;
  const url = `https://yddishmarket.com/seller/${seller.slug}`;
  return {
    title: seller.shopName,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${seller.shopName} — YDDISH MARKET`,
      description,
      url,
      type: "website",
    },
  };
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={14}
          strokeWidth={1.5}
          className={
            i < Math.round(rating) ? "fill-foreground text-foreground" : "text-border"
          }
        />
      ))}
    </div>
  );
}

export default async function SellerPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const seller = await getSellerBySlug(slug);

  if (!seller) notFound();

  const products: ProductCardData[] = await getSellerProducts(seller.id);

  return (
    <div>
      {/* Banner */}
      <div className="relative h-[200px] lg:h-[280px] bg-[#E8E4DE]">
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs text-[#A09A90] tracking-[0.3em] uppercase">
            Banner image
          </span>
        </div>
      </div>

      {/* Seller info */}
      <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12">
        <div className="relative -mt-12 mb-8">
          <div className="flex items-end gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 bg-white border border-border flex items-center justify-center shadow-sm rounded-2xl">
              <span className="text-[24px] font-light text-muted-foreground">
                {seller.shopName.charAt(0)}
              </span>
            </div>
            <div className="pb-1">
              <div className="flex items-center gap-3">
                <h1 className="text-[22px] font-light text-foreground">
                  {seller.shopName}
                </h1>
                {seller.verified && (
                  <span className="px-2.5 py-0.5 text-[10px] font-medium tracking-wider uppercase border border-accent text-accent rounded-full">
                    Vérifié
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 mt-1">
                {seller.rating !== null && (
                  <div className="flex items-center gap-1.5">
                    <Stars rating={seller.rating} />
                    <span className="text-[12px] text-muted-foreground">
                      {seller.rating}/5
                    </span>
                  </div>
                )}
                <span className="text-[12px] text-muted-foreground">
                  {seller.totalSales} vente{seller.totalSales > 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        {seller.description && (
          <div className="max-w-2xl mb-12">
            <p className="text-[13px] text-muted-foreground leading-relaxed">
              {seller.description}
            </p>
          </div>
        )}

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-[12px] text-muted-foreground mb-4">
          <Link href="/" className="hover:text-foreground transition-colors">
            Accueil
          </Link>
          <span>&gt;</span>
          <span className="text-foreground">{seller.shopName}</span>
        </nav>

        {/* Products count */}
        <div className="flex items-center justify-between py-4 border-b border-border mb-8">
          <p className="text-[12px] text-muted-foreground">
            {products.length} article{products.length > 1 ? "s" : ""}
          </p>
        </div>

        {/* Products grid */}
        {products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 pb-16">
            {products.map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center">
            <p className="text-[14px] text-muted-foreground">
              Aucun produit disponible pour le moment.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

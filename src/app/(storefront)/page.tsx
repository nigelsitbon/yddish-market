import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import { getHomepageSettings } from "@/lib/homepage-settings";
import { HeroBanner } from "@/components/storefront/hero-banner";
import { FeaturedArtisans } from "@/components/storefront/featured-artisans";
import { CollectionSection } from "@/components/storefront/collection-section";
import { HeritageBand } from "@/components/storefront/heritage-band";
import { PiliersSection } from "@/components/storefront/piliers-section";
import { OrganizationJsonLd, WebSiteJsonLd } from "@/components/seo/json-ld";
import type { ProductCardData } from "@/components/storefront/product-card";

// ISR: rebuild page in background every 300s
export const revalidate = 300;

/* ── Cached data fetching ── */

const getFeaturedArtisans = unstable_cache(
  async () => {
    return prisma.sellerProfile.findMany({
      where: {
        verified: true,
        products: { some: { status: "ACTIVE" } },
      },
      select: {
        shopName: true,
        slug: true,
        description: true,
        logo: true,
        verified: true,
        shipsFrom: true,
      },
      orderBy: { totalSales: "desc" },
      take: 3,
    });
  },
  ["homepage-featured-artisans"],
  { revalidate: 300, tags: ["sellers"] }
);

const getCollectionProducts = unstable_cache(
  async (categorySlugs: string[]): Promise<ProductCardData[]> => {
    const categories = await prisma.category.findMany({
      where: { slug: { in: categorySlugs } },
      include: { children: { select: { id: true } } },
    });

    const allCategoryIds = categories.flatMap((cat) =>
      cat.children.length > 0
        ? [cat.id, ...cat.children.map((c) => c.id)]
        : [cat.id]
    );

    if (allCategoryIds.length === 0) return [];

    const products = await prisma.product.findMany({
      where: {
        status: "ACTIVE",
        categories: { some: { categoryId: { in: allCategoryIds } } },
      },
      select: {
        id: true,
        slug: true,
        title: true,
        price: true,
        comparePrice: true,
        images: true,
        seller: { select: { shopName: true, slug: true, verified: true } },
        categories: {
          select: { category: { select: { name: true, slug: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 4,
    });

    return products.map((p) => ({
      ...p,
      categories: p.categories.map((pc) => pc.category),
    }));
  },
  ["homepage-collection"],
  { revalidate: 300, tags: ["products"] }
);

/* ── Page ── */

export default async function HomePage() {
  const [artisans, shabbatProducts, bijouxProducts, mezuzahProducts, settings] =
    await Promise.all([
      getFeaturedArtisans(),
      getCollectionProducts(["chabbat"]),
      getCollectionProducts(["colliers", "bracelets", "bagues"]),
      getCollectionProducts(["mezouza"]),
      getHomepageSettings(),
    ]);

  const t = settings.texts;

  return (
    <>
      <OrganizationJsonLd />
      <WebSiteJsonLd />

      <HeroBanner settings={settings} />

      {/* Divider */}
      <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12 py-4">
        <div className="h-px bg-border" />
      </div>

      <FeaturedArtisans artisans={artisans} />

      <CollectionSection
        title={t.homepage_text_collection_1_title}
        description={t.homepage_text_collection_1_description}
        products={shabbatProducts}
        href="/products?category=chabbat"
      />

      <CollectionSection
        title={t.homepage_text_collection_2_title}
        description={t.homepage_text_collection_2_description}
        products={bijouxProducts}
        href="/products?category=bijoux"
      />

      <CollectionSection
        title={t.homepage_text_collection_3_title}
        description={t.homepage_text_collection_3_description}
        products={mezuzahProducts}
        href="/products?category=art-accessoires"
      />

      <PiliersSection settings={settings} />

      {/* Divider */}
      <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12">
        <div className="h-px bg-border" />
      </div>

      <HeritageBand settings={settings} />
    </>
  );
}

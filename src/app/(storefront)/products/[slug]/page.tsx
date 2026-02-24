import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ImageGallery } from "@/components/storefront/image-gallery";
import { AddToCartButton } from "@/components/storefront/add-to-cart-button";
import { FavoriteButton } from "@/components/storefront/favorite-button";
import { ProductCard } from "@/components/storefront/product-card";
import { formatPrice } from "@/lib/utils";
import { Star, Package, Truck, Check } from "@/components/ui/icons";
import { unstable_cache } from "next/cache";
import { ProductJsonLd, BreadcrumbJsonLd } from "@/components/seo/json-ld";

// ISR: revalidate every 300s — product data cached on CDN
export const revalidate = 300;

/* ── Cached data fetching ── */

const getProductMeta = unstable_cache(
  async (slug: string) => {
    return prisma.product.findUnique({
      where: { slug },
      select: { title: true, description: true, images: true, price: true, slug: true },
    });
  },
  ["product-meta"],
  { revalidate: 300, tags: ["products"] }
);

const getProduct = unstable_cache(
  async (slug: string) => {
    return prisma.product.findUnique({
      where: { slug, status: "ACTIVE" },
      include: {
        seller: true,
        categories: { include: { category: true } },
        variants: true,
        reviews: {
          include: { user: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        _count: { select: { reviews: true, favorites: true } },
      },
    });
  },
  ["product-detail"],
  { revalidate: 300, tags: ["products"] }
);

const getRelatedProducts = unstable_cache(
  async (categoryIds: string[], excludeProductId: string) => {
    return prisma.product.findMany({
      where: {
        categories: { some: { categoryId: { in: categoryIds } } },
        id: { not: excludeProductId },
        status: "ACTIVE",
      },
      select: {
        slug: true,
        title: true,
        price: true,
        comparePrice: true,
        images: true,
        seller: { select: { shopName: true, slug: true } },
      },
      take: 4,
      orderBy: { createdAt: "desc" },
    });
  },
  ["related-products"],
  { revalidate: 300, tags: ["products"] }
);

/* ── Metadata ── */

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductMeta(slug);

  if (!product) return { title: "Produit introuvable" };

  const description = product.description.slice(0, 160);
  const url = `https://yddishmarket.com/products/${product.slug}`;

  return {
    title: product.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: product.title,
      description,
      url,
      type: "website",
      images: product.images.length > 0
        ? [{ url: product.images[0], width: 800, height: 800, alt: product.title }]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title: product.title,
      description,
      images: product.images.length > 0 ? [product.images[0]] : [],
    },
  };
}

function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={size}
          strokeWidth={1.5}
          className={i < Math.round(rating) ? "fill-foreground text-foreground" : "text-border"}
        />
      ))}
    </div>
  );
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const product = await getProduct(slug);

  if (!product) notFound();

  // Calculate average rating
  const averageRating =
    product.reviews.length > 0
      ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
      : 0;

  // Get first category for breadcrumb & related products
  const primaryCategory = product.categories[0]?.category ?? null;
  const productCatIds = product.categories.map((pc) => pc.category.id);

  // Fetch related products (share any category, different product)
  const relatedProducts = await getRelatedProducts(productCatIds, product.id);

  return (
    <div>
      {/* SEO: Structured Data */}
      <ProductJsonLd
        name={product.title}
        description={product.description}
        image={product.images}
        slug={product.slug}
        price={product.price}
        comparePrice={product.comparePrice}
        inStock={product.stock > 0}
        sku={product.sku}
        seller={{ shopName: product.seller.shopName, slug: product.seller.slug }}
        rating={averageRating > 0 ? averageRating : undefined}
        reviewCount={product._count.reviews > 0 ? product._count.reviews : undefined}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Accueil", url: "https://yddishmarket.com" },
          ...(primaryCategory
            ? [{ name: primaryCategory.name, url: `https://yddishmarket.com/?category=${primaryCategory.slug}` }]
            : []),
          { name: product.title, url: `https://yddishmarket.com/products/${product.slug}` },
        ]}
      />

      {/* Breadcrumb */}
      <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12 pt-4 pb-2">
        <nav className="flex items-center gap-2 text-[12px] text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">Accueil</Link>
          <span>&gt;</span>
          {primaryCategory ? (
            <Link href={`/?category=${primaryCategory.slug}`} className="hover:text-foreground transition-colors">
              {primaryCategory.name}
            </Link>
          ) : (
            <Link href="/" className="hover:text-foreground transition-colors">Produits</Link>
          )}
          <span>&gt;</span>
          <span className="text-foreground">{product.title}</span>
        </nav>
      </div>

      {/* Main product section */}
      <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
          {/* Left: Gallery */}
          <ImageGallery images={product.images} title={product.title} />

          {/* Right: Product info */}
          <div className="lg:max-w-md">
            {/* Seller */}
            <Link
              href={`/seller/${product.seller.slug}`}
              className="text-[12px] text-muted-foreground tracking-wide hover:text-foreground transition-colors"
            >
              {product.seller.shopName}
            </Link>

            {/* Title */}
            <h1 className="text-[22px] font-light text-foreground mt-2 leading-snug">
              {product.title}
            </h1>

            {/* Rating */}
            {product._count.reviews > 0 && (
              <div className="flex items-center gap-2 mt-3">
                <Stars rating={averageRating} />
                <span className="text-[12px] text-muted-foreground">
                  ({product._count.reviews} avis)
                </span>
              </div>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-3 mt-4">
              <span className="text-[20px] text-foreground">{formatPrice(product.price)}</span>
              {product.comparePrice && (
                <span className="text-[14px] text-muted-foreground line-through">
                  {formatPrice(product.comparePrice)}
                </span>
              )}
              {product.comparePrice && (
                <span className="text-[12px] text-sale font-medium">
                  -{Math.round((1 - product.price / product.comparePrice) * 100)}%
                </span>
              )}
            </div>

            {/* Variants */}
            {product.variants.length > 0 && (
              <div className="mt-6">
                <p className="text-[11px] font-medium tracking-[0.15em] uppercase text-foreground mb-3">
                  Variante
                </p>
                <div className="flex gap-2">
                  {product.variants.map((v, i) => (
                    <button
                      key={v.id}
                      type="button"
                      className={`px-4 py-2 text-[12px] border transition-colors ${
                        i === 0
                          ? "border-foreground text-foreground"
                          : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                      }`}
                    >
                      {v.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Add to cart */}
            <div className="mt-8 flex items-center gap-3">
              <div className="flex-1">
                <AddToCartButton productId={product.id} />
              </div>
              <FavoriteButton productId={product.id} size="md" />
            </div>

            {/* Stock */}
            <p className="text-[12px] text-muted-foreground mt-3">
              {product.stock > 0 ? (
                product.stock <= 3 ? (
                  <span className="text-sale">Plus que {product.stock} en stock</span>
                ) : (
                  "En stock"
                )
              ) : (
                <span className="text-sale">Rupture de stock</span>
              )}
            </p>

            {/* Retour & livraison */}
            <div className="flex items-center gap-4 mt-4 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                Retour sous 14 jours
              </span>
              <span className="flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="13" x="6" y="4.5" rx="2"/><path d="m3 7 3-2.5"/><path d="m21 7-3-2.5"/><path d="M12 12h.01"/></svg>
                Paiement sécurisé
              </span>
            </div>

            {/* Description */}
            <div className="mt-8 pt-8 border-t border-border">
              <h2 className="text-[11px] font-medium tracking-[0.15em] uppercase text-foreground mb-4">
                Description
              </h2>
              <div className="text-[13px] text-muted-foreground leading-relaxed whitespace-pre-line">
                {product.description}
              </div>
            </div>

            {/* Details */}
            <div className="mt-6 pt-6 border-t border-border">
              <h2 className="text-[11px] font-medium tracking-[0.15em] uppercase text-foreground mb-4">
                Details
              </h2>
              <dl className="space-y-2 text-[13px]">
                {product.sku && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Reference</dt>
                    <dd className="text-foreground">{product.sku}</dd>
                  </div>
                )}
                {product.weight && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Poids</dt>
                    <dd className="text-foreground">{product.weight} g</dd>
                  </div>
                )}
                {product.categories.length > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Catégories</dt>
                    <dd className="text-foreground">
                      {product.categories.map((pc) => pc.category.name).join(", ")}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Seller card */}
            <div className="mt-6 pt-6 border-t border-border">
              <Link
                href={`/seller/${product.seller.slug}`}
                className="block bg-[#FAFAF7] border border-border/60 p-4 hover:border-foreground/20 transition-colors group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-foreground text-[#FFFFFF] flex items-center justify-center text-[13px] font-medium shrink-0">
                    {product.seller.shopName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-foreground font-medium group-hover:underline truncate">
                      {product.seller.shopName}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {product.seller.verified && (
                        <span className="flex items-center gap-0.5 text-[10px] text-accent">
                          <Check size={10} strokeWidth={2} />
                          Certifié
                        </span>
                      )}
                      {product.seller.totalSales > 0 && (
                        <span className="text-[11px] text-muted-foreground">
                          {product.seller.totalSales} vente{product.seller.totalSales > 1 ? "s" : ""}
                        </span>
                      )}
                      {product.seller.rating > 0 && (
                        <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground">
                          <Star size={10} strokeWidth={1.5} className="fill-foreground text-foreground" />
                          {product.seller.rating.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {product.seller.description && (
                  <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2 mb-3">
                    {product.seller.description}
                  </p>
                )}

                <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Truck size={11} strokeWidth={1.5} />
                    Expédié sous {product.seller.handlingDays}j
                  </span>
                  <span className="flex items-center gap-1">
                    <Package size={11} strokeWidth={1.5} />
                    Depuis {product.seller.shipsFrom === "FR" ? "France" : product.seller.shipsFrom === "IL" ? "Israël" : product.seller.shipsFrom}
                  </span>
                  {product.seller.freeShippingThreshold && (
                    <span className="text-accent font-medium">
                      Livraison offerte dès {formatPrice(product.seller.freeShippingThreshold)}
                    </span>
                  )}
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews */}
      {product.reviews.length > 0 && (
        <section className="border-t border-border">
          <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12 py-12">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-[15px] font-medium tracking-wide text-foreground">
                Avis clients ({product._count.reviews})
              </h2>
              <div className="flex items-center gap-2">
                <Stars rating={averageRating} size={16} />
                <span className="text-[13px] text-foreground">{averageRating.toFixed(1)}/5</span>
              </div>
            </div>
            <div className="space-y-6 max-w-2xl">
              {product.reviews.map((review) => (
                <div key={review.id} className="pb-6 border-b border-border last:border-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <Stars rating={review.rating} size={12} />
                      <span className="text-[13px] font-medium text-foreground">
                        {review.user.name || "Anonyme"}
                      </span>
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      {new Date(review.createdAt).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="text-[13px] text-muted-foreground leading-relaxed">{review.comment}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Related products */}
      {relatedProducts.length > 0 && (
        <section className="border-t border-border">
          <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12 py-12">
            <h2 className="text-[15px] font-medium tracking-wide text-foreground mb-8">
              Vous aimerez aussi
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-8">
              {relatedProducts.map((p) => (
                <ProductCard
                  key={p.slug}
                  product={{
                    slug: p.slug,
                    title: p.title,
                    price: p.price,
                    comparePrice: p.comparePrice,
                    images: p.images,
                    seller: {
                      shopName: p.seller.shopName,
                      slug: p.seller.slug,
                    },
                  }}
                />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

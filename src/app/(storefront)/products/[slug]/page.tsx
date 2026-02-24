import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ImageGallery } from "@/components/storefront/image-gallery";
import { AddToCartButton } from "@/components/storefront/add-to-cart-button";
import { FavoriteButton } from "@/components/storefront/favorite-button";
import { ProductCard } from "@/components/storefront/product-card";
import { formatPrice } from "@/lib/utils";
import { Star, Package, Truck, Check, Shield } from "@/components/ui/icons";
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

  // Build structured details
  const details: { label: string; value: string }[] = [];
  if (product.categories.length > 0) {
    details.push({ label: "Catégorie", value: product.categories.map((pc) => pc.category.name).join(", ") });
  }
  if (product.sku) {
    details.push({ label: "Référence", value: product.sku });
  }
  if (product.weight) {
    details.push({ label: "Poids", value: `${product.weight} g` });
  }
  details.push({
    label: "Expédition",
    value: `Depuis ${product.seller.shipsFrom === "FR" ? "France" : product.seller.shipsFrom === "IL" ? "Israël" : product.seller.shipsFrom} · ${product.seller.handlingDays}j de préparation`,
  });
  if (product.seller.freeShippingThreshold) {
    details.push({ label: "Livraison offerte", value: `Dès ${formatPrice(product.seller.freeShippingThreshold)} d'achat` });
  }
  if (product.tags && product.tags.length > 0) {
    details.push({ label: "Tags", value: product.tags.join(", ") });
  }

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
          <span className="text-border">/</span>
          {primaryCategory ? (
            <Link href={`/?category=${primaryCategory.slug}`} className="hover:text-foreground transition-colors">
              {primaryCategory.name}
            </Link>
          ) : (
            <Link href="/" className="hover:text-foreground transition-colors">Produits</Link>
          )}
          <span className="text-border">/</span>
          <span className="text-foreground/60 truncate max-w-[200px]">{product.title}</span>
        </nav>
      </div>

      {/* Main product section — Info LEFT, Image RIGHT */}
      <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12 py-6 lg:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.15fr] gap-8 lg:gap-16">

          {/* ═══ LEFT: Product Info ═══ */}
          <div className="order-2 lg:order-1 lg:py-4">
            {/* Seller name */}
            <Link
              href={`/seller/${product.seller.slug}`}
              className="inline-flex items-center gap-1.5 text-[11px] tracking-[0.12em] uppercase text-muted-foreground hover:text-accent transition-colors"
            >
              {product.seller.shopName}
              {product.seller.verified && (
                <Check size={10} strokeWidth={2.5} className="text-accent" />
              )}
            </Link>

            {/* Title */}
            <h1 className="text-[26px] lg:text-[32px] font-light text-foreground mt-3 leading-[1.2] tracking-[-0.01em]">
              {product.title}
            </h1>

            {/* Rating */}
            {product._count.reviews > 0 && (
              <div className="flex items-center gap-2.5 mt-4">
                <Stars rating={averageRating} size={13} />
                <span className="text-[12px] text-muted-foreground">
                  {averageRating.toFixed(1)} ({product._count.reviews} avis)
                </span>
              </div>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-3 mt-5">
              <span className="text-[24px] font-light text-foreground tracking-tight">
                {formatPrice(product.price)}
              </span>
              {product.comparePrice && (
                <span className="text-[14px] text-muted-foreground line-through">
                  {formatPrice(product.comparePrice)}
                </span>
              )}
              {product.comparePrice && (
                <span className="text-[11px] text-[#FFFFFF] bg-sale px-2 py-0.5 rounded-full font-medium">
                  -{Math.round((1 - product.price / product.comparePrice) * 100)}%
                </span>
              )}
            </div>

            {/* Divider */}
            <div className="h-px bg-border/60 my-7" />

            {/* Description — short preview */}
            <div className="text-[13px] text-muted-foreground leading-[1.7] whitespace-pre-line line-clamp-4">
              {product.description}
            </div>

            {/* Structured details grid */}
            {details.length > 0 && (
              <div className="mt-7">
                <dl className="space-y-3">
                  {details.map((d) => (
                    <div key={d.label} className="flex items-start gap-4">
                      <dt className="w-[110px] shrink-0 text-[11px] tracking-[0.1em] uppercase text-muted-foreground pt-px">
                        {d.label}
                      </dt>
                      <dd className="text-[13px] text-foreground">
                        {d.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {/* Variants */}
            {product.variants.length > 0 && (
              <div className="mt-7">
                <p className="text-[11px] tracking-[0.1em] uppercase text-muted-foreground mb-3">
                  Variante
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v, i) => (
                    <button
                      key={v.id}
                      type="button"
                      className={`px-4 py-2 text-[12px] border transition-all duration-200 rounded-lg ${
                        i === 0
                          ? "border-foreground text-foreground bg-foreground/5"
                          : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                      }`}
                    >
                      {v.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Divider */}
            <div className="h-px bg-border/60 my-7" />

            {/* Add to cart + Favorite */}
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <AddToCartButton productId={product.id} />
              </div>
              <div className="w-[52px] h-[52px] border border-border/60 rounded-xl flex items-center justify-center hover:border-foreground/30 transition-colors">
                <FavoriteButton productId={product.id} size="md" />
              </div>
            </div>

            {/* Stock indicator */}
            <p className="text-[12px] mt-3">
              {product.stock > 0 ? (
                product.stock <= 3 ? (
                  <span className="text-sale font-medium">Plus que {product.stock} en stock</span>
                ) : (
                  <span className="text-muted-foreground">En stock — Expédié sous {product.seller.handlingDays} jour{product.seller.handlingDays > 1 ? "s" : ""}</span>
                )
              ) : (
                <span className="text-sale font-medium">Rupture de stock</span>
              )}
            </p>

            {/* Trust badges */}
            <div className="flex items-center gap-5 mt-5 py-4 border-t border-border/40">
              <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Truck size={14} strokeWidth={1.5} className="text-foreground/40" />
                Livraison suivie
              </span>
              <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Shield size={14} strokeWidth={1.5} className="text-foreground/40" />
                Paiement sécurisé
              </span>
              <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Package size={14} strokeWidth={1.5} className="text-foreground/40" />
                Retour 14 jours
              </span>
            </div>

            {/* Seller card */}
            <div className="mt-2">
              <Link
                href={`/seller/${product.seller.slug}`}
                className="flex items-center gap-3.5 p-4 bg-[#FAFAF7] border border-border/40 rounded-xl hover:border-foreground/20 transition-all duration-200 group"
              >
                <div className="w-11 h-11 bg-foreground text-[#FFFFFF] flex items-center justify-center text-[14px] font-medium shrink-0 rounded-xl">
                  {product.seller.shopName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-foreground font-medium group-hover:text-accent transition-colors truncate">
                    {product.seller.shopName}
                  </p>
                  <div className="flex items-center gap-3 mt-0.5 text-[11px] text-muted-foreground">
                    {product.seller.verified && (
                      <span className="flex items-center gap-0.5 text-accent">
                        <Check size={10} strokeWidth={2.5} />
                        Vérifié
                      </span>
                    )}
                    {product.seller.totalSales > 0 && (
                      <span>{product.seller.totalSales} vente{product.seller.totalSales > 1 ? "s" : ""}</span>
                    )}
                    {product.seller.rating > 0 && (
                      <span className="flex items-center gap-0.5">
                        <Star size={10} strokeWidth={1.5} className="fill-foreground text-foreground" />
                        {product.seller.rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </div>
          </div>

          {/* ═══ RIGHT: Image Gallery ═══ */}
          <div className="order-1 lg:order-2 lg:sticky lg:top-20 lg:self-start">
            <ImageGallery images={product.images} title={product.title} />
          </div>
        </div>
      </div>

      {/* ═══ Full description (below fold) ═══ */}
      {product.description.length > 200 && (
        <section className="border-t border-border/40">
          <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12 py-12 lg:py-16">
            <div className="max-w-2xl">
              <h2 className="text-[11px] font-medium tracking-[0.15em] uppercase text-muted-foreground mb-5">
                Description complète
              </h2>
              <div className="text-[14px] text-foreground/80 leading-[1.8] whitespace-pre-line">
                {product.description}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ═══ Reviews ═══ */}
      {product.reviews.length > 0 && (
        <section className="border-t border-border/40">
          <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12 py-12 lg:py-16">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-[11px] font-medium tracking-[0.15em] uppercase text-muted-foreground">
                Avis clients ({product._count.reviews})
              </h2>
              <div className="flex items-center gap-2">
                <Stars rating={averageRating} size={14} />
                <span className="text-[13px] text-foreground font-medium">{averageRating.toFixed(1)}/5</span>
              </div>
            </div>
            <div className="space-y-0 max-w-2xl divide-y divide-border/40">
              {product.reviews.map((review) => (
                <div key={review.id} className="py-6 first:pt-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <Stars rating={review.rating} size={11} />
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

      {/* ═══ Related products ═══ */}
      {relatedProducts.length > 0 && (
        <section className="border-t border-border/40 bg-[#FAFAF9]">
          <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12 py-12 lg:py-16">
            <h2 className="text-[11px] font-medium tracking-[0.15em] uppercase text-muted-foreground mb-8">
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

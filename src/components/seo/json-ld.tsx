/* ── JSON-LD Structured Data Components ── */

type JsonLdProps = {
  data: Record<string, unknown>;
};

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/* ── Organization (homepage) ── */

export function OrganizationJsonLd() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "YDDISH MARKET",
        url: "https://yddishmarket.com",
        logo: "https://yddishmarket.com/logo.svg",
        description:
          "La marketplace de référence pour les objets Judaica : objets rituels, bijoux, art, mode, mezouzot, livres et alimentaire casher.",
        sameAs: [],
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "customer service",
          email: "contact@yddishmarket.com",
          availableLanguage: ["French", "English", "Hebrew"],
        },
      }}
    />
  );
}

export function WebSiteJsonLd() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "YDDISH MARKET",
        url: "https://yddishmarket.com",
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: "https://yddishmarket.com/?q={search_term_string}",
          },
          "query-input": "required name=search_term_string",
        },
      }}
    />
  );
}

/* ── Product (product detail page) ── */

type ProductJsonLdProps = {
  name: string;
  description: string;
  image: string[];
  slug: string;
  price: number;
  comparePrice?: number | null;
  currency?: string;
  inStock: boolean;
  sku?: string | null;
  seller: { shopName: string; slug: string };
  rating?: number;
  reviewCount?: number;
};

export function ProductJsonLd({
  name,
  description,
  image,
  slug,
  price,
  comparePrice,
  currency = "EUR",
  inStock,
  sku,
  seller,
  rating,
  reviewCount,
}: ProductJsonLdProps) {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description: description.slice(0, 500),
    image,
    url: `https://yddishmarket.com/products/${slug}`,
    brand: {
      "@type": "Brand",
      name: seller.shopName,
    },
    offers: {
      "@type": "Offer",
      price: price.toFixed(2),
      priceCurrency: currency,
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: seller.shopName,
        url: `https://yddishmarket.com/seller/${seller.slug}`,
      },
      ...(comparePrice
        ? {
            priceValidUntil: new Date(
              Date.now() + 30 * 24 * 60 * 60 * 1000
            )
              .toISOString()
              .split("T")[0],
          }
        : {}),
    },
  };

  if (sku) {
    data.sku = sku;
  }

  if (rating && reviewCount && reviewCount > 0) {
    data.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: rating.toFixed(1),
      reviewCount,
      bestRating: "5",
      worstRating: "1",
    };
  }

  return <JsonLd data={data} />;
}

/* ── BreadcrumbList ── */

type BreadcrumbItem = {
  name: string;
  url: string;
};

export function BreadcrumbJsonLd({ items }: { items: BreadcrumbItem[] }) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: item.name,
          item: item.url,
        })),
      }}
    />
  );
}

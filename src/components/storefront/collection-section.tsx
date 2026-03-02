import Link from "next/link";
import { ProductCard, type ProductCardData } from "@/components/storefront/product-card";

type CollectionSectionProps = {
  title: string;
  description: string;
  products: ProductCardData[];
  href: string;
};

export function CollectionSection({
  title,
  description,
  products,
  href,
}: CollectionSectionProps) {
  if (products.length === 0) return null;

  return (
    <section className="py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12">
        {/* Header row — title left, CTA right */}
        <div className="flex items-end justify-between mb-3">
          <h2 className="text-[20px] sm:text-[24px] lg:text-[28px] font-light text-foreground">
            {title}
          </h2>
          <Link
            href={href}
            className="hidden sm:inline-flex items-center h-10 px-6 text-[11px] tracking-[0.15em] uppercase font-medium border border-foreground/20 text-foreground hover:border-foreground transition-colors rounded-xl shrink-0"
          >
            Voir la sélection
          </Link>
        </div>

        {/* Description */}
        <p className="text-[13px] text-muted-foreground max-w-[500px] mb-8">
          {description}
        </p>

        {/* Products grid */}
        <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide lg:grid lg:grid-cols-4 lg:overflow-visible lg:pb-0">
          {products.slice(0, 4).map((product) => (
            <div
              key={product.slug}
              className="min-w-[260px] sm:min-w-[280px] lg:min-w-0 snap-start"
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>

        {/* Mobile CTA */}
        <div className="mt-6 sm:hidden">
          <Link
            href={href}
            className="text-[12px] tracking-[0.15em] uppercase text-foreground border-b border-foreground/30 pb-0.5 hover:border-foreground transition-colors"
          >
            Voir la sélection
          </Link>
        </div>
      </div>
    </section>
  );
}

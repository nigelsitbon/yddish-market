"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart } from "@/components/ui/icons";
import { formatPrice } from "@/lib/utils";

export type ProductCardData = {
  slug: string;
  title: string;
  price: number;
  comparePrice?: number | null;
  images: string[];
  seller: {
    shopName: string;
    slug: string;
    verified?: boolean;
  };
  categories?: {
    name: string;
    slug: string;
  }[];
};

/** Filter out placeholder URLs that don't render well in next/image */
function getRealImage(images: string[]): string | null {
  const real = images.find(
    (url) => url && !url.includes("placehold.co") && !url.includes("placeholder")
  );
  return real ?? null;
}

function PlaceholderImage() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[#F5F5F5]">
      <span className="text-[11px] text-muted-foreground tracking-widest uppercase">
        Photo
      </span>
    </div>
  );
}

export function ProductCard({ product }: { product: ProductCardData }) {
  const [imgError, setImgError] = useState(false);
  const imageUrl = getRealImage(product.images);
  const hasImage = !!imageUrl && !imgError;
  const hasDiscount = product.comparePrice && product.comparePrice > product.price;

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      {/* Image */}
      <div className="relative aspect-[3/4] bg-[#F5F5F5] mb-3 overflow-hidden">
        {hasImage ? (
          <Image
            src={imageUrl}
            alt={product.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
            onError={() => setImgError(true)}
          />
        ) : (
          <PlaceholderImage />
        )}

        {/* Favorite button */}
        <button
          type="button"
          className="absolute top-3 right-3 z-10 p-1 text-muted-foreground hover:text-foreground transition-colors"
          onClick={(e) => {
            e.preventDefault();
            // TODO: toggle favorite
          }}
          aria-label="Ajouter aux favoris"
        >
          <Heart size={18} strokeWidth={1.5} />
        </button>

        {/* Discount badge */}
        {hasDiscount && (
          <span className="absolute top-3 left-3 bg-sale text-[#FFFFFF] text-[10px] font-medium px-2 py-0.5 tracking-wide">
            -{Math.round(((product.comparePrice! - product.price) / product.comparePrice!) * 100)}%
          </span>
        )}
      </div>

      {/* Info */}
      <div className="space-y-0.5">
        <p className="text-[12px] text-muted-foreground tracking-wide">
          {product.seller.shopName}
        </p>
        <p className="text-[13px] text-foreground leading-snug group-hover:underline line-clamp-2">
          {product.title}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-[13px] text-foreground font-medium">
            {formatPrice(product.price)}
          </p>
          {hasDiscount && (
            <p className="text-[12px] text-muted-foreground line-through">
              {formatPrice(product.comparePrice!)}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

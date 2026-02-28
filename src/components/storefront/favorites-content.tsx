"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, ArrowRight } from "@/components/ui/icons";
import { formatPrice } from "@/lib/utils";

type FavoriteProduct = {
  id: string;
  slug: string;
  title: string;
  price: number;
  comparePrice: number | null;
  images: string[];
  seller: {
    shopName: string;
    slug: string;
    verified: boolean;
  };
};

type FavoriteItem = {
  id: string;
  productId: string;
  createdAt: string;
  product: FavoriteProduct;
};

export function FavoritesContent() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/favorites")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setFavorites(json.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const removeFavorite = async (productId: string) => {
    // Optimistic remove
    setRemovingIds((prev) => new Set(prev).add(productId));
    const previousFavorites = [...favorites];
    setFavorites((prev) => prev.filter((f) => f.productId !== productId));

    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      const json = await res.json();
      if (!json.success) {
        // Rollback on error
        setFavorites(previousFavorites);
      }
    } catch {
      // Rollback on error
      setFavorites(previousFavorites);
    } finally {
      setRemovingIds((prev) => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-[3/4] bg-muted rounded-xl mb-3" />
            <div className="space-y-2">
              <div className="h-3 w-20 bg-muted rounded" />
              <div className="h-3 w-32 bg-muted rounded" />
              <div className="h-3 w-16 bg-muted rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 bg-muted/60 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Heart size={28} strokeWidth={1} className="text-muted-foreground" />
        </div>
        <h2 className="text-[18px] font-light text-foreground mb-2">
          Aucun favori
        </h2>
        <p className="text-[13px] text-muted-foreground mb-6 max-w-sm mx-auto">
          Vous n'avez pas encore ajouté de produit à vos favoris.
          Parcourez notre catalogue et cliquez sur le cœur pour sauvegarder vos coups de cœur.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 h-12 px-8 btn-gradient-dark text-[#FFFFFF] text-[13px] tracking-wide rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
        >
          Découvrir les produits
          <ArrowRight size={16} strokeWidth={1.5} />
        </Link>
      </div>
    );
  }

  return (
    <div>
      <p className="text-[12px] text-muted-foreground mb-6">
        {favorites.length} article{favorites.length > 1 ? "s" : ""}
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {favorites.map((fav) => {
          const product = fav.product;
          const imageUrl = product.images.find(
            (url) => url && !url.includes("placehold.co") && !url.includes("placeholder")
          );
          const hasDiscount = product.comparePrice && product.comparePrice > product.price;
          const isRemoving = removingIds.has(fav.productId);

          return (
            <div
              key={fav.id}
              className={`group relative transition-opacity duration-300 ${isRemoving ? "opacity-50 pointer-events-none" : ""}`}
            >
              <Link href={`/products/${product.slug}`} className="block">
                {/* Image */}
                <div className="relative aspect-[3/4] bg-[#F5F5F5] mb-3 overflow-hidden rounded-xl">
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={product.title}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[11px] text-muted-foreground tracking-widest uppercase">
                        Photo
                      </span>
                    </div>
                  )}

                  {/* Discount badge */}
                  {hasDiscount && (
                    <span className="absolute top-3 left-3 bg-sale text-[#FFFFFF] text-[10px] font-medium px-2.5 py-1 tracking-wide rounded-lg">
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

              {/* Remove button */}
              <button
                type="button"
                onClick={() => removeFavorite(fav.productId)}
                className="absolute top-3 right-3 z-10 p-2 rounded-full bg-[#FFFFFF]/80 backdrop-blur-sm text-foreground hover:text-destructive hover:bg-[#FFFFFF] shadow-sm hover:shadow-md transition-all duration-200"
                aria-label="Retirer des favoris"
              >
                <Heart size={16} strokeWidth={1.5} className="fill-current" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { AddToCartButton } from "./add-to-cart-button";
import { FavoriteButton } from "./favorite-button";
import { formatPrice } from "@/lib/utils";

type Variant = {
  id: string;
  name: string;
  price: number | null;
  stock: number;
};

type VariantSelectorProps = {
  productId: string;
  basePrice: number;
  baseStock: number;
  variants: Variant[];
};

export function VariantSelector({ productId, basePrice, baseStock, variants }: VariantSelectorProps) {
  const [selectedId, setSelectedId] = useState<string | null>(
    variants.length > 0 ? variants[0].id : null
  );

  const selected = variants.find((v) => v.id === selectedId);
  const currentPrice = selected?.price ?? basePrice;
  const currentStock = selected ? selected.stock : baseStock;
  const isOutOfStock = currentStock <= 0;

  return (
    <div>
      {/* Variant buttons */}
      {variants.length > 0 && (
        <div className="mb-7">
          <p className="text-[11px] tracking-[0.1em] uppercase text-muted-foreground mb-3">
            Variante
          </p>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => {
              const isSelected = selectedId === v.id;
              const outOfStock = v.stock <= 0;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setSelectedId(v.id)}
                  disabled={outOfStock}
                  className={`px-4 py-2 text-[12px] border transition-all duration-200 rounded-lg ${
                    outOfStock
                      ? "border-border/40 text-muted-foreground/40 line-through cursor-not-allowed"
                      : isSelected
                      ? "border-foreground text-foreground bg-foreground/5"
                      : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                  }`}
                >
                  {v.name}
                  {v.price && v.price !== basePrice && (
                    <span className="ml-1.5 text-[10px] text-muted-foreground">
                      {formatPrice(v.price)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Divider */}
      <div className="h-px bg-border/60 mb-7" />

      {/* Add to cart + Favorite */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <AddToCartButton
            productId={productId}
            variantId={selectedId || undefined}
            disabled={isOutOfStock}
          />
        </div>
        <div className="w-[52px] h-[52px] border border-border/60 rounded-xl flex items-center justify-center hover:border-foreground/30 transition-colors">
          <FavoriteButton productId={productId} size="md" />
        </div>
      </div>

      {/* Stock indicator */}
      <p className="text-[12px] mt-3">
        {currentStock > 0 ? (
          currentStock <= 3 ? (
            <span className="text-sale font-medium">Plus que {currentStock} en stock</span>
          ) : (
            <span className="text-muted-foreground">En stock</span>
          )
        ) : (
          <span className="text-sale font-medium">Rupture de stock</span>
        )}
      </p>
    </div>
  );
}

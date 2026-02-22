"use client";

import Link from "next/link";
import Image from "next/image";
import { X } from "@/components/ui/icons";
import { QuantitySelector } from "@/components/storefront/quantity-selector";
import { formatPrice } from "@/lib/utils";
import type { CartItem } from "@/stores/cart";

type CartItemRowProps = {
  item: CartItem;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
  disabled?: boolean;
};

export function CartItemRow({ item, onUpdateQuantity, onRemove, disabled }: CartItemRowProps) {
  const price = item.variant?.price ?? item.product.price;
  const lineTotal = price * item.quantity;

  return (
    <div className="flex gap-4 sm:gap-6 py-6 border-b border-border">
      {/* Image */}
      <Link href={`/products/${item.product.slug}`} className="shrink-0">
        <div className="w-[100px] h-[133px] sm:w-[120px] sm:h-[160px] bg-[#F5F5F0] relative overflow-hidden flex items-center justify-center">
          {item.product.images[0] ? (
            <Image
              src={item.product.images[0]}
              alt={item.product.title}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100px, 120px"
            />
          ) : (
            <span className="text-[10px] text-[#A09A90] tracking-widest uppercase">Image</span>
          )}
        </div>
      </Link>

      {/* Details */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <Link
            href={`/seller/${item.product.seller.slug}`}
            className="text-[11px] tracking-wide text-muted-foreground hover:text-foreground transition-colors uppercase"
          >
            {item.product.seller.shopName}
          </Link>
          <Link href={`/products/${item.product.slug}`}>
            <h3 className="text-[13px] sm:text-[14px] text-foreground mt-0.5 hover:opacity-70 transition-opacity">
              {item.product.title}
            </h3>
          </Link>
          {item.variant && (
            <p className="text-[12px] text-muted-foreground mt-1">
              {item.variant.name}
            </p>
          )}
        </div>

        <div className="flex items-end justify-between mt-4">
          <QuantitySelector
            value={item.quantity}
            onChange={(qty) => onUpdateQuantity(item.id, qty)}
            max={20}
            min={1}
          />
          <div className="text-right">
            <p className="text-[14px] font-medium text-foreground">
              {formatPrice(lineTotal)}
            </p>
            {item.quantity > 1 && (
              <p className="text-[11px] text-muted-foreground">
                {formatPrice(price)} / pièce
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Remove */}
      <button
        type="button"
        onClick={() => onRemove(item.id)}
        disabled={disabled}
        className="shrink-0 self-start p-1 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30"
        aria-label="Supprimer"
      >
        <X size={16} strokeWidth={1.5} />
      </button>
    </div>
  );
}

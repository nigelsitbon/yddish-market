"use client";

import { useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useUser } from "@clerk/nextjs";
import { X, ShoppingBag, ArrowRight } from "@/components/ui/icons";
import { useCartStore } from "@/stores/cart";
import { QuantitySelector } from "@/components/storefront/quantity-selector";
import { formatPrice } from "@/lib/utils";

export function CartDrawer() {
  const { isSignedIn, isLoaded } = useUser();
  const { items, isOpen, isLoading, setOpen, setItems, setLoading, updateQuantity, removeItem } =
    useCartStore();

  const fetchCart = useCallback(async () => {
    if (!isSignedIn) return;
    setLoading(true);
    try {
      const res = await fetch("/api/cart");
      const json = await res.json();
      if (json.success) {
        setItems(json.data);
      }
    } catch (err) {
      console.error("Failed to fetch cart", err);
    } finally {
      setLoading(false);
    }
  }, [isSignedIn, setItems, setLoading]);

  // Fetch cart when drawer opens
  useEffect(() => {
    if (isOpen && isLoaded && isSignedIn) {
      fetchCart();
    }
  }, [isOpen, isLoaded, isSignedIn, fetchCart]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    if (isOpen) {
      document.addEventListener("keydown", onKey);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, setOpen]);

  const handleUpdateQuantity = async (itemId: string, quantity: number) => {
    updateQuantity(itemId, quantity);
    try {
      const res = await fetch(`/api/cart/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
      });
      if (!res.ok) fetchCart();
    } catch {
      fetchCart();
    }
  };

  const handleRemove = async (itemId: string) => {
    removeItem(itemId);
    try {
      await fetch(`/api/cart/${itemId}`, { method: "DELETE" });
    } catch {
      fetchCart();
    }
  };

  const subtotal = useCartStore.getState().subtotal();
  const count = useCartStore.getState().itemCount();

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-[60] transition-opacity"
        onClick={() => setOpen(false)}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-[420px] bg-white z-[61] flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 h-[60px] border-b border-border shrink-0">
          <h2 className="text-[14px] font-medium tracking-wide uppercase text-foreground">
            Panier ({count})
          </h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="p-1 text-foreground hover:opacity-60 transition-opacity"
            aria-label="Fermer"
          >
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-6 space-y-4">
              <div className="h-20 bg-muted animate-pulse" />
              <div className="h-20 bg-muted animate-pulse" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-6 text-center">
              <ShoppingBag size={32} strokeWidth={1} className="text-muted-foreground mb-3" />
              <p className="text-[13px] text-muted-foreground mb-4">
                Votre panier est vide
              </p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-[12px] text-foreground underline underline-offset-4 hover:opacity-70 transition-opacity"
              >
                Continuer mes achats
              </button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {items.map((item) => {
                const price = item.variant?.price ?? item.product.price;
                return (
                  <div key={item.id} className="flex gap-4 p-4">
                    {/* Thumb */}
                    <Link
                      href={`/products/${item.product.slug}`}
                      onClick={() => setOpen(false)}
                      className="shrink-0"
                    >
                      <div className="w-[72px] h-[96px] bg-[#F5F5F0] relative overflow-hidden flex items-center justify-center">
                        {item.product.images[0] ? (
                          <Image
                            src={item.product.images[0]}
                            alt={item.product.title}
                            fill
                            className="object-cover"
                            sizes="72px"
                          />
                        ) : (
                          <span className="text-[8px] text-[#A09A90] tracking-widest uppercase">
                            Image
                          </span>
                        )}
                      </div>
                    </Link>

                    {/* Info */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <p className="text-[10px] tracking-wider text-muted-foreground uppercase">
                          {item.product.seller.shopName}
                        </p>
                        <Link
                          href={`/products/${item.product.slug}`}
                          onClick={() => setOpen(false)}
                          className="text-[12px] text-foreground leading-tight hover:opacity-70 transition-opacity line-clamp-2"
                        >
                          {item.product.title}
                        </Link>
                        {item.variant && (
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {item.variant.name}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <QuantitySelector
                          value={item.quantity}
                          onChange={(qty) => handleUpdateQuantity(item.id, qty)}
                          max={20}
                          min={1}
                        />
                        <p className="text-[13px] font-medium text-foreground">
                          {formatPrice(price * item.quantity)}
                        </p>
                      </div>
                    </div>

                    {/* Remove */}
                    <button
                      type="button"
                      onClick={() => handleRemove(item.id)}
                      className="shrink-0 self-start p-0.5 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="Supprimer"
                    >
                      <X size={14} strokeWidth={1.5} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="shrink-0 border-t border-border p-6 space-y-4">
            <div className="flex justify-between text-[13px]">
              <span className="text-muted-foreground">Sous-total</span>
              <span className="font-medium text-foreground">{formatPrice(subtotal)}</span>
            </div>
            {subtotal < 150 && (
              <p className="text-[11px] text-accent">
                Plus que {formatPrice(150 - subtotal)} pour la livraison offerte
              </p>
            )}
            <div className="space-y-2">
              <Link
                href="/checkout"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-2 w-full h-13 bg-accent text-[#FFFFFF] text-[14px] tracking-wide font-semibold hover:bg-accent/90 transition-colors shadow-md"
              >
                Passer commande
                <ArrowRight size={16} strokeWidth={1.5} />
              </Link>
              <Link
                href="/cart"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center w-full h-12 border border-foreground text-foreground text-[13px] tracking-wide hover:bg-foreground hover:text-[#FFFFFF] transition-colors"
              >
                Voir le panier
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

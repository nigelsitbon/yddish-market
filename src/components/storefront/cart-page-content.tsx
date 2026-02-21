"use client";

import { useEffect, useCallback } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { ShoppingBag, ArrowRight, ArrowLeft } from "lucide-react";
import { useCartStore } from "@/stores/cart";
import { CartItemRow } from "@/components/storefront/cart-item-row";
import { formatPrice } from "@/lib/utils";

export function CartPageContent() {
  const { isSignedIn, isLoaded } = useUser();
  const { items, isLoading, setItems, setLoading, updateQuantity, removeItem } = useCartStore();

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

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchCart();
    }
  }, [isLoaded, isSignedIn, fetchCart]);

  const handleUpdateQuantity = async (itemId: string, quantity: number) => {
    // Optimistic update
    updateQuantity(itemId, quantity);
    try {
      const res = await fetch(`/api/cart/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
      });
      if (!res.ok) {
        // Revert on error
        fetchCart();
      }
    } catch {
      fetchCart();
    }
  };

  const handleRemove = async (itemId: string) => {
    // Optimistic update
    removeItem(itemId);
    try {
      await fetch(`/api/cart/${itemId}`, { method: "DELETE" });
    } catch {
      fetchCart();
    }
  };

  const subtotal = useCartStore.getState().subtotal();
  const shippingEstimate = subtotal >= 150 ? 0 : 9.90;
  const total = subtotal + shippingEstimate;

  // Loading state
  if (!isLoaded || isLoading) {
    return (
      <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12 py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-6 w-48 bg-muted" />
          <div className="h-[160px] bg-muted" />
          <div className="h-[160px] bg-muted" />
        </div>
      </div>
    );
  }

  // Not signed in
  if (!isSignedIn) {
    return (
      <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12 py-20 text-center">
        <ShoppingBag size={40} strokeWidth={1} className="mx-auto text-muted-foreground mb-4" />
        <h1 className="text-[20px] font-light text-foreground mb-2">Votre panier</h1>
        <p className="text-[13px] text-muted-foreground mb-6">
          Connectez-vous pour accéder à votre panier.
        </p>
        <Link
          href="/sign-in"
          className="inline-flex items-center gap-2 h-12 px-8 bg-foreground text-white text-[13px] tracking-wide hover:bg-foreground/90 transition-colors"
        >
          Se connecter
        </Link>
      </div>
    );
  }

  // Empty cart
  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12 py-20 text-center">
        <ShoppingBag size={40} strokeWidth={1} className="mx-auto text-muted-foreground mb-4" />
        <h1 className="text-[20px] font-light text-foreground mb-2">Votre panier est vide</h1>
        <p className="text-[13px] text-muted-foreground mb-6">
          Découvrez notre sélection de produits Judaica d'exception.
        </p>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 h-12 px-8 bg-foreground text-white text-[13px] tracking-wide hover:bg-foreground/90 transition-colors"
        >
          Explorer la boutique
          <ArrowRight size={16} strokeWidth={1.5} />
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12 py-8 lg:py-12">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-[12px] text-muted-foreground mb-6">
        <Link href="/" className="hover:text-foreground transition-colors">Accueil</Link>
        <span>&gt;</span>
        <span className="text-foreground">Panier</span>
      </nav>

      <h1 className="text-[22px] font-light text-foreground mb-2">
        Votre panier
      </h1>
      <p className="text-[12px] text-muted-foreground mb-8">
        {items.length} article{items.length > 1 ? "s" : ""}
      </p>

      <div className="lg:grid lg:grid-cols-[1fr_380px] lg:gap-12">
        {/* Cart items */}
        <div>
          {items.map((item) => (
            <CartItemRow
              key={item.id}
              item={item}
              onUpdateQuantity={handleUpdateQuantity}
              onRemove={handleRemove}
              disabled={isLoading}
            />
          ))}

          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-[13px] text-muted-foreground hover:text-foreground transition-colors mt-6"
          >
            <ArrowLeft size={14} strokeWidth={1.5} />
            Continuer mes achats
          </Link>
        </div>

        {/* Order summary */}
        <div className="mt-8 lg:mt-0">
          <div className="bg-[#FAFAFA] p-6 lg:sticky lg:top-[120px]">
            <h2 className="text-[14px] font-medium text-foreground tracking-wide uppercase mb-6">
              Récapitulatif
            </h2>

            <div className="space-y-3 text-[13px]">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sous-total</span>
                <span className="text-foreground">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Livraison estimée</span>
                <span className="text-foreground">
                  {shippingEstimate === 0 ? "Offerte" : formatPrice(shippingEstimate)}
                </span>
              </div>
              {shippingEstimate > 0 && (
                <p className="text-[11px] text-accent">
                  Plus que {formatPrice(150 - subtotal)} pour la livraison offerte
                </p>
              )}
              <div className="border-t border-border pt-3 mt-3">
                <div className="flex justify-between text-[14px] font-medium">
                  <span className="text-foreground">Total</span>
                  <span className="text-foreground">{formatPrice(total)}</span>
                </div>
              </div>
            </div>

            <Link
              href="/checkout"
              className="flex items-center justify-center gap-2 w-full h-12 mt-6 bg-foreground text-white text-[13px] tracking-wide font-medium hover:bg-foreground/90 transition-colors"
            >
              Passer commande
              <ArrowRight size={16} strokeWidth={1.5} />
            </Link>

            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="11" width="18" height="11" rx="0" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                Paiement sécurisé par Stripe
              </div>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-1.5">
                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="1.5">
                  <path d="M3 7h18M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7M3 7l9 6 9-6" />
                </svg>
                Retours sous 14 jours
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

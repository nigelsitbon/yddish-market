"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { ShoppingBag, Check } from "lucide-react";
import { useCartStore } from "@/stores/cart";

type AddToCartButtonProps = {
  productId: string;
  variantId?: string;
  disabled?: boolean;
  quantity?: number;
};

export function AddToCartButton({ productId, variantId, disabled, quantity = 1 }: AddToCartButtonProps) {
  const { isSignedIn } = useUser();
  const [added, setAdded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { addItem, setOpen } = useCartStore();

  const handleAdd = async () => {
    if (loading || added) return;

    // If not signed in, prompt to sign in
    if (!isSignedIn) {
      window.location.href = "/sign-in?redirect_url=" + encodeURIComponent(window.location.pathname);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, variantId: variantId || null, quantity }),
      });

      const json = await res.json();

      if (json.success) {
        // Add to local store
        addItem(json.data);
        setAdded(true);
        // Open cart drawer
        setTimeout(() => setOpen(true), 300);
        setTimeout(() => setAdded(false), 2000);
      } else {
        setError(json.error || "Erreur");
        setTimeout(() => setError(""), 3000);
      }
    } catch {
      setError("Erreur réseau");
      setTimeout(() => setError(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={handleAdd}
        disabled={disabled || loading}
        className={`w-full flex items-center justify-center gap-2 h-12 text-[13px] tracking-wide font-medium transition-all ${
          added
            ? "bg-foreground text-white"
            : error
            ? "bg-destructive text-white"
            : disabled
            ? "bg-[#E5E5E5] text-muted-foreground cursor-not-allowed"
            : "bg-foreground text-white hover:bg-foreground/90"
        }`}
      >
        {added ? (
          <>
            <Check size={16} strokeWidth={2} />
            Ajouté au panier
          </>
        ) : error ? (
          <span className="text-[12px]">{error}</span>
        ) : loading ? (
          <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <>
            <ShoppingBag size={16} strokeWidth={1.5} />
            Ajouter au panier
          </>
        )}
      </button>
    </div>
  );
}

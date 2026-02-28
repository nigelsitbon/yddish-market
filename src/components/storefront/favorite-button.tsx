"use client";

import { useState, useCallback } from "react";
import { Heart } from "@/components/ui/icons";

type FavoriteButtonProps = {
  productId: string;
  initialFavorited?: boolean;
  size?: "sm" | "md";
  className?: string;
};

export function FavoriteButton({
  productId,
  initialFavorited = false,
  size = "md",
  className,
}: FavoriteButtonProps) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [loading, setLoading] = useState(false);

  const toggle = useCallback(async () => {
    if (loading) return;

    // Optimistic update
    const prev = favorited;
    setFavorited(!prev);
    setLoading(true);

    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      const json = await res.json();

      if (!json.success) {
        // Rollback on error (including auth errors — user not logged in)
        setFavorited(prev);
      }
    } catch {
      // Rollback on network error
      setFavorited(prev);
    } finally {
      setLoading(false);
    }
  }, [productId, favorited, loading]);

  const iconSize = size === "sm" ? 16 : 20;

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      className={className || "p-2 hover:opacity-60 transition-opacity"}
      aria-label={favorited ? "Retirer des favoris" : "Ajouter aux favoris"}
    >
      <Heart
        size={iconSize}
        strokeWidth={1.5}
        className={
          favorited
            ? "fill-foreground text-foreground transition-colors duration-200"
            : "text-muted-foreground transition-colors duration-200"
        }
      />
    </button>
  );
}

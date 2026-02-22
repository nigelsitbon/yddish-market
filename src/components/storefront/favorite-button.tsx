"use client";

import { useState } from "react";
import { Heart } from "@/components/ui/icons";

type FavoriteButtonProps = {
  productId: string;
  initialFavorited?: boolean;
  size?: "sm" | "md";
};

export function FavoriteButton({ productId, initialFavorited = false, size = "md" }: FavoriteButtonProps) {
  const [favorited, setFavorited] = useState(initialFavorited);

  const toggle = async () => {
    setFavorited(!favorited);
    // TODO: API call to toggle favorite
    void productId;
  };

  const iconSize = size === "sm" ? 16 : 20;

  return (
    <button
      type="button"
      onClick={toggle}
      className="p-2 hover:opacity-60 transition-opacity"
      aria-label={favorited ? "Retirer des favoris" : "Ajouter aux favoris"}
    >
      <Heart
        size={iconSize}
        strokeWidth={1.5}
        className={favorited ? "fill-foreground text-foreground" : "text-muted-foreground"}
      />
    </button>
  );
}

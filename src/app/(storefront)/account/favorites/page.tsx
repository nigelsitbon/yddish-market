import type { Metadata } from "next";
import { Suspense } from "react";
import { FavoritesContent } from "@/components/storefront/favorites-content";

export const metadata: Metadata = {
  title: "Mes favoris — YDDISH MARKET",
  description: "Retrouvez tous les produits que vous avez ajoutés à vos favoris sur YDDISH MARKET.",
};

function FavoritesSkeleton() {
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

export default function FavoritesPage() {
  return (
    <div className="mx-auto max-w-[900px] px-4 sm:px-8 py-10 lg:py-14">
      <div className="mb-8">
        <h1 className="text-[26px] lg:text-[32px] font-light text-foreground tracking-[-0.01em]">
          Mes favoris
        </h1>
        <p className="text-[13px] text-muted-foreground mt-2">
          Vos produits sauvegardés, prêts à être retrouvés.
        </p>
      </div>

      <Suspense fallback={<FavoritesSkeleton />}>
        <FavoritesContent />
      </Suspense>
    </div>
  );
}

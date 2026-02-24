import type { Metadata } from "next";
import { Suspense } from "react";
import { OrdersContent } from "@/components/storefront/orders-content";

export const metadata: Metadata = {
  title: "Mes commandes — YDDISH MARKET",
  description: "Suivez l'état de vos commandes sur YDDISH MARKET.",
};

function OrdersSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="border border-border/60 rounded-2xl p-6 animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-4 w-40 bg-muted rounded" />
            <div className="h-4 w-24 bg-muted rounded-full" />
          </div>
          <div className="flex gap-4">
            <div className="w-16 h-20 bg-muted rounded-lg" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-48 bg-muted rounded" />
              <div className="h-3 w-32 bg-muted rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function OrdersPage() {
  return (
    <div className="mx-auto max-w-[900px] px-4 sm:px-8 py-10 lg:py-14">
      <div className="mb-8">
        <h1 className="text-[26px] lg:text-[32px] font-light text-foreground tracking-[-0.01em]">
          Mes commandes
        </h1>
        <p className="text-[13px] text-muted-foreground mt-2">
          Suivez l'état de vos commandes et retrouvez vos achats.
        </p>
      </div>

      <Suspense fallback={<OrdersSkeleton />}>
        <OrdersContent />
      </Suspense>
    </div>
  );
}

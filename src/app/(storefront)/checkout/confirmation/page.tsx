import { Suspense } from "react";
import { OrderConfirmationContent } from "@/components/storefront/order-confirmation-content";

export const metadata = {
  title: "Confirmation de commande",
};

export const dynamic = "force-dynamic";

export default function ConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-[700px] px-4 sm:px-8 py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-16 w-16 bg-muted mx-auto" />
            <div className="h-6 w-64 bg-muted mx-auto" />
          </div>
        </div>
      }
    >
      <OrderConfirmationContent />
    </Suspense>
  );
}

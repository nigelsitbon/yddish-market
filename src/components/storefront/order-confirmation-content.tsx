"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Check, Package, ArrowRight } from "lucide-react";
import { useCartStore } from "@/stores/cart";
import { formatPrice } from "@/lib/utils";

type OrderData = {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: number;
  shippingTotal: number;
  total: number;
  createdAt: string;
  address: {
    firstName: string;
    lastName: string;
    street: string;
    street2?: string | null;
    city: string;
    zip: string;
    country: string;
  };
  items: {
    id: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    product: { title: string; slug: string; images: string[] };
    variant: { name: string } | null;
    seller: { shopName: string };
  }[];
};

export function OrderConfirmationContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order");
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const clearCart = useCartStore((s) => s.clearCart);

  useEffect(() => {
    // Clear cart after successful order
    clearCart();
  }, [clearCart]);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    fetch(`/api/orders/${orderId}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setOrder(json.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) {
    return (
      <div className="mx-auto max-w-[700px] px-4 sm:px-8 py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-16 w-16 bg-muted mx-auto" />
          <div className="h-6 w-64 bg-muted mx-auto" />
          <div className="h-[200px] bg-muted" />
        </div>
      </div>
    );
  }

  if (!orderId || !order) {
    return (
      <div className="mx-auto max-w-[700px] px-4 sm:px-8 py-20 text-center">
        <Package size={40} strokeWidth={1} className="mx-auto text-muted-foreground mb-4" />
        <h1 className="text-[20px] font-light text-foreground mb-2">
          Commande introuvable
        </h1>
        <p className="text-[13px] text-muted-foreground mb-6">
          Nous n'avons pas trouvé cette commande.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 h-12 px-8 bg-foreground text-white text-[13px] tracking-wide hover:bg-foreground/90 transition-colors"
        >
          Retour à l'accueil
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[700px] px-4 sm:px-8 py-12 lg:py-16">
      {/* Success icon */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-foreground text-white flex items-center justify-center mx-auto mb-4">
          <Check size={28} strokeWidth={2} />
        </div>
        <h1 className="text-[22px] font-light text-foreground mb-1">
          Merci pour votre commande !
        </h1>
        <p className="text-[13px] text-muted-foreground">
          Commande n° {order.orderNumber}
        </p>
      </div>

      {/* Order details card */}
      <div className="border border-border p-6 mb-6">
        <h2 className="text-[13px] font-medium tracking-wide uppercase text-foreground mb-4">
          Détails de la commande
        </h2>

        {/* Items */}
        <div className="space-y-3 mb-6">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-start gap-3">
              <div className="w-12 h-16 bg-[#F5F5F0] shrink-0 flex items-center justify-center">
                {item.product.images[0] ? (
                  <img
                    src={item.product.images[0]}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-[7px] text-[#A09A90]">IMG</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] text-foreground">{item.product.title}</p>
                {item.variant && (
                  <p className="text-[11px] text-muted-foreground">{item.variant.name}</p>
                )}
                <p className="text-[11px] text-muted-foreground">
                  {item.seller.shopName} · Qté : {item.quantity}
                </p>
              </div>
              <p className="text-[12px] text-foreground shrink-0">
                {formatPrice(item.subtotal)}
              </p>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="border-t border-border pt-4 space-y-2 text-[13px]">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Sous-total</span>
            <span className="text-foreground">{formatPrice(order.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Livraison</span>
            <span className="text-foreground">
              {order.shippingTotal === 0 ? "Offerte" : formatPrice(order.shippingTotal)}
            </span>
          </div>
          <div className="flex justify-between text-[14px] font-medium pt-2 border-t border-border">
            <span>Total</span>
            <span>{formatPrice(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Shipping address */}
      <div className="border border-border p-6 mb-6">
        <h2 className="text-[13px] font-medium tracking-wide uppercase text-foreground mb-3">
          Adresse de livraison
        </h2>
        <div className="text-[13px] text-muted-foreground leading-relaxed">
          <p className="text-foreground font-medium">
            {order.address.firstName} {order.address.lastName}
          </p>
          <p>{order.address.street}</p>
          {order.address.street2 && <p>{order.address.street2}</p>}
          <p>
            {order.address.zip} {order.address.city}, {order.address.country}
          </p>
        </div>
      </div>

      {/* Info */}
      <div className="bg-[#FAFAFA] p-6 mb-8 text-[12px] text-muted-foreground space-y-2">
        <p>
          Un email de confirmation sera envoyé à votre adresse.
        </p>
        <p>
          Chaque vendeur préparera et expédiera sa partie de la commande séparément.
          Vous recevrez un email avec le suivi pour chaque envoi.
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/products"
          className="flex items-center justify-center gap-2 h-12 px-8 bg-foreground text-white text-[13px] tracking-wide hover:bg-foreground/90 transition-colors"
        >
          Continuer mes achats
          <ArrowRight size={16} strokeWidth={1.5} />
        </Link>
      </div>
    </div>
  );
}

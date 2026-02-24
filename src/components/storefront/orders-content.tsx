"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Package, Truck, Check, Clock, X, ArrowRight, ShoppingBag } from "@/components/ui/icons";
import { formatPrice } from "@/lib/utils";

type OrderItem = {
  id: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  status: string;
  carrier: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  product: { title: string; slug: string; images: string[] };
  variant: { name: string } | null;
  seller: { shopName: string; slug: string };
};

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: number;
  shippingTotal: number;
  total: number;
  createdAt: string;
  items: OrderItem[];
};

const statusConfig: Record<string, { label: string; icon: typeof Clock; color: string }> = {
  PENDING: { label: "En attente", icon: Clock, color: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  CONFIRMED: { label: "Confirmée", icon: Check, color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  PROCESSING: { label: "En préparation", icon: Package, color: "bg-blue-50 text-blue-700 border-blue-200" },
  SHIPPED: { label: "Expédiée", icon: Truck, color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  DELIVERED: { label: "Livrée", icon: Check, color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  CANCELLED: { label: "Annulée", icon: X, color: "bg-red-50 text-red-600 border-red-200" },
  REFUNDED: { label: "Remboursée", icon: X, color: "bg-gray-50 text-gray-600 border-gray-200" },
};

function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || statusConfig.PENDING;
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-medium rounded-full border ${config.color}`}>
      <Icon size={12} strokeWidth={2} />
      {config.label}
    </span>
  );
}

export function OrdersContent() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/orders")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setOrders(json.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
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

  if (orders.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 bg-muted/60 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <ShoppingBag size={28} strokeWidth={1} className="text-muted-foreground" />
        </div>
        <h2 className="text-[18px] font-light text-foreground mb-2">
          Aucune commande
        </h2>
        <p className="text-[13px] text-muted-foreground mb-6 max-w-sm mx-auto">
          Vous n'avez pas encore passé de commande. Découvrez notre sélection de produits.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 h-12 px-8 btn-gradient-dark text-[#FFFFFF] text-[13px] tracking-wide rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
        >
          Découvrir les produits
          <ArrowRight size={16} strokeWidth={1.5} />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <div
          key={order.id}
          className="border border-border/60 rounded-2xl overflow-hidden hover:border-foreground/20 transition-colors duration-200"
        >
          {/* Order header */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 bg-[#FAFAF9] border-b border-border/40">
            <div className="flex items-center gap-4">
              <div>
                <p className="text-[12px] text-muted-foreground">
                  Commande n° <span className="text-foreground font-medium">{order.orderNumber}</span>
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {new Date(order.createdAt).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge status={order.status} />
              <span className="text-[14px] font-medium text-foreground">
                {formatPrice(order.total)}
              </span>
            </div>
          </div>

          {/* Items */}
          <div className="px-6 py-4 space-y-4">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-start gap-4">
                <Link
                  href={`/products/${item.product.slug}`}
                  className="w-16 h-20 bg-[#F5F5F0] shrink-0 relative overflow-hidden rounded-lg hover:opacity-80 transition-opacity"
                >
                  {item.product.images[0] ? (
                    <Image
                      src={item.product.images[0]}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  ) : (
                    <span className="flex items-center justify-center h-full text-[8px] text-muted-foreground">
                      IMG
                    </span>
                  )}
                </Link>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/products/${item.product.slug}`}
                    className="text-[13px] text-foreground hover:text-accent transition-colors font-medium"
                  >
                    {item.product.title}
                  </Link>
                  {item.variant && (
                    <p className="text-[11px] text-muted-foreground mt-0.5">{item.variant.name}</p>
                  )}
                  <p className="text-[11px] text-muted-foreground mt-1">
                    <Link href={`/seller/${item.seller.slug}`} className="hover:text-accent transition-colors">
                      {item.seller.shopName}
                    </Link>
                    {" "}· Qté : {item.quantity}
                  </p>

                  {/* Tracking info */}
                  {item.trackingNumber && (
                    <div className="mt-2">
                      {item.trackingUrl ? (
                        <a
                          href={item.trackingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-[11px] text-accent font-medium hover:underline"
                        >
                          <Truck size={12} strokeWidth={1.5} />
                          Suivre le colis ({item.carrier || "Transporteur"})
                        </a>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">
                          N° suivi : {item.trackingNumber}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[13px] text-foreground">{formatPrice(item.subtotal)}</p>
                  {item.status !== order.status && (
                    <StatusBadge status={item.status} />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Order footer with totals */}
          <div className="px-6 py-3 border-t border-border/40 flex items-center justify-between">
            <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
              <span>Sous-total : {formatPrice(order.subtotal)}</span>
              <span>Livraison : {order.shippingTotal === 0 ? "Offerte" : formatPrice(order.shippingTotal)}</span>
            </div>
            <Link
              href={`/order-confirmation?order=${order.id}`}
              className="text-[11px] text-accent font-medium hover:underline"
            >
              Voir le détail
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}

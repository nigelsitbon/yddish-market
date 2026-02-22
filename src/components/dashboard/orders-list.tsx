"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { ShoppingCart, Package, Truck, Check, X as XIcon } from "@/components/ui/icons";
import { formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui";

type PayoutInfo = {
  id: string;
  status: string;
  amount: number;
};

type OrderItemData = {
  id: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  commission: number;
  status: string;
  trackingNumber: string | null;
  trackingUrl: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
  order: {
    orderNumber: string;
    createdAt: string;
    buyer: { name: string | null; email: string };
    address: { firstName: string; lastName: string; city: string; country: string };
  };
  product: { title: string; slug: string; images: string[] };
  variant: { name: string } | null;
  payouts: PayoutInfo[];
};

const statusConfig: Record<string, { label: string; variant: "default" | "success" | "destructive" | "outline" | "muted"; icon: typeof Package }> = {
  PENDING: { label: "En attente", variant: "outline", icon: Package },
  CONFIRMED: { label: "Confirmée", variant: "default", icon: Check },
  PROCESSING: { label: "En préparation", variant: "muted", icon: Package },
  SHIPPED: { label: "Expédiée", variant: "default", icon: Truck },
  DELIVERED: { label: "Livrée", variant: "success", icon: Check },
  CANCELLED: { label: "Annulée", variant: "destructive", icon: XIcon },
  REFUNDED: { label: "Remboursée", variant: "destructive", icon: XIcon },
};

const nextStatus: Record<string, string> = {
  PENDING: "CONFIRMED",
  CONFIRMED: "PROCESSING",
  PROCESSING: "SHIPPED",
  SHIPPED: "DELIVERED",
};

export function OrdersList() {
  const [orders, setOrders] = useState<OrderItemData[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [trackingModal, setTrackingModal] = useState<string | null>(null);
  const [trackingNumber, setTrackingNumber] = useState("");

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await fetch(`/api/dashboard/orders?${params}`);
      const json = await res.json();
      if (json.success) {
        setOrders(json.data.orders);
        setTotal(json.data.total);
      }
    } catch (err) {
      console.error("Failed to fetch orders", err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleUpdateStatus = async (orderItemId: string, status: string, tracking?: string) => {
    setUpdatingId(orderItemId);
    try {
      const body: Record<string, string> = { status };
      if (tracking) body.trackingNumber = tracking;

      await fetch(`/api/dashboard/orders/${orderItemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      fetchOrders();
    } catch (err) {
      console.error("Failed to update status", err);
    } finally {
      setUpdatingId(null);
      setTrackingModal(null);
      setTrackingNumber("");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-[20px] font-light text-foreground">Commandes</h1>
        <p className="text-[12px] text-muted-foreground mt-0.5">
          {total} commande{total > 1 ? "s" : ""}
        </p>
      </div>

      {/* Status filters */}
      <div className="flex gap-1 flex-wrap">
        {["all", "PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatusFilter(s)}
            className={`h-9 px-3 text-[11px] tracking-wide border transition-colors ${
              statusFilter === s
                ? "border-foreground bg-foreground text-[#FFFFFF]"
                : "border-border bg-white text-muted-foreground hover:text-foreground"
            }`}
          >
            {s === "all" ? "Toutes" : statusConfig[s]?.label || s}
          </button>
        ))}
      </div>

      {/* Orders */}
      <div className="bg-white border border-border">
        {loading ? (
          <div className="p-8 space-y-4">
            {[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-muted animate-pulse" />)}
          </div>
        ) : orders.length === 0 ? (
          <div className="py-16 text-center">
            <ShoppingCart size={32} strokeWidth={1} className="mx-auto text-muted-foreground mb-3" />
            <p className="text-[13px] text-muted-foreground">
              {statusFilter !== "all" ? "Aucune commande avec ce statut" : "Aucune commande pour le moment"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {orders.map((item) => {
              const st = statusConfig[item.status] || statusConfig.PENDING;
              const next = nextStatus[item.status];
              const netRevenue = item.subtotal - item.commission;

              return (
                <div key={item.id} className="p-5">
                  <div className="flex items-start gap-4">
                    {/* Product image */}
                    <div className="w-14 h-14 bg-[#F5F5F0] shrink-0 relative overflow-hidden flex items-center justify-center">
                      {item.product.images[0] ? (
                        <Image src={item.product.images[0]} alt="" fill className="object-cover" sizes="56px" />
                      ) : (
                        <Package size={18} className="text-muted-foreground" />
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-[13px] text-foreground">{item.product.title}</p>
                          {item.variant && (
                            <p className="text-[11px] text-muted-foreground">{item.variant.name}</p>
                          )}
                          <p className="text-[11px] text-muted-foreground mt-1">
                            N° {item.order.orderNumber} · Qté {item.quantity} · {new Date(item.order.createdAt).toLocaleDateString("fr-FR")}
                          </p>
                        </div>
                        <Badge variant={st.variant} className="text-[10px] shrink-0">
                          {st.label}
                        </Badge>
                      </div>

                      {/* Client + Financial */}
                      <div className="flex flex-wrap gap-x-6 gap-y-1 mt-2 text-[11px] text-muted-foreground">
                        <span>
                          Client : {item.order.address.firstName} {item.order.address.lastName}
                          {" "}({item.order.address.city})
                        </span>
                        <span>Total : {formatPrice(item.subtotal)}</span>
                        <span className="text-success">Net : {formatPrice(netRevenue)}</span>
                        {item.payouts?.[0] && (
                          <span className={item.payouts[0].status === "COMPLETED" ? "text-green-600" : item.payouts[0].status === "FAILED" ? "text-red-600" : "text-muted-foreground"}>
                            {item.payouts[0].status === "COMPLETED" ? "Versé" : item.payouts[0].status === "FAILED" ? "Versement échoué" : "Versement en attente"}
                          </span>
                        )}
                      </div>

                      {/* Tracking */}
                      {item.trackingNumber && (
                        <p className="text-[11px] text-foreground mt-1">
                          Suivi : {item.trackingNumber}
                        </p>
                      )}

                      {/* Action buttons */}
                      {next && (
                        <div className="mt-3 flex gap-2">
                          {next === "SHIPPED" ? (
                            <button
                              type="button"
                              onClick={() => setTrackingModal(item.id)}
                              disabled={updatingId === item.id}
                              className="flex items-center gap-1.5 h-8 px-3 text-[11px] bg-foreground text-[#FFFFFF] hover:bg-foreground/90 transition-colors disabled:opacity-50"
                            >
                              <Truck size={12} /> Marquer expédiée
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(item.id, next)}
                              disabled={updatingId === item.id}
                              className="flex items-center gap-1.5 h-8 px-3 text-[11px] bg-foreground text-[#FFFFFF] hover:bg-foreground/90 transition-colors disabled:opacity-50"
                            >
                              {updatingId === item.id ? (
                                <span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                              ) : (
                                <>
                                  <Check size={12} />
                                  {statusConfig[next]?.label || next}
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tracking modal */}
                  {trackingModal === item.id && (
                    <div className="mt-3 p-3 border border-border bg-muted/50">
                      <p className="text-[11px] text-foreground mb-2">Numéro de suivi (optionnel)</p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={trackingNumber}
                          onChange={(e) => setTrackingNumber(e.target.value)}
                          placeholder="Ex: FR12345678"
                          className="flex-1 h-9 px-2 text-[12px] border border-border bg-white focus:border-foreground focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(item.id, "SHIPPED", trackingNumber || undefined)}
                          className="h-9 px-4 text-[11px] bg-foreground text-[#FFFFFF]"
                        >
                          Confirmer
                        </button>
                        <button
                          type="button"
                          onClick={() => { setTrackingModal(null); setTrackingNumber(""); }}
                          className="h-9 px-3 text-[11px] border border-border text-muted-foreground"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

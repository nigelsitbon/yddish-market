"use client";

import { useEffect, useState, useCallback } from "react";
import { Euro, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui";

type PayoutData = {
  id: string;
  amount: number;
  commission: number;
  shippingAmount: number;
  status: string;
  stripeTransferId: string | null;
  failureReason: string | null;
  createdAt: string;
  orderItem: {
    id: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    shippingAmount: number;
    order: { orderNumber: string };
    product: { title: string };
  };
};

type Summary = {
  totalCompleted: number;
  totalPending: number;
  countCompleted: number;
  countPending: number;
  countFailed: number;
};

const statusConfig: Record<string, { label: string; variant: "default" | "success" | "destructive" | "outline" | "muted"; icon: typeof CheckCircle }> = {
  PENDING: { label: "En attente", variant: "outline", icon: Clock },
  PROCESSING: { label: "En cours", variant: "muted", icon: Clock },
  COMPLETED: { label: "Versé", variant: "success", icon: CheckCircle },
  FAILED: { label: "Échoué", variant: "destructive", icon: AlertTriangle },
};

export function PayoutsList() {
  const [payouts, setPayouts] = useState<PayoutData[]>([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState<Summary>({ totalCompleted: 0, totalPending: 0, countCompleted: 0, countPending: 0, countFailed: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchPayouts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await fetch(`/api/dashboard/payouts?${params}`);
      const json = await res.json();
      if (json.success) {
        setPayouts(json.data.payouts);
        setTotal(json.data.total);
        setSummary(json.data.summary);
      }
    } catch (err) {
      console.error("Failed to fetch payouts", err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchPayouts();
  }, [fetchPayouts]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-[20px] font-light text-foreground">Versements</h1>
        <p className="text-[12px] text-muted-foreground mt-0.5">
          Suivi de vos versements
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-border p-4">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Versé</p>
          <p className="text-[18px] font-light text-foreground mt-1">
            {formatPrice(summary.totalCompleted)}
          </p>
          <p className="text-[11px] text-muted-foreground">{summary.countCompleted} versement{summary.countCompleted > 1 ? "s" : ""}</p>
        </div>
        <div className="bg-white border border-border p-4">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">En attente</p>
          <p className="text-[18px] font-light text-foreground mt-1">
            {formatPrice(summary.totalPending)}
          </p>
          <p className="text-[11px] text-muted-foreground">{summary.countPending} versement{summary.countPending > 1 ? "s" : ""}</p>
        </div>
        <div className="bg-white border border-border p-4">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Total</p>
          <p className="text-[18px] font-light text-foreground mt-1">
            {formatPrice(summary.totalCompleted + summary.totalPending)}
          </p>
        </div>
        {summary.countFailed > 0 && (
          <div className="bg-white border border-red-200 p-4">
            <p className="text-[10px] text-red-600 uppercase tracking-wide">Échoués</p>
            <p className="text-[18px] font-light text-red-600 mt-1">{summary.countFailed}</p>
          </div>
        )}
      </div>

      {/* Status filters */}
      <div className="flex gap-1 flex-wrap">
        {["all", "PENDING", "COMPLETED", "FAILED"].map((s) => (
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
            {s === "all" ? "Tous" : statusConfig[s]?.label || s}
          </button>
        ))}
      </div>

      {/* Payouts list */}
      <div className="bg-white border border-border">
        {loading ? (
          <div className="p-8 space-y-4">
            {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-muted animate-pulse" />)}
          </div>
        ) : payouts.length === 0 ? (
          <div className="py-16 text-center">
            <Euro size={32} strokeWidth={1} className="mx-auto text-muted-foreground mb-3" />
            <p className="text-[13px] text-muted-foreground">
              {statusFilter !== "all" ? "Aucun versement avec ce statut" : "Aucun versement pour le moment"}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              Les versements sont créés automatiquement quand une commande est livrée.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {/* Table header */}
            <div className="hidden sm:grid sm:grid-cols-[1fr_100px_100px_100px_100px_90px] gap-4 px-5 py-3 text-[10px] text-muted-foreground uppercase tracking-wide bg-[#FAFAFA]">
              <span>Produit</span>
              <span className="text-right">Brut</span>
              <span className="text-right">Commission</span>
              <span className="text-right">Livraison</span>
              <span className="text-right">Net</span>
              <span className="text-center">Statut</span>
            </div>

            {payouts.map((payout) => {
              const st = statusConfig[payout.status] || statusConfig.PENDING;
              return (
                <div key={payout.id} className="p-5 sm:grid sm:grid-cols-[1fr_100px_100px_100px_100px_90px] sm:gap-4 sm:items-center">
                  {/* Product info */}
                  <div>
                    <p className="text-[13px] text-foreground truncate">{payout.orderItem.product.title}</p>
                    <p className="text-[11px] text-muted-foreground">
                      N° {payout.orderItem.order.orderNumber} · {new Date(payout.createdAt).toLocaleDateString("fr-FR")}
                    </p>
                    {payout.failureReason && (
                      <p className="text-[11px] text-red-600 mt-0.5">{payout.failureReason}</p>
                    )}
                  </div>

                  {/* Amounts */}
                  <p className="text-[12px] text-foreground text-right hidden sm:block">
                    {formatPrice(payout.orderItem.subtotal)}
                  </p>
                  <p className="text-[12px] text-muted-foreground text-right hidden sm:block">
                    -{formatPrice(payout.commission)}
                  </p>
                  <p className="text-[12px] text-muted-foreground text-right hidden sm:block">
                    +{formatPrice(payout.shippingAmount)}
                  </p>
                  <p className="text-[12px] text-foreground font-medium text-right hidden sm:block">
                    {formatPrice(payout.amount)}
                  </p>

                  {/* Mobile amounts */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 sm:hidden text-[11px] text-muted-foreground">
                    <span>Brut : {formatPrice(payout.orderItem.subtotal)}</span>
                    <span>Commission : -{formatPrice(payout.commission)}</span>
                    <span className="text-foreground font-medium">Net : {formatPrice(payout.amount)}</span>
                  </div>

                  {/* Status */}
                  <div className="mt-2 sm:mt-0 sm:text-center">
                    <Badge variant={st.variant} className="text-[10px]">
                      {st.label}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination info */}
      {total > 20 && (
        <p className="text-[11px] text-muted-foreground text-center">
          Affichage de {payouts.length} sur {total} versements
        </p>
      )}
    </div>
  );
}

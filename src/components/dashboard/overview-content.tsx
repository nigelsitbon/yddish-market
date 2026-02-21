"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Package,
  ShoppingCart,
  Euro,
  TrendingUp,
  Plus,
  ArrowRight,
  Clock,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui";

type Stats = {
  totalProducts: number;
  activeProducts: number;
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  totalSales: number;
  commission: number;
};

type RecentOrder = {
  id: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  status: string;
  order: { orderNumber: string; createdAt: string };
  product: { title: string; slug: string; images: string[] };
  variant: { name: string } | null;
};

const statusLabels: Record<string, { label: string; variant: "default" | "success" | "destructive" | "outline" | "muted" }> = {
  PENDING: { label: "En attente", variant: "outline" },
  CONFIRMED: { label: "Confirmée", variant: "default" },
  PROCESSING: { label: "En préparation", variant: "muted" },
  SHIPPED: { label: "Expédiée", variant: "default" },
  DELIVERED: { label: "Livrée", variant: "success" },
  CANCELLED: { label: "Annulée", variant: "destructive" },
  REFUNDED: { label: "Remboursée", variant: "destructive" },
};

export function OverviewContent() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setStats(json.data.stats);
          setRecentOrders(json.data.recentOrders);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-white animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-[100px] bg-white animate-pulse" />
          ))}
        </div>
        <div className="h-[300px] bg-white animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-light text-foreground">Vue d'ensemble</h1>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            Bienvenue sur votre tableau de bord vendeur
          </p>
        </div>
        <Link
          href="/dashboard/products/new"
          className="flex items-center gap-2 h-10 px-4 bg-foreground text-white text-[12px] tracking-wide hover:bg-foreground/90 transition-colors"
        >
          <Plus size={14} strokeWidth={1.5} />
          Nouveau produit
        </Link>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Package size={18} strokeWidth={1.5} />}
          label="Produits actifs"
          value={`${stats?.activeProducts ?? 0} / ${stats?.totalProducts ?? 0}`}
        />
        <StatCard
          icon={<ShoppingCart size={18} strokeWidth={1.5} />}
          label="Commandes"
          value={String(stats?.totalOrders ?? 0)}
          accent={stats?.pendingOrders ? `${stats.pendingOrders} en attente` : undefined}
        />
        <StatCard
          icon={<Euro size={18} strokeWidth={1.5} />}
          label="Revenus nets"
          value={formatPrice(stats?.totalRevenue ?? 0)}
        />
        <StatCard
          icon={<TrendingUp size={18} strokeWidth={1.5} />}
          label="Ventes totales"
          value={formatPrice(stats?.totalSales ?? 0)}
          accent={`Commission : ${formatPrice(stats?.commission ?? 0)}`}
        />
      </div>

      {/* Quick actions + Recent orders */}
      <div className="grid lg:grid-cols-[1fr_1fr] gap-6">
        {/* Recent orders */}
        <div className="bg-white border border-border">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="text-[13px] font-medium tracking-wide uppercase text-foreground">
              Dernières commandes
            </h2>
            <Link
              href="/dashboard/orders"
              className="text-[11px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              Tout voir <ArrowRight size={12} />
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <Clock size={24} strokeWidth={1} className="mx-auto text-muted-foreground mb-2" />
              <p className="text-[12px] text-muted-foreground">
                Aucune commande pour le moment
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentOrders.map((item) => {
                const st = statusLabels[item.status] || statusLabels.PENDING;
                return (
                  <Link
                    key={item.id}
                    href={`/dashboard/orders/${item.order.orderNumber}`}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="w-10 h-10 bg-[#F5F5F0] shrink-0 flex items-center justify-center">
                      {item.product.images[0] ? (
                        <img src={item.product.images[0]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Package size={14} className="text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] text-foreground truncate">{item.product.title}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {item.order.orderNumber} · Qté {item.quantity}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[12px] font-medium text-foreground">
                        {formatPrice(item.subtotal)}
                      </p>
                      <Badge variant={st.variant} className="text-[9px] mt-0.5">
                        {st.label}
                      </Badge>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="space-y-4">
          <div className="bg-white border border-border p-5">
            <h2 className="text-[13px] font-medium tracking-wide uppercase text-foreground mb-4">
              Actions rapides
            </h2>
            <div className="space-y-2">
              <QuickAction
                href="/dashboard/products/new"
                icon={<Plus size={16} />}
                label="Ajouter un produit"
                desc="Créer une nouvelle fiche produit"
              />
              <QuickAction
                href="/dashboard/orders"
                icon={<ShoppingCart size={16} />}
                label="Gérer les commandes"
                desc="Voir et traiter les commandes"
              />
              <QuickAction
                href="/dashboard/settings"
                icon={<Package size={16} />}
                label="Paramètres boutique"
                desc="Modifier votre profil vendeur"
              />
            </div>
          </div>

          {/* Tips */}
          <div className="bg-accent-soft border border-accent/20 p-5">
            <h3 className="text-[12px] font-medium text-foreground mb-2">
              Conseil
            </h3>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Pour maximiser vos ventes, ajoutez des photos de qualité et une description détaillée pour chaque produit. Les produits avec au moins 3 images se vendent 2x plus.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="bg-white border border-border p-5">
      <div className="flex items-center gap-2 text-muted-foreground mb-3">
        {icon}
        <span className="text-[11px] tracking-wide uppercase">{label}</span>
      </div>
      <p className="text-[20px] font-light text-foreground">{value}</p>
      {accent && (
        <p className="text-[11px] text-accent mt-1">{accent}</p>
      )}
    </div>
  );
}

function QuickAction({
  href,
  icon,
  label,
  desc,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2.5 border border-border hover:border-foreground/30 transition-colors"
    >
      <div className="text-muted-foreground">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] text-foreground">{label}</p>
        <p className="text-[11px] text-muted-foreground">{desc}</p>
      </div>
      <ArrowRight size={14} className="text-muted-foreground shrink-0" />
    </Link>
  );
}

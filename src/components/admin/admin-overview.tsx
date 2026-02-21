import Link from "next/link";
import {
  Users,
  Store,
  Package,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  UserPlus,
  Clock,
  ArrowRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface AdminStats {
  totalUsers: number;
  totalSellers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  totalCommission: number;
  newUsersThisMonth: number;
  pendingOrders: number;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(
    value
  );

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
}

function StatCard({ label, value, icon: Icon }: StatCardProps) {
  return (
    <div className="bg-white border border-border p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] tracking-wider uppercase text-muted-foreground">
          {label}
        </p>
        <Icon size={18} strokeWidth={1.5} className="text-muted-foreground" />
      </div>
      <p className="text-[24px] font-light text-foreground">{value}</p>
    </div>
  );
}

const quickActions = [
  { label: "Gérer les utilisateurs", href: "/admin/users" },
  { label: "Gérer les vendeurs", href: "/admin/sellers" },
  { label: "Modérer les produits", href: "/admin/products" },
  { label: "Voir les commandes", href: "/admin/orders" },
  { label: "Catégories", href: "/admin/categories" },
  { label: "Retour boutique", href: "/" },
];

const statCards: { label: string; key: keyof AdminStats; icon: LucideIcon; isCurrency?: boolean }[] = [
  { label: "Utilisateurs", key: "totalUsers", icon: Users },
  { label: "Vendeurs", key: "totalSellers", icon: Store },
  { label: "Produits", key: "totalProducts", icon: Package },
  { label: "Commandes", key: "totalOrders", icon: ShoppingCart },
  { label: "Revenu total", key: "totalRevenue", icon: DollarSign, isCurrency: true },
  { label: "Commission totale", key: "totalCommission", icon: TrendingUp, isCurrency: true },
  { label: "Nouveaux ce mois", key: "newUsersThisMonth", icon: UserPlus },
  { label: "En attente", key: "pendingOrders", icon: Clock },
];

interface AdminOverviewProps {
  stats: AdminStats;
}

export function AdminOverview({ stats }: AdminOverviewProps) {
  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-[22px] font-light tracking-tight text-foreground">
          Administration
        </h1>
        <p className="text-[13px] text-muted-foreground mt-1">
          Vue d&apos;ensemble de la plateforme
        </p>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <StatCard
            key={card.key}
            label={card.label}
            value={
              card.isCurrency
                ? formatCurrency(stats[card.key] as number)
                : stats[card.key]
            }
            icon={card.icon}
          />
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-[13px] tracking-wider uppercase text-muted-foreground mb-4">
          Actions rapides
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="group flex items-center justify-between bg-white border border-border p-4 hover:border-foreground transition-colors"
            >
              <span className="text-[13px] text-foreground">
                {action.label}
              </span>
              <ArrowRight
                size={14}
                strokeWidth={1.5}
                className="text-muted-foreground group-hover:text-foreground transition-colors"
              />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

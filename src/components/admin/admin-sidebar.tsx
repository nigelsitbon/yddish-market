"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Store,
  Package,
  ShoppingCart,
  FolderTree,
  ImageIcon,
  Shield,
  ArrowLeft,
} from "lucide-react";

const navItems = [
  { label: "Vue d'ensemble", href: "/admin", icon: LayoutDashboard },
  { label: "Utilisateurs", href: "/admin/users", icon: Users },
  { label: "Vendeurs", href: "/admin/sellers", icon: Store },
  { label: "Produits", href: "/admin/products", icon: Package },
  { label: "Commandes", href: "/admin/orders", icon: ShoppingCart },
  { label: "Catégories", href: "/admin/categories", icon: FolderTree },
  { label: "Homepage", href: "/admin/homepage", icon: ImageIcon },
];

export function AdminSidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-[240px] lg:shrink-0 border-r border-border bg-white h-screen sticky top-0">
      {/* Logo */}
      <div className="h-[60px] flex items-center px-6 border-b border-border">
        <Link href="/admin" className="flex items-center gap-2">
          <Shield size={18} strokeWidth={1.5} className="text-accent" />
          <span className="text-[13px] font-medium tracking-wide text-foreground">
            YDDISH ADMIN
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 h-10 text-[13px] transition-colors ${
                active
                  ? "bg-muted text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <Icon size={18} strokeWidth={1.5} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Back to store */}
      <div className="px-3 py-4 border-t border-border">
        <Link
          href="/"
          className="flex items-center gap-2 px-3 h-10 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={14} strokeWidth={1.5} />
          Retour à la boutique
        </Link>
      </div>
    </aside>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import {
  LayoutDashboard,
  Users,
  Store,
  Package,
  ShoppingCart,
  FolderTree,
  ImageIcon,
  Shield,
  Menu,
  X,
  ArrowLeft,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { label: "Vue d'ensemble", href: "/admin", icon: LayoutDashboard },
  { label: "Utilisateurs", href: "/admin/users", icon: Users },
  { label: "Vendeurs", href: "/admin/sellers", icon: Store },
  { label: "Produits", href: "/admin/products", icon: Package },
  { label: "Commandes", href: "/admin/orders", icon: ShoppingCart },
  { label: "Catégories", href: "/admin/categories", icon: FolderTree },
  { label: "Homepage", href: "/admin/homepage", icon: ImageIcon },
];

export function AdminHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-border lg:ml-0">
      <div className="flex items-center justify-between h-[60px] px-4 sm:px-6">
        {/* Mobile menu */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="lg:hidden text-foreground hover:opacity-60 transition-opacity"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="hidden lg:block">
            <p className="text-[13px] text-muted-foreground">
              Administration
            </p>
          </div>
          {/* Mobile logo */}
          <Link href="/admin" className="lg:hidden flex items-center gap-1.5">
            <Shield size={16} strokeWidth={1.5} className="text-accent" />
            <span className="text-[12px] font-medium tracking-wide text-foreground">
              ADMIN
            </span>
          </Link>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="hidden sm:flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={12} strokeWidth={1.5} />
            Boutique
          </Link>
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: {
                avatarBox: "h-8 w-8",
              },
            }}
          />
        </div>
      </div>

      {/* Mobile nav dropdown */}
      {mobileOpen && (
        <nav className="lg:hidden border-t border-border bg-white">
          <div className="px-4 py-3 space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 h-10 text-[13px] transition-colors ${
                    active
                      ? "bg-muted text-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon size={18} strokeWidth={1.5} />
                  {item.label}
                </Link>
              );
            })}
            <Link
              href="/"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-3 h-10 text-[12px] text-muted-foreground hover:text-foreground transition-colors mt-2 pt-2 border-t border-border"
            >
              <ArrowLeft size={14} strokeWidth={1.5} />
              Retour à la boutique
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}

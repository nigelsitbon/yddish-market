"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser, SignInButton, UserButton } from "@clerk/nextjs";
import {
  Search,
  Heart,
  ShoppingBag,
  Menu,
  X,
  LayoutDashboard,
  Shield,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useCartStore } from "@/stores/cart";

const navigation = [
  { name: "Nouveautés", href: "/products?sort=newest" },
  { name: "Vêtements", href: "/products?category=vetements" },
  { name: "Bijoux", href: "/products?category=bijoux" },
  { name: "Art & Accessoires", href: "/products?category=art-accessoires" },
  { name: "Livres", href: "/products?category=livres" },
  { name: "Fêtes", href: "/products?category=fetes" },
];

type UserContext = {
  id: string;
  name: string | null;
  role: string;
  hasSeller: boolean;
  sellerSlug: string | null;
} | null;

export function Header() {
  const router = useRouter();
  const { isSignedIn } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const cartItemCount = useCartStore((s) => s.itemCount());
  const setCartOpen = useCartStore((s) => s.setOpen);
  const [userCtx, setUserCtx] = useState<UserContext>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    router.push(`/products?q=${encodeURIComponent(q)}`);
    setSearchOpen(false);
    setSearchQuery("");
  };

  // Fetch user context (role, seller status) when signed in
  useEffect(() => {
    if (!isSignedIn) {
      setUserCtx(null);
      return;
    }
    fetch("/api/me")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setUserCtx(json.data);
      })
      .catch(() => {});
  }, [isSignedIn]);

  const isSeller = userCtx?.hasSeller;
  const isAdmin = userCtx?.role === "ADMIN";

  return (
    <header className="sticky top-0 z-50 bg-white">
      {/* Top utility bar — contextual links */}
      {isSignedIn && (isSeller || isAdmin) && (
        <div className="border-b border-border bg-[#FAFAF7]">
          <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12">
            <div className="flex h-[32px] items-center justify-end gap-4">
              {isSeller && (
                <Link
                  href="/dashboard"
                  className="flex items-center gap-1.5 text-[11px] tracking-wide text-muted-foreground hover:text-foreground transition-colors"
                >
                  <LayoutDashboard size={12} strokeWidth={1.5} />
                  Mon Dashboard
                </Link>
              )}
              {isAdmin && (
                <Link
                  href="/admin"
                  className="flex items-center gap-1.5 text-[11px] tracking-wide text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Shield size={12} strokeWidth={1.5} />
                  Admin
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main header row */}
      <div className="border-b border-border">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12">
          <div className="flex h-[60px] items-center justify-between">
            {/* Left: mobile menu */}
            <div className="flex items-center gap-4 w-[120px]">
              <button
                type="button"
                className="lg:hidden text-foreground hover:opacity-60 transition-opacity"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Menu"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>

            {/* Center: Logo */}
            <Link href="/" className="absolute left-1/2 -translate-x-1/2">
              <h1 className="text-[22px] sm:text-[26px] font-bold tracking-[0.15em] text-foreground uppercase">
                YDDISH MARKET
              </h1>
            </Link>

            {/* Right: Icons */}
            <div className="flex items-center gap-1 sm:gap-3">
              <button
                type="button"
                className="p-2 text-foreground hover:opacity-60 transition-opacity"
                onClick={() => setSearchOpen(!searchOpen)}
                aria-label="Rechercher"
              >
                <Search size={20} strokeWidth={1.5} />
              </button>

              {isSignedIn ? (
                <>
                  <Link
                    href="/account/favorites"
                    className="p-2 text-foreground hover:opacity-60 transition-opacity hidden sm:block"
                    aria-label="Favoris"
                  >
                    <Heart size={20} strokeWidth={1.5} />
                  </Link>
                  <button
                    type="button"
                    onClick={() => setCartOpen(true)}
                    className="relative p-2 text-foreground hover:opacity-60 transition-opacity"
                    aria-label="Panier"
                  >
                    <ShoppingBag size={20} strokeWidth={1.5} />
                    {cartItemCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-foreground text-white text-[10px] font-medium px-1">
                        {cartItemCount}
                      </span>
                    )}
                  </button>
                  <div className="ml-1">
                    <UserButton
                      afterSignOutUrl="/"
                      appearance={{
                        elements: {
                          avatarBox: "h-8 w-8",
                        },
                      }}
                    />
                  </div>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setCartOpen(true)}
                    className="relative p-2 text-foreground hover:opacity-60 transition-opacity"
                    aria-label="Panier"
                  >
                    <ShoppingBag size={20} strokeWidth={1.5} />
                    {cartItemCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-foreground text-white text-[10px] font-medium px-1">
                        {cartItemCount}
                      </span>
                    )}
                  </button>
                  <SignInButton mode="modal">
                    <button
                      type="button"
                      className="text-[13px] text-foreground hover:opacity-60 transition-opacity hidden sm:block ml-1"
                    >
                      Connexion
                    </button>
                  </SignInButton>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Search bar - expandable */}
      {searchOpen && (
        <div className="border-b border-border bg-white">
          <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12 py-4">
            <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto">
              <Search size={18} strokeWidth={1.5} className="absolute left-0 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Que recherchez-vous ?"
                className="w-full h-10 pl-8 pr-10 bg-transparent text-sm border-b border-foreground focus:outline-none placeholder:text-muted-foreground"
                autoFocus
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    searchInputRef.current?.focus();
                  }}
                  className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                >
                  <X size={16} strokeWidth={1.5} />
                </button>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Desktop navigation */}
      <nav className="hidden lg:block border-b border-border">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12">
          <div className="flex h-[44px] items-center justify-center gap-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-[13px] tracking-wide text-foreground hover:opacity-60 transition-opacity"
              >
                {item.name}
              </Link>
            ))}
            <Link
              href="/products?category=epicerie-fine"
              className="text-[13px] tracking-wide text-sale hover:opacity-60 transition-opacity"
            >
              Épicerie Fine
            </Link>
          </div>
        </div>
      </nav>

      {/* Mobile navigation */}
      {mobileMenuOpen && (
        <nav className="lg:hidden border-b border-border bg-white">
          <div className="px-4 py-6 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="block py-2.5 text-[13px] tracking-wide text-foreground hover:opacity-60 transition-opacity"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <Link
              href="/products?category=epicerie-fine"
              className="block py-2.5 text-[13px] tracking-wide text-sale"
              onClick={() => setMobileMenuOpen(false)}
            >
              Épicerie Fine
            </Link>

            {/* Role-based mobile links */}
            <div className="pt-4 mt-4 border-t border-border space-y-1">
              {isSignedIn ? (
                <>
                  <Link
                    href="/account/favorites"
                    className="flex items-center gap-2 py-2.5 text-[13px] tracking-wide text-muted-foreground"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Heart size={14} strokeWidth={1.5} />
                    Mes favoris
                  </Link>
                  {isSeller && (
                    <Link
                      href="/dashboard"
                      className="flex items-center gap-2 py-2.5 text-[13px] tracking-wide text-foreground font-medium"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <LayoutDashboard size={14} strokeWidth={1.5} />
                      Mon Dashboard vendeur
                    </Link>
                  )}
                  {isAdmin && (
                    <Link
                      href="/admin"
                      className="flex items-center gap-2 py-2.5 text-[13px] tracking-wide text-foreground font-medium"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Shield size={14} strokeWidth={1.5} />
                      Administration
                    </Link>
                  )}
                </>
              ) : (
                <SignInButton mode="modal">
                  <button
                    type="button"
                    className="block py-2.5 text-[13px] tracking-wide text-muted-foreground"
                  >
                    Connexion
                  </button>
                </SignInButton>
              )}
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}

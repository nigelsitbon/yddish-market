"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Plus, Search, Package, MoreHorizontal, Eye, Edit, Archive } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui";

type Product = {
  id: string;
  title: string;
  slug: string;
  price: number;
  comparePrice: number | null;
  images: string[];
  stock: number;
  status: string;
  createdAt: string;
  categories: { category: { id: string; name: string; slug: string } }[];
  variants: { id: string; name: string; stock: number }[];
  _count: { reviews: number; orderItems: number; favorites: number };
};

const statusConfig: Record<string, { label: string; variant: "default" | "success" | "destructive" | "outline" | "muted" }> = {
  DRAFT: { label: "Brouillon", variant: "outline" },
  ACTIVE: { label: "Actif", variant: "success" },
  PAUSED: { label: "En pause", variant: "muted" },
  ARCHIVED: { label: "Archivé", variant: "destructive" },
};

export function ProductsList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter !== "all") params.set("status", statusFilter);
      params.set("page", String(page));

      const res = await fetch(`/api/dashboard/products?${params}`);
      const json = await res.json();
      if (json.success) {
        setProducts(json.data.products);
        setTotal(json.data.total);
      }
    } catch (err) {
      console.error("Failed to fetch products", err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleArchive = async (productId: string) => {
    setMenuOpen(null);
    try {
      await fetch(`/api/dashboard/products/${productId}`, { method: "DELETE" });
      fetchProducts();
    } catch (err) {
      console.error("Failed to archive", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-light text-foreground">Produits</h1>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            {total} produit{total > 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/dashboard/products/new"
          className="flex items-center gap-2 h-11 px-6 bg-accent text-[#FFFFFF] text-[13px] font-medium tracking-wide hover:bg-accent/90 transition-colors shadow-sm"
        >
          <Plus size={16} strokeWidth={2} />
          Nouveau produit
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher un produit..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full h-10 pl-9 pr-3 text-[13px] border border-border bg-white focus:border-foreground focus:outline-none transition-colors"
          />
        </div>
        <div className="flex gap-1">
          {["all", "ACTIVE", "DRAFT", "PAUSED", "ARCHIVED"].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`h-10 px-3 text-[11px] tracking-wide border transition-colors ${
                statusFilter === s
                  ? "border-foreground bg-foreground text-[#FFFFFF]"
                  : "border-border bg-white text-muted-foreground hover:text-foreground"
              }`}
            >
              {s === "all" ? "Tous" : statusConfig[s]?.label || s}
            </button>
          ))}
        </div>
      </div>

      {/* Products table */}
      <div className="bg-white border border-border">
        {loading ? (
          <div className="p-8 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-muted animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="py-16 text-center">
            <Package size={32} strokeWidth={1} className="mx-auto text-muted-foreground mb-3" />
            <p className="text-[13px] text-muted-foreground mb-4">
              {search || statusFilter !== "all"
                ? "Aucun produit ne correspond à votre recherche"
                : "Vous n'avez pas encore de produits"}
            </p>
            {!search && statusFilter === "all" && (
              <Link
                href="/dashboard/products/new"
                className="inline-flex items-center gap-2 h-11 px-8 bg-accent text-[#FFFFFF] text-[13px] font-medium tracking-wide hover:bg-accent/90 transition-colors shadow-sm"
              >
                <Plus size={16} strokeWidth={2} />
                Créer mon premier produit
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* Table header */}
            <div className="hidden md:grid md:grid-cols-[1fr_120px_80px_80px_100px_40px] gap-4 px-5 py-3 border-b border-border text-[10px] tracking-wider text-muted-foreground uppercase">
              <span>Produit</span>
              <span>Catégorie</span>
              <span>Prix</span>
              <span>Stock</span>
              <span>Statut</span>
              <span></span>
            </div>

            {/* Table rows */}
            <div className="divide-y divide-border">
              {products.map((product) => {
                const st = statusConfig[product.status] || statusConfig.DRAFT;
                const totalStock = product.variants.length > 0
                  ? product.variants.reduce((sum, v) => sum + v.stock, 0)
                  : product.stock;
                return (
                  <div
                    key={product.id}
                    className="md:grid md:grid-cols-[1fr_120px_80px_80px_100px_40px] gap-4 px-5 py-3 items-center hover:bg-muted/30 transition-colors"
                  >
                    {/* Product */}
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-[#F5F5F0] shrink-0 relative overflow-hidden flex items-center justify-center">
                        {product.images[0] ? (
                          <Image src={product.images[0]} alt="" fill className="object-cover" sizes="48px" />
                        ) : (
                          <Package size={16} className="text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <Link
                          href={`/dashboard/products/${product.id}`}
                          className="text-[13px] text-foreground hover:underline underline-offset-2 truncate block"
                        >
                          {product.title}
                        </Link>
                        <p className="text-[11px] text-muted-foreground">
                          {product._count.orderItems} ventes · {product._count.favorites} favoris
                        </p>
                      </div>
                    </div>

                    {/* Category */}
                    <span className="text-[12px] text-muted-foreground hidden md:block truncate">
                      {product.categories.map((pc) => pc.category.name).join(", ") || "—"}
                    </span>

                    {/* Price */}
                    <span className="text-[12px] text-foreground hidden md:block">
                      {formatPrice(product.price)}
                    </span>

                    {/* Stock */}
                    <span className={`text-[12px] hidden md:block ${totalStock === 0 ? "text-destructive" : totalStock < 5 ? "text-sale" : "text-foreground"}`}>
                      {totalStock}
                    </span>

                    {/* Status */}
                    <div className="hidden md:block">
                      <Badge variant={st.variant} className="text-[10px]">
                        {st.label}
                      </Badge>
                    </div>

                    {/* Actions */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setMenuOpen(menuOpen === product.id ? null : product.id)}
                        className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <MoreHorizontal size={16} />
                      </button>
                      {menuOpen === product.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
                          <div className="absolute right-0 top-8 z-20 bg-white border border-border shadow-lg py-1 w-[160px]">
                            <Link
                              href={`/products/${product.slug}`}
                              onClick={() => setMenuOpen(null)}
                              className="flex items-center gap-2 px-3 py-2 text-[12px] text-foreground hover:bg-muted transition-colors"
                            >
                              <Eye size={14} /> Voir en boutique
                            </Link>
                            <Link
                              href={`/dashboard/products/${product.id}`}
                              onClick={() => setMenuOpen(null)}
                              className="flex items-center gap-2 px-3 py-2 text-[12px] text-foreground hover:bg-muted transition-colors"
                            >
                              <Edit size={14} /> Modifier
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleArchive(product.id)}
                              className="flex items-center gap-2 px-3 py-2 text-[12px] text-destructive hover:bg-red-50 transition-colors w-full"
                            >
                              <Archive size={14} /> Archiver
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

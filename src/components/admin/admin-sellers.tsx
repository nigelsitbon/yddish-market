"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Search, Check, X, ChevronLeft, ChevronRight, Loader2, Store } from "lucide-react";

/* ---------- types ---------- */

interface Seller {
  id: string;
  shopName: string;
  slug: string;
  verified: boolean;
  commission: number;
  rating: number | null;
  totalSales: number;
  _count?: { products: number };
  createdAt: string;
  user: {
    name: string | null;
    email: string;
  };
}

interface SellersResponse {
  sellers: Seller[];
  total: number;
  page: number;
  totalPages: number;
}

type VerifiedFilter = "all" | "true" | "false";

/* ---------- helpers ---------- */

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(v);

const LIMIT = 20;

/* ---------- component ---------- */

export function AdminSellers() {
  const [data, setData] = useState<SellersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [verifiedFilter, setVerifiedFilter] = useState<VerifiedFilter>("all");
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [editingCommission, setEditingCommission] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  /* ---- fetch ---- */
  const fetchSellers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(LIMIT),
      });
      if (search.trim()) params.set("search", search.trim());
      if (verifiedFilter !== "all") params.set("verified", verifiedFilter);

      const res = await fetch(`/api/admin/sellers?${params}`);
      if (!res.ok) throw new Error("Erreur lors du chargement des vendeurs");
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Erreur serveur");
      setData({
        sellers: json.data.sellers,
        total: json.data.pagination.total,
        page: json.data.pagination.page,
        totalPages: json.data.pagination.totalPages,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, [page, search, verifiedFilter]);

  useEffect(() => {
    fetchSellers();
  }, [fetchSellers]);

  /* ---- debounced search ---- */
  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      /* fetchSellers will fire via useEffect due to search state change */
    }, 300);
  };

  /* ---- toggle verified ---- */
  const toggleVerified = async (seller: Seller) => {
    setTogglingId(seller.id);
    try {
      const res = await fetch("/api/admin/sellers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sellerId: seller.id,
          verified: !seller.verified,
        }),
      });
      if (!res.ok) throw new Error("Échec de la mise à jour");
      await fetchSellers();
    } catch {
      setError("Impossible de modifier le statut de vérification");
    } finally {
      setTogglingId(null);
    }
  };

  /* ---- commission edit ---- */
  const saveCommission = async (seller: Seller, rawValue: string) => {
    setEditingCommission(null);
    const parsed = parseFloat(rawValue);
    if (isNaN(parsed) || parsed < 0 || parsed > 100) return;
    const decimal = parsed / 100;
    if (decimal === seller.commission) return;

    try {
      const res = await fetch("/api/admin/sellers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sellerId: seller.id,
          commission: decimal,
        }),
      });
      if (!res.ok) throw new Error("Échec de la mise à jour");
      await fetchSellers();
    } catch {
      setError("Impossible de modifier la commission");
    }
  };

  /* ---- filter buttons data ---- */
  const filterButtons: { label: string; value: VerifiedFilter }[] = [
    { label: "Tous", value: "all" },
    { label: "Vérifiés", value: "true" },
    { label: "Non vérifiés", value: "false" },
  ];

  /* ---- render ---- */
  const sellers = data?.sellers ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-light tracking-tight text-foreground">
            Vendeurs
          </h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            {loading ? "Chargement…" : `${total} vendeur${total !== 1 ? "s" : ""}`}
          </p>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search
            size={16}
            strokeWidth={1.5}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            placeholder="Rechercher une boutique…"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full h-10 pl-10 pr-4 text-[13px] bg-white border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition-colors"
          />
        </div>

        {/* Verified filter */}
        <div className="flex gap-1">
          {filterButtons.map((btn) => (
            <button
              key={btn.value}
              onClick={() => {
                setVerifiedFilter(btn.value);
                setPage(1);
              }}
              className={`h-10 px-4 text-[12px] tracking-wide border transition-colors ${
                verifiedFilter === btn.value
                  ? "bg-foreground text-[#FFFFFF] border-foreground"
                  : "bg-white text-muted-foreground border-border hover:border-foreground hover:text-foreground"
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-[13px] px-4 py-3">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-3 underline hover:no-underline"
          >
            Fermer
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-border overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border">
              {[
                "Boutique",
                "Vérifié",
                "Commission",
                "Produits",
                "Ventes",
                "Note",
                "Inscrit le",
                "Actions",
              ].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-[11px] tracking-wider uppercase text-muted-foreground font-medium whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-b border-border last:border-b-0">
                  {Array.from({ length: 8 }).map((__, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 w-20 bg-muted-foreground/10 animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : sellers.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-16 text-center">
                  <Store
                    size={32}
                    strokeWidth={1}
                    className="mx-auto mb-3 text-muted-foreground/40"
                  />
                  <p className="text-[13px] text-muted-foreground">
                    Aucun vendeur trouvé
                  </p>
                </td>
              </tr>
            ) : (
              sellers.map((seller) => (
                <tr
                  key={seller.id}
                  className="border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors"
                >
                  {/* Boutique */}
                  <td className="px-4 py-3">
                    <p className="text-[13px] font-medium text-foreground">
                      {seller.shopName}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {seller.user.name || seller.user.email}
                    </p>
                    {seller.user.name && (
                      <p className="text-[11px] text-muted-foreground">
                        {seller.user.email}
                      </p>
                    )}
                  </td>

                  {/* Vérifié */}
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium ${
                        seller.verified
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {seller.verified ? (
                        <>
                          <Check size={12} strokeWidth={2} /> Oui
                        </>
                      ) : (
                        <>
                          <X size={12} strokeWidth={2} /> Non
                        </>
                      )}
                    </span>
                  </td>

                  {/* Commission */}
                  <td className="px-4 py-3">
                    {editingCommission === seller.id ? (
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={1}
                        defaultValue={Math.round(seller.commission * 100)}
                        autoFocus
                        onBlur={(e) => saveCommission(seller, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            saveCommission(
                              seller,
                              (e.target as HTMLInputElement).value
                            );
                          }
                          if (e.key === "Escape") setEditingCommission(null);
                        }}
                        className="w-16 h-7 px-2 text-[13px] bg-white border border-foreground text-foreground text-center focus:outline-none"
                      />
                    ) : (
                      <button
                        onClick={() => setEditingCommission(seller.id)}
                        className="text-[13px] text-foreground hover:underline cursor-pointer"
                        title="Cliquer pour modifier"
                      >
                        {Math.round(seller.commission * 100)}%
                      </button>
                    )}
                  </td>

                  {/* Produits */}
                  <td className="px-4 py-3 text-[13px] text-foreground">
                    {seller._count?.products ?? 0}
                  </td>

                  {/* Ventes */}
                  <td className="px-4 py-3 text-[13px] text-foreground">
                    {formatCurrency(seller.totalSales)}
                  </td>

                  {/* Note */}
                  <td className="px-4 py-3 text-[13px] text-foreground">
                    {seller.rating !== null ? `${seller.rating.toFixed(1)}/5` : "—"}
                  </td>

                  {/* Inscrit le */}
                  <td className="px-4 py-3 text-[13px] text-muted-foreground whitespace-nowrap">
                    {formatDate(seller.createdAt)}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleVerified(seller)}
                      disabled={togglingId === seller.id}
                      className={`inline-flex items-center gap-1.5 h-8 px-3 text-[12px] border transition-colors disabled:opacity-50 ${
                        seller.verified
                          ? "border-red-200 text-red-600 hover:bg-red-50"
                          : "border-green-200 text-green-700 hover:bg-green-50"
                      }`}
                    >
                      {togglingId === seller.id ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : seller.verified ? (
                        <>
                          <X size={12} strokeWidth={2} /> Retirer
                        </>
                      ) : (
                        <>
                          <Check size={12} strokeWidth={2} /> Vérifier
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-[12px] text-muted-foreground">
            Page {page} sur {totalPages}
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="h-9 w-9 flex items-center justify-center border border-border text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} strokeWidth={1.5} />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="h-9 w-9 flex items-center justify-center border border-border text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

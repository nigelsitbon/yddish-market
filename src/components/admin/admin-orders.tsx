"use client";

import { useCallback, useEffect, useState } from "react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface OrderItem {
  id: string;
}

interface Order {
  id: string;
  orderNumber: string;
  buyer: { name: string | null; email: string };
  items: OrderItem[];
  total: number;
  commissionTotal: number;
  status: string;
  createdAt: string;
}

interface OrdersResponse {
  orders: Order[];
  total: number;
  page: number;
  totalPages: number;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const STATUSES = [
  "Toutes",
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
] as const;

const STATUS_BADGE: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  PROCESSING: "bg-indigo-100 text-indigo-700",
  SHIPPED: "bg-purple-100 text-purple-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
  REFUNDED: "bg-gray-100 text-gray-600",
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: "En attente",
  CONFIRMED: "Confirmée",
  PROCESSING: "En cours",
  SHIPPED: "Expédiée",
  DELIVERED: "Livrée",
  CANCELLED: "Annulée",
  REFUNDED: "Remboursée",
};

const LIMIT = 20;

const formatPrice = (value: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(
    value
  );

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("fr-FR");

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState<string>("Toutes");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);

  /* Debounce search ------------------------------------------------ */
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  /* Fetch ---------------------------------------------------------- */
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(LIMIT));
      if (status !== "Toutes") params.set("status", status);
      if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());

      const res = await fetch(`/api/admin/orders?${params.toString()}`);
      if (!res.ok) throw new Error("Fetch failed");
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Erreur serveur");
      const data = json.data;

      setOrders(data.orders);
      setTotal(data.pagination.total);
      setTotalPages(data.pagination.totalPages);
    } catch {
      setOrders([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [page, status, debouncedSearch]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  /* Reset page on filter change ------------------------------------ */
  useEffect(() => {
    setPage(1);
  }, [status, debouncedSearch]);

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */
  return (
    <section className="mx-auto max-w-7xl px-6 py-12">
      {/* Header ---------------------------------------------------- */}
      <div className="flex items-end justify-between border-b border-[#E8E8E3] pb-6">
        <div>
          <h1 className="text-2xl font-light tracking-tight text-[#1A1A2E]">
            Commandes
          </h1>
          <p className="mt-1 text-sm text-[#1A1A2E]/50">
            {total} commande{total !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Filters --------------------------------------------------- */}
      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par n° de commande…"
          className="w-full max-w-xs rounded-none border border-[#E8E8E3] bg-white px-4 py-2.5 text-sm text-[#1A1A2E] placeholder:text-[#1A1A2E]/30 focus:border-[#C5A55A] focus:outline-none transition-colors"
        />

        {/* Status filter */}
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`px-3 py-1.5 text-xs tracking-wide uppercase transition-colors ${
                status === s
                  ? "bg-[#1A1A2E] text-[#FFFFFF]"
                  : "bg-[#F5F5F0] text-[#1A1A2E]/60 hover:bg-[#E8E8E3]"
              }`}
            >
              {s === "Toutes" ? s : STATUS_LABEL[s] ?? s}
            </button>
          ))}
        </div>
      </div>

      {/* Table ------------------------------------------------------ */}
      <div className="mt-8 overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b border-[#E8E8E3] text-left text-[10px] uppercase tracking-widest text-[#1A1A2E]/40">
              <th className="pb-3 pr-4 font-medium">N° commande</th>
              <th className="pb-3 pr-4 font-medium">Client</th>
              <th className="pb-3 pr-4 font-medium text-center">Articles</th>
              <th className="pb-3 pr-4 font-medium text-right">Total</th>
              <th className="pb-3 pr-4 font-medium text-right">Commission</th>
              <th className="pb-3 pr-4 font-medium">Statut</th>
              <th className="pb-3 font-medium text-right">Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="py-20 text-center">
                  <div className="inline-flex items-center gap-2 text-[#1A1A2E]/40">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#C5A55A] border-t-transparent" />
                    <span className="text-xs tracking-wide">Chargement…</span>
                  </div>
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="py-20 text-center text-sm text-[#1A1A2E]/40"
                >
                  Aucune commande trouvée.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-[#E8E8E3]/60 transition-colors hover:bg-[#FAFAF7]"
                >
                  {/* Order number */}
                  <td className="py-4 pr-4 font-mono text-xs tracking-wide text-[#1A1A2E]">
                    {order.orderNumber}
                  </td>

                  {/* Client */}
                  <td className="py-4 pr-4">
                    <p className="text-sm text-[#1A1A2E]">
                      {order.buyer?.name || "—"}
                    </p>
                    <p className="mt-0.5 text-xs text-[#1A1A2E]/40">
                      {order.buyer?.email}
                    </p>
                  </td>

                  {/* Items count */}
                  <td className="py-4 pr-4 text-center text-sm text-[#1A1A2E]/70">
                    {order.items?.length ?? 0}
                  </td>

                  {/* Total */}
                  <td className="py-4 pr-4 text-right text-sm text-[#1A1A2E]">
                    {formatPrice(order.total)}
                  </td>

                  {/* Commission */}
                  <td className="py-4 pr-4 text-right text-sm text-[#C5A55A]">
                    {formatPrice(order.commissionTotal)}
                  </td>

                  {/* Status badge */}
                  <td className="py-4 pr-4">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
                        STATUS_BADGE[order.status] ?? "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {STATUS_LABEL[order.status] ?? order.status}
                    </span>
                  </td>

                  {/* Date */}
                  <td className="py-4 text-right text-xs text-[#1A1A2E]/50">
                    {formatDate(order.createdAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination ------------------------------------------------- */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 text-xs uppercase tracking-wide text-[#1A1A2E]/60 transition-colors hover:text-[#1A1A2E] disabled:pointer-events-none disabled:opacity-30"
          >
            Préc.
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(
              (p) =>
                p === 1 ||
                p === totalPages ||
                (p >= page - 2 && p <= page + 2)
            )
            .reduce<(number | "ellipsis")[]>((acc, p, idx, arr) => {
              if (idx > 0 && p - (arr[idx - 1] as number) > 1) {
                acc.push("ellipsis");
              }
              acc.push(p);
              return acc;
            }, [])
            .map((item, idx) =>
              item === "ellipsis" ? (
                <span
                  key={`e-${idx}`}
                  className="px-2 text-xs text-[#1A1A2E]/30"
                >
                  …
                </span>
              ) : (
                <button
                  key={item}
                  onClick={() => setPage(item)}
                  className={`min-w-[32px] px-2 py-1.5 text-xs transition-colors ${
                    page === item
                      ? "bg-[#1A1A2E] text-[#FFFFFF]"
                      : "text-[#1A1A2E]/60 hover:bg-[#F5F5F0]"
                  }`}
                >
                  {item}
                </button>
              )
            )}

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 text-xs uppercase tracking-wide text-[#1A1A2E]/60 transition-colors hover:text-[#1A1A2E] disabled:pointer-events-none disabled:opacity-30"
          >
            Suiv.
          </button>
        </div>
      )}
    </section>
  );
}

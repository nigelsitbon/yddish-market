"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type ProductStatus = "DRAFT" | "ACTIVE" | "PAUSED" | "ARCHIVED";

interface ProductImage {
  url: string;
  alt?: string;
}

interface Product {
  id: string;
  title: string;
  slug: string;
  status: ProductStatus;
  featured: boolean;
  price: number;
  compareAtPrice?: number | null;
  stock: number;
  images: ProductImage[];
  categories?: { category: { name: string } }[];
  seller?: { shopName: string } | null;
}

interface ProductsResponse {
  products: Product[];
  total: number;
  page: number;
  totalPages: number;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const STATUSES: { label: string; value: ProductStatus | "ALL" }[] = [
  { label: "Tous", value: "ALL" },
  { label: "Brouillon", value: "DRAFT" },
  { label: "Actif", value: "ACTIVE" },
  { label: "En pause", value: "PAUSED" },
  { label: "Archivé", value: "ARCHIVED" },
];

const STATUS_BADGE: Record<ProductStatus, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  DRAFT: "bg-gray-100 text-gray-600",
  PAUSED: "bg-orange-100 text-orange-700",
  ARCHIVED: "bg-red-100 text-red-700",
};

const STATUS_LABEL: Record<ProductStatus, string> = {
  ACTIVE: "Actif",
  DRAFT: "Brouillon",
  PAUSED: "En pause",
  ARCHIVED: "Archivé",
};

const LIMIT = 20;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatPrice(value: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={1.5}
      className={`h-5 w-5 transition-colors ${
        filled ? "text-[#C5A55A]" : "text-gray-300 hover:text-[#C5A55A]/60"
      }`}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"
      />
    </svg>
  );
}

function Skeleton() {
  return (
    <div className="animate-pulse space-y-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-lg bg-gray-100" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-48 rounded bg-gray-100" />
            <div className="h-3 w-32 rounded bg-gray-100" />
          </div>
          <div className="h-4 w-20 rounded bg-gray-100" />
          <div className="h-4 w-16 rounded bg-gray-100" />
          <div className="h-4 w-12 rounded bg-gray-100" />
          <div className="h-6 w-16 rounded-full bg-gray-100" />
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<ProductStatus | "ALL">("ALL");
  const [featured, setFeatured] = useState<boolean | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  /* Debounce search ------------------------------------------------ */
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  /* Reset page on filter change ------------------------------------ */
  useEffect(() => {
    setPage(1);
  }, [status, featured, debouncedSearch]);

  /* Fetch products ------------------------------------------------- */
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(LIMIT));
    if (status !== "ALL") params.set("status", status);
    if (featured !== null) params.set("featured", String(featured));
    if (debouncedSearch) params.set("search", debouncedSearch);

    try {
      const res = await fetch(`/api/admin/products?${params.toString()}`);
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Erreur serveur");
      const data = json.data;
      setProducts(data.products);
      setTotal(data.pagination.total);
      setTotalPages(data.pagination.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, [page, status, featured, debouncedSearch]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  /* Patch product -------------------------------------------------- */
  async function patchProduct(
    productId: string,
    body: { status?: ProductStatus; featured?: boolean }
  ) {
    setActionLoading(productId);
    try {
      const res = await fetch("/api/admin/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, ...body }),
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);

      // Optimistic update
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, ...body } : p))
      );
    } catch {
      await fetchProducts(); // rollback
    } finally {
      setActionLoading(null);
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      {/* Header */}
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#1A1A2E]">
            Produits
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            {total} produit{total !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Filters bar */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative w-full max-w-xs">
          <input
            type="text"
            placeholder="Rechercher un produit…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-4 text-sm text-[#1A1A2E] placeholder:text-gray-300 transition-colors focus:border-[#C5A55A] focus:outline-none"
          />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300"
          >
            <path
              fillRule="evenodd"
              d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z"
              clipRule="evenodd"
            />
          </svg>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Status filters */}
          <div className="flex gap-1">
            {STATUSES.map((s) => (
              <button
                key={s.value}
                onClick={() => setStatus(s.value)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                  status === s.value
                    ? "bg-[#1A1A2E] text-[#FFFFFF]"
                    : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Featured toggle */}
          <button
            onClick={() =>
              setFeatured((prev) =>
                prev === null ? true : prev === true ? false : null
              )
            }
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
              featured === true
                ? "bg-[#C5A55A] text-[#FFFFFF]"
                : featured === false
                ? "bg-gray-200 text-gray-600"
                : "bg-gray-50 text-gray-500 hover:bg-gray-100"
            }`}
          >
            <StarIcon filled={featured === true} />
            {featured === null
              ? "Featured"
              : featured
              ? "Featured"
              : "Non-featured"}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
          <button
            onClick={fetchProducts}
            className="ml-3 font-medium underline underline-offset-2"
          >
            Réessayer
          </button>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <Skeleton />
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="mb-4 h-12 w-12 rounded-full bg-gray-50" />
          <p className="text-sm text-gray-400">Aucun produit trouvé</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-[#FAFAF7]">
                <th className="px-4 py-3 font-medium text-gray-400">Image</th>
                <th className="px-4 py-3 font-medium text-gray-400">Titre</th>
                <th className="px-4 py-3 font-medium text-gray-400">
                  Catégorie
                </th>
                <th className="px-4 py-3 font-medium text-gray-400">Prix</th>
                <th className="px-4 py-3 font-medium text-gray-400">Stock</th>
                <th className="px-4 py-3 font-medium text-gray-400">Statut</th>
                <th className="px-4 py-3 text-center font-medium text-gray-400">
                  <StarIcon filled />
                </th>
                <th className="px-4 py-3 font-medium text-gray-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const isActioning = actionLoading === product.id;
                const firstImage = product.images?.[0];

                return (
                  <tr
                    key={product.id}
                    className={`border-b border-gray-50 transition-colors hover:bg-[#FAFAF7]/60 ${
                      isActioning ? "pointer-events-none opacity-50" : ""
                    }`}
                  >
                    {/* Image */}
                    <td className="px-4 py-3">
                      {firstImage ? (
                        <Image
                          src={firstImage.url}
                          alt={firstImage.alt || product.title}
                          width={48}
                          height={48}
                          className="h-12 w-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className="h-5 w-5 text-gray-300"
                          >
                            <path
                              fillRule="evenodd"
                              d="M1 5.25A2.25 2.25 0 0 1 3.25 3h13.5A2.25 2.25 0 0 1 19 5.25v9.5A2.25 2.25 0 0 1 16.75 17H3.25A2.25 2.25 0 0 1 1 14.75v-9.5Zm1.5 5.81v3.69c0 .414.336.75.75.75h13.5a.75.75 0 0 0 .75-.75v-2.69l-2.22-2.219a.75.75 0 0 0-1.06 0l-1.91 1.909-4.72-4.719a.75.75 0 0 0-1.06 0L2.5 11.06Zm12.22-6.31a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0Z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      )}
                    </td>

                    {/* Titre + seller */}
                    <td className="px-4 py-3">
                      <p className="font-medium text-[#1A1A2E] leading-tight">
                        {product.title}
                      </p>
                      {product.seller?.shopName && (
                        <p className="mt-0.5 text-xs text-gray-400">
                          {product.seller.shopName}
                        </p>
                      )}
                    </td>

                    {/* Catégorie */}
                    <td className="px-4 py-3 text-gray-500">
                      {product.categories?.map((pc) => pc.category.name).join(", ") || "—"}
                    </td>

                    {/* Prix */}
                    <td className="px-4 py-3 font-medium text-[#1A1A2E] tabular-nums">
                      {formatPrice(product.price)}
                    </td>

                    {/* Stock */}
                    <td className="px-4 py-3 tabular-nums">
                      <span
                        className={
                          product.stock <= 0
                            ? "text-red-600"
                            : product.stock <= 5
                            ? "text-orange-600"
                            : "text-gray-600"
                        }
                      >
                        {product.stock}
                      </span>
                    </td>

                    {/* Statut */}
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          STATUS_BADGE[product.status]
                        }`}
                      >
                        {STATUS_LABEL[product.status]}
                      </span>
                    </td>

                    {/* Featured */}
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() =>
                          patchProduct(product.id, {
                            featured: !product.featured,
                          })
                        }
                        className="inline-flex cursor-pointer transition-transform hover:scale-110"
                        title={
                          product.featured
                            ? "Retirer des favoris"
                            : "Mettre en avant"
                        }
                      >
                        <StarIcon filled={product.featured} />
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        {product.status !== "ACTIVE" && (
                          <button
                            onClick={() =>
                              patchProduct(product.id, { status: "ACTIVE" })
                            }
                            className="rounded-md bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 transition-colors hover:bg-green-100"
                          >
                            Activer
                          </button>
                        )}
                        {product.status !== "PAUSED" &&
                          product.status !== "ARCHIVED" && (
                            <button
                              onClick={() =>
                                patchProduct(product.id, { status: "PAUSED" })
                              }
                              className="rounded-md bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-700 transition-colors hover:bg-orange-100"
                            >
                              Pause
                            </button>
                          )}
                        {product.status !== "ARCHIVED" && (
                          <button
                            onClick={() =>
                              patchProduct(product.id, { status: "ARCHIVED" })
                            }
                            className="rounded-md bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 transition-colors hover:bg-red-100"
                          >
                            Archiver
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-xs text-gray-400">
            Page {page} sur {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-30"
            >
              Précédent
            </button>

            {/* Page numbers */}
            <div className="hidden gap-1 sm:flex">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(
                  (p) =>
                    p === 1 ||
                    p === totalPages ||
                    (p >= page - 1 && p <= page + 1)
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
                      key={`ellipsis-${idx}`}
                      className="px-2 py-1.5 text-xs text-gray-300"
                    >
                      ...
                    </span>
                  ) : (
                    <button
                      key={item}
                      onClick={() => setPage(item as number)}
                      className={`min-w-[2rem] rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${
                        page === item
                          ? "bg-[#1A1A2E] text-[#FFFFFF]"
                          : "text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      {item}
                    </button>
                  )
                )}
            </div>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-30"
            >
              Suivant
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

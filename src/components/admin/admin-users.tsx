"use client";

import { useCallback, useEffect, useState } from "react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Role = "BUYER" | "SELLER" | "ADMIN";

interface User {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  role: Role;
  imageUrl: string | null;
  orderCount: number;
  createdAt: string;
}

interface UsersResponse {
  users: User[];
  total: number;
  page: number;
  totalPages: number;
}

type RoleFilter = "ALL" | Role;

const ROLES: RoleFilter[] = ["ALL", "BUYER", "SELLER", "ADMIN"];
const LIMIT = 20;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function roleBadgeClasses(role: Role): string {
  const base = "px-2 py-0.5 text-[10px] tracking-wide uppercase rounded-full font-medium inline-block";
  switch (role) {
    case "BUYER":
      return `${base} bg-[#E8E8E8] text-[#555]`;
    case "SELLER":
      return `${base} bg-[#C5A55A]/15 text-[#C5A55A]`;
    case "ADMIN":
      return `${base} bg-[#D94F4F]/10 text-[#D94F4F]`;
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function initials(firstName: string | null, lastName: string | null): string {
  const f = firstName?.[0] ?? "";
  const l = lastName?.[0] ?? "";
  return (f + l).toUpperCase() || "?";
}

function displayName(u: User): string {
  const parts = [u.firstName, u.lastName].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : "Sans nom";
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  /* ---- Fetch ---- */

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(LIMIT),
      });
      if (search.trim()) params.set("search", search.trim());
      if (roleFilter !== "ALL") params.set("role", roleFilter);

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Erreur serveur");
      const data = json.data;

      setUsers(data.users);
      setTotal(data.pagination.total);
      setTotalPages(data.pagination.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  /* ---- Role change ---- */

  async function changeRole(userId: string, role: Role) {
    setOpenDropdown(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role }),
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      await fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    }
  }

  /* ---- Search with debounce reset page ---- */

  function handleSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handleRoleFilter(role: RoleFilter) {
    setRoleFilter(role);
    setPage(1);
  }

  /* ---- Close dropdown on outside click ---- */

  useEffect(() => {
    if (!openDropdown) return;
    function handler() {
      setOpenDropdown(null);
    }
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [openDropdown]);

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      <div className="mx-auto max-w-6xl px-6 py-12">
        {/* Header */}
        <div className="flex items-end justify-between border-b border-[#E8E8E8] pb-6 mb-8">
          <div>
            <h1 className="text-[22px] font-light tracking-tight text-[#1A1A2E]">
              Utilisateurs
            </h1>
            {!loading && (
              <p className="mt-1 text-[13px] text-[#1A1A2E]/50">
                {total} utilisateur{total !== 1 ? "s" : ""}
              </p>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          {/* Search */}
          <div className="relative w-full sm:max-w-xs">
            <svg
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#1A1A2E]/30"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
            <input
              type="text"
              placeholder="Rechercher par nom ou e-mail…"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full rounded-none border border-[#E8E8E8] bg-white py-2.5 pl-10 pr-4 text-[13px] text-[#1A1A2E] placeholder:text-[#1A1A2E]/30 focus:border-[#1A1A2E] focus:outline-none transition-colors"
            />
          </div>

          {/* Role filters */}
          <div className="flex gap-1">
            {ROLES.map((r) => (
              <button
                key={r}
                onClick={() => handleRoleFilter(r)}
                className={`px-3 py-1.5 text-[11px] tracking-wider uppercase transition-colors ${
                  roleFilter === r
                    ? "bg-[#1A1A2E] text-[#FFFFFF]"
                    : "bg-transparent text-[#1A1A2E]/50 hover:text-[#1A1A2E]"
                }`}
              >
                {r === "ALL" ? "Tous" : r}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 border border-[#D94F4F]/20 bg-[#D94F4F]/5 px-4 py-3 text-[13px] text-[#D94F4F]">
            {error}
            <button
              onClick={fetchUsers}
              className="ml-3 underline underline-offset-2 hover:no-underline"
            >
              Réessayer
            </button>
          </div>
        )}

        {/* Table */}
        <div className="border border-[#E8E8E8] bg-white">
          {/* Table header */}
          <div className="hidden sm:grid grid-cols-[1fr_100px_80px_120px_48px] gap-4 px-5 py-3 border-b border-[#E8E8E8]">
            <span className="text-[11px] tracking-wider uppercase text-[#1A1A2E]/40">
              Nom
            </span>
            <span className="text-[11px] tracking-wider uppercase text-[#1A1A2E]/40">
              Rôle
            </span>
            <span className="text-[11px] tracking-wider uppercase text-[#1A1A2E]/40 text-right">
              Commandes
            </span>
            <span className="text-[11px] tracking-wider uppercase text-[#1A1A2E]/40">
              Inscrit le
            </span>
            <span />
          </div>

          {/* Loading skeleton */}
          {loading && (
            <div className="divide-y divide-[#E8E8E8]">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[1fr_100px_80px_120px_48px] gap-4 px-5 py-4 items-center"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-[#E8E8E8] animate-pulse" />
                    <div className="space-y-1.5">
                      <div className="h-3 w-28 rounded bg-[#E8E8E8] animate-pulse" />
                      <div className="h-2.5 w-40 rounded bg-[#E8E8E8] animate-pulse" />
                    </div>
                  </div>
                  <div className="h-5 w-14 rounded-full bg-[#E8E8E8] animate-pulse" />
                  <div className="h-3 w-6 rounded bg-[#E8E8E8] animate-pulse ml-auto" />
                  <div className="h-3 w-20 rounded bg-[#E8E8E8] animate-pulse" />
                  <div />
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && users.length === 0 && (
            <div className="px-5 py-16 text-center">
              <p className="text-[13px] text-[#1A1A2E]/40">
                Aucun utilisateur trouvé.
              </p>
            </div>
          )}

          {/* User rows */}
          {!loading &&
            users.map((user) => (
              <div
                key={user.id}
                className="grid grid-cols-1 sm:grid-cols-[1fr_100px_80px_120px_48px] gap-2 sm:gap-4 px-5 py-4 items-center border-b border-[#E8E8E8] last:border-0 hover:bg-[#FAFAF7]/60 transition-colors"
              >
                {/* Avatar + name */}
                <div className="flex items-center gap-3 min-w-0">
                  {user.imageUrl ? (
                    <img
                      src={user.imageUrl}
                      alt=""
                      className="h-8 w-8 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E8E8E8] text-[11px] font-medium text-[#1A1A2E]/60 flex-shrink-0">
                      {initials(user.firstName, user.lastName)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium text-[#1A1A2E]">
                      {displayName(user)}
                    </p>
                    <p className="truncate text-[12px] text-[#1A1A2E]/40">
                      {user.email}
                    </p>
                  </div>
                </div>

                {/* Role badge */}
                <div>
                  <span className={roleBadgeClasses(user.role)}>
                    {user.role}
                  </span>
                </div>

                {/* Order count */}
                <div className="text-right text-[13px] text-[#1A1A2E]/70 tabular-nums">
                  {user.orderCount}
                </div>

                {/* Created date */}
                <div className="text-[13px] text-[#1A1A2E]/50">
                  {formatDate(user.createdAt)}
                </div>

                {/* Action dropdown */}
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenDropdown(openDropdown === user.id ? null : user.id);
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded hover:bg-[#E8E8E8]/60 transition-colors"
                  >
                    <svg
                      className="h-4 w-4 text-[#1A1A2E]/40"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                    </svg>
                  </button>

                  {openDropdown === user.id && (
                    <div
                      className="absolute right-0 top-full z-10 mt-1 w-44 border border-[#E8E8E8] bg-white shadow-sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {(["BUYER", "SELLER", "ADMIN"] as Role[])
                        .filter((r) => r !== user.role)
                        .map((r) => (
                          <button
                            key={r}
                            onClick={() => changeRole(user.id, r)}
                            className="block w-full px-4 py-2.5 text-left text-[12px] text-[#1A1A2E]/70 hover:bg-[#FAFAF7] transition-colors"
                          >
                            Passer en{" "}
                            <span className="font-medium text-[#1A1A2E]">
                              {r}
                            </span>
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <p className="text-[12px] text-[#1A1A2E]/40">
              Page {page} sur {totalPages}
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 text-[12px] border border-[#E8E8E8] text-[#1A1A2E]/60 hover:border-[#1A1A2E] hover:text-[#1A1A2E] disabled:opacity-30 disabled:hover:border-[#E8E8E8] disabled:hover:text-[#1A1A2E]/60 transition-colors"
              >
                Précédent
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 text-[12px] border border-[#E8E8E8] text-[#1A1A2E]/60 hover:border-[#1A1A2E] hover:text-[#1A1A2E] disabled:opacity-30 disabled:hover:border-[#E8E8E8] disabled:hover:text-[#1A1A2E]/60 transition-colors"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

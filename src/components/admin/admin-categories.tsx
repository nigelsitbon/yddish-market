"use client";

import { useCallback, useEffect, useState } from "react";

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

type Category = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  image: string | null;
  parentId: string | null;
  order: number;
  _count: { products: number };
  children: Category[];
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

const toSlug = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  /* ---------- add form state ---------- */
  const [showAdd, setShowAdd] = useState(false);
  const [addName, setAddName] = useState("");
  const [addSlug, setAddSlug] = useState("");
  const [addParentId, setAddParentId] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  /* ---------- edit state ---------- */
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  /* ---------- expanded parents ---------- */
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  /* ---------------------------------------------------------------- */
  /*  Fetch                                                           */
  /* ---------------------------------------------------------------- */

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/categories");
      if (!res.ok) throw new Error("Erreur lors du chargement des catégories");
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Erreur serveur");
      setCategories(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  /* ---------------------------------------------------------------- */
  /*  Feedback auto-clear                                             */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    if (!feedback) return;
    const t = setTimeout(() => setFeedback(null), 3000);
    return () => clearTimeout(t);
  }, [feedback]);

  /* ---------------------------------------------------------------- */
  /*  Actions                                                         */
  /* ---------------------------------------------------------------- */

  const handleCreate = async () => {
    if (!addName.trim()) return;
    try {
      setAddLoading(true);
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: addName.trim(),
          slug: addSlug || toSlug(addName),
          parentId: addParentId || null,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Erreur lors de la création");
      }
      setAddName("");
      setAddSlug("");
      setAddParentId("");
      setShowAdd(false);
      setFeedback("Catégorie créée avec succès");
      await fetchCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setAddLoading(false);
    }
  };

  const handleSaveEdit = async (id: string) => {
    if (!editName.trim()) return;
    try {
      setEditLoading(true);
      const res = await fetch("/api/admin/categories", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: id,
          name: editName.trim(),
          slug: editSlug || toSlug(editName),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Erreur lors de la modification");
      }
      setEditId(null);
      setFeedback("Catégorie modifiée avec succès");
      await fetchCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Supprimer la catégorie « ${name} » ?`)) return;
    try {
      const res = await fetch("/api/admin/categories", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryId: id }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Erreur lors de la suppression");
      }
      setFeedback("Catégorie supprimée");
      await fetchCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    }
  };

  /* ---------------------------------------------------------------- */
  /*  Helpers – toggle expand                                         */
  /* ---------------------------------------------------------------- */

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  /* ---------------------------------------------------------------- */
  /*  Derived                                                         */
  /* ---------------------------------------------------------------- */

  const totalCount = categories.reduce(
    (sum, c) => sum + 1 + (c.children?.length ?? 0),
    0
  );

  const parentCategories = categories.filter((c) => !c.parentId);

  /* ---------------------------------------------------------------- */
  /*  Render helpers                                                  */
  /* ---------------------------------------------------------------- */

  const inputClass =
    "h-10 w-full px-3 text-[12px] border border-border bg-white focus:border-foreground focus:outline-none transition-colors";

  const startEdit = (cat: Category) => {
    setEditId(cat.id);
    setEditName(cat.name);
    setEditSlug(cat.slug);
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditName("");
    setEditSlug("");
  };

  /* ---------------------------------------------------------------- */
  /*  Row                                                             */
  /* ---------------------------------------------------------------- */

  const renderRow = (cat: Category, isChild: boolean) => {
    const isEditing = editId === cat.id;
    const hasChildren = cat.children && cat.children.length > 0;
    const isExpanded = expanded.has(cat.id);

    return (
      <div key={cat.id}>
        <div
          className={`flex items-center justify-between px-4 py-3 border-b border-border ${
            isChild ? "pl-8" : ""
          }`}
        >
          {/* Left side */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* Expand toggle for parents with children */}
            {!isChild && hasChildren ? (
              <button
                onClick={() => toggleExpand(cat.id)}
                className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                aria-label={isExpanded ? "Réduire" : "Développer"}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  className={`transition-transform ${isExpanded ? "rotate-90" : ""}`}
                >
                  <path
                    d="M6 4L10 8L6 12"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            ) : (
              <span className="w-4 shrink-0" />
            )}

            {/* Icon */}
            {cat.icon && (
              <span className="text-base shrink-0">{cat.icon}</span>
            )}

            {isEditing ? (
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => {
                    setEditName(e.target.value);
                    setEditSlug(toSlug(e.target.value));
                  }}
                  className={inputClass + " max-w-[200px]"}
                  placeholder="Nom"
                />
                <input
                  type="text"
                  value={editSlug}
                  onChange={(e) => setEditSlug(e.target.value)}
                  className={inputClass + " max-w-[200px]"}
                  placeholder="Slug"
                />
              </div>
            ) : (
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[13px] font-medium text-foreground truncate">
                  {cat.name}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  /{cat.slug}
                </span>
              </div>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3 shrink-0 ml-4">
            <span className="text-[11px] text-muted-foreground tabular-nums">
              {cat._count.products} produit{cat._count.products !== 1 ? "s" : ""}
            </span>

            {isEditing ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleSaveEdit(cat.id)}
                  disabled={editLoading}
                  className="h-8 px-3 text-[11px] font-medium bg-foreground text-background hover:opacity-80 transition-opacity disabled:opacity-40"
                >
                  {editLoading ? "..." : "Sauver"}
                </button>
                <button
                  onClick={cancelEdit}
                  className="h-8 px-3 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  Annuler
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                {/* Edit */}
                <button
                  onClick={() => startEdit(cat)}
                  className="h-8 w-8 inline-flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Modifier"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                  >
                    <path
                      d="M10.08 1.92a1.25 1.25 0 0 1 1.77 0l.23.23a1.25 1.25 0 0 1 0 1.77L5.54 10.46l-2.46.69.69-2.46L10.08 1.92Z"
                      stroke="currentColor"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>

                {/* Delete — only if no products */}
                {cat._count.products === 0 && (
                  <button
                    onClick={() => handleDelete(cat.id, cat.name)}
                    className="h-8 w-8 inline-flex items-center justify-center text-muted-foreground hover:text-red-500 transition-colors"
                    aria-label="Supprimer"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                    >
                      <path
                        d="M2.5 3.5h9M5.5 3.5V2.5a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1M6 6v4M8 6v4M3.5 3.5l.5 8a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1l.5-8"
                        stroke="currentColor"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Children */}
        {!isChild && hasChildren && isExpanded &&
          cat.children.map((child) => renderRow(child, true))}
      </div>
    );
  };

  /* ---------------------------------------------------------------- */
  /*  Main render                                                     */
  /* ---------------------------------------------------------------- */

  return (
    <div className="space-y-6">
      {/* ---- Header ---- */}
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-3">
          <h1 className="text-[22px] font-semibold tracking-tight text-foreground">
            Catégories
          </h1>
          {!loading && (
            <span className="text-[12px] text-muted-foreground">
              {totalCount} catégorie{totalCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <button
          onClick={() => setShowAdd((v) => !v)}
          className="h-9 px-4 text-[12px] font-medium bg-foreground text-background hover:opacity-80 transition-opacity"
        >
          {showAdd ? "Fermer" : "Ajouter"}
        </button>
      </div>

      {/* ---- Feedback ---- */}
      {feedback && (
        <div className="px-4 py-2.5 text-[12px] bg-green-50 text-green-700 border border-green-200">
          {feedback}
        </div>
      )}

      {/* ---- Error ---- */}
      {error && (
        <div className="px-4 py-2.5 text-[12px] bg-red-50 text-red-600 border border-red-200 flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-600 ml-4"
          >
            &times;
          </button>
        </div>
      )}

      {/* ---- Add form ---- */}
      {showAdd && (
        <div className="bg-white border border-border p-5 space-y-3">
          <p className="text-[13px] font-medium text-foreground">
            Ajouter une catégorie
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] text-muted-foreground mb-1">
                Nom
              </label>
              <input
                type="text"
                value={addName}
                onChange={(e) => {
                  setAddName(e.target.value);
                  setAddSlug(toSlug(e.target.value));
                }}
                placeholder="Ex : Vêtements"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-[11px] text-muted-foreground mb-1">
                Slug
              </label>
              <input
                type="text"
                value={addSlug}
                onChange={(e) => setAddSlug(e.target.value)}
                placeholder="auto-généré"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-[11px] text-muted-foreground mb-1">
                Catégorie parente
              </label>
              <select
                value={addParentId}
                onChange={(e) => setAddParentId(e.target.value)}
                className={inputClass + " appearance-none"}
              >
                <option value="">Aucune (racine)</option>
                {parentCategories.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              onClick={handleCreate}
              disabled={addLoading || !addName.trim()}
              className="h-9 px-5 text-[12px] font-medium bg-foreground text-background hover:opacity-80 transition-opacity disabled:opacity-40"
            >
              {addLoading ? "Création..." : "Créer"}
            </button>
          </div>
        </div>
      )}

      {/* ---- Category list ---- */}
      <div className="bg-white border border-border">
        {/* Column header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            Nom / Slug
          </span>
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            Produits
          </span>
        </div>

        {loading ? (
          <div className="px-4 py-12 text-center">
            <div className="inline-block h-5 w-5 border-2 border-border border-t-foreground rounded-full animate-spin" />
            <p className="text-[12px] text-muted-foreground mt-3">
              Chargement...
            </p>
          </div>
        ) : categories.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <p className="text-[13px] text-muted-foreground">
              Aucune catégorie pour le moment.
            </p>
          </div>
        ) : (
          categories.map((cat) => renderRow(cat, false))
        )}
      </div>
    </div>
  );
}

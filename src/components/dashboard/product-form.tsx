"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, X, Save, Eye } from "lucide-react";
import { ImageUpload } from "@/components/dashboard/image-upload";

type Category = { id: string; name: string; slug: string; parentId: string | null; children?: Category[] };
type Variant = { name: string; sku?: string; price?: number; stock: number };

type ProductData = {
  id?: string;
  title: string;
  description: string;
  price: number;
  comparePrice?: number | null;
  categoryIds: string[];
  images: string[];
  stock: number;
  sku?: string;
  weight?: number;
  tags: string[];
  variants: Variant[];
  status: string;
  slug?: string;
};

const emptyProduct: ProductData = {
  title: "",
  description: "",
  price: 0,
  comparePrice: null,
  categoryIds: [],
  images: [],
  stock: 0,
  sku: "",
  weight: undefined,
  tags: [],
  variants: [],
  status: "DRAFT",
};

export function ProductForm({ productId }: { productId?: string }) {
  const router = useRouter();
  const isEdit = !!productId;

  const [form, setForm] = useState<ProductData>(emptyProduct);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [tagInput, setTagInput] = useState("");

  // Fetch categories
  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setCategories(json.data);
      })
      .catch(console.error);
  }, []);

  // Fetch product if editing
  useEffect(() => {
    if (!productId) return;
    setLoading(true);
    fetch(`/api/dashboard/products/${productId}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          const p = json.data;
          setForm({
            id: p.id,
            title: p.title,
            description: p.description,
            price: p.price,
            comparePrice: p.comparePrice,
            categoryIds: p.categories?.map((pc: { category: { id: string } }) => pc.category.id) ?? [],
            images: p.images,
            stock: p.stock,
            sku: p.sku || "",
            weight: p.weight || undefined,
            tags: p.tags,
            variants: p.variants.map((v: { name: string; sku?: string; price?: number; stock: number }) => ({
              name: v.name,
              sku: v.sku || "",
              price: v.price || undefined,
              stock: v.stock,
            })),
            status: p.status,
            slug: p.slug,
          });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [productId]);

  const handleSubmit = async (publishStatus?: string) => {
    setError("");
    setSaving(true);

    const payload = {
      title: form.title,
      description: form.description,
      price: Number(form.price),
      comparePrice: form.comparePrice ? Number(form.comparePrice) : undefined,
      categoryIds: form.categoryIds,
      images: form.images,
      stock: Number(form.stock),
      sku: form.sku || undefined,
      weight: form.weight ? Number(form.weight) : undefined,
      tags: form.tags,
      variants: form.variants,
      status: publishStatus || form.status,
    };

    try {
      const url = isEdit
        ? `/api/dashboard/products/${productId}`
        : "/api/dashboard/products";

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeout);
      const json = await res.json();

      if (json.success) {
        router.push("/dashboard/products");
      } else {
        setError(json.error || "Erreur lors de la sauvegarde");
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setError("Délai dépassé — veuillez réessayer");
      } else {
        setError("Erreur réseau");
      }
    } finally {
      setSaving(false);
    }
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !form.tags.includes(tag)) {
      setForm({ ...form, tags: [...form.tags, tag] });
    }
    setTagInput("");
  };

  const addVariant = () => {
    setForm({
      ...form,
      variants: [...form.variants, { name: "", stock: 0 }],
    });
  };

  const updateVariant = (index: number, field: string, value: string | number) => {
    const updated = [...form.variants];
    updated[index] = { ...updated[index], [field]: value };
    setForm({ ...form, variants: updated });
  };

  const removeVariant = (index: number) => {
    setForm({ ...form, variants: form.variants.filter((_, i) => i !== index) });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-white animate-pulse" />
        <div className="h-[500px] bg-white animate-pulse" />
      </div>
    );
  }

  // Flatten categories for select
  const flatCategories: { id: string; name: string; depth: number }[] = [];
  const flatten = (cats: Category[], depth = 0) => {
    cats.forEach((c) => {
      flatCategories.push({ id: c.id, name: c.name, depth });
      if (c.children) flatten(c.children, depth + 1);
    });
  };
  flatten(categories);

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/products"
            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={18} strokeWidth={1.5} />
          </Link>
          <div>
            <h1 className="text-[20px] font-light text-foreground">
              {isEdit ? "Modifier le produit" : "Nouveau produit"}
            </h1>
          </div>
        </div>
        {isEdit && form.slug && (
          <Link
            href={`/products/${form.slug}`}
            className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <Eye size={14} /> Voir en boutique
          </Link>
        )}
      </div>

      {/* Form */}
      <div className="space-y-6">
        {/* Basic info */}
        <div className="bg-white border border-border p-5 space-y-4">
          <h2 className="text-[13px] font-medium tracking-wide uppercase text-foreground">
            Informations générales
          </h2>

          <div>
            <label className="block text-[11px] tracking-wider text-muted-foreground uppercase mb-1.5">
              Titre *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ex: Menorah en argent 925"
              className="w-full h-11 px-3 text-[13px] border border-border bg-white focus:border-foreground focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-[11px] tracking-wider text-muted-foreground uppercase mb-1.5">
              Description *
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={5}
              placeholder="Décrivez votre produit en détail..."
              className="w-full px-3 py-2.5 text-[13px] border border-border bg-white focus:border-foreground focus:outline-none transition-colors resize-none"
            />
          </div>

          <div>
            <label className="block text-[11px] tracking-wider text-muted-foreground uppercase mb-1.5">
              Catégories * <span className="normal-case tracking-normal text-[10px]">(sélection multiple)</span>
            </label>
            <div className="border border-border bg-white p-3 max-h-[280px] overflow-y-auto space-y-3">
              {categories.map((parent) => (
                <div key={parent.id}>
                  <p className="text-[11px] font-medium tracking-wider uppercase text-foreground mb-1.5">
                    {parent.name}
                  </p>
                  <div className="grid grid-cols-2 gap-1 pl-2">
                    {parent.children?.map((child) => (
                      <label key={child.id} className="flex items-center gap-2 py-1 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={form.categoryIds.includes(child.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setForm({ ...form, categoryIds: [...form.categoryIds, child.id] });
                            } else {
                              setForm({ ...form, categoryIds: form.categoryIds.filter((id) => id !== child.id) });
                            }
                          }}
                          className="w-3.5 h-3.5 accent-foreground"
                        />
                        <span className="text-[12px] text-muted-foreground group-hover:text-foreground transition-colors">
                          {child.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {form.categoryIds.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {form.categoryIds.map((catId) => {
                  const cat = flatCategories.find((c) => c.id === catId);
                  return cat ? (
                    <span key={catId} className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted text-[10px] text-foreground">
                      {cat.name}
                      <button type="button" onClick={() => setForm({ ...form, categoryIds: form.categoryIds.filter((id) => id !== catId) })}>
                        <X size={10} className="text-muted-foreground hover:text-foreground" />
                      </button>
                    </span>
                  ) : null;
                })}
              </div>
            )}
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white border border-border p-5 space-y-4">
          <h2 className="text-[13px] font-medium tracking-wide uppercase text-foreground">
            Prix & stock
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-[11px] tracking-wider text-muted-foreground uppercase mb-1.5">
                Prix (€) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.price || ""}
                onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
                className="w-full h-11 px-3 text-[13px] border border-border bg-white focus:border-foreground focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-[11px] tracking-wider text-muted-foreground uppercase mb-1.5">
                Prix barré (€)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.comparePrice || ""}
                onChange={(e) => setForm({ ...form, comparePrice: parseFloat(e.target.value) || null })}
                className="w-full h-11 px-3 text-[13px] border border-border bg-white focus:border-foreground focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-[11px] tracking-wider text-muted-foreground uppercase mb-1.5">
                Stock
              </label>
              <input
                type="number"
                min="0"
                value={form.stock || ""}
                onChange={(e) => setForm({ ...form, stock: parseInt(e.target.value) || 0 })}
                className="w-full h-11 px-3 text-[13px] border border-border bg-white focus:border-foreground focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-[11px] tracking-wider text-muted-foreground uppercase mb-1.5">
                SKU
              </label>
              <input
                type="text"
                value={form.sku || ""}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                className="w-full h-11 px-3 text-[13px] border border-border bg-white focus:border-foreground focus:outline-none transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Variants */}
        <div className="bg-white border border-border p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[13px] font-medium tracking-wide uppercase text-foreground">
              Variantes
            </h2>
            <button
              type="button"
              onClick={addVariant}
              className="flex items-center gap-1 text-[11px] text-foreground hover:opacity-70 transition-opacity"
            >
              <Plus size={14} /> Ajouter
            </button>
          </div>
          {form.variants.length === 0 ? (
            <p className="text-[12px] text-muted-foreground">
              Aucune variante. Utile pour taille, couleur, etc.
            </p>
          ) : (
            <div className="space-y-3">
              {form.variants.map((v, i) => (
                <div key={i} className="flex items-end gap-3 pb-3 border-b border-border last:border-0">
                  <div className="flex-1">
                    <label className="block text-[10px] text-muted-foreground mb-1">Nom</label>
                    <input
                      type="text"
                      value={v.name}
                      onChange={(e) => updateVariant(i, "name", e.target.value)}
                      placeholder="Ex: Taille M"
                      className="w-full h-9 px-2 text-[12px] border border-border focus:border-foreground focus:outline-none"
                    />
                  </div>
                  <div className="w-20">
                    <label className="block text-[10px] text-muted-foreground mb-1">Prix (€)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={v.price || ""}
                      onChange={(e) => updateVariant(i, "price", parseFloat(e.target.value) || 0)}
                      className="w-full h-9 px-2 text-[12px] border border-border focus:border-foreground focus:outline-none"
                    />
                  </div>
                  <div className="w-16">
                    <label className="block text-[10px] text-muted-foreground mb-1">Stock</label>
                    <input
                      type="number"
                      min="0"
                      value={v.stock}
                      onChange={(e) => updateVariant(i, "stock", parseInt(e.target.value) || 0)}
                      className="w-full h-9 px-2 text-[12px] border border-border focus:border-foreground focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeVariant(i)}
                    className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Images */}
        <div className="bg-white border border-border p-5 space-y-4">
          <h2 className="text-[13px] font-medium tracking-wide uppercase text-foreground">
            Images
          </h2>
          <ImageUpload
            images={form.images}
            onChange={(images) => setForm({ ...form, images })}
          />
        </div>

        {/* Tags */}
        <div className="bg-white border border-border p-5 space-y-4">
          <h2 className="text-[13px] font-medium tracking-wide uppercase text-foreground">
            Tags
          </h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="Ajouter un tag"
              className="flex-1 h-10 px-3 text-[12px] border border-border focus:border-foreground focus:outline-none"
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
            />
            <button type="button" onClick={addTag} className="h-10 px-4 text-[11px] bg-foreground text-[#FFFFFF]">
              Ajouter
            </button>
          </div>
          {form.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {form.tags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 bg-muted text-[11px] text-foreground">
                  {tag}
                  <button type="button" onClick={() => setForm({ ...form, tags: form.tags.filter((t) => t !== tag) })}>
                    <X size={12} className="text-muted-foreground hover:text-foreground" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-[12px] text-red-700">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => handleSubmit("DRAFT")}
            disabled={saving}
            className="flex items-center gap-2 h-11 px-6 border border-border text-[12px] tracking-wide text-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            <Save size={14} />
            Enregistrer brouillon
          </button>
          <button
            type="button"
            onClick={() => handleSubmit("ACTIVE")}
            disabled={saving || !form.title || !form.description || form.categoryIds.length === 0 || form.price <= 0}
            className="flex items-center gap-2 h-11 px-6 bg-foreground text-[#FFFFFF] text-[12px] tracking-wide hover:bg-foreground/90 transition-colors disabled:opacity-50"
          >
            {saving ? (
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Eye size={14} />
                Publier
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

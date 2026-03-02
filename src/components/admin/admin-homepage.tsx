"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Upload, Check, Loader2, ImageIcon, Info, Save } from "lucide-react";
import { HOMEPAGE_DEFAULTS } from "@/lib/homepage-settings";

/* ── Types ── */

interface ImageSlot {
  key: string;
  label: string;
  dimensions: string;
  aspect: string;
}

const HERO_SLOT: ImageSlot = {
  key: "hero_image",
  label: "Image Hero",
  dimensions: "1200 × 1500 px",
  aspect: "aspect-[4/5]",
};

const HERITAGE_SLOTS: ImageSlot[] = Array.from({ length: 6 }, (_, i) => ({
  key: `heritage_image_${i + 1}`,
  label: `Photo ${i + 1}`,
  dimensions: "600 × 750 px",
  aspect: "aspect-[4/5]",
}));

/* ── Main Component ── */

export function HomepageImagesManager() {
  const [images, setImages] = useState<Record<string, string | null>>({});
  const [texts, setTexts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch all settings
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/admin/homepage");
        const json = await res.json();
        if (json.success) {
          setImages(json.data.images);
          // Merge defaults with DB values
          const merged: Record<string, string> = { ...HOMEPAGE_DEFAULTS };
          for (const [key, val] of Object.entries(json.data.texts)) {
            if (val) merged[key] = val as string;
          }
          setTexts(merged);
        }
      } catch {
        setError("Erreur de chargement");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Update text field
  const updateText = useCallback((key: string, value: string) => {
    setTexts((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Upload image
  const handleUpload = async (key: string, file: File) => {
    setUploading(key);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("key", key);

      const res = await fetch("/api/admin/homepage", { method: "POST", body: formData });
      const json = await res.json();

      if (json.success) {
        setImages((prev) => ({ ...prev, [key]: json.data.url }));
        setUploadSuccess(key);
        setTimeout(() => setUploadSuccess(null), 3000);
      } else {
        setError(json.error || "Erreur upload");
      }
    } catch {
      setError("Erreur réseau");
    } finally {
      setUploading(null);
    }
  };

  // Save texts for a section
  const saveTexts = async (sectionKey: string, keys: string[]) => {
    setSaving(sectionKey);
    setError(null);

    try {
      const payload: Record<string, string> = {};
      for (const key of keys) {
        payload[key] = texts[key] ?? "";
      }

      const res = await fetch("/api/admin/homepage", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texts: payload }),
      });

      const json = await res.json();

      if (json.success) {
        setSaveSuccess(sectionKey);
        setTimeout(() => setSaveSuccess(null), 3000);
      } else {
        setError(json.error || "Erreur sauvegarde");
      }
    } catch {
      setError("Erreur réseau");
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={20} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-[22px] font-light tracking-tight text-foreground">
          Gestion de la Homepage
        </h1>
        <p className="text-[13px] text-muted-foreground mt-1">
          Modifiez les images et les textes de la page d&apos;accueil.
          Les changements sont visibles après sauvegarde.
        </p>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 bg-[#FDF8EE] border border-[#C5A55A]/30 p-4 rounded-lg">
        <Info size={16} className="text-[#C5A55A] mt-0.5 shrink-0" />
        <div className="text-[12px] text-foreground/80 leading-relaxed">
          <strong>Images :</strong> recadrées et converties en WebP automatiquement (max 10 Mo).{" "}
          <strong>Textes :</strong> sauvegardez section par section.
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 px-4 py-3 rounded-lg text-[12px] text-red-700">
          {error}
          <button onClick={() => setError(null)} className="ml-3 underline">
            Fermer
          </button>
        </div>
      )}

      {/* ── SECTION: Hero ── */}
      <Section title="Hero">
        <div className="grid lg:grid-cols-[280px_1fr] gap-6">
          <ImageCard
            slot={HERO_SLOT}
            currentImage={images.hero_image ?? null}
            isUploading={uploading === "hero_image"}
            isSuccess={uploadSuccess === "hero_image"}
            onUpload={(file) => handleUpload("hero_image", file)}
          />
          <div className="space-y-4">
            <TextArea
              label="Titre"
              value={texts.homepage_text_hero_title ?? ""}
              onChange={(v) => updateText("homepage_text_hero_title", v)}
              hint="Utilisez un retour à la ligne pour séparer les lignes"
              rows={2}
            />
            <TextArea
              label="Sous-titre"
              value={texts.homepage_text_hero_subtitle ?? ""}
              onChange={(v) => updateText("homepage_text_hero_subtitle", v)}
              rows={3}
            />
            <TextInput
              label="Texte du bouton CTA"
              value={texts.homepage_text_hero_cta ?? ""}
              onChange={(v) => updateText("homepage_text_hero_cta", v)}
            />
          </div>
        </div>
        <SaveButton
          section="hero"
          saving={saving}
          success={saveSuccess}
          onClick={() =>
            saveTexts("hero", [
              "homepage_text_hero_title",
              "homepage_text_hero_subtitle",
              "homepage_text_hero_cta",
            ])
          }
        />
      </Section>

      {/* ── SECTION: Collections ── */}
      <Section title="Collections">
        <div className="space-y-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="p-4 bg-[#FAFAF9] rounded-lg border border-border/50 space-y-3">
              <p className="text-[11px] font-medium tracking-[0.1em] uppercase text-muted-foreground">
                Collection {n}
              </p>
              <TextInput
                label="Titre"
                value={texts[`homepage_text_collection_${n}_title`] ?? ""}
                onChange={(v) => updateText(`homepage_text_collection_${n}_title`, v)}
              />
              <TextArea
                label="Description"
                value={texts[`homepage_text_collection_${n}_description`] ?? ""}
                onChange={(v) => updateText(`homepage_text_collection_${n}_description`, v)}
                rows={2}
              />
            </div>
          ))}
        </div>
        <SaveButton
          section="collections"
          saving={saving}
          success={saveSuccess}
          onClick={() =>
            saveTexts("collections", [
              "homepage_text_collection_1_title",
              "homepage_text_collection_1_description",
              "homepage_text_collection_2_title",
              "homepage_text_collection_2_description",
              "homepage_text_collection_3_title",
              "homepage_text_collection_3_description",
            ])
          }
        />
      </Section>

      {/* ── SECTION: Piliers ── */}
      <Section title="Nos trois piliers">
        <div className="grid sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="p-4 bg-[#FAFAF9] rounded-lg border border-border/50 space-y-3">
              <TextInput
                label="Titre"
                value={texts[`homepage_text_pilier_${n}_title`] ?? ""}
                onChange={(v) => updateText(`homepage_text_pilier_${n}_title`, v)}
              />
              <TextArea
                label="Description"
                value={texts[`homepage_text_pilier_${n}_description`] ?? ""}
                onChange={(v) => updateText(`homepage_text_pilier_${n}_description`, v)}
                rows={4}
              />
            </div>
          ))}
        </div>
        <SaveButton
          section="piliers"
          saving={saving}
          success={saveSuccess}
          onClick={() =>
            saveTexts("piliers", [
              "homepage_text_pilier_1_title",
              "homepage_text_pilier_1_description",
              "homepage_text_pilier_2_title",
              "homepage_text_pilier_2_description",
              "homepage_text_pilier_3_title",
              "homepage_text_pilier_3_description",
            ])
          }
        />
      </Section>

      {/* ── SECTION: Héritage ── */}
      <Section title="L'Héritage">
        <div className="space-y-4 mb-6">
          <TextInput
            label="Titre de section"
            value={texts.homepage_text_heritage_heading ?? ""}
            onChange={(v) => updateText("homepage_text_heritage_heading", v)}
          />
          <TextArea
            label="Description"
            value={texts.homepage_text_heritage_description ?? ""}
            onChange={(v) => updateText("homepage_text_heritage_description", v)}
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {HERITAGE_SLOTS.map((slot, i) => (
            <div key={slot.key}>
              <ImageCard
                slot={slot}
                currentImage={images[slot.key] ?? null}
                isUploading={uploading === slot.key}
                isSuccess={uploadSuccess === slot.key}
                onUpload={(file) => handleUpload(slot.key, file)}
              />
              <div className="mt-2 px-1">
                <TextInput
                  label="Légende"
                  value={texts[`homepage_text_heritage_caption_${i + 1}`] ?? ""}
                  onChange={(v) => updateText(`homepage_text_heritage_caption_${i + 1}`, v)}
                  small
                />
              </div>
            </div>
          ))}
        </div>

        <SaveButton
          section="heritage"
          saving={saving}
          success={saveSuccess}
          onClick={() =>
            saveTexts("heritage", [
              "homepage_text_heritage_heading",
              "homepage_text_heritage_description",
              ...Array.from({ length: 6 }, (_, i) => `homepage_text_heritage_caption_${i + 1}`),
            ])
          }
        />
      </Section>
    </div>
  );
}

/* ── Section wrapper ── */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border border-border rounded-lg overflow-hidden">
      <div className="bg-[#FAFAF9] px-5 py-3 border-b border-border">
        <h2 className="text-[14px] font-medium text-foreground">{title}</h2>
      </div>
      <div className="p-5 space-y-5">{children}</div>
    </section>
  );
}

/* ── Save button ── */

function SaveButton({
  section,
  saving,
  success,
  onClick,
}: {
  section: string;
  saving: string | null;
  success: string | null;
  onClick: () => void;
}) {
  const isSaving = saving === section;
  const isSuccess = success === section;

  return (
    <div className="pt-3 flex justify-end">
      <button
        type="button"
        onClick={onClick}
        disabled={isSaving}
        className="flex items-center gap-2 h-9 px-5 text-[12px] tracking-wide font-medium bg-foreground text-white rounded-lg hover:bg-foreground/90 disabled:opacity-50 transition-all"
      >
        {isSaving ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            Sauvegarde...
          </>
        ) : isSuccess ? (
          <>
            <Check size={14} />
            Sauvegardé
          </>
        ) : (
          <>
            <Save size={14} />
            Sauvegarder
          </>
        )}
      </button>
    </div>
  );
}

/* ── Text Input ── */

function TextInput({
  label,
  value,
  onChange,
  hint,
  small,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  small?: boolean;
}) {
  return (
    <div>
      <label className={`block ${small ? "text-[10px]" : "text-[11px]"} font-medium text-muted-foreground mb-1`}>
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full ${small ? "h-8 text-[12px]" : "h-9 text-[13px]"} px-3 bg-white border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-accent/40 transition-all`}
      />
      {hint && <p className="text-[10px] text-muted-foreground/70 mt-0.5">{hint}</p>}
    </div>
  );
}

/* ── Text Area ── */

function TextArea({
  label,
  value,
  onChange,
  hint,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  rows?: number;
}) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-muted-foreground mb-1">
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="w-full text-[13px] px-3 py-2 bg-white border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-accent/40 transition-all resize-y leading-relaxed"
      />
      {hint && <p className="text-[10px] text-muted-foreground/70 mt-0.5">{hint}</p>}
    </div>
  );
}

/* ── Image Card ── */

function ImageCard({
  slot,
  currentImage,
  isUploading,
  isSuccess,
  onUpload,
}: {
  slot: ImageSlot;
  currentImage: string | null;
  isUploading: boolean;
  isSuccess: boolean;
  onUpload: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
      e.target.value = "";
    }
  };

  return (
    <div className="bg-white border border-border rounded-lg overflow-hidden">
      {/* Image preview */}
      <div className={`relative ${slot.aspect} max-h-[260px] bg-[#F5F5F0] overflow-hidden`}>
        {currentImage ? (
          <img
            src={currentImage}
            alt={slot.label}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
            <ImageIcon size={28} strokeWidth={1} className="mb-1" />
            <span className="text-[10px] tracking-wider uppercase">Aucune image</span>
          </div>
        )}

        {isUploading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Loader2 size={16} className="animate-spin text-white" />
          </div>
        )}

        {isSuccess && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <Check size={16} className="text-white" />
          </div>
        )}
      </div>

      {/* Info + upload */}
      <div className="p-3 flex items-center justify-between">
        <div>
          <p className="text-[12px] font-medium text-foreground">{slot.label}</p>
          <p className="text-[10px] text-muted-foreground">{slot.dimensions}</p>
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center gap-1 h-7 px-2.5 text-[10px] tracking-wide border border-foreground/30 text-foreground hover:bg-foreground hover:text-white transition-colors rounded disabled:opacity-50"
        >
          <Upload size={10} />
          {currentImage ? "Changer" : "Upload"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
}

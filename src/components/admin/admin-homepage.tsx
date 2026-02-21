"use client";

import { useEffect, useState, useRef } from "react";
import { Upload, Check, Loader2, ImageIcon, Info } from "lucide-react";

/* ── Types ── */

interface ImageSlot {
  key: string;
  label: string;
  description: string;
  dimensions: string;
  aspect: string;
}

const IMAGE_SLOTS: ImageSlot[] = [
  {
    key: "hero_image",
    label: "Hero principal",
    description: "Grande image gauche de la section d'accueil",
    dimensions: "1200 x 1500 px",
    aspect: "aspect-[4/5]",
  },
  {
    key: "artisan_image",
    label: "Section Artisan",
    description: "Image de la section \"Nos artisans\"",
    dimensions: "1200 x 800 px",
    aspect: "aspect-[3/2]",
  },
  {
    key: "bijoux_image",
    label: "Bijoux",
    description: "Banner catégorie Bijoux",
    dimensions: "800 x 600 px",
    aspect: "aspect-[4/3]",
  },
  {
    key: "art_accessoires_image",
    label: "Art & Accessoires",
    description: "Banner catégorie Art & Accessoires",
    dimensions: "800 x 600 px",
    aspect: "aspect-[4/3]",
  },
  {
    key: "fetes_image",
    label: "Fêtes",
    description: "Banner catégorie Fêtes",
    dimensions: "800 x 600 px",
    aspect: "aspect-[4/3]",
  },
  {
    key: "vetements_image",
    label: "Vêtements",
    description: "Carré catégorie Vêtements",
    dimensions: "600 x 600 px",
    aspect: "aspect-square",
  },
  {
    key: "livres_image",
    label: "Livres",
    description: "Carré catégorie Livres",
    dimensions: "600 x 600 px",
    aspect: "aspect-square",
  },
  {
    key: "epicerie_fine_image",
    label: "Épicerie Fine",
    description: "Carré catégorie Épicerie Fine",
    dimensions: "600 x 600 px",
    aspect: "aspect-square",
  },
];

/* ── Component ── */

export function HomepageImagesManager() {
  const [images, setImages] = useState<Record<string, string | null>>({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch current images
  useEffect(() => {
    async function fetchImages() {
      try {
        const res = await fetch("/api/admin/homepage");
        const json = await res.json();
        if (json.success) {
          setImages(json.data.images);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchImages();
  }, []);

  const handleUpload = async (key: string, file: File) => {
    setUploading(key);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("key", key);

      const res = await fetch("/api/admin/homepage", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();

      if (json.success) {
        setImages((prev) => ({ ...prev, [key]: json.data.url }));
        setSuccess(key);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(json.error || "Erreur lors de l'upload");
      }
    } catch {
      setError("Erreur réseau");
    } finally {
      setUploading(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-[22px] font-light tracking-tight text-foreground">
          Images Homepage
        </h1>
        <p className="text-[13px] text-muted-foreground mt-1">
          Gérez les images de la page d&apos;accueil. Chaque image est automatiquement
          recadrée et optimisée au bon format.
        </p>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 bg-[#FDF8EE] border border-[#C5A55A]/30 p-4">
        <Info size={16} className="text-[#C5A55A] mt-0.5 shrink-0" />
        <div className="text-[12px] text-foreground/80 leading-relaxed">
          <strong>Recadrage automatique :</strong> Vos images sont automatiquement
          redimensionnées et recadrées au centre pour s&apos;adapter parfaitement à chaque
          emplacement. Format de sortie : WebP optimisé. Taille max : 10 Mo.
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 px-4 py-3 text-[12px] text-red-700">
          {error}
        </div>
      )}

      {/* Image Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {IMAGE_SLOTS.map((slot) => (
          <ImageCard
            key={slot.key}
            slot={slot}
            currentImage={images[slot.key] ?? null}
            isUploading={uploading === slot.key}
            isSuccess={success === slot.key}
            isLoading={loading}
            onUpload={(file) => handleUpload(slot.key, file)}
          />
        ))}
      </div>
    </div>
  );
}

/* ── Image Card ── */

interface ImageCardProps {
  slot: ImageSlot;
  currentImage: string | null;
  isUploading: boolean;
  isSuccess: boolean;
  isLoading: boolean;
  onUpload: (file: File) => void;
}

function ImageCard({ slot, currentImage, isUploading, isSuccess, isLoading, onUpload }: ImageCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
      e.target.value = "";
    }
  };

  return (
    <div className="bg-white border border-border">
      {/* Image preview */}
      <div className={`relative ${slot.aspect} max-h-[300px] bg-[#F5F5F0] overflow-hidden`}>
        {isLoading ? (
          <div className="absolute inset-0 bg-muted animate-pulse" />
        ) : currentImage ? (
          <img
            src={currentImage}
            alt={slot.label}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
            <ImageIcon size={32} strokeWidth={1} className="mb-2" />
            <span className="text-[11px] tracking-wider uppercase">Aucune image</span>
          </div>
        )}

        {/* Upload overlay */}
        {isUploading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="flex items-center gap-2 text-white text-[12px]">
              <Loader2 size={16} className="animate-spin" />
              Traitement en cours...
            </div>
          </div>
        )}

        {/* Success overlay */}
        {isSuccess && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <div className="flex items-center gap-2 text-white text-[12px]">
              <Check size={16} />
              Image mise à jour
            </div>
          </div>
        )}
      </div>

      {/* Info + upload button */}
      <div className="p-4 space-y-3">
        <div>
          <p className="text-[13px] font-medium text-foreground">{slot.label}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">{slot.description}</p>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[10px] tracking-wider text-muted-foreground uppercase">
            {slot.dimensions}
          </span>

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-1.5 h-8 px-3 text-[11px] tracking-wide border border-foreground text-foreground hover:bg-foreground hover:text-white transition-colors disabled:opacity-50"
          >
            <Upload size={12} />
            {currentImage ? "Changer" : "Uploader"}
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
    </div>
  );
}

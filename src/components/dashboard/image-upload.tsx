"use client";

import { useState, useCallback } from "react";
import { Upload, X, Loader2, ImageIcon, Sparkles, ArrowLeft, ArrowRight } from "lucide-react";

type ImageUploadProps = {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
};

export function ImageUpload({ images, onChange, maxImages = 8 }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [enhancingIndex, setEnhancingIndex] = useState<number | null>(null);

  const uploadFile = useCallback(
    async (file: File) => {
      if (images.length >= maxImages) {
        setError(`Maximum ${maxImages} images`);
        return;
      }

      setUploading(true);
      setError("");

      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const json = await res.json();
        if (json.success) {
          onChange([...images, json.data.url]);
        } else {
          setError(json.error || "Erreur d'upload");
        }
      } catch {
        setError("Erreur réseau");
      } finally {
        setUploading(false);
      }
    },
    [images, maxImages, onChange]
  );

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      // Upload files sequentially
      const fileArray = Array.from(files).slice(0, maxImages - images.length);
      fileArray.reduce(async (promise, file) => {
        await promise;
        await uploadFile(file);
      }, Promise.resolve());
    },
    [uploadFile, maxImages, images.length]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onChange(newImages);
  };

  const reorderImage = (from: number, to: number) => {
    const newImages = [...images];
    const [moved] = newImages.splice(from, 1);
    newImages.splice(to, 0, moved);
    onChange(newImages);
  };

  const enhanceImage = async (index: number) => {
    if (enhancingIndex !== null) return;

    setEnhancingIndex(index);
    setError("");

    try {
      const res = await fetch("/api/dashboard/enhance-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: images[index] }),
      });

      const json = await res.json();

      if (json.success && json.data?.url) {
        // Replace original with enhanced version
        const newImages = [...images];
        newImages[index] = json.data.url;
        onChange(newImages);
      } else {
        setError(json.error || "L'amélioration n'a pas pu être effectuée");
        setTimeout(() => setError(""), 5000);
      }
    } catch {
      setError("Erreur réseau — réessayez");
      setTimeout(() => setError(""), 5000);
    } finally {
      setEnhancingIndex(null);
    }
  };

  return (
    <div className="space-y-3">
      {/* Image grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {images.map((url, i) => {
            const isEnhancing = enhancingIndex === i;

            return (
              <div
                key={url}
                className="relative aspect-square bg-[#F5F5F0] border border-border/60 rounded-xl overflow-hidden group"
              >
                <img
                  src={url}
                  alt={`Image ${i + 1}`}
                  className={`w-full h-full object-cover transition-all duration-500 ${
                    isEnhancing ? "blur-sm scale-[1.02]" : ""
                  }`}
                />

                {/* AI Enhancement overlay */}
                {isEnhancing && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center z-20">
                    <div className="relative mb-3">
                      <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                        <Sparkles size={18} className="text-accent animate-pulse" />
                      </div>
                      <div className="absolute inset-0 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
                    </div>
                    <p className="text-[11px] font-medium text-foreground">
                      Amélioration en cours
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Studio IA...
                    </p>
                  </div>
                )}

                {/* Hover overlay with actions */}
                {!isEnhancing && (
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 z-10">
                    {/* Top row: reorder + delete */}
                    <div className="flex items-center gap-1.5">
                      {i > 0 && (
                        <button
                          type="button"
                          onClick={() => reorderImage(i, i - 1)}
                          className="w-8 h-8 flex items-center justify-center bg-white/90 backdrop-blur-sm text-foreground rounded-lg hover:bg-white transition-colors"
                          title="Déplacer à gauche"
                        >
                          <ArrowLeft size={14} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="w-8 h-8 flex items-center justify-center bg-white/90 backdrop-blur-sm text-red-600 rounded-lg hover:bg-white transition-colors"
                        title="Supprimer"
                      >
                        <X size={14} />
                      </button>
                      {i < images.length - 1 && (
                        <button
                          type="button"
                          onClick={() => reorderImage(i, i + 1)}
                          className="w-8 h-8 flex items-center justify-center bg-white/90 backdrop-blur-sm text-foreground rounded-lg hover:bg-white transition-colors"
                          title="Déplacer à droite"
                        >
                          <ArrowRight size={14} />
                        </button>
                      )}
                    </div>

                    {/* AI Enhance button */}
                    <button
                      type="button"
                      onClick={() => enhanceImage(i)}
                      disabled={enhancingIndex !== null}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-lg text-[11px] font-medium text-foreground hover:bg-white transition-colors disabled:opacity-50"
                    >
                      <Sparkles size={12} className="text-accent" />
                      Photo Studio IA
                    </button>
                  </div>
                )}

                {/* Badge — main image */}
                {i === 0 && !isEnhancing && (
                  <span className="absolute top-2 left-2 px-2 py-0.5 bg-foreground/80 backdrop-blur-sm text-[#FFFFFF] text-[9px] tracking-wide uppercase rounded-md z-10">
                    Principale
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Drop zone */}
      {images.length < maxImages && (
        <label
          className={`flex flex-col items-center justify-center gap-2.5 border-2 border-dashed rounded-xl p-8 cursor-pointer transition-all duration-200 ${
            dragOver
              ? "border-accent bg-accent/5"
              : "border-border/60 hover:border-foreground/40 hover:bg-muted/30"
          } ${uploading ? "pointer-events-none opacity-60" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            multiple
            className="sr-only"
            onChange={(e) => handleFiles(e.target.files)}
            disabled={uploading}
          />
          {uploading ? (
            <>
              <Loader2 size={24} className="text-accent animate-spin" />
              <p className="text-[12px] text-muted-foreground">Upload en cours...</p>
            </>
          ) : (
            <>
              <div className="w-12 h-12 flex items-center justify-center bg-muted/60 rounded-xl">
                {images.length === 0 ? (
                  <ImageIcon size={22} className="text-muted-foreground" />
                ) : (
                  <Upload size={22} className="text-muted-foreground" />
                )}
              </div>
              <div className="text-center">
                <p className="text-[13px] text-foreground">
                  Glissez vos images ici ou{" "}
                  <span className="text-accent font-medium">parcourir</span>
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  JPG, PNG ou WebP · Max 5 Mo · {images.length}/{maxImages} images
                </p>
              </div>
            </>
          )}
        </label>
      )}

      {/* AI Info — show only when images exist */}
      {images.length > 0 && enhancingIndex === null && (
        <div className="flex items-start gap-2.5 p-3 bg-accent/5 border border-accent/10 rounded-xl">
          <Sparkles size={14} className="text-accent shrink-0 mt-0.5" />
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            <span className="text-foreground font-medium">Photo Studio IA</span> — Survolez une image et cliquez sur le bouton pour transformer votre photo en packshot professionnel avec fond studio blanc.
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200/60 rounded-xl">
          <p className="text-[11px] text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
}

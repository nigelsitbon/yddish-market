"use client";

import { useState, useCallback } from "react";
import { Upload, X, Loader2, ImageIcon } from "lucide-react";

type ImageUploadProps = {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
};

export function ImageUpload({ images, onChange, maxImages = 8 }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);

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

  return (
    <div className="space-y-3">
      {/* Image grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {images.map((url, i) => (
            <div
              key={url}
              className="relative aspect-square bg-[#F5F5F0] border border-border group"
            >
              <img
                src={url}
                alt={`Image ${i + 1}`}
                className="w-full h-full object-cover"
              />
              {/* Overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                {i > 0 && (
                  <button
                    type="button"
                    onClick={() => reorderImage(i, i - 1)}
                    className="w-7 h-7 flex items-center justify-center bg-white text-foreground text-[11px]"
                    title="Déplacer à gauche"
                  >
                    ←
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="w-7 h-7 flex items-center justify-center bg-white text-red-600"
                  title="Supprimer"
                >
                  <X size={14} />
                </button>
                {i < images.length - 1 && (
                  <button
                    type="button"
                    onClick={() => reorderImage(i, i + 1)}
                    className="w-7 h-7 flex items-center justify-center bg-white text-foreground text-[11px]"
                    title="Déplacer à droite"
                  >
                    →
                  </button>
                )}
              </div>
              {/* Badge */}
              {i === 0 && (
                <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-foreground text-[#FFFFFF] text-[9px] tracking-wide uppercase">
                  Principale
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      {images.length < maxImages && (
        <label
          className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed p-6 cursor-pointer transition-colors ${
            dragOver
              ? "border-foreground bg-foreground/5"
              : "border-border hover:border-foreground/50"
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
              <Loader2 size={24} className="text-muted-foreground animate-spin" />
              <p className="text-[12px] text-muted-foreground">Upload en cours...</p>
            </>
          ) : (
            <>
              <div className="w-10 h-10 flex items-center justify-center bg-muted">
                {images.length === 0 ? (
                  <ImageIcon size={20} className="text-muted-foreground" />
                ) : (
                  <Upload size={20} className="text-muted-foreground" />
                )}
              </div>
              <div className="text-center">
                <p className="text-[12px] text-foreground">
                  Glissez vos images ici ou <span className="underline">parcourir</span>
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  JPG, PNG ou WebP · Max 5 Mo · {images.length}/{maxImages} images
                </p>
              </div>
            </>
          )}
        </label>
      )}

      {/* Error */}
      {error && (
        <p className="text-[11px] text-red-600">{error}</p>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

type ImageGalleryProps = {
  images: string[];
  title: string;
};

export function ImageGallery({ images, title }: ImageGalleryProps) {
  const [current, setCurrent] = useState(0);
  const hasImages = images.length > 0;

  const next = () => setCurrent((c) => (c + 1) % (images.length || 1));
  const prev = () => setCurrent((c) => (c - 1 + (images.length || 1)) % (images.length || 1));

  return (
    <div className="flex flex-col-reverse lg:flex-row gap-4">
      {/* Thumbnails */}
      {hasImages && images.length > 1 && (
        <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto lg:max-h-[600px]">
          {images.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCurrent(i)}
              className={`relative w-16 h-20 flex-shrink-0 border transition-colors ${
                i === current ? "border-foreground" : "border-border hover:border-foreground/50"
              }`}
            >
              <Image
                src={img}
                alt={`${title} - ${i + 1}`}
                fill
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}

      {/* Main image */}
      <div className="relative flex-1 aspect-[3/4] bg-[#F5F5F5] overflow-hidden group">
        {hasImages ? (
          <Image
            src={images[current]}
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[11px] text-muted-foreground tracking-widest uppercase">
              Photo
            </span>
          </div>
        )}

        {/* Navigation arrows */}
        {hasImages && images.length > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-white/80 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Image precedente"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white/80 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Image suivante"
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

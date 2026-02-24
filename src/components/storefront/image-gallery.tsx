"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "@/components/ui/icons";

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
    <div className="flex flex-col gap-3">
      {/* Main image */}
      <div className="relative aspect-[3/4] bg-[#F5F5F3] overflow-hidden group rounded-2xl">
        {hasImages ? (
          <Image
            src={images[current]}
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 55vw"
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
              className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 bg-white/80 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-sm hover:shadow-md"
              aria-label="Image precedente"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-white/80 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-sm hover:shadow-md"
              aria-label="Image suivante"
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}

        {/* Image counter */}
        {hasImages && images.length > 1 && (
          <div className="absolute bottom-3 right-3 px-2.5 py-1 bg-black/40 backdrop-blur-sm rounded-full text-[11px] text-white/90 opacity-0 group-hover:opacity-100 transition-opacity">
            {current + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Thumbnails — horizontal row below */}
      {hasImages && images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-none">
          {images.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCurrent(i)}
              className={`relative w-[72px] h-[90px] flex-shrink-0 border-2 transition-all duration-200 rounded-xl overflow-hidden ${
                i === current ? "border-foreground" : "border-transparent hover:border-foreground/30"
              }`}
            >
              <Image
                src={img}
                alt={`${title} - ${i + 1}`}
                fill
                className="object-cover"
                sizes="72px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X, Maximize2 } from "@/components/ui/icons";

type ImageGalleryProps = {
  images: string[];
  title: string;
};

/* ── Swipe hook ── */

function useSwipe(onSwipeLeft: () => void, onSwipeRight: () => void) {
  const start = useRef<{ x: number; y: number } | null>(null);
  const endX = useRef(0);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    start.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    endX.current = e.touches[0].clientX;
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    endX.current = e.touches[0].clientX;
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!start.current) return;
      const deltaX = start.current.x - endX.current;
      const deltaY = Math.abs(e.changedTouches[0].clientY - start.current.y);
      if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > deltaY) {
        if (deltaX > 0) onSwipeLeft();
        else onSwipeRight();
      }
      start.current = null;
    },
    [onSwipeLeft, onSwipeRight],
  );

  return { onTouchStart, onTouchMove, onTouchEnd };
}

/* ── Gallery component ── */

export function ImageGallery({ images, title }: ImageGalleryProps) {
  const [current, setCurrent] = useState(0);
  const [displayIndex, setDisplayIndex] = useState(0);
  const [opacity, setOpacity] = useState(1);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const hasImages = images.length > 0;
  const multipleImages = images.length > 1;

  const next = useCallback(
    () => setCurrent((c) => (c + 1) % (images.length || 1)),
    [images.length],
  );
  const prev = useCallback(
    () => setCurrent((c) => (c - 1 + (images.length || 1)) % (images.length || 1)),
    [images.length],
  );

  const swipeHandlers = useSwipe(next, prev);

  /* Crossfade transition */
  useEffect(() => {
    if (current === displayIndex) return;
    setOpacity(0);
    const timer = setTimeout(() => {
      setDisplayIndex(current);
      setOpacity(1);
    }, 150);
    return () => clearTimeout(timer);
  }, [current, displayIndex]);

  /* Keyboard navigation */
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "Escape" && lightboxOpen) setLightboxOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [next, prev, lightboxOpen]);

  /* Body scroll lock for lightbox */
  useEffect(() => {
    if (lightboxOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [lightboxOpen]);

  return (
    <>
      <div className="flex flex-col gap-3">
        {/* ── Main image ── */}
        <div
          className="relative aspect-[3/4] bg-[#F5F5F3] overflow-hidden group rounded-2xl cursor-zoom-in"
          onClick={() => hasImages && setLightboxOpen(true)}
          {...swipeHandlers}
        >
          {hasImages ? (
            <Image
              src={images[displayIndex]}
              alt={title}
              fill
              className="object-cover transition-opacity duration-300"
              style={{ opacity }}
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
          {multipleImages && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); prev(); }}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 bg-white/80 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-sm hover:shadow-md"
                aria-label="Image précédente"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); next(); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-white/80 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-sm hover:shadow-md"
                aria-label="Image suivante"
              >
                <ChevronRight size={18} />
              </button>
            </>
          )}

          {/* Expand button */}
          {hasImages && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setLightboxOpen(true); }}
              className="absolute top-3 right-3 p-2.5 bg-white/80 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-sm hover:shadow-md"
              aria-label="Agrandir l'image"
            >
              <Maximize2 size={16} />
            </button>
          )}

          {/* Counter */}
          {multipleImages && (
            <div className="absolute bottom-3 right-3 px-2.5 py-1 bg-black/40 backdrop-blur-sm rounded-full text-[11px] text-white/90 opacity-0 group-hover:opacity-100 transition-opacity">
              {current + 1} / {images.length}
            </div>
          )}
        </div>

        {/* ── Thumbnails ── */}
        {multipleImages && (
          <div className="flex gap-2 overflow-x-auto scrollbar-none">
            {images.map((img, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCurrent(i)}
                className={`relative w-[72px] h-[90px] flex-shrink-0 border-2 transition-all duration-200 rounded-xl overflow-hidden ${
                  i === current
                    ? "border-foreground"
                    : "border-transparent hover:border-foreground/30"
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

      {/* ── Lightbox (portaled to body to escape stacking contexts) ── */}
      {lightboxOpen && createPortal(
        <div className="fixed inset-0 z-[60] flex items-center justify-center" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/90"
            onClick={() => setLightboxOpen(false)}
            aria-hidden="true"
          />

          {/* Close */}
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 z-10 p-2.5 text-white/70 hover:text-white transition-colors"
            aria-label="Fermer"
          >
            <X size={24} />
          </button>

          {/* Image */}
          <div
            className="relative z-10 w-full h-full max-w-5xl max-h-[90vh] mx-4"
            {...swipeHandlers}
          >
            <Image
              src={images[current]}
              alt={title}
              fill
              className="object-contain"
              sizes="100vw"
              priority
            />
          </div>

          {/* Lightbox arrows */}
          {multipleImages && (
            <>
              <button
                type="button"
                onClick={prev}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 text-white/70 hover:text-white transition-colors"
                aria-label="Image précédente"
              >
                <ChevronLeft size={28} />
              </button>
              <button
                type="button"
                onClick={next}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 text-white/70 hover:text-white transition-colors"
                aria-label="Image suivante"
              >
                <ChevronRight size={28} />
              </button>
            </>
          )}

          {/* Lightbox counter */}
          {multipleImages && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 px-3 py-1.5 bg-black/50 backdrop-blur-sm rounded-full text-[12px] text-white/80">
              {current + 1} / {images.length}
            </div>
          )}
        </div>,
        document.body,
      )}
    </>
  );
}

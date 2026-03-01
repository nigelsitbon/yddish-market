"use client";

import { useState, useRef, useEffect } from "react";
import { Share2, Link2, X } from "@/components/ui/icons";

type ShareButtonProps = {
  title: string;
  url?: string;
};

export function ShareButton({ title, url }: ShareButtonProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const shareUrl = url || (typeof window !== "undefined" ? window.location.href : "");

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleShare = async () => {
    // Use native share if available (mobile)
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, url: shareUrl });
        return;
      } catch {
        // User cancelled or not supported, fall through to menu
      }
    }
    setOpen(!open);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setOpen(false);
      }, 1500);
    } catch {
      // Fallback
    }
  };

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(`${title} — ${shareUrl}`)}`, "_blank");
    setOpen(false);
  };

  const shareEmail = () => {
    window.open(`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`Regarde ce produit : ${shareUrl}`)}`, "_blank");
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={handleShare}
        className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Partager"
      >
        <Share2 size={13} strokeWidth={1.5} />
        Partager
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-border/60 rounded-xl shadow-lg overflow-hidden z-30">
          <button
            type="button"
            onClick={copyLink}
            className="w-full flex items-center gap-2.5 px-4 py-3 text-[12px] text-foreground hover:bg-muted/40 transition-colors"
          >
            <Link2 size={14} strokeWidth={1.5} className="text-muted-foreground" />
            {copied ? "Lien copie !" : "Copier le lien"}
          </button>
          <button
            type="button"
            onClick={shareWhatsApp}
            className="w-full flex items-center gap-2.5 px-4 py-3 text-[12px] text-foreground hover:bg-muted/40 transition-colors border-t border-border/30"
          >
            <span className="text-[14px]">💬</span>
            WhatsApp
          </button>
          <button
            type="button"
            onClick={shareEmail}
            className="w-full flex items-center gap-2.5 px-4 py-3 text-[12px] text-foreground hover:bg-muted/40 transition-colors border-t border-border/30"
          >
            <span className="text-[14px]">✉️</span>
            Email
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="w-full flex items-center justify-center py-2 text-muted-foreground hover:text-foreground transition-colors border-t border-border/30"
            aria-label="Fermer"
          >
            <X size={14} strokeWidth={1.5} />
          </button>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[APP_ERROR]", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center px-4">
        <div className="w-16 h-16 bg-muted/60 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <span className="text-[28px]">⚠️</span>
        </div>
        <h2 className="text-[20px] lg:text-[24px] font-light text-foreground mb-3">
          Une erreur est survenue
        </h2>
        <p className="text-[13px] text-muted-foreground max-w-sm mx-auto mb-8">
          Nous sommes désolés, quelque chose s'est mal passé. Veuillez réessayer.
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 h-12 px-8 btn-gradient-dark text-[#FFFFFF] text-[13px] tracking-wide rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
        >
          Réessayer
        </button>
      </div>
    </div>
  );
}

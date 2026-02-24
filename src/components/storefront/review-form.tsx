"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Star, Loader2 } from "@/components/ui/icons";

type ReviewFormProps = {
  productId: string;
  existingReview?: {
    rating: number;
    comment: string | null;
  } | null;
  onSuccess?: () => void;
};

export function ReviewForm({ productId, existingReview, onSuccess }: ReviewFormProps) {
  const { isSignedIn } = useUser();
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState(existingReview?.comment || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!isSignedIn) {
    return (
      <div className="border border-border/60 rounded-2xl p-6 bg-[#FAFAF9]">
        <p className="text-[13px] text-muted-foreground text-center">
          <a href={`/sign-in?redirect_url=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname : "")}`} className="text-accent font-medium hover:underline">
            Connectez-vous
          </a>{" "}
          pour laisser un avis sur ce produit.
        </p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      setError("Veuillez sélectionner une note");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, rating, comment: comment.trim() || null }),
      });

      const json = await res.json();

      if (json.success) {
        setSuccess(true);
        onSuccess?.();
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(json.error || "Erreur lors de l'envoi");
      }
    } catch {
      setError("Erreur réseau — réessayez");
    } finally {
      setLoading(false);
    }
  };

  const displayRating = hoverRating || rating;

  return (
    <form onSubmit={handleSubmit} className="border border-border/60 rounded-2xl p-6">
      <h3 className="text-[13px] font-medium text-foreground mb-4">
        {existingReview ? "Modifier votre avis" : "Laisser un avis"}
      </h3>

      {/* Star rating */}
      <div className="flex items-center gap-1 mb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setRating(i + 1)}
            onMouseEnter={() => setHoverRating(i + 1)}
            onMouseLeave={() => setHoverRating(0)}
            className="p-0.5 transition-transform hover:scale-110"
          >
            <Star
              size={22}
              strokeWidth={1.5}
              className={
                i < displayRating
                  ? "fill-accent text-accent"
                  : "text-border hover:text-accent/40"
              }
            />
          </button>
        ))}
        {displayRating > 0 && (
          <span className="ml-2 text-[12px] text-muted-foreground">
            {displayRating}/5
          </span>
        )}
      </div>

      {/* Comment */}
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Votre commentaire (optionnel)..."
        rows={3}
        className="w-full px-4 py-3 text-[13px] border border-border/60 rounded-xl bg-background text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/20 transition-all duration-200 resize-none"
      />

      {/* Error */}
      {error && (
        <p className="text-[11px] text-red-600 mt-2">{error}</p>
      )}

      {/* Success */}
      {success && (
        <p className="text-[11px] text-emerald-600 mt-2">
          {existingReview ? "Avis mis à jour !" : "Merci pour votre avis !"}
        </p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading || rating === 0}
        className="mt-4 h-10 px-6 text-[12px] font-medium tracking-wide btn-gradient-dark text-[#FFFFFF] rounded-xl shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            Envoi...
          </>
        ) : existingReview ? (
          "Modifier mon avis"
        ) : (
          "Publier mon avis"
        )}
      </button>
    </form>
  );
}

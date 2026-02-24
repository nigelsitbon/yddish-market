"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Store, ArrowRight, Check } from "@/components/ui/icons";

export function BecomeSellerForm() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useUser();
  const [shopName, setShopName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSignedIn) {
      router.push("/sign-in?redirect_url=/become-seller");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/dashboard/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopName, description: description || undefined }),
      });

      const json = await res.json();

      if (json.success) {
        router.push("/dashboard");
      } else {
        setError(json.error || "Erreur lors de la création");
      }
    } catch {
      setError("Erreur réseau. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="animate-pulse space-y-4 max-w-lg mx-auto py-20">
        <div className="h-8 w-48 bg-muted mx-auto" />
        <div className="h-[300px] bg-muted" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12 py-12 lg:py-20">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-14 h-14 bg-foreground text-[#FFFFFF] flex items-center justify-center mx-auto mb-4 rounded-2xl">
            <Store size={24} strokeWidth={1.5} />
          </div>
          <h1 className="text-[24px] font-light text-foreground mb-2">
            Devenir vendeur
          </h1>
          <p className="text-[13px] text-muted-foreground max-w-sm mx-auto">
            Rejoignez la marketplace Judaica premium. Créez votre boutique et commencez à vendre vos créations.
          </p>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {[
            { label: "Commission", value: "20%", desc: "sur chaque vente" },
            { label: "Paiement", value: "Sécurisé", desc: "via Stripe Connect" },
            { label: "Audience", value: "Ciblée", desc: "communauté Judaica" },
          ].map((item) => (
            <div key={item.label} className="border border-border p-4 text-center rounded-xl">
              <p className="text-[18px] font-light text-foreground">{item.value}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[11px] tracking-wider text-muted-foreground uppercase mb-1.5">
              Nom de la boutique *
            </label>
            <input
              type="text"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              required
              minLength={2}
              maxLength={50}
              placeholder="Ex: Atelier David"
              className="w-full h-11 px-3 text-[13px] border border-border bg-white focus:border-accent/50 focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all duration-200 rounded-xl placeholder:text-muted-foreground/50"
            />
          </div>

          <div>
            <label className="block text-[11px] tracking-wider text-muted-foreground uppercase mb-1.5">
              Description (optionnel)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Présentez votre atelier, votre savoir-faire..."
              className="w-full px-3 py-2.5 text-[13px] border border-border bg-white focus:border-accent/50 focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all duration-200 rounded-xl resize-none placeholder:text-muted-foreground/50"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              {description.length}/500 caractères
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-[12px] text-red-700">
              {error}
            </div>
          )}

          <div className="pt-2 space-y-3">
            <div className="flex items-start gap-2 text-[11px] text-muted-foreground">
              <Check size={14} className="text-success shrink-0 mt-0.5" />
              <span>Inscription gratuite, vous ne payez que sur vos ventes</span>
            </div>
            <div className="flex items-start gap-2 text-[11px] text-muted-foreground">
              <Check size={14} className="text-success shrink-0 mt-0.5" />
              <span>Dashboard complet pour gérer produits et commandes</span>
            </div>
            <div className="flex items-start gap-2 text-[11px] text-muted-foreground">
              <Check size={14} className="text-success shrink-0 mt-0.5" />
              <span>Paiements automatiques sur votre compte bancaire</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !shopName.trim()}
            className="flex items-center justify-center gap-2 w-full h-13 mt-4 btn-gradient-dark text-[#FFFFFF] text-[14px] tracking-wide font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg rounded-xl"
          >
            {isSubmitting ? (
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Créer ma boutique
                <ArrowRight size={16} strokeWidth={1.5} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Save, ExternalLink, Store, CreditCard, RefreshCw, CheckCircle } from "lucide-react";

type SellerProfile = {
  id: string;
  shopName: string;
  slug: string;
  description: string | null;
  logo: string | null;
  banner: string | null;
  stripeAccountId: string | null;
  stripeOnboarded: boolean;
  verified: boolean;
  rating: number;
  totalSales: number;
  commission: number;
};

export function SettingsForm() {
  const searchParams = useSearchParams();
  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [stripeLoading, setStripeLoading] = useState(false);
  const [stripeMessage, setStripeMessage] = useState("");

  const [shopName, setShopName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    fetch("/api/dashboard/settings")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setProfile(json.data);
          setShopName(json.data.shopName);
          setDescription(json.data.description || "");
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Vérifier le statut Stripe au retour de l'onboarding
  useEffect(() => {
    const stripeParam = searchParams.get("stripe");
    if (stripeParam === "return") {
      setStripeLoading(true);
      setStripeMessage("Vérification de votre compte Stripe...");
      fetch("/api/dashboard/stripe-connect/status")
        .then((r) => r.json())
        .then((json) => {
          if (json.success && json.data.onboarded) {
            setProfile((prev) => prev ? { ...prev, stripeOnboarded: true } : prev);
            setStripeMessage("Compte Stripe connecté avec succès !");
          } else if (json.success) {
            setStripeMessage("L'onboarding n'est pas encore terminé. Veuillez compléter la configuration.");
          }
        })
        .catch(() => setStripeMessage("Erreur lors de la vérification."))
        .finally(() => setStripeLoading(false));
    } else if (stripeParam === "refresh") {
      setStripeMessage("Votre session Stripe a expiré. Cliquez ci-dessous pour reprendre.");
    }
  }, [searchParams]);

  const handleStripeConnect = async () => {
    setStripeLoading(true);
    setStripeMessage("");
    try {
      const res = await fetch("/api/dashboard/stripe-connect", { method: "POST" });
      const json = await res.json();
      if (json.success && json.data?.url) {
        window.location.href = json.data.url;
      } else {
        setStripeMessage(json.error || "Erreur Stripe Connect");
        setStripeLoading(false);
      }
    } catch {
      setStripeMessage("Erreur réseau");
      setStripeLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch("/api/dashboard/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopName, description: description || undefined }),
      });

      const json = await res.json();
      if (json.success) {
        setProfile(json.data);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(json.error || "Erreur");
      }
    } catch {
      setError("Erreur réseau");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-white animate-pulse" />
        <div className="h-[300px] bg-white animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-[20px] font-light text-foreground">Paramètres</h1>
        <p className="text-[12px] text-muted-foreground mt-0.5">
          Gérez votre profil vendeur
        </p>
      </div>

      {/* Shop info */}
      <div className="bg-white border border-border p-5 space-y-4">
        <h2 className="text-[13px] font-medium tracking-wide uppercase text-foreground">
          Ma boutique
        </h2>

        <div>
          <label className="block text-[11px] tracking-wider text-muted-foreground uppercase mb-1.5">
            Nom de la boutique
          </label>
          <input
            type="text"
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
            className="w-full h-11 px-3 text-[13px] border border-border bg-white focus:border-foreground focus:outline-none transition-colors"
          />
        </div>

        <div>
          <label className="block text-[11px] tracking-wider text-muted-foreground uppercase mb-1.5">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            maxLength={1000}
            className="w-full px-3 py-2.5 text-[13px] border border-border bg-white focus:border-foreground focus:outline-none transition-colors resize-none"
          />
          <p className="text-[11px] text-muted-foreground mt-1">
            {description.length}/1000 caractères
          </p>
        </div>

        <div>
          <label className="block text-[11px] tracking-wider text-muted-foreground uppercase mb-1.5">
            URL de votre boutique
          </label>
          <div className="flex items-center gap-2">
            <code className="flex-1 h-11 flex items-center px-3 text-[12px] bg-muted border border-border text-muted-foreground">
              yddishmarket.com/seller/{profile?.slug}
            </code>
            <a
              href={`/seller/${profile?.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="h-11 px-3 flex items-center gap-1 border border-border text-[11px] text-foreground hover:bg-muted transition-colors"
            >
              <ExternalLink size={14} /> Voir
            </a>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-[12px] text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-50 border border-green-200 text-[12px] text-green-700">
            Modifications enregistrées
          </div>
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !shopName.trim()}
          className="flex items-center gap-2 h-11 px-6 bg-foreground text-[#FFFFFF] text-[12px] tracking-wide hover:bg-foreground/90 transition-colors disabled:opacity-50"
        >
          {saving ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Save size={14} />
              Enregistrer
            </>
          )}
        </button>
      </div>

      {/* Stats */}
      <div className="bg-white border border-border p-5 space-y-4">
        <h2 className="text-[13px] font-medium tracking-wide uppercase text-foreground">
          Informations
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-[18px] font-light text-foreground">{profile?.rating.toFixed(1)}/5</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Note</p>
          </div>
          <div>
            <p className="text-[18px] font-light text-foreground">{profile?.totalSales}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Ventes</p>
          </div>
          <div>
            <p className="text-[18px] font-light text-foreground">{(profile?.commission ?? 0.20) * 100}%</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Commission</p>
          </div>
          <div>
            <p className="text-[18px] font-light text-foreground">
              {profile?.verified ? "✓" : "—"}
            </p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Vérifié</p>
          </div>
        </div>
      </div>

      {/* Stripe Connect */}
      <div className="bg-white border border-border p-5 space-y-4">
        <h2 className="text-[13px] font-medium tracking-wide uppercase text-foreground flex items-center gap-2">
          <CreditCard size={15} /> Paiements — Stripe Connect
        </h2>

        {stripeMessage && (
          <div className={`p-3 text-[12px] border ${
            profile?.stripeOnboarded
              ? "bg-green-50 border-green-200 text-green-700"
              : "bg-blue-50 border-blue-200 text-blue-700"
          }`}>
            {stripeMessage}
          </div>
        )}

        {profile?.stripeOnboarded ? (
          <div className="flex items-center gap-2">
            <CheckCircle size={16} className="text-green-600" />
            <p className="text-[12px] text-foreground">Compte Stripe connecté — vous recevrez vos versements automatiquement</p>
          </div>
        ) : (
          <div>
            <p className="text-[12px] text-muted-foreground mb-3">
              Connectez votre compte Stripe pour recevoir les paiements de vos ventes.
              Vous serez redirigé vers Stripe pour compléter la vérification.
            </p>
            <button
              type="button"
              onClick={handleStripeConnect}
              disabled={stripeLoading}
              className="flex items-center gap-2 h-11 px-5 bg-[#635bff] text-[#FFFFFF] text-[12px] tracking-wide hover:bg-[#5249d9] transition-colors disabled:opacity-50"
            >
              {stripeLoading ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  Chargement...
                </>
              ) : (
                <>
                  <Store size={14} />
                  Configurer Stripe Connect
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

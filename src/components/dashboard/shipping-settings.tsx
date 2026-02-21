"use client";

import { useEffect, useState } from "react";
import { Truck, Check, AlertCircle } from "lucide-react";
import { COUNTRY_OPTIONS } from "@/lib/shipping";

interface ShippingData {
  shippingDomestic: number;
  shippingEU: number;
  shippingInternational: number;
  freeShippingThreshold: number | null;
  handlingDays: number;
  shipsFrom: string;
}

export function ShippingSettings() {
  const [data, setData] = useState<ShippingData>({
    shippingDomestic: 6.9,
    shippingEU: 12.9,
    shippingInternational: 24.9,
    freeShippingThreshold: null,
    handlingDays: 3,
    shipsFrom: "FR",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [freeShippingEnabled, setFreeShippingEnabled] = useState(false);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/dashboard/shipping");
        const json = await res.json();
        if (json.success) {
          setData(json.data);
          setFreeShippingEnabled(json.data.freeShippingThreshold !== null);
        }
      } catch {
        // Use defaults
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    setError(null);

    try {
      const payload = {
        ...data,
        freeShippingThreshold: freeShippingEnabled ? data.freeShippingThreshold : null,
      };

      const res = await fetch("/api/dashboard/shipping", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (json.success) {
        setData(json.data);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(json.error || "Erreur lors de la sauvegarde");
      }
    } catch {
      setError("Erreur réseau");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 sm:p-8 lg:p-12 max-w-[720px]">
        <div className="animate-pulse space-y-6">
          <div className="h-6 bg-muted w-48" />
          <div className="h-40 bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 lg:p-12 max-w-[720px]">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Truck size={18} strokeWidth={1.5} className="text-accent" />
          <h1 className="text-[18px] font-light text-foreground">Paramètres de livraison</h1>
        </div>
        <p className="text-[12px] text-muted-foreground">
          Définissez vos tarifs de livraison par zone géographique.
        </p>
      </div>

      {/* Messages */}
      {success && (
        <div className="mb-6 flex items-center gap-2 text-[12px] text-green-700 bg-green-50 border border-green-200 px-4 py-2.5">
          <Check size={14} />
          Paramètres sauvegardés
        </div>
      )}
      {error && (
        <div className="mb-6 flex items-center gap-2 text-[12px] text-red-700 bg-red-50 border border-red-200 px-4 py-2.5">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      <div className="space-y-8">
        {/* Pays d'expédition */}
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
            Pays d&apos;expédition
          </label>
          <select
            value={data.shipsFrom}
            onChange={(e) => setData({ ...data, shipsFrom: e.target.value })}
            className="h-11 px-3 text-[13px] border border-border bg-white w-full max-w-[300px] focus:outline-none focus:border-foreground transition-colors"
          >
            {COUNTRY_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          <p className="text-[11px] text-muted-foreground mt-1">
            Le pays depuis lequel vous expédiez vos produits.
          </p>
        </div>

        {/* Tarifs */}
        <div>
          <h2 className="text-[11px] uppercase tracking-wider text-muted-foreground mb-4">
            Tarifs de livraison
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[12px] text-foreground mb-1.5">
                Domestique
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.10"
                  min="0"
                  value={data.shippingDomestic}
                  onChange={(e) => setData({ ...data, shippingDomestic: parseFloat(e.target.value) || 0 })}
                  className="h-11 px-3 pr-8 text-[13px] border border-border bg-white w-full focus:outline-none focus:border-foreground transition-colors"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-muted-foreground">€</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                Même pays que votre adresse
              </p>
            </div>

            <div>
              <label className="block text-[12px] text-foreground mb-1.5">
                Union Européenne
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.10"
                  min="0"
                  value={data.shippingEU}
                  onChange={(e) => setData({ ...data, shippingEU: parseFloat(e.target.value) || 0 })}
                  className="h-11 px-3 pr-8 text-[13px] border border-border bg-white w-full focus:outline-none focus:border-foreground transition-colors"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-muted-foreground">€</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                Pays de l&apos;UE (hors domestique)
              </p>
            </div>

            <div>
              <label className="block text-[12px] text-foreground mb-1.5">
                International
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.10"
                  min="0"
                  value={data.shippingInternational}
                  onChange={(e) => setData({ ...data, shippingInternational: parseFloat(e.target.value) || 0 })}
                  className="h-11 px-3 pr-8 text-[13px] border border-border bg-white w-full focus:outline-none focus:border-foreground transition-colors"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-muted-foreground">€</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                Hors UE (Israël, USA, etc.)
              </p>
            </div>
          </div>
        </div>

        {/* Livraison gratuite */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <button
              type="button"
              onClick={() => {
                setFreeShippingEnabled(!freeShippingEnabled);
                if (!freeShippingEnabled) {
                  setData({ ...data, freeShippingThreshold: 100 });
                }
              }}
              className={`w-10 h-5 rounded-full transition-colors relative ${
                freeShippingEnabled ? "bg-accent" : "bg-muted"
              }`}
            >
              <span
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                  freeShippingEnabled ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
            <span className="text-[12px] text-foreground">Livraison gratuite à partir d&apos;un montant</span>
          </div>

          {freeShippingEnabled && (
            <div className="relative w-48">
              <input
                type="number"
                step="1"
                min="0"
                value={data.freeShippingThreshold ?? 100}
                onChange={(e) => setData({ ...data, freeShippingThreshold: parseFloat(e.target.value) || 0 })}
                className="h-11 px-3 pr-8 text-[13px] border border-border bg-white w-full focus:outline-none focus:border-foreground transition-colors"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-muted-foreground">€</span>
            </div>
          )}
        </div>

        {/* Délai de préparation */}
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
            Délai de préparation
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="1"
              max="30"
              value={data.handlingDays}
              onChange={(e) => setData({ ...data, handlingDays: parseInt(e.target.value) || 1 })}
              className="h-11 px-3 text-[13px] border border-border bg-white w-24 focus:outline-none focus:border-foreground transition-colors"
            />
            <span className="text-[12px] text-muted-foreground">jours ouvrés</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            Temps moyen pour préparer et expédier une commande.
          </p>
        </div>

        {/* Save button */}
        <div className="pt-4 border-t border-border">
          <button
            onClick={handleSave}
            disabled={saving}
            className="h-11 px-8 bg-foreground text-white text-[12px] uppercase tracking-wider hover:bg-foreground/90 transition-colors disabled:opacity-50"
          >
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}

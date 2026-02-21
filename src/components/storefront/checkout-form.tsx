"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { ArrowLeft, Lock, ChevronDown } from "lucide-react";
import { useCartStore } from "@/stores/cart";
import { formatPrice } from "@/lib/utils";

type Address = {
  id: string;
  label?: string | null;
  firstName: string;
  lastName: string;
  street: string;
  street2?: string | null;
  city: string;
  zip: string;
  country: string;
  phone?: string | null;
  isDefault: boolean;
};

const emptyAddress = {
  firstName: "",
  lastName: "",
  street: "",
  street2: "",
  city: "",
  zip: "",
  country: "FR",
  phone: "",
};

export function CheckoutForm() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useUser();
  const { items, setItems, setLoading: setCartLoading } = useCartStore();

  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [form, setForm] = useState(emptyAddress);
  const [saveAddress, setSaveAddress] = useState(true);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Fetch cart and addresses
  const fetchData = useCallback(async () => {
    if (!isSignedIn) return;

    try {
      const [cartRes, addrRes] = await Promise.all([
        fetch("/api/cart"),
        fetch("/api/addresses"),
      ]);
      const [cartJson, addrJson] = await Promise.all([cartRes.json(), addrRes.json()]);

      if (cartJson.success) setItems(cartJson.data);
      if (addrJson.success) {
        setSavedAddresses(addrJson.data);
        // Auto-select default address
        const defaultAddr = addrJson.data.find((a: Address) => a.isDefault);
        if (defaultAddr) {
          setSelectedAddressId(defaultAddr.id);
        } else if (addrJson.data.length > 0) {
          setSelectedAddressId(addrJson.data[0].id);
        } else {
          setShowNewForm(true);
        }
      }
    } catch (err) {
      console.error("Checkout: fetch error", err);
    }
  }, [isSignedIn, setItems]);

  useEffect(() => {
    if (isLoaded && isSignedIn) fetchData();
  }, [isLoaded, isSignedIn, fetchData]);

  // Redirect if not signed in
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/sign-in?redirect_url=/checkout");
    }
  }, [isLoaded, isSignedIn, router]);

  const subtotal = useCartStore.getState().subtotal();
  const shipping = subtotal >= 150 ? 0 : 9.90;
  const total = subtotal + shipping;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      let addressId = selectedAddressId;

      // Create new address if needed
      if (showNewForm || !addressId) {
        if (!form.firstName || !form.lastName || !form.street || !form.city || !form.zip) {
          setError("Veuillez remplir tous les champs obligatoires.");
          setIsSubmitting(false);
          return;
        }

        if (saveAddress) {
          const addrRes = await fetch("/api/addresses", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...form, isDefault: savedAddresses.length === 0 }),
          });
          const addrJson = await addrRes.json();
          if (!addrJson.success) {
            setError(addrJson.error || "Erreur lors de la sauvegarde de l'adresse.");
            setIsSubmitting(false);
            return;
          }
          addressId = addrJson.data.id;
        }
      }

      if (!addressId) {
        setError("Veuillez sélectionner ou créer une adresse de livraison.");
        setIsSubmitting(false);
        return;
      }

      // Create checkout session
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          addressId,
          notes: notes || undefined,
          // If address not saved, pass inline
          ...(!saveAddress && showNewForm ? { address: form } : {}),
        }),
      });

      const json = await res.json();

      if (json.success && json.data?.url) {
        // Redirect to Stripe Checkout
        window.location.href = json.data.url;
      } else if (json.success && json.data?.orderId) {
        // Direct order (e.g., free or demo mode)
        setCartLoading(true);
        router.push(`/checkout/confirmation?order=${json.data.orderId}`);
      } else {
        setError(json.error || "Erreur lors de la création de la commande.");
      }
    } catch (err) {
      console.error("Checkout error", err);
      setError("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12 py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-6 w-48 bg-muted" />
          <div className="h-[300px] bg-muted" />
        </div>
      </div>
    );
  }

  if (items.length === 0 && !isSubmitting) {
    return (
      <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12 py-20 text-center">
        <h1 className="text-[20px] font-light text-foreground mb-2">Panier vide</h1>
        <p className="text-[13px] text-muted-foreground mb-6">
          Ajoutez des articles avant de passer commande.
        </p>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 h-12 px-8 bg-foreground text-white text-[13px] tracking-wide hover:bg-foreground/90 transition-colors"
        >
          Explorer la boutique
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12 py-8 lg:py-12">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-[12px] text-muted-foreground mb-6">
        <Link href="/" className="hover:text-foreground transition-colors">Accueil</Link>
        <span>&gt;</span>
        <Link href="/cart" className="hover:text-foreground transition-colors">Panier</Link>
        <span>&gt;</span>
        <span className="text-foreground">Commande</span>
      </nav>

      <h1 className="text-[22px] font-light text-foreground mb-8">Passer commande</h1>

      <form onSubmit={handleSubmit}>
        <div className="lg:grid lg:grid-cols-[1fr_380px] lg:gap-12">
          {/* Left: Address */}
          <div>
            <h2 className="text-[14px] font-medium tracking-wide uppercase text-foreground mb-6">
              Adresse de livraison
            </h2>

            {/* Saved addresses */}
            {savedAddresses.length > 0 && !showNewForm && (
              <div className="space-y-3 mb-6">
                {savedAddresses.map((addr) => (
                  <label
                    key={addr.id}
                    className={`flex items-start gap-3 p-4 border cursor-pointer transition-colors ${
                      selectedAddressId === addr.id
                        ? "border-foreground bg-[#FAFAFA]"
                        : "border-border hover:border-foreground/30"
                    }`}
                  >
                    <input
                      type="radio"
                      name="address"
                      value={addr.id}
                      checked={selectedAddressId === addr.id}
                      onChange={() => setSelectedAddressId(addr.id)}
                      className="mt-0.5 accent-foreground"
                    />
                    <div className="text-[13px] text-foreground leading-relaxed">
                      <p className="font-medium">
                        {addr.firstName} {addr.lastName}
                        {addr.label && (
                          <span className="ml-2 text-[11px] text-muted-foreground font-normal">
                            ({addr.label})
                          </span>
                        )}
                      </p>
                      <p className="text-muted-foreground">{addr.street}</p>
                      {addr.street2 && <p className="text-muted-foreground">{addr.street2}</p>}
                      <p className="text-muted-foreground">
                        {addr.zip} {addr.city}, {addr.country}
                      </p>
                      {addr.phone && <p className="text-muted-foreground">{addr.phone}</p>}
                    </div>
                  </label>
                ))}

                <button
                  type="button"
                  onClick={() => {
                    setShowNewForm(true);
                    setSelectedAddressId(null);
                  }}
                  className="text-[12px] text-foreground underline underline-offset-4 hover:opacity-70 transition-opacity"
                >
                  + Ajouter une nouvelle adresse
                </button>
              </div>
            )}

            {/* New address form */}
            {(showNewForm || savedAddresses.length === 0) && (
              <div className="space-y-4 mb-6">
                {savedAddresses.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewForm(false);
                      const def = savedAddresses.find((a) => a.isDefault) || savedAddresses[0];
                      if (def) setSelectedAddressId(def.id);
                    }}
                    className="text-[12px] text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors mb-2"
                  >
                    ← Utiliser une adresse existante
                  </button>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] tracking-wider text-muted-foreground uppercase mb-1.5">
                      Prénom *
                    </label>
                    <input
                      type="text"
                      value={form.firstName}
                      onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                      required
                      className="w-full h-11 px-3 text-[13px] border border-border bg-white focus:border-foreground focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] tracking-wider text-muted-foreground uppercase mb-1.5">
                      Nom *
                    </label>
                    <input
                      type="text"
                      value={form.lastName}
                      onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                      required
                      className="w-full h-11 px-3 text-[13px] border border-border bg-white focus:border-foreground focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] tracking-wider text-muted-foreground uppercase mb-1.5">
                    Adresse *
                  </label>
                  <input
                    type="text"
                    value={form.street}
                    onChange={(e) => setForm({ ...form, street: e.target.value })}
                    required
                    placeholder="Numéro et nom de rue"
                    className="w-full h-11 px-3 text-[13px] border border-border bg-white focus:border-foreground focus:outline-none transition-colors placeholder:text-muted-foreground/50"
                  />
                </div>

                <div>
                  <label className="block text-[11px] tracking-wider text-muted-foreground uppercase mb-1.5">
                    Complément
                  </label>
                  <input
                    type="text"
                    value={form.street2}
                    onChange={(e) => setForm({ ...form, street2: e.target.value })}
                    placeholder="Appartement, étage, etc."
                    className="w-full h-11 px-3 text-[13px] border border-border bg-white focus:border-foreground focus:outline-none transition-colors placeholder:text-muted-foreground/50"
                  />
                </div>

                <div className="grid grid-cols-[120px_1fr] gap-4">
                  <div>
                    <label className="block text-[11px] tracking-wider text-muted-foreground uppercase mb-1.5">
                      Code postal *
                    </label>
                    <input
                      type="text"
                      value={form.zip}
                      onChange={(e) => setForm({ ...form, zip: e.target.value })}
                      required
                      className="w-full h-11 px-3 text-[13px] border border-border bg-white focus:border-foreground focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] tracking-wider text-muted-foreground uppercase mb-1.5">
                      Ville *
                    </label>
                    <input
                      type="text"
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      required
                      className="w-full h-11 px-3 text-[13px] border border-border bg-white focus:border-foreground focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] tracking-wider text-muted-foreground uppercase mb-1.5">
                      Pays
                    </label>
                    <div className="relative">
                      <select
                        value={form.country}
                        onChange={(e) => setForm({ ...form, country: e.target.value })}
                        className="w-full h-11 px-3 pr-8 text-[13px] border border-border bg-white focus:border-foreground focus:outline-none transition-colors appearance-none"
                      >
                        <option value="FR">France</option>
                        <option value="BE">Belgique</option>
                        <option value="CH">Suisse</option>
                        <option value="IL">Israël</option>
                        <option value="LU">Luxembourg</option>
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] tracking-wider text-muted-foreground uppercase mb-1.5">
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="+33 6 12 34 56 78"
                      className="w-full h-11 px-3 text-[13px] border border-border bg-white focus:border-foreground focus:outline-none transition-colors placeholder:text-muted-foreground/50"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={saveAddress}
                    onChange={(e) => setSaveAddress(e.target.checked)}
                    className="accent-foreground"
                  />
                  <span className="text-[12px] text-muted-foreground">
                    Sauvegarder cette adresse pour mes prochaines commandes
                  </span>
                </label>
              </div>
            )}

            {/* Notes */}
            <div className="mb-6">
              <label className="block text-[11px] tracking-wider text-muted-foreground uppercase mb-1.5">
                Instructions de livraison (optionnel)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Digicode, étage, instructions spéciales..."
                className="w-full px-3 py-2.5 text-[13px] border border-border bg-white focus:border-foreground focus:outline-none transition-colors resize-none placeholder:text-muted-foreground/50"
              />
            </div>

            <Link
              href="/cart"
              className="inline-flex items-center gap-2 text-[13px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft size={14} strokeWidth={1.5} />
              Retour au panier
            </Link>
          </div>

          {/* Right: Summary */}
          <div className="mt-8 lg:mt-0">
            <div className="bg-[#FAFAFA] p-6 lg:sticky lg:top-[120px]">
              <h2 className="text-[14px] font-medium text-foreground tracking-wide uppercase mb-6">
                Récapitulatif
              </h2>

              {/* Items mini list */}
              <div className="space-y-3 mb-6 max-h-[280px] overflow-y-auto">
                {items.map((item) => {
                  const price = item.variant?.price ?? item.product.price;
                  return (
                    <div key={item.id} className="flex items-start gap-3">
                      <div className="w-12 h-16 bg-[#F0F0ED] shrink-0 flex items-center justify-center">
                        {item.product.images[0] ? (
                          <img
                            src={item.product.images[0]}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-[7px] text-[#A09A90]">IMG</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] text-foreground truncate">{item.product.title}</p>
                        {item.variant && (
                          <p className="text-[11px] text-muted-foreground">{item.variant.name}</p>
                        )}
                        <p className="text-[11px] text-muted-foreground">Qté : {item.quantity}</p>
                      </div>
                      <p className="text-[12px] text-foreground shrink-0">
                        {formatPrice(price * item.quantity)}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-3 text-[13px] border-t border-border pt-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sous-total</span>
                  <span className="text-foreground">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Livraison</span>
                  <span className="text-foreground">
                    {shipping === 0 ? "Offerte" : formatPrice(shipping)}
                  </span>
                </div>
                <div className="border-t border-border pt-3 mt-3">
                  <div className="flex justify-between text-[14px] font-medium">
                    <span className="text-foreground">Total</span>
                    <span className="text-foreground">{formatPrice(total)}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">TVA incluse</p>
                </div>
              </div>

              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 text-[12px] text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center justify-center gap-2 w-full h-12 mt-6 bg-foreground text-white text-[13px] tracking-wide font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Lock size={14} strokeWidth={1.5} />
                    Paiement sécurisé
                  </>
                )}
              </button>

              <p className="text-[10px] text-muted-foreground text-center mt-3">
                Vous serez redirigé vers Stripe pour le paiement
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

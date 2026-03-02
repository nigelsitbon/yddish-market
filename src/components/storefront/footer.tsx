"use client";

import Link from "next/link";
import { useState } from "react";
import { Instagram, Facebook, Mail } from "@/components/ui/icons";

const footerSections = [
  {
    title: "YDDISH MARKET",
    links: [
      { name: "À propos", href: "/about" },
      { name: "Nos artisans", href: "/sellers" },
      { name: "Devenir vendeur", href: "/become-seller" },
      { name: "Comment ça marche", href: "/how-it-works" },
    ],
  },
  {
    title: "Catégories",
    links: [
      { name: "Vêtements", href: "/products?category=vetements" },
      { name: "Bijoux", href: "/products?category=bijoux" },
      { name: "Art & Accessoires", href: "/products?category=art-accessoires" },
      { name: "Livres", href: "/products?category=livres" },
      { name: "Fêtes", href: "/products?category=fetes" },
      { name: "Épicerie Fine", href: "/products?category=epicerie-fine" },
    ],
  },
  {
    title: "Aide",
    links: [
      { name: "Centre d'aide", href: "/help" },
      { name: "Livraison & retours", href: "/shipping" },
      { name: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Légal",
    links: [
      { name: "Mentions légales", href: "/legal" },
      { name: "CGV", href: "/cgv" },
      { name: "Confidentialité", href: "/privacy" },
    ],
  },
];

function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [msg, setMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const json = await res.json();
      if (json.success) {
        setStatus("success");
        setMsg("Merci ! Vous recevrez nos actualités.");
        setEmail("");
        setTimeout(() => setStatus("idle"), 4000);
      } else {
        setStatus("error");
        setMsg(json.error || "Erreur");
        setTimeout(() => setStatus("idle"), 3000);
      }
    } catch {
      setStatus("error");
      setMsg("Erreur réseau");
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <div className="relative flex-1">
        <Mail size={14} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Votre email"
          aria-label="Email pour la newsletter"
          className="w-full h-10 pl-9 pr-3 text-[12px] bg-white border border-border/60 rounded-lg focus:outline-none focus:ring-1 focus:ring-accent/30 placeholder:text-muted-foreground/50 transition-all"
          required
        />
      </div>
      <button
        type="submit"
        disabled={status === "loading"}
        className="h-10 px-5 text-[11px] tracking-[0.1em] uppercase font-medium bg-foreground text-white rounded-lg hover:bg-foreground/90 disabled:opacity-50 transition-all shrink-0"
      >
        {status === "loading" ? "..." : "OK"}
      </button>
      {status === "success" && (
        <p className="absolute mt-11 text-[11px] text-accent">{msg}</p>
      )}
      {status === "error" && (
        <p className="absolute mt-11 text-[11px] text-sale">{msg}</p>
      )}
    </form>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-border bg-[#FAFAF9]">
      {/* Links + Newsletter */}
      <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12 py-12 lg:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 lg:gap-12">
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-[11px] font-medium tracking-[0.15em] uppercase text-foreground mb-5">
                {section.title}
              </h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-[13px] text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Newsletter + Social */}
          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            <h3 className="text-[11px] font-medium tracking-[0.15em] uppercase text-foreground mb-5">
              Newsletter
            </h3>
            <p className="text-[12px] text-muted-foreground mb-3 leading-relaxed">
              Nouveautés et offres exclusives
            </p>
            <div className="relative">
              <NewsletterForm />
            </div>

            {/* Social links */}
            <div className="flex items-center gap-3 mt-6">
              <a
                href="https://instagram.com/yddishmarket"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 flex items-center justify-center border border-border/60 rounded-lg text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all"
                aria-label="Instagram"
              >
                <Instagram size={16} strokeWidth={1.5} />
              </a>
              <a
                href="https://facebook.com/yddishmarket"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 flex items-center justify-center border border-border/60 rounded-lg text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all"
                aria-label="Facebook"
              >
                <Facebook size={16} strokeWidth={1.5} />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-border">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[12px] text-muted-foreground">
              &copy; {new Date().getFullYear()} EINSOF SAS &mdash; Tous droits réservés
            </p>
            <div className="flex items-center gap-6">
              <span className="text-[11px] text-muted-foreground tracking-wide border border-border/50 rounded-full px-3 py-1">Paiement sécurisé</span>
              <span className="text-[11px] text-muted-foreground tracking-wide border border-border/50 rounded-full px-3 py-1">Artisans vérifiés</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

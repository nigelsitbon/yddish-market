import Link from "next/link";

const footerSections = [
  {
    title: "YDDISH MARKET",
    links: [
      { name: "A propos", href: "/about" },
      { name: "Nos artisans", href: "/sellers" },
      { name: "Devenir vendeur", href: "/become-seller" },
      { name: "Comment ca marche", href: "/how-it-works" },
    ],
  },
  {
    title: "Categories",
    links: [
      { name: "Objets rituels", href: "/?category=objets-rituels" },
      { name: "Bijoux", href: "/?category=bijoux" },
      { name: "Mezouzot", href: "/?category=mezouzot" },
      { name: "Art & Decoration", href: "/?category=art-decoration" },
      { name: "Mode", href: "/?category=mode" },
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
    title: "Legal",
    links: [
      { name: "Mentions legales", href: "/legal" },
      { name: "CGV", href: "/cgv" },
      { name: "Confidentialite", href: "/privacy" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-[#FAFAF9]">
      {/* Links */}
      <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12 py-12 lg:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-16">
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
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-border">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-12 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[12px] text-muted-foreground">
              &copy; {new Date().getFullYear()} EINSOF SAS &mdash; Tous droits reserves
            </p>
            <div className="flex items-center gap-6">
              <span className="text-[11px] text-muted-foreground tracking-wide border border-border/50 rounded-full px-3 py-1">Paiement securise</span>
              <span className="text-[11px] text-muted-foreground tracking-wide border border-border/50 rounded-full px-3 py-1">Artisans verifies</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

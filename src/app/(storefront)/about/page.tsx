import Link from "next/link";

export const metadata = {
  title: "À propos — YDDISH MARKET",
  description: "Découvrez YDDISH MARKET, la marketplace dédiée à l'artisanat et la culture judaïque. Opérée par EINSOF SAS.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-[800px] px-4 sm:px-8 lg:px-12 py-12 lg:py-20">
      <h1 className="text-[28px] font-light text-foreground mb-2">
        À propos de YDDISH MARKET
      </h1>
      <p className="text-[12px] text-muted-foreground mb-12">
        La marketplace de l&apos;artisanat judaïque
      </p>

      <div className="space-y-10 text-[14px] leading-relaxed text-foreground/80">
        <section>
          <h2 className="text-[16px] font-medium text-foreground mb-3">
            Notre mission
          </h2>
          <p>
            YDDISH MARKET est une marketplace en ligne qui réunit les meilleurs
            artisans spécialisés dans la culture et la tradition judaïque. Notre
            mission est de rendre accessibles des objets rituels, bijoux, œuvres
            d&apos;art et créations artisanales d&apos;exception, tout en
            soutenant les artisans indépendants qui perpétuent ces savoir-faire.
          </p>
        </section>

        <section>
          <h2 className="text-[16px] font-medium text-foreground mb-3">
            Ce que nous proposons
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { title: "Objets rituels", desc: "Menorot, chandeliers, kiddoush cups et objets de cérémonie fabriqués à la main." },
              { title: "Bijoux", desc: "Créations originales inspirées par la tradition et le design contemporain." },
              { title: "Mezouzot", desc: "Mezouzot artisanales en matériaux nobles, alliant tradition et modernité." },
              { title: "Art & Décoration", desc: "Peintures, sculptures et objets décoratifs célébrant la culture judaïque." },
            ].map((item) => (
              <div key={item.title} className="p-4 border border-border/60 rounded-xl">
                <h3 className="text-[13px] font-medium text-foreground mb-1">{item.title}</h3>
                <p className="text-[12px] text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-[16px] font-medium text-foreground mb-3">
            Nos engagements
          </h2>
          <ul className="space-y-3 text-[14px]">
            <li className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-accent mt-2 shrink-0" />
              <span><strong>Artisans vérifiés</strong> — Chaque vendeur est sélectionné pour la qualité de son travail et son authenticité.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-accent mt-2 shrink-0" />
              <span><strong>Paiement sécurisé</strong> — Toutes les transactions sont protégées via Stripe, leader mondial du paiement en ligne.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-accent mt-2 shrink-0" />
              <span><strong>Livraison suivie</strong> — Chaque commande bénéficie d&apos;un suivi de livraison avec les principaux transporteurs.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-accent mt-2 shrink-0" />
              <span><strong>Support réactif</strong> — Notre équipe est disponible pour vous accompagner à chaque étape.</span>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-[16px] font-medium text-foreground mb-3">
            Qui sommes-nous ?
          </h2>
          <p>
            YDDISH MARKET est opéré par EINSOF SAS, société française basée en
            France. Nous sommes une équipe passionnée par la préservation et la
            valorisation du patrimoine culturel judaïque à travers l&apos;artisanat.
          </p>
          <p className="mt-2">
            Pour toute question, contactez-nous à{" "}
            <a href="mailto:contact@yddishmarket.com" className="text-accent hover:underline">
              contact@yddishmarket.com
            </a>
          </p>
        </section>
      </div>

      <div className="mt-12 pt-8 border-t border-border">
        <Link
          href="/"
          className="text-[12px] uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
        >
          &larr; Retour à la boutique
        </Link>
      </div>
    </div>
  );
}

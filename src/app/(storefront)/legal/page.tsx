import Link from "next/link";

export const metadata = {
  title: "Mentions légales — YDDISH MARKET",
  description: "Mentions légales de YDDISH MARKET, opéré par EINSOF SAS.",
  alternates: { canonical: "/legal" },
};

export default function LegalPage() {
  return (
    <div className="mx-auto max-w-[800px] px-4 sm:px-8 lg:px-12 py-12 lg:py-20">
      <h1 className="text-[28px] font-light text-foreground mb-2">
        Mentions légales
      </h1>
      <p className="text-[12px] text-muted-foreground mb-12">
        Conformément aux dispositions de la loi n° 2004-575 du 21 juin 2004
      </p>

      <div className="space-y-10 text-[14px] leading-relaxed text-foreground/80">
        <section>
          <h2 className="text-[16px] font-medium text-foreground mb-3">
            1. Éditeur du site
          </h2>
          <div className="text-[14px] space-y-1">
            <p>Le site <strong>yddishmarket.com</strong> est édité par :</p>
            <div className="mt-3 p-4 border border-border/60 rounded-xl text-[13px] text-muted-foreground space-y-1">
              <p className="text-foreground font-medium">EINSOF SAS</p>
              <p>Société par actions simplifiée</p>
              <p>Email : contact@yddishmarket.com</p>
              <p>Site : www.yddishmarket.com</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-[16px] font-medium text-foreground mb-3">
            2. Directeur de la publication
          </h2>
          <p>
            Le directeur de la publication est le représentant légal de la
            société EINSOF SAS.
          </p>
        </section>

        <section>
          <h2 className="text-[16px] font-medium text-foreground mb-3">
            3. Hébergement
          </h2>
          <div className="p-4 border border-border/60 rounded-xl text-[13px] text-muted-foreground space-y-1">
            <p className="text-foreground font-medium">Vercel Inc.</p>
            <p>440 N Barranca Ave #4133</p>
            <p>Covina, CA 91723, États-Unis</p>
            <p>www.vercel.com</p>
          </div>
        </section>

        <section>
          <h2 className="text-[16px] font-medium text-foreground mb-3">
            4. Activité de la plateforme
          </h2>
          <p>
            YDDISH MARKET est une marketplace en ligne mettant en relation des
            acheteurs et des vendeurs indépendants spécialisés dans
            l&apos;artisanat et la culture judaïque. EINSOF SAS agit en qualité
            d&apos;intermédiaire technique et n&apos;est pas le vendeur des
            produits proposés sur la plateforme.
          </p>
          <p className="mt-2">
            La plateforme perçoit une commission de 20% sur chaque transaction
            entre acheteurs et vendeurs.
          </p>
        </section>

        <section>
          <h2 className="text-[16px] font-medium text-foreground mb-3">
            5. Propriété intellectuelle
          </h2>
          <p>
            L&apos;ensemble du contenu du site (textes, images, logos, graphismes,
            icônes, etc.) est la propriété exclusive de EINSOF SAS ou de ses
            partenaires, et est protégé par les lois françaises et
            internationales relatives à la propriété intellectuelle.
          </p>
          <p className="mt-2">
            Toute reproduction, représentation, modification, publication ou
            adaptation de tout ou partie du contenu du site est strictement
            interdite sans autorisation préalable écrite.
          </p>
        </section>

        <section>
          <h2 className="text-[16px] font-medium text-foreground mb-3">
            6. Données personnelles
          </h2>
          <p>
            Les informations collectées sur ce site sont traitées conformément
            au Règlement Général sur la Protection des Données (RGPD) et à la
            loi Informatique et Libertés. Pour plus d&apos;informations,
            consultez notre{" "}
            <Link href="/privacy" className="text-accent hover:underline">
              politique de confidentialité
            </Link>.
          </p>
        </section>

        <section>
          <h2 className="text-[16px] font-medium text-foreground mb-3">
            7. Contact
          </h2>
          <p>
            Pour toute question relative aux mentions légales, vous pouvez nous
            contacter à l&apos;adresse :{" "}
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

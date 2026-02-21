import Link from "next/link";

export const metadata = {
  title: "Conditions Générales de Vente — YDDISH MARKET",
  description: "Conditions générales de vente de la marketplace YDDISH MARKET opérée par EINSOF SAS.",
};

export default function CGVPage() {
  return (
    <div className="mx-auto max-w-[800px] px-4 sm:px-8 lg:px-12 py-12 lg:py-20">
      <h1 className="text-[28px] font-light text-foreground mb-2">
        Conditions Générales de Vente
      </h1>
      <p className="text-[12px] text-muted-foreground mb-12">
        Dernière mise à jour : février 2026
      </p>

      <div className="space-y-10 text-[14px] leading-relaxed text-foreground/80">
        {/* Article 1 */}
        <section>
          <h2 className="text-[16px] font-medium text-foreground mb-3">
            1. Objet et champ d&apos;application
          </h2>
          <p>
            YDDISH MARKET est une marketplace en ligne opérée par EINSOF SAS,
            mettant en relation des acheteurs et des vendeurs indépendants
            spécialisés dans l&apos;artisanat et la culture judaïque.
          </p>
          <p className="mt-2">
            EINSOF SAS agit en qualité d&apos;intermédiaire technique et
            n&apos;est pas le vendeur des produits proposés sur la plateforme.
            Chaque vendeur est responsable de la conformité, de la qualité et
            de la livraison de ses produits.
          </p>
          <p className="mt-2">
            Les présentes CGV régissent toute transaction effectuée sur la
            plateforme YDDISH MARKET entre un acheteur et un vendeur
            référencé.
          </p>
        </section>

        {/* Article 2 */}
        <section>
          <h2 className="text-[16px] font-medium text-foreground mb-3">
            2. Prix et paiement
          </h2>
          <p>
            Les prix affichés sur YDDISH MARKET sont indiqués en euros (EUR),
            toutes taxes comprises (TTC). Le paiement est effectué en ligne
            par carte bancaire via notre prestataire de paiement sécurisé
            Stripe.
          </p>
          <p className="mt-2">
            La commande n&apos;est considérée comme validée qu&apos;après
            confirmation du paiement. Un email de confirmation est envoyé à
            l&apos;acheteur.
          </p>
        </section>

        {/* Article 3 */}
        <section>
          <h2 className="text-[16px] font-medium text-foreground mb-3">
            3. Livraison
          </h2>
          <p>
            Les frais de livraison sont fixés par chaque vendeur et affichés
            au moment du paiement. Ils varient selon la destination
            (France métropolitaine, Union Européenne, international) et le
            montant de la commande.
          </p>
          <p className="mt-2">
            Les délais de livraison sont indicatifs et dépendent du vendeur.
            Le délai de préparation (traitement et expédition) est indiqué
            sur la fiche de chaque vendeur. EINSOF SAS ne saurait être tenu
            responsable des retards de livraison imputables aux transporteurs.
          </p>
          <p className="mt-2">
            En cas de commande auprès de plusieurs vendeurs, l&apos;acheteur
            peut recevoir ses articles en plusieurs colis distincts, chacun
            expédié par le vendeur concerné.
          </p>
        </section>

        {/* Article 4 */}
        <section>
          <h2 className="text-[16px] font-medium text-foreground mb-3">
            4. Droit de rétractation
          </h2>
          <p>
            Conformément aux articles L221-18 et suivants du Code de la
            consommation, l&apos;acheteur dispose d&apos;un délai de{" "}
            <strong>14 jours calendaires</strong> à compter de la réception
            de sa commande pour exercer son droit de rétractation, sans avoir
            à justifier de motif.
          </p>
          <p className="mt-2">
            Pour exercer ce droit, l&apos;acheteur doit notifier le vendeur
            concerné via la messagerie de la plateforme ou par tout moyen
            écrit.
          </p>
          <p className="mt-2">
            Le produit doit être retourné dans son état d&apos;origine, complet
            et non utilisé. Les frais de retour sont à la charge de
            l&apos;acheteur, sauf en cas de produit défectueux ou non conforme
            à la description.
          </p>
          <p className="mt-2">
            Le remboursement est effectué dans un délai maximum de 14 jours
            suivant la réception du produit retourné par le vendeur.
          </p>
          <p className="mt-2 text-[13px] text-muted-foreground">
            <em>
              Exception : les denrées alimentaires périssables et les produits
              descellés ne peuvent pas faire l&apos;objet d&apos;un droit de
              rétractation (Art. L221-28 du Code de la consommation).
            </em>
          </p>
        </section>

        {/* Article 5 */}
        <section>
          <h2 className="text-[16px] font-medium text-foreground mb-3">
            5. Garanties
          </h2>
          <p>
            Chaque vendeur est tenu à la garantie légale de conformité
            (articles L217-4 et suivants du Code de la consommation) et à
            la garantie des vices cachés (articles 1641 et suivants du Code
            civil).
          </p>
          <p className="mt-2">
            En cas de produit non conforme ou défectueux, l&apos;acheteur
            peut contacter le vendeur via la plateforme pour convenir d&apos;un
            échange ou d&apos;un remboursement.
          </p>
        </section>

        {/* Article 6 */}
        <section>
          <h2 className="text-[16px] font-medium text-foreground mb-3">
            6. Responsabilité de la plateforme
          </h2>
          <p>
            EINSOF SAS, en tant qu&apos;opérateur de la marketplace YDDISH
            MARKET, agit exclusivement en qualité d&apos;intermédiaire
            technique. La responsabilité de la vente, de la qualité, de
            l&apos;authenticité et de la livraison des produits incombe
            uniquement aux vendeurs.
          </p>
          <p className="mt-2">
            EINSOF SAS s&apos;engage à mettre en œuvre les moyens nécessaires
            pour assurer le bon fonctionnement de la plateforme et la
            sécurité des transactions.
          </p>
        </section>

        {/* Article 7 */}
        <section>
          <h2 className="text-[16px] font-medium text-foreground mb-3">
            7. Données personnelles
          </h2>
          <p>
            Les données personnelles collectées dans le cadre des transactions
            sont traitées conformément au Règlement Général sur la Protection
            des Données (RGPD). Elles sont utilisées exclusivement pour le
            traitement des commandes et la gestion de la relation client.
          </p>
          <p className="mt-2">
            L&apos;acheteur dispose d&apos;un droit d&apos;accès, de
            rectification et de suppression de ses données personnelles en
            contactant EINSOF SAS à l&apos;adresse : contact@yddishmarket.com
          </p>
        </section>

        {/* Article 8 */}
        <section>
          <h2 className="text-[16px] font-medium text-foreground mb-3">
            8. Litiges et droit applicable
          </h2>
          <p>
            Les présentes CGV sont soumises au droit français. En cas de
            litige, les parties s&apos;engagent à rechercher une solution
            amiable avant toute action judiciaire.
          </p>
          <p className="mt-2">
            Conformément aux dispositions du Code de la consommation,
            l&apos;acheteur peut recourir gratuitement au service de
            médiation de la consommation. À défaut de résolution amiable,
            les tribunaux français sont seuls compétents.
          </p>
        </section>

        {/* Coordonnées */}
        <section className="border-t border-border pt-8">
          <h2 className="text-[16px] font-medium text-foreground mb-3">
            Coordonnées de l&apos;éditeur
          </h2>
          <div className="text-[13px] text-muted-foreground space-y-1">
            <p>EINSOF SAS</p>
            <p>contact@yddishmarket.com</p>
            <p>www.yddishmarket.com</p>
          </div>
        </section>
      </div>

      {/* Back */}
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

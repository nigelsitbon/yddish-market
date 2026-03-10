import Link from "next/link";

export const metadata = {
  title: "Politique de confidentialité — YDDISH MARKET",
  description: "Politique de confidentialité et protection des données personnelles de YDDISH MARKET.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-[800px] px-4 sm:px-8 lg:px-12 py-12 lg:py-20">
      <h1 className="text-[28px] font-light text-foreground mb-2">
        Politique de confidentialité
      </h1>
      <p className="text-[12px] text-muted-foreground mb-12">
        Dernière mise à jour : février 2026
      </p>

      <div className="space-y-10 text-[14px] leading-relaxed text-foreground/80">
        <section>
          <h2 className="text-[16px] font-medium text-foreground mb-3">
            1. Responsable du traitement
          </h2>
          <p>
            Le responsable du traitement des données personnelles est EINSOF
            SAS, éditeur du site yddishmarket.com. Pour toute question relative
            à vos données, contactez-nous à :{" "}
            <a href="mailto:contact@yddishmarket.com" className="text-accent hover:underline">
              contact@yddishmarket.com
            </a>
          </p>
        </section>

        <section>
          <h2 className="text-[16px] font-medium text-foreground mb-3">
            2. Données collectées
          </h2>
          <p className="mb-3">
            Dans le cadre de l&apos;utilisation de notre plateforme, nous
            collectons les données suivantes :
          </p>
          <div className="space-y-2">
            {[
              { title: "Données d'identification", desc: "Nom, prénom, adresse email, mot de passe (chiffré via Clerk)." },
              { title: "Données de transaction", desc: "Historique des commandes, montants, adresses de livraison." },
              { title: "Données vendeur", desc: "Nom de boutique, description, informations Stripe Connect." },
              { title: "Données techniques", desc: "Adresse IP, type de navigateur, pages visitées (via cookies analytiques)." },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-foreground mt-2 shrink-0" />
                <span><strong>{item.title}</strong> : {item.desc}</span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-[16px] font-medium text-foreground mb-3">
            3. Finalités du traitement
          </h2>
          <p>Vos données sont utilisées pour :</p>
          <ul className="mt-3 space-y-2">
            {[
              "Créer et gérer votre compte utilisateur",
              "Traiter et suivre vos commandes",
              "Gérer les paiements via Stripe",
              "Communiquer sur le suivi de vos commandes",
              "Améliorer notre plateforme et votre expérience",
              "Respecter nos obligations légales et réglementaires",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-accent mt-2 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-[16px] font-medium text-foreground mb-3">
            4. Partage des données
          </h2>
          <p>
            Vos données personnelles ne sont jamais vendues à des tiers. Elles
            peuvent être partagées avec :
          </p>
          <ul className="mt-3 space-y-2">
            {[
              "Les vendeurs concernés par votre commande (nom, adresse de livraison)",
              "Stripe, pour le traitement sécurisé des paiements",
              "Clerk, pour la gestion de l'authentification",
              "Les transporteurs, pour l'acheminement de vos commandes",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-foreground mt-2 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-[16px] font-medium text-foreground mb-3">
            5. Durée de conservation
          </h2>
          <p>
            Vos données sont conservées pendant la durée de votre compte actif,
            puis pendant une durée maximale de 3 ans après la dernière
            interaction. Les données de facturation sont conservées 10 ans
            conformément aux obligations comptables.
          </p>
        </section>

        <section>
          <h2 className="text-[16px] font-medium text-foreground mb-3">
            6. Vos droits
          </h2>
          <p>
            Conformément au RGPD, vous disposez des droits suivants :
          </p>
          <ul className="mt-3 space-y-2">
            {[
              "Droit d'accès à vos données personnelles",
              "Droit de rectification des données inexactes",
              "Droit à l'effacement (« droit à l'oubli »)",
              "Droit à la portabilité de vos données",
              "Droit d'opposition au traitement",
              "Droit de limitation du traitement",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-accent mt-2 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3">
            Pour exercer ces droits, envoyez un email à{" "}
            <a href="mailto:contact@yddishmarket.com" className="text-accent hover:underline">
              contact@yddishmarket.com
            </a>
            . Nous vous répondrons sous 30 jours.
          </p>
        </section>

        <section>
          <h2 className="text-[16px] font-medium text-foreground mb-3">
            7. Cookies
          </h2>
          <p>
            Notre site utilise des cookies essentiels au fonctionnement de la
            plateforme (authentification, panier, préférences). Aucun cookie
            publicitaire n&apos;est utilisé. Les cookies d&apos;analyse sont
            anonymisés et utilisés uniquement pour améliorer l&apos;expérience
            utilisateur.
          </p>
        </section>

        <section>
          <h2 className="text-[16px] font-medium text-foreground mb-3">
            8. Sécurité
          </h2>
          <p>
            Nous mettons en œuvre des mesures techniques et organisationnelles
            appropriées pour protéger vos données personnelles contre tout
            accès non autorisé, altération, divulgation ou destruction. Les
            paiements sont traités de manière sécurisée par Stripe, certifié
            PCI-DSS.
          </p>
        </section>

        <section>
          <h2 className="text-[16px] font-medium text-foreground mb-3">
            9. Réclamation
          </h2>
          <p>
            Si vous estimez que vos droits ne sont pas respectés, vous pouvez
            introduire une réclamation auprès de la Commission Nationale de
            l&apos;Informatique et des Libertés (CNIL) : www.cnil.fr
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

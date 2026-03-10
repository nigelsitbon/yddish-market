import Link from "next/link";

export const metadata = {
  title: "Centre d'aide — YDDISH MARKET",
  description: "Trouvez les réponses à vos questions sur YDDISH MARKET. FAQ, contact et assistance.",
  alternates: { canonical: "/help" },
};

const faqSections = [
  {
    title: "Commandes & Paiements",
    questions: [
      {
        q: "Comment passer une commande ?",
        a: "Parcourez notre catalogue, ajoutez les articles souhaités à votre panier, puis procédez au paiement par carte bancaire via notre système sécurisé Stripe.",
      },
      {
        q: "Quels moyens de paiement acceptez-vous ?",
        a: "Nous acceptons les cartes Visa, Mastercard et American Express via Stripe. Tous les paiements sont sécurisés et chiffrés.",
      },
      {
        q: "Puis-je commander auprès de plusieurs vendeurs ?",
        a: "Oui ! Vous pouvez ajouter des articles de différents vendeurs dans le même panier. Chaque vendeur expédiera ses articles séparément.",
      },
      {
        q: "Comment annuler une commande ?",
        a: "Contactez directement le vendeur via la messagerie de la plateforme. Si la commande n'a pas encore été expédiée, le vendeur pourra procéder à l'annulation et au remboursement.",
      },
    ],
  },
  {
    title: "Livraison & Retours",
    questions: [
      {
        q: "Quels sont les délais de livraison ?",
        a: "Les délais varient selon le vendeur et la destination. Le délai de préparation est indiqué sur chaque fiche vendeur (généralement 1 à 5 jours ouvrés). La livraison prend ensuite 2 à 7 jours selon le transporteur.",
      },
      {
        q: "Comment suivre ma commande ?",
        a: "Une fois votre commande expédiée, vous recevrez un email avec un numéro de suivi et un lien vers le site du transporteur.",
      },
      {
        q: "Puis-je retourner un article ?",
        a: "Vous disposez de 14 jours après réception pour exercer votre droit de rétractation. Le produit doit être retourné dans son état d'origine. Contactez le vendeur pour organiser le retour.",
      },
    ],
  },
  {
    title: "Vendre sur YDDISH MARKET",
    questions: [
      {
        q: "Comment devenir vendeur ?",
        a: "Créez un compte, puis rendez-vous sur la page \"Devenir vendeur\" pour ouvrir votre boutique. L'inscription est gratuite et ne prend que quelques minutes.",
      },
      {
        q: "Quelle est la commission prélevée ?",
        a: "YDDISH MARKET prélève une commission de 20% sur chaque vente. Cette commission couvre la plateforme, le support et la gestion des paiements. Aucun abonnement mensuel.",
      },
      {
        q: "Comment suis-je payé ?",
        a: "Les paiements sont versés automatiquement sur votre compte bancaire via Stripe Connect. Vous devez configurer votre compte Stripe lors de votre inscription vendeur.",
      },
    ],
  },
];

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-[800px] px-4 sm:px-8 lg:px-12 py-12 lg:py-20">
      <h1 className="text-[28px] font-light text-foreground mb-2">
        Centre d&apos;aide
      </h1>
      <p className="text-[12px] text-muted-foreground mb-12">
        Trouvez les réponses à vos questions
      </p>

      <div className="space-y-10">
        {faqSections.map((section) => (
          <section key={section.title}>
            <h2 className="text-[11px] font-medium tracking-[0.15em] uppercase text-accent mb-5">
              {section.title}
            </h2>
            <div className="space-y-4">
              {section.questions.map((item) => (
                <div
                  key={item.q}
                  className="border border-border/60 rounded-xl p-4"
                >
                  <h3 className="text-[14px] font-medium text-foreground mb-2">
                    {item.q}
                  </h3>
                  <p className="text-[13px] text-muted-foreground leading-relaxed">
                    {item.a}
                  </p>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Contact */}
      <section className="mt-12 bg-muted/50 border border-border/60 rounded-2xl p-6 text-center">
        <h2 className="text-[16px] font-medium text-foreground mb-2">
          Vous ne trouvez pas la réponse ?
        </h2>
        <p className="text-[13px] text-muted-foreground mb-4">
          Notre équipe est disponible pour vous aider.
        </p>
        <Link
          href="/contact"
          className="inline-flex items-center gap-2 h-10 px-5 btn-gradient-dark text-[#FFFFFF] text-[12px] tracking-wide rounded-xl shadow-sm hover:shadow-md transition-all"
        >
          Nous contacter
        </Link>
      </section>

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

import Link from "next/link";

export const metadata = {
  title: "Comment ça marche — YDDISH MARKET",
  description: "Découvrez comment acheter et vendre sur YDDISH MARKET, la marketplace de l'artisanat judaïque.",
};

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-[800px] px-4 sm:px-8 lg:px-12 py-12 lg:py-20">
      <h1 className="text-[28px] font-light text-foreground mb-2">
        Comment ça marche
      </h1>
      <p className="text-[12px] text-muted-foreground mb-12">
        Achetez et vendez en toute simplicité
      </p>

      <div className="space-y-12 text-[14px] leading-relaxed text-foreground/80">
        {/* Acheteurs */}
        <section>
          <h2 className="text-[11px] font-medium tracking-[0.15em] uppercase text-accent mb-6">
            Pour les acheteurs
          </h2>
          <div className="space-y-6">
            {[
              { step: "1", title: "Parcourez le catalogue", desc: "Explorez notre sélection d'objets rituels, bijoux, mezouzot et créations artisanales. Filtrez par catégorie, prix ou artisan." },
              { step: "2", title: "Ajoutez au panier", desc: "Sélectionnez les articles qui vous plaisent et ajoutez-les à votre panier. Vous pouvez commander auprès de plusieurs artisans en une seule commande." },
              { step: "3", title: "Payez en toute sécurité", desc: "Réglez par carte bancaire via notre système de paiement sécurisé Stripe. Vos données bancaires ne sont jamais stockées sur nos serveurs." },
              { step: "4", title: "Suivez votre commande", desc: "Recevez un email de confirmation avec un numéro de suivi. Suivez l'acheminement de votre colis en temps réel." },
            ].map((item) => (
              <div key={item.step} className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                  <span className="text-[14px] font-medium text-accent">{item.step}</span>
                </div>
                <div>
                  <h3 className="text-[14px] font-medium text-foreground mb-1">{item.title}</h3>
                  <p className="text-[13px] text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Vendeurs */}
        <section>
          <h2 className="text-[11px] font-medium tracking-[0.15em] uppercase text-accent mb-6">
            Pour les vendeurs
          </h2>
          <div className="space-y-6">
            {[
              { step: "1", title: "Créez votre boutique", desc: "Inscrivez-vous gratuitement et créez votre profil vendeur en quelques minutes. Choisissez le nom de votre boutique et ajoutez une description." },
              { step: "2", title: "Connectez Stripe", desc: "Configurez votre compte Stripe Connect pour recevoir vos paiements directement sur votre compte bancaire. La vérification prend quelques minutes." },
              { step: "3", title: "Ajoutez vos produits", desc: "Créez vos fiches produits avec photos, description, prix et variantes. Publiez-les quand vous êtes prêt." },
              { step: "4", title: "Vendez et expédiez", desc: "Recevez des commandes, préparez vos colis et ajoutez le numéro de suivi. Vous êtes payé automatiquement après livraison." },
            ].map((item) => (
              <div key={item.step} className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-foreground/5 flex items-center justify-center shrink-0">
                  <span className="text-[14px] font-medium text-foreground">{item.step}</span>
                </div>
                <div>
                  <h3 className="text-[14px] font-medium text-foreground mb-1">{item.title}</h3>
                  <p className="text-[13px] text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Commission */}
        <section className="bg-muted/50 border border-border/60 rounded-2xl p-6">
          <h2 className="text-[16px] font-medium text-foreground mb-3">
            Commission transparente
          </h2>
          <p className="text-[13px] text-muted-foreground">
            YDDISH MARKET prélève une commission de <strong className="text-foreground">20%</strong> sur chaque vente.
            Cette commission couvre l&apos;hébergement de la plateforme, le support technique,
            la gestion des paiements et la promotion de votre boutique. Aucun frais caché,
            aucun abonnement mensuel.
          </p>
        </section>

        {/* CTA */}
        <section className="text-center py-6">
          <p className="text-[14px] text-foreground mb-4">
            Prêt à rejoindre notre communauté d&apos;artisans ?
          </p>
          <Link
            href="/become-seller"
            className="inline-flex items-center gap-2 h-11 px-6 btn-gradient-accent text-[#FFFFFF] text-[13px] font-medium tracking-wide rounded-xl shadow-sm hover:shadow-md transition-all"
          >
            Devenir vendeur
          </Link>
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

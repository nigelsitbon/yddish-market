import Link from "next/link";

export const metadata = {
  title: "Contact — YDDISH MARKET",
  description: "Contactez l'équipe YDDISH MARKET. Nous sommes là pour répondre à vos questions.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-[800px] px-4 sm:px-8 lg:px-12 py-12 lg:py-20">
      <h1 className="text-[28px] font-light text-foreground mb-2">
        Contact
      </h1>
      <p className="text-[12px] text-muted-foreground mb-12">
        Nous sommes là pour vous aider
      </p>

      <div className="space-y-10 text-[14px] leading-relaxed text-foreground/80">
        <section>
          <h2 className="text-[16px] font-medium text-foreground mb-3">
            Nous écrire
          </h2>
          <p>
            Pour toute question concernant votre commande, votre boutique vendeur
            ou le fonctionnement de la plateforme, n&apos;hésitez pas à nous contacter.
          </p>
          <div className="mt-4 p-5 border border-border/60 rounded-xl space-y-3">
            <div>
              <p className="text-[11px] tracking-wider text-muted-foreground uppercase mb-1">Email</p>
              <a href="mailto:contact@yddishmarket.com" className="text-[14px] text-accent hover:underline">
                contact@yddishmarket.com
              </a>
            </div>
            <div>
              <p className="text-[11px] tracking-wider text-muted-foreground uppercase mb-1">Site web</p>
              <p className="text-[14px] text-foreground">www.yddishmarket.com</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-[16px] font-medium text-foreground mb-3">
            Délai de réponse
          </h2>
          <p>
            Nous nous efforçons de répondre à toutes les demandes sous
            <strong> 24 à 48 heures</strong> ouvrées. Pour les questions
            urgentes liées à une commande en cours, merci de préciser votre
            numéro de commande dans votre message.
          </p>
        </section>

        <section>
          <h2 className="text-[16px] font-medium text-foreground mb-3">
            Questions fréquentes
          </h2>
          <p>
            Avant de nous contacter, consultez notre{" "}
            <Link href="/help" className="text-accent hover:underline">
              centre d&apos;aide
            </Link>{" "}
            qui contient les réponses aux questions les plus courantes sur les
            commandes, la livraison et les retours.
          </p>
        </section>

        <section className="border-t border-border pt-8">
          <h2 className="text-[16px] font-medium text-foreground mb-3">
            Informations légales
          </h2>
          <div className="text-[13px] text-muted-foreground space-y-1">
            <p>EINSOF SAS</p>
            <p>contact@yddishmarket.com</p>
            <p>www.yddishmarket.com</p>
          </div>
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

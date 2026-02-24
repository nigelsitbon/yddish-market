import Link from "next/link";

export const metadata = {
  title: "Livraison & Retours — YDDISH MARKET",
  description: "Informations sur la livraison, les délais et la politique de retours de YDDISH MARKET.",
};

export default function ShippingPage() {
  return (
    <div className="mx-auto max-w-[800px] px-4 sm:px-8 lg:px-12 py-12 lg:py-20">
      <h1 className="text-[28px] font-light text-foreground mb-2">
        Livraison & Retours
      </h1>
      <p className="text-[12px] text-muted-foreground mb-12">
        Tout savoir sur l&apos;expédition et les retours
      </p>

      <div className="space-y-10 text-[14px] leading-relaxed text-foreground/80">
        <section>
          <h2 className="text-[16px] font-medium text-foreground mb-3">
            Livraison
          </h2>
          <p>
            YDDISH MARKET est une marketplace multi-vendeurs. Chaque artisan
            gère ses propres expéditions, ce qui signifie que les frais et
            délais peuvent varier d&apos;un vendeur à l&apos;autre.
          </p>
        </section>

        <section>
          <h2 className="text-[16px] font-medium text-foreground mb-3">
            Tarifs indicatifs
          </h2>
          <div className="border border-border/60 rounded-xl overflow-hidden">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left px-4 py-3 text-[11px] tracking-wider text-muted-foreground uppercase font-medium">Destination</th>
                  <th className="text-left px-4 py-3 text-[11px] tracking-wider text-muted-foreground uppercase font-medium">Tarif indicatif</th>
                  <th className="text-left px-4 py-3 text-[11px] tracking-wider text-muted-foreground uppercase font-medium">Délai estimé</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                <tr>
                  <td className="px-4 py-3 text-foreground">France métropolitaine</td>
                  <td className="px-4 py-3 text-muted-foreground">À partir de 6,90 €</td>
                  <td className="px-4 py-3 text-muted-foreground">2 - 5 jours ouvrés</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-foreground">Union Européenne</td>
                  <td className="px-4 py-3 text-muted-foreground">À partir de 12,90 €</td>
                  <td className="px-4 py-3 text-muted-foreground">5 - 10 jours ouvrés</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-foreground">International</td>
                  <td className="px-4 py-3 text-muted-foreground">À partir de 24,90 €</td>
                  <td className="px-4 py-3 text-muted-foreground">7 - 15 jours ouvrés</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-[12px] text-muted-foreground mt-3">
            * Les tarifs exacts sont affichés au moment du paiement. Certains vendeurs
            proposent la livraison gratuite à partir d&apos;un certain montant.
          </p>
        </section>

        <section>
          <h2 className="text-[16px] font-medium text-foreground mb-3">
            Suivi de commande
          </h2>
          <p>
            Une fois votre commande expédiée, vous recevrez un email contenant
            le numéro de suivi et un lien vers le site du transporteur. Vous
            pouvez également suivre vos commandes depuis votre espace client.
          </p>
        </section>

        <section>
          <h2 className="text-[16px] font-medium text-foreground mb-3">
            Politique de retours
          </h2>
          <p>
            Conformément à la législation française, vous disposez d&apos;un
            délai de <strong>14 jours calendaires</strong> à compter de la
            réception de votre commande pour exercer votre droit de
            rétractation.
          </p>
          <div className="mt-4 space-y-3">
            <div className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-foreground mt-2 shrink-0" />
              <span>Le produit doit être retourné dans son état d&apos;origine, complet et non utilisé.</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-foreground mt-2 shrink-0" />
              <span>Les frais de retour sont à la charge de l&apos;acheteur, sauf produit défectueux.</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-foreground mt-2 shrink-0" />
              <span>Le remboursement est effectué sous 14 jours après réception du retour.</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-foreground mt-2 shrink-0" />
              <span>Contactez le vendeur via la plateforme pour organiser le retour.</span>
            </div>
          </div>
        </section>

        <section className="bg-accent/5 border border-accent/15 rounded-2xl p-5">
          <p className="text-[13px] text-foreground">
            <strong>Besoin d&apos;aide ?</strong> Contactez-nous à{" "}
            <a href="mailto:contact@yddishmarket.com" className="text-accent hover:underline">
              contact@yddishmarket.com
            </a>{" "}
            ou consultez notre{" "}
            <Link href="/help" className="text-accent hover:underline">
              centre d&apos;aide
            </Link>.
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

export type Carrier = {
  id: string;
  name: string;
  urlTemplate: string | null;
};

export const CARRIERS: Carrier[] = [
  { id: "colissimo", name: "Colissimo", urlTemplate: "https://www.laposte.fr/outils/suivre-vos-envois?code={tracking}" },
  { id: "chronopost", name: "Chronopost", urlTemplate: "https://www.chronopost.fr/tracking-no-cms/suivi-page?listeNumerosLT={tracking}" },
  { id: "mondial-relay", name: "Mondial Relay", urlTemplate: "https://www.mondialrelay.fr/suivi-de-colis?numeroExpedition={tracking}" },
  { id: "dhl", name: "DHL", urlTemplate: "https://www.dhl.com/fr-fr/home/tracking.html?tracking-id={tracking}" },
  { id: "ups", name: "UPS", urlTemplate: "https://www.ups.com/track?tracknum={tracking}" },
  { id: "fedex", name: "FedEx", urlTemplate: "https://www.fedex.com/fedextrack/?trknbr={tracking}" },
  { id: "gls", name: "GLS", urlTemplate: "https://gls-group.com/FR/fr/suivi-colis?match={tracking}" },
  { id: "dpd", name: "DPD", urlTemplate: "https://trace.dpd.fr/fr/trace/{tracking}" },
  { id: "israel-post", name: "Israel Post", urlTemplate: "https://israelpost.co.il/itemtrace.nsf/maaboralieng?openagent&ItemCode={tracking}" },
  { id: "other", name: "Autre", urlTemplate: null },
];

export function getTrackingUrl(carrierId: string, trackingNumber: string): string | null {
  const carrier = CARRIERS.find((c) => c.id === carrierId);
  if (!carrier?.urlTemplate) return null;
  return carrier.urlTemplate.replace("{tracking}", encodeURIComponent(trackingNumber));
}

export function getCarrierName(carrierId: string): string | null {
  return CARRIERS.find((c) => c.id === carrierId)?.name ?? null;
}

/**
 * Calcul des frais de livraison par vendeur
 */

export type ShippingConfig = {
  shippingDomestic: number;
  shippingEU: number;
  shippingInternational: number;
  freeShippingThreshold: number | null;
  shipsFrom: string;
};

const EU_COUNTRIES = [
  "FR", "DE", "IT", "ES", "BE", "NL", "LU", "AT", "PT", "IE",
  "FI", "SE", "DK", "PL", "CZ", "SK", "HU", "RO", "BG", "HR",
  "SI", "EE", "LV", "LT", "MT", "CY", "GR",
];

/**
 * Calcule les frais de livraison d'un vendeur vers un pays donné.
 * - Gratuit si le sous-total vendeur dépasse le seuil de livraison gratuite
 * - Tarif domestique si même pays que le vendeur
 * - Tarif EU si pays dans l'UE
 * - Tarif international sinon
 */
export function calculateSellerShipping(
  config: ShippingConfig,
  destinationCountry: string,
  sellerSubtotal: number,
): number {
  // Check free shipping threshold
  if (
    config.freeShippingThreshold !== null &&
    sellerSubtotal >= config.freeShippingThreshold
  ) {
    return 0;
  }

  // Same country as seller → domestic rate
  if (destinationCountry.toUpperCase() === config.shipsFrom.toUpperCase()) {
    return config.shippingDomestic;
  }

  // EU country → EU rate
  if (EU_COUNTRIES.includes(destinationCountry.toUpperCase())) {
    return config.shippingEU;
  }

  // International
  return config.shippingInternational;
}

/** Liste des pays pour les selects UI */
export const COUNTRY_OPTIONS = [
  { value: "FR", label: "France" },
  { value: "BE", label: "Belgique" },
  { value: "CH", label: "Suisse" },
  { value: "LU", label: "Luxembourg" },
  { value: "IL", label: "Israël" },
  { value: "DE", label: "Allemagne" },
  { value: "IT", label: "Italie" },
  { value: "ES", label: "Espagne" },
  { value: "NL", label: "Pays-Bas" },
  { value: "GB", label: "Royaume-Uni" },
  { value: "US", label: "États-Unis" },
  { value: "CA", label: "Canada" },
] as const;

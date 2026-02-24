import { CheckoutForm } from "@/components/storefront/checkout-form";

export const metadata = {
  title: "Commande",
  description: "Finalisez votre commande sur YDDISH MARKET. Paiement sécurisé par Stripe.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function CheckoutPage() {
  return <CheckoutForm />;
}

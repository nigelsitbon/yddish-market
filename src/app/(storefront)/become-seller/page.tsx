import { BecomeSellerForm } from "@/components/storefront/become-seller-form";

export const metadata = {
  title: "Devenir vendeur",
  description:
    "Rejoignez YDDISH MARKET et vendez vos créations Judaica à des milliers d'acheteurs. Commission de 20%, paiement sécurisé via Stripe Connect.",
  alternates: { canonical: "/become-seller" },
};

export const dynamic = "force-dynamic";

export default function BecomeSellerPage() {
  return <BecomeSellerForm />;
}

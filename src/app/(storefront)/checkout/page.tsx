import { CheckoutForm } from "@/components/storefront/checkout-form";

export const metadata = {
  title: "Commande",
};

export const dynamic = "force-dynamic";

export default function CheckoutPage() {
  return <CheckoutForm />;
}

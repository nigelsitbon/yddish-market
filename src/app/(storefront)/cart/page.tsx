import { CartPageContent } from "@/components/storefront/cart-page-content";

export const metadata = {
  title: "Panier",
  description: "Consultez votre panier YDDISH MARKET et finalisez votre commande d'objets Judaica.",
  robots: { index: false, follow: false },
};

export default function CartPage() {
  return <CartPageContent />;
}

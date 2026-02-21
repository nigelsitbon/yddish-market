import { BecomeSellerForm } from "@/components/storefront/become-seller-form";

export const metadata = {
  title: "Devenir vendeur",
};

export const dynamic = "force-dynamic";

export default function BecomeSellerPage() {
  return <BecomeSellerForm />;
}

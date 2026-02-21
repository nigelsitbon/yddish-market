import { ProductForm } from "@/components/dashboard/product-form";

export const metadata = { title: "Nouveau produit" };
export const dynamic = "force-dynamic";

export default function NewProductPage() {
  return <ProductForm />;
}

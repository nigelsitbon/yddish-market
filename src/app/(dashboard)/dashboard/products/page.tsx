import { ProductsList } from "@/components/dashboard/products-list";

export const metadata = { title: "Mes produits" };
export const dynamic = "force-dynamic";

export default function ProductsPage() {
  return <ProductsList />;
}

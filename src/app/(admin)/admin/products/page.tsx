import { AdminProducts } from "@/components/admin/admin-products";

export const dynamic = "force-dynamic";
export const metadata = { title: "Produits — Admin" };

export default function ProductsPage() {
  return <AdminProducts />;
}

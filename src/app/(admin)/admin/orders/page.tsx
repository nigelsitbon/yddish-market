import { AdminOrders } from "@/components/admin/admin-orders";

export const dynamic = "force-dynamic";
export const metadata = { title: "Commandes — Admin" };

export default function OrdersPage() {
  return <AdminOrders />;
}

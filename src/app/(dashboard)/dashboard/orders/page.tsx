import { OrdersList } from "@/components/dashboard/orders-list";

export const metadata = { title: "Mes commandes" };
export const dynamic = "force-dynamic";

export default function OrdersPage() {
  return <OrdersList />;
}

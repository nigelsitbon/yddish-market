import { AdminUsers } from "@/components/admin/admin-users";

export const dynamic = "force-dynamic";
export const metadata = { title: "Utilisateurs — Admin" };

export default function UsersPage() {
  return <AdminUsers />;
}

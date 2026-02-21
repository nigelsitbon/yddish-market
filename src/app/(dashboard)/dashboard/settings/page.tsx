import { SettingsForm } from "@/components/dashboard/settings-form";

export const metadata = { title: "Paramètres boutique" };
export const dynamic = "force-dynamic";

export default function SettingsPage() {
  return <SettingsForm />;
}

import type { Metadata } from "next";
import { Wallet } from "lucide-react";
import { PlaceholderPage } from "@/components/layout/PlaceholderPage";

export const metadata: Metadata = { title: "Presupuestos" };

export default function PresupuestosPage() {
  return (
    <PlaceholderPage
      title="Presupuestos"
      subtitle="Presupuestos por obra"
      icon={Wallet}
    />
  );
}

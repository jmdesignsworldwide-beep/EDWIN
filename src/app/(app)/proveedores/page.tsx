import type { Metadata } from "next";
import { Truck } from "lucide-react";
import { PlaceholderPage } from "@/components/layout/PlaceholderPage";

export const metadata: Metadata = { title: "Proveedores" };

export default function ProveedoresPage() {
  return (
    <PlaceholderPage
      title="Proveedores"
      subtitle="Directorio de proveedores"
      icon={Truck}
    />
  );
}

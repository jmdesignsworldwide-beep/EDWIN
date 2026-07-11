import type { Metadata } from "next";
import { UserSquare2 } from "lucide-react";
import { PlaceholderPage } from "@/components/layout/PlaceholderPage";

export const metadata: Metadata = { title: "Clientes" };

export default function ClientesPage() {
  return (
    <PlaceholderPage
      title="Clientes"
      subtitle="Directorio de clientes"
      icon={UserSquare2}
    />
  );
}

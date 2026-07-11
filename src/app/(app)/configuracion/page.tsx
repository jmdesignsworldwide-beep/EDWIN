import type { Metadata } from "next";
import { Settings } from "lucide-react";
import { PlaceholderPage } from "@/components/layout/PlaceholderPage";

export const metadata: Metadata = { title: "Configuración" };

export default function ConfiguracinPage() {
  return (
    <PlaceholderPage
      title="Configuración"
      subtitle="Ajustes del sistema"
      icon={Settings}
    />
  );
}

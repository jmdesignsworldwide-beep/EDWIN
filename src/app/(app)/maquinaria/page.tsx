import type { Metadata } from "next";
import { Wrench } from "lucide-react";
import { PlaceholderPage } from "@/components/layout/PlaceholderPage";

export const metadata: Metadata = { title: "Maquinaria" };

export default function MaquinariaPage() {
  return (
    <PlaceholderPage
      title="Maquinaria"
      subtitle="Equipos y maquinaria"
      icon={Wrench}
    />
  );
}

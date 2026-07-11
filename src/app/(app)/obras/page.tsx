import type { Metadata } from "next";
import { HardHat } from "lucide-react";
import { PlaceholderPage } from "@/components/layout/PlaceholderPage";

export const metadata: Metadata = { title: "Obras" };

export default function ObrasPage() {
  return (
    <PlaceholderPage
      title="Obras"
      subtitle="Proyectos y obras en ejecución"
      icon={HardHat}
    />
  );
}

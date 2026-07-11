import type { Metadata } from "next";
import { BarChart3 } from "lucide-react";
import { PlaceholderPage } from "@/components/layout/PlaceholderPage";

export const metadata: Metadata = { title: "Reportes" };

export default function ReportesPage() {
  return (
    <PlaceholderPage
      title="Reportes"
      subtitle="Reportes y análisis"
      icon={BarChart3}
    />
  );
}

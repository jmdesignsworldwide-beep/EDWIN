import type { Metadata } from "next";
import { FileText } from "lucide-react";
import { PlaceholderPage } from "@/components/layout/PlaceholderPage";

export const metadata: Metadata = { title: "Documentos" };

export default function DocumentosPage() {
  return (
    <PlaceholderPage
      title="Documentos"
      subtitle="Planos y documentación"
      icon={FileText}
    />
  );
}

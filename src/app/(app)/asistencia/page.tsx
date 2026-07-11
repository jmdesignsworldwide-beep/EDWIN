import type { Metadata } from "next";
import { ClipboardCheck } from "lucide-react";
import { PlaceholderPage } from "@/components/layout/PlaceholderPage";

export const metadata: Metadata = { title: "Asistencia" };

export default function AsistenciaPage() {
  return (
    <PlaceholderPage
      title="Asistencia"
      subtitle="Registro de asistencia"
      icon={ClipboardCheck}
    />
  );
}

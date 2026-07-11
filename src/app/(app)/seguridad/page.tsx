import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { PlaceholderPage } from "@/components/layout/PlaceholderPage";

export const metadata: Metadata = { title: "Seguridad" };

export default function SeguridadPage() {
  return (
    <PlaceholderPage
      title="Seguridad"
      subtitle="Seguridad en obra"
      icon={ShieldCheck}
    />
  );
}

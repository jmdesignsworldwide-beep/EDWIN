import type { Metadata } from "next";
import { Camera } from "lucide-react";
import { PlaceholderPage } from "@/components/layout/PlaceholderPage";

export const metadata: Metadata = { title: "Avances" };

export default function AvancesPage() {
  return (
    <PlaceholderPage
      title="Avances"
      subtitle="Avances fotográficos"
      icon={Camera}
    />
  );
}

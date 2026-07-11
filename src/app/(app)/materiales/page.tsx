import type { Metadata } from "next";
import { Boxes } from "lucide-react";
import { PlaceholderPage } from "@/components/layout/PlaceholderPage";

export const metadata: Metadata = { title: "Materiales" };

export default function MaterialesPage() {
  return (
    <PlaceholderPage
      title="Materiales"
      subtitle="Inventario de materiales"
      icon={Boxes}
    />
  );
}

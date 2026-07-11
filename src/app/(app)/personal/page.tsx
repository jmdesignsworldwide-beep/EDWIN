import type { Metadata } from "next";
import { Users } from "lucide-react";
import { PlaceholderPage } from "@/components/layout/PlaceholderPage";

export const metadata: Metadata = { title: "Personal" };

export default function PersonalPage() {
  return (
    <PlaceholderPage
      title="Personal"
      subtitle="Personal y cuadrillas"
      icon={Users}
    />
  );
}

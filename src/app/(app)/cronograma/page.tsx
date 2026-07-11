import type { Metadata } from "next";
import { CalendarRange } from "lucide-react";
import { PlaceholderPage } from "@/components/layout/PlaceholderPage";

export const metadata: Metadata = { title: "Cronograma" };

export default function CronogramaPage() {
  return (
    <PlaceholderPage
      title="Cronograma"
      subtitle="Planificación y cronogramas"
      icon={CalendarRange}
    />
  );
}

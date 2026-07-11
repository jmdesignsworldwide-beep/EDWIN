import type { Metadata } from "next";
import { Bell } from "lucide-react";
import { PlaceholderPage } from "@/components/layout/PlaceholderPage";

export const metadata: Metadata = { title: "Notificaciones" };

export default function NotificacionesPage() {
  return (
    <PlaceholderPage
      title="Notificaciones"
      subtitle="Centro de notificaciones"
      icon={Bell}
    />
  );
}

import type { Metadata } from "next";
import { getNotificaciones } from "./actions";
import { NotificacionesView } from "./NotificacionesView";

export const metadata: Metadata = { title: "Notificaciones" };

export const dynamic = "force-dynamic";

export default async function NotificacionesPage() {
  const { items } = await getNotificaciones();
  return <NotificacionesView items={items} />;
}

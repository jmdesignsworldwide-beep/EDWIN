import type { Metadata } from "next";
import { listPendientes } from "./actions";
import { getNotificaciones } from "../notificaciones/actions";
import { listObrasResumen } from "../obras/actions";
import { PendientesView } from "./PendientesView";

export const metadata: Metadata = { title: "Pendientes" };

export const dynamic = "force-dynamic";

export default async function PendientesPage() {
  const [pendientes, { items }, obras] = await Promise.all([
    listPendientes(),
    getNotificaciones(),
    listObrasResumen(),
  ]);
  return <PendientesView pendientes={pendientes} sistema={items} obras={obras} />;
}

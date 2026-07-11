import type { Metadata } from "next";
import { listProyectos } from "./actions";
import { listClientes } from "./clientes-actions";
import { ObrasView } from "./ObrasView";

export const metadata: Metadata = { title: "Obras" };

// Datos en vivo desde Supabase (usa cookies + service_role): sin prerender.
export const dynamic = "force-dynamic";

export default async function ObrasPage() {
  const [{ proyectos, configured, error }, { clientes }] = await Promise.all([
    listProyectos(),
    listClientes(),
  ]);
  return (
    <ObrasView
      proyectos={proyectos}
      clientes={clientes}
      configured={configured}
      loadError={error}
    />
  );
}

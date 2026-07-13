import type { Metadata } from "next";
import { listProyectos } from "./actions";
import { listClientes } from "./clientes-actions";
import { listPersonal } from "../personal/actions";
import { ObrasView } from "./ObrasView";

export const metadata: Metadata = { title: "Obras" };

// Datos en vivo desde Supabase (usa cookies + service_role): sin prerender.
export const dynamic = "force-dynamic";

export default async function ObrasPage() {
  const [{ proyectos, configured, error }, { clientes }, { personal }] = await Promise.all([
    listProyectos(),
    listClientes(),
    listPersonal(),
  ]);
  return (
    <ObrasView
      proyectos={proyectos}
      clientes={clientes}
      personal={personal.map((p) => ({ id: p.id, nombre: p.nombre }))}
      configured={configured}
      loadError={error}
    />
  );
}

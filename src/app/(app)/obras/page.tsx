import type { Metadata } from "next";
import { listProyectos } from "./actions";
import { ObrasView } from "./ObrasView";

export const metadata: Metadata = { title: "Obras" };

// Datos en vivo desde Supabase (usa cookies + service_role): sin prerender.
export const dynamic = "force-dynamic";

export default async function ObrasPage() {
  const { proyectos, configured, error } = await listProyectos();
  return (
    <ObrasView proyectos={proyectos} configured={configured} loadError={error} />
  );
}

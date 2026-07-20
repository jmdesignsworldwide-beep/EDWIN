import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { listAuditoria, type AuditoriaFiltros } from "./actions";
import { ActividadView } from "./ActividadView";
import type { AccionAuditoria } from "@/lib/proyectos/types";

export const metadata: Metadata = { title: "Actividad" };

export const dynamic = "force-dynamic";

export default async function ActividadPage({
  searchParams,
}: {
  searchParams?: Record<string, string | undefined>;
}) {
  const user = await getSessionUser();
  if (user?.rol !== "admin") notFound();

  const filtros: AuditoriaFiltros = {
    accion: (searchParams?.accion as AccionAuditoria | undefined) || "",
    entidad_tipo: searchParams?.tipo || "",
    usuario_id: searchParams?.usuario || "",
    desde: searchParams?.desde || "",
    hasta: searchParams?.hasta || "",
    q: searchParams?.q || "",
    page: searchParams?.page ? Math.max(0, Number(searchParams.page) || 0) : 0,
  };
  const data = await listAuditoria(filtros);
  return <ActividadView data={data} filtros={filtros} />;
}

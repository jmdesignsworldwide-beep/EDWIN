import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getProyecto } from "../actions";
import { getFinancieroObra } from "../financiero-actions";
import { listClientes } from "../clientes-actions";
import { listProveedores } from "../../proveedores/actions";
import { listPersonal } from "../../personal/actions";
import { ObraWorkspace } from "./ObraWorkspace";

export const metadata: Metadata = { title: "Obra" };

export const dynamic = "force-dynamic";

export default async function ObraDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { vista?: string };
}) {
  const [proyecto, { proveedores }, { personal }, { clientes }, financiero] = await Promise.all([
    getProyecto(params.id),
    listProveedores(),
    listPersonal(),
    listClientes(),
    getFinancieroObra(params.id),
  ]);

  if (!proyecto) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <Link
          href="/obras"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-content-muted hover:text-content"
        >
          <ArrowLeft className="h-4 w-4" />
          Obras
        </Link>
        <p className="text-base font-semibold text-content">Obra no encontrada</p>
        <p className="mt-1 text-sm text-content-muted">
          Puede que haya sido eliminada o que falte conectar Supabase.
        </p>
      </div>
    );
  }

  const vista = searchParams?.vista;
  const initialTab =
    vista === "cronograma" ||
    vista === "materiales" ||
    vista === "equipo" ||
    vista === "asistencia"
      ? vista
      : "resumen";
  return (
    <ObraWorkspace
      proyecto={proyecto}
      proveedores={proveedores}
      personal={personal}
      clientes={clientes}
      financiero={financiero}
      initialTab={initialTab}
    />
  );
}

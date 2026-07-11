import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getProyecto } from "../actions";
import { EtapasWorkspace } from "./EtapasWorkspace";

export const metadata: Metadata = { title: "Cronograma" };

export const dynamic = "force-dynamic";

export default async function ObraCronogramaPage({
  params,
}: {
  params: { id: string };
}) {
  const proyecto = await getProyecto(params.id);

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

  return <EtapasWorkspace proyecto={proyecto} />;
}

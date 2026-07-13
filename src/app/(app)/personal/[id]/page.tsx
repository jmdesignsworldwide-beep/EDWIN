import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getPersona } from "../actions";
import { listObrasResumen } from "../../obras/actions";
import { listPagos } from "../pagos-actions";
import { listNotas } from "../notas-actions";
import { PersonaWorkspace } from "./PersonaWorkspace";

export const metadata: Metadata = { title: "Empleado" };

export const dynamic = "force-dynamic";

export default async function PersonaExpedientePage({
  params,
}: {
  params: { id: string };
}) {
  const [persona, obras, pagos, notas] = await Promise.all([
    getPersona(params.id),
    listObrasResumen(),
    listPagos(params.id),
    listNotas(params.id),
  ]);

  if (!persona) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <Link href="/personal" className="mb-4 inline-flex items-center gap-1.5 text-sm text-content-muted hover:text-content">
          <ArrowLeft className="h-4 w-4" />
          Personal
        </Link>
        <p className="text-base font-semibold text-content">Persona no encontrada</p>
        <p className="mt-1 text-sm text-content-muted">Puede que haya sido eliminada o que falte conectar Supabase.</p>
      </div>
    );
  }

  return <PersonaWorkspace persona={persona} obras={obras} pagos={pagos} notas={notas} />;
}

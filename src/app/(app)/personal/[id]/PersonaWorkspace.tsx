"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  IdCard,
  HandCoins,
  NotebookPen,
  Wallet,
  AlertTriangle,
} from "lucide-react";
import { Reveal, CountUp } from "@/components/primitives";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PersonaForm } from "@/components/personal/PersonaForm";
import { PersonaDetail } from "@/components/personal/PersonaDetail";
import { deletePersona } from "../actions";
import { PagosTab } from "./PagosTab";
import { NotasTab } from "./NotasTab";
import {
  totalEntregado,
  adelantosPendientes,
  type NotaEmpleado,
  type PagoEmpleado,
  type Persona,
} from "@/lib/proyectos/types";
import { formatCurrency, cn } from "@/lib/utils";

type Tab = "resumen" | "pagos" | "notas";

export function PersonaWorkspace({
  persona,
  obras,
  pagos,
  notas,
}: {
  persona: Persona;
  obras: { id: string; nombre: string }[];
  pagos: PagoEmpleado[];
  notas: NotaEmpleado[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("resumen");
  const [editing, setEditing] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const total = totalEntregado(pagos);
  const pendiente = adelantosPendientes(pagos);

  async function doDelete() {
    setDeleting(true);
    const res = await deletePersona(persona.id);
    setDeleting(false);
    if (res.ok) router.push("/personal");
  }

  return (
    <>
      {/* Encabezado */}
      <div className="mb-6">
        <Link href="/personal" className="mb-3 inline-flex items-center gap-1.5 text-sm text-content-muted transition-colors hover:text-content">
          <ArrowLeft className="h-4 w-4" />
          Personal
        </Link>
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="truncate text-xl font-bold tracking-tight text-content sm:text-2xl">{persona.nombre}</h1>
          <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset", persona.activo ? "bg-emerald-500/12 text-emerald-700 ring-emerald-500/25 dark:text-emerald-300" : "bg-slate-500/12 text-slate-600 ring-slate-500/25 dark:text-slate-300")}>
            {persona.activo ? "Activo" : "Inactivo"}
          </span>
        </div>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-content-muted">
          <IdCard className="h-3.5 w-3.5 text-content-subtle" />
          {persona.oficio || "Sin oficio"}
        </p>
      </div>

      {/* KPIs de dinero */}
      <div className="mb-5 grid grid-cols-2 gap-4">
        <div className="rounded-2xl border border-line bg-surface/50 p-4 shadow-card">
          <p className="flex items-center gap-1.5 text-xs text-content-subtle">
            <Wallet className="h-3.5 w-3.5" />
            Total entregado
          </p>
          <p className="mt-1 text-lg font-bold tabular-nums text-content sm:text-xl">
            <CountUp value={total} duration={0.8} format={formatCurrency} />
          </p>
        </div>
        <div className={cn("rounded-2xl border p-4 shadow-card", pendiente > 0 ? "border-amber-500/30 bg-amber-500/[0.06]" : "border-line bg-surface/50")}>
          <p className="flex items-center gap-1.5 text-xs text-content-subtle">
            <AlertTriangle className="h-3.5 w-3.5" />
            Adelantos pendientes
          </p>
          <p className={cn("mt-1 text-lg font-bold tabular-nums sm:text-xl", pendiente > 0 ? "text-amber-700 dark:text-amber-300" : "text-content")}>
            <CountUp value={pendiente} duration={0.8} format={formatCurrency} />
          </p>
        </div>
      </div>

      {/* Pestañas */}
      <div className="mb-5 -mx-1 overflow-x-auto px-1 pb-1">
        <div className="inline-flex min-w-max gap-1 rounded-xl border border-line bg-surface/60 p-1">
          <TabBtn active={tab === "resumen"} onClick={() => setTab("resumen")} icon={IdCard}>Datos y obras</TabBtn>
          <TabBtn active={tab === "pagos"} onClick={() => setTab("pagos")} icon={HandCoins} count={pagos.length}>Pagos y adelantos</TabBtn>
          <TabBtn active={tab === "notas"} onClick={() => setTab("notas")} icon={NotebookPen} count={notas.length}>Notas</TabBtn>
        </div>
      </div>

      {tab === "resumen" ? (
        <Reveal standalone>
          <div className="rounded-2xl border border-line bg-surface/50 p-5 shadow-card">
            <PersonaDetail
              persona={persona}
              obras={obras}
              onEdit={() => setEditing(true)}
              onDelete={() => setConfirmDel(true)}
            />
          </div>
        </Reveal>
      ) : tab === "pagos" ? (
        <PagosTab personaId={persona.id} pagos={pagos} />
      ) : (
        <NotasTab personaId={persona.id} notas={notas} />
      )}

      <Modal open={editing} onClose={() => setEditing(false)} title="Editar persona" subtitle={persona.nombre}>
        <PersonaForm persona={persona} onSaved={() => { setEditing(false); router.refresh(); }} onCancel={() => setEditing(false)} />
      </Modal>

      <ConfirmDialog
        open={confirmDel}
        title="Eliminar persona"
        description={`Se eliminará a "${persona.nombre}", sus asignaciones, pagos y notas de forma permanente.`}
        loading={deleting}
        onConfirm={doDelete}
        onCancel={() => setConfirmDel(false)}
      />
    </>
  );
}

function TabBtn({
  active,
  onClick,
  icon: Icon,
  count,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof IdCard;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
        active ? "bg-brand-gradient text-brand-ink shadow-glow" : "text-content-muted hover:text-content",
      )}
    >
      <Icon className="h-4 w-4" />
      {children}
      {count != null && count > 0 && (
        <span className={cn("inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-bold", active ? "bg-brand-ink/15 text-brand-ink" : "bg-surface-2 text-content-muted")}>
          {count}
        </span>
      )}
    </button>
  );
}

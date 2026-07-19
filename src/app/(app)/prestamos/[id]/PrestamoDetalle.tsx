"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpCircle,
  ArrowDownCircle,
  HardHat,
  Ban,
  Trash2,
  Loader2,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { CountUp } from "@/components/primitives";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { marcarCuota, anularPrestamo, deletePrestamo } from "../actions";
import {
  PRESTAMO_ESTADO_BADGE,
  interesSimple,
  totalPrestamo,
  type Prestamo,
} from "@/lib/proyectos/types";
import { formatMoney, cn } from "@/lib/utils";

function fmtFecha(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("es-DO", { day: "2-digit", month: "short", year: "numeric" });
}

export function PrestamoDetalle({ prestamo }: { prestamo: Prestamo }) {
  const router = useRouter();
  const cuotas = prestamo.cuotas ?? [];
  const total = totalPrestamo(prestamo.capital, prestamo.tasa);
  const interes = interesSimple(prestamo.capital, prestamo.tasa);
  const pagado = cuotas.filter((c) => c.pagada).reduce((a, c) => a + c.monto, 0);
  const pendiente = cuotas.filter((c) => !c.pagada).reduce((a, c) => a + c.monto, 0);
  const est = PRESTAMO_ESTADO_BADGE[prestamo.estado];
  const anulado = prestamo.estado === "anulado";

  const [busyId, setBusyId] = useState<string | null>(null);
  const [anularOpen, setAnularOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [busy, start] = useTransition();

  function toggle(cuotaId: string, pagada: boolean) {
    setBusyId(cuotaId);
    start(async () => {
      await marcarCuota(cuotaId, prestamo.id, pagada);
      setBusyId(null);
      router.refresh();
    });
  }
  function doAnular() { start(async () => { await anularPrestamo(prestamo.id); setAnularOpen(false); router.refresh(); }); }
  function doDelete() { start(async () => { const r = await deletePrestamo(prestamo.id); if (r.ok) router.push("/prestamos"); }); }

  return (
    <>
      <div className="mb-2">
        <Link href="/prestamos" className="inline-flex items-center gap-1.5 text-sm font-medium text-content-muted transition-colors hover:text-content">
          <ArrowLeft className="h-4 w-4" />Préstamos
        </Link>
      </div>

      <PageHeader
        title={prestamo.contraparte}
        subtitle={prestamo.tipo === "por_pagar" ? "Por pagar · dinero que pediste" : "Por cobrar · dinero que diste"}
        action={<span className={cn("rounded-full px-3 py-1.5 text-sm font-semibold", est.badge)}>{est.label}</span>}
      />

      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-semibold">
        <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5", prestamo.tipo === "por_pagar" ? "bg-rose-500/12 text-rose-700 dark:text-rose-300" : "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300")}>
          {prestamo.tipo === "por_pagar" ? <ArrowUpCircle className="h-3.5 w-3.5" /> : <ArrowDownCircle className="h-3.5 w-3.5" />}
          {prestamo.tipo === "por_pagar" ? "Por pagar" : "Por cobrar"}
        </span>
        {prestamo.obra && (
          <Link href={`/obras/${prestamo.obra.id}`} className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2 py-0.5 text-content-muted hover:text-brand">
            <HardHat className="h-3.5 w-3.5" />{prestamo.obra.nombre}
          </Link>
        )}
      </div>

      {/* Resumen */}
      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Stat label="Capital" value={prestamo.capital} />
        <Stat label={`Interés (${prestamo.tasa}%)`} value={interes} />
        <Stat label="Total" value={total} strong />
        <Stat label="Pagado" value={pagado} tone="pos" />
        <Stat label="Pendiente" value={pendiente} tone={pendiente > 0 ? "brand" : "pos"} />
      </div>

      {/* Cuotas */}
      <div className="overflow-hidden rounded-2xl border border-line bg-surface/50 shadow-card">
        <div className="hidden grid-cols-[auto_1fr_1fr_auto] gap-2 border-b border-line bg-surface-2/40 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-content-subtle sm:grid">
          <span>#</span><span>Vence</span><span className="text-right">Monto</span><span className="text-right">Estado</span>
        </div>
        <ul className="divide-y divide-line">
          {cuotas.map((c) => {
            const vencida = !c.pagada && new Date(c.vence + "T00:00:00") < new Date(new Date().toDateString());
            return (
              <li key={c.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-1 px-4 py-3 sm:grid-cols-[auto_1fr_1fr_auto]">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-surface-2 text-xs font-bold text-content-muted">{c.numero}</span>
                <span className="text-sm text-content">
                  {fmtFecha(c.vence)}
                  {vencida && <span className="ml-2 rounded-full bg-rose-500/15 px-1.5 py-0.5 text-[10px] font-bold text-rose-700 dark:text-rose-300">vencida</span>}
                  {c.pagada && c.fecha_pago && <span className="ml-2 text-[11px] text-content-subtle">pagada {fmtFecha(c.fecha_pago)}</span>}
                </span>
                <span className="text-right text-sm font-semibold tabular-nums text-content sm:col-auto col-start-2">{formatMoney(c.monto)}</span>
                <div className="flex justify-end sm:col-auto col-start-3 row-start-1 sm:row-auto">
                  <button
                    type="button"
                    onClick={() => !anulado && toggle(c.id, !c.pagada)}
                    disabled={anulado || busyId === c.id}
                    className={cn(
                      "inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-semibold ring-1 ring-inset transition-colors disabled:opacity-60",
                      c.pagada ? "bg-emerald-500/12 text-emerald-700 ring-emerald-500/25 dark:text-emerald-300" : "bg-surface-2 text-content-muted ring-line hover:bg-surface-2/70",
                    )}
                  >
                    {busyId === c.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : c.pagada ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
                    {c.pagada ? "Pagada" : "Pendiente"}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {prestamo.notas && <p className="mt-4 whitespace-pre-wrap rounded-xl border border-line bg-surface-2/40 p-3.5 text-sm text-content">{prestamo.notas}</p>}

      {/* Acciones */}
      <div className="mt-6 flex flex-wrap items-center justify-end gap-2.5 border-t border-line pt-5">
        {!anulado && (
          <button type="button" onClick={() => setAnularOpen(true)} className="inline-flex h-11 items-center gap-2 rounded-xl border border-line px-4 text-sm font-semibold text-content-muted transition-colors hover:bg-surface-2 hover:text-content">
            <Ban className="h-4 w-4" />Anular
          </button>
        )}
        <button type="button" onClick={() => setDeleteOpen(true)} className="inline-flex h-11 items-center gap-2 rounded-xl border border-line px-4 text-sm font-semibold text-danger transition-colors hover:bg-danger/10">
          <Trash2 className="h-4 w-4" />Eliminar
        </button>
      </div>

      <ConfirmDialog open={anularOpen} title="Anular préstamo" description="El préstamo quedará anulado (no se borra). ¿Continuar?" confirmLabel="Anular" loading={busy} onConfirm={doAnular} onCancel={() => setAnularOpen(false)} />
      <ConfirmDialog open={deleteOpen} title="Eliminar préstamo" description="Se eliminará el préstamo y todas sus cuotas de forma permanente." confirmLabel="Eliminar" loading={busy} onConfirm={doDelete} onCancel={() => setDeleteOpen(false)} />
    </>
  );
}

function Stat({ label, value, strong, tone }: { label: string; value: number; strong?: boolean; tone?: "pos" | "brand" }) {
  return (
    <div className="rounded-2xl border border-line bg-surface/50 p-4 shadow-card">
      <p className="text-[11px] font-medium text-content-subtle">{label}</p>
      <p className={cn("mt-0.5 tabular-nums", strong ? "text-lg font-bold sm:text-xl" : "text-base font-bold", tone === "pos" ? "text-emerald-700 dark:text-emerald-300" : tone === "brand" ? "text-brand" : "text-content")}>
        <CountUp value={value} duration={0.7} format={formatMoney} />
      </p>
    </div>
  );
}

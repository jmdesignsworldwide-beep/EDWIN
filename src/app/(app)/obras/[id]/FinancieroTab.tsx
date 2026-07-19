"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Loader2,
  Trash2,
  Pencil,
  Package,
  Users,
  ShoppingCart,
  Receipt,
  Wallet,
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import { Reveal, CountUp, Button, EmptyState } from "@/components/primitives";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { SmartSelect } from "@/components/ui/SmartSelect";
import { addGasto, updateGasto, deleteGasto, type FinancieroData } from "../financiero-actions";
import { CATEGORIAS_GASTO, type GastoObra } from "@/lib/proyectos/types";
import { formatCurrency, formatMoney, cn } from "@/lib/utils";

function fmtFecha(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("es-DO", { day: "2-digit", month: "short", year: "numeric" });
}
function todayISO(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

const SEMAFORO = {
  sano: { ring: "ring-emerald-500/30", bg: "bg-emerald-500/[0.06]", text: "text-emerald-700 dark:text-emerald-300", bar: "bg-emerald-500", icon: CheckCircle2, label: "En presupuesto" },
  alerta: { ring: "ring-amber-500/30", bg: "bg-amber-500/[0.06]", text: "text-amber-700 dark:text-amber-300", bar: "bg-amber-500", icon: AlertTriangle, label: "Cerca del límite" },
  excedido: { ring: "ring-rose-500/30", bg: "bg-rose-500/[0.06]", text: "text-rose-700 dark:text-rose-300", bar: "bg-rose-500", icon: XCircle, label: "Presupuesto excedido" },
  sin_presupuesto: { ring: "ring-line", bg: "bg-surface-2/40", text: "text-content-muted", bar: "bg-brand", icon: Wallet, label: "Sin presupuesto definido" },
} as const;

export function FinancieroTab({ obraId, financiero }: { obraId: string; financiero: FinancieroData }) {
  const router = useRouter();
  const { resumen, gastos } = financiero;
  const [form, setForm] = useState<{ type: "closed" } | { type: "create" } | { type: "edit"; gasto: GastoObra }>({ type: "closed" });
  const [toDelete, setToDelete] = useState<GastoObra | null>(null);
  const [deleting, setDeleting] = useState(false);

  const sem = SEMAFORO[resumen.estado];
  const SemIcon = sem.icon;
  const pct = resumen.ejecutado ?? 0;
  const excedido = resumen.estado === "excedido";

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    await deleteGasto(toDelete.id, obraId);
    setDeleting(false);
    setToDelete(null);
    router.refresh();
  }

  return (
    <div className="space-y-5">
      {/* Semáforo: Presupuesto / Gastado / Restante */}
      <Reveal standalone>
        <div className={cn("rounded-2xl border border-line p-5 shadow-card ring-1 ring-inset", sem.ring, sem.bg)}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <span className={cn("inline-flex items-center gap-1.5 text-sm font-semibold", sem.text)}>
              <SemIcon className="h-4 w-4" />
              {sem.label}
            </span>
            {resumen.ejecutado != null && (
              <span className={cn("text-sm font-bold tabular-nums", sem.text)}>{resumen.ejecutado.toFixed(0)}% ejecutado</span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Stat label="Presupuesto" value={resumen.presupuesto} muted />
            <Stat label="Gastado" value={resumen.gastado} strong />
            <Stat label="Restante" value={resumen.restante} tone={excedido ? "danger" : "brand"} />
          </div>

          {resumen.presupuesto != null && resumen.presupuesto > 0 && (
            <div className="mt-4">
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-2">
                <div className={cn("h-full rounded-full transition-all", sem.bar)} style={{ width: `${Math.min(100, pct)}%` }} />
              </div>
            </div>
          )}
        </div>
      </Reveal>

      {/* Desglose por fuente */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Fuente icon={Package} label="Materiales" value={resumen.materiales} />
        <Fuente icon={Users} label="Mano de obra" value={resumen.manoObra} />
        <Fuente icon={ShoppingCart} label="Compras" value={resumen.compras} />
        <Fuente icon={Receipt} label="Gastos varios" value={resumen.gastosManuales} />
      </div>
      <p className="text-center text-xs text-content-subtle">
        Materiales, mano de obra (asistencia × jornal) y compras se calculan solos. Abajo agregas gastos sueltos.
      </p>

      {/* Gastos manuales */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-content">
          <Receipt className="h-4 w-4 text-content-subtle" />
          Gastos varios
          <span className="text-content-subtle/70">· {gastos.length}</span>
        </h3>
        <Button icon={Plus} size="sm" onClick={() => setForm({ type: "create" })}>Agregar gasto</Button>
      </div>

      {gastos.length === 0 ? (
        <div className="rounded-2xl border border-line bg-surface/50 shadow-card">
          <EmptyState
            icon={TrendingDown}
            title="Sin gastos varios"
            description="Registra combustible, transporte, alquiler de equipo u otros gastos sueltos de esta obra."
            actionLabel="Agregar gasto"
            actionIcon={Plus}
            onAction={() => setForm({ type: "create" })}
            size="sm"
          />
        </div>
      ) : (
        <ul className="space-y-2.5">
          {gastos.map((g) => (
            <li key={g.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-surface/50 p-3.5 shadow-card">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-brand/12 px-2 py-0.5 text-[11px] font-semibold text-brand ring-1 ring-inset ring-brand/25">{g.categoria}</span>
                  <span className="text-xs tabular-nums text-content-subtle">{fmtFecha(g.fecha)}</span>
                </div>
                {g.concepto && <p className="mt-1 truncate text-sm text-content">{g.concepto}</p>}
                {g.notas && <p className="truncate text-xs text-content-subtle">{g.notas}</p>}
              </div>
              <span className="text-sm font-bold tabular-nums text-content">{formatMoney(g.monto)}</span>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => setForm({ type: "edit", gasto: g })} aria-label="Editar" className="grid h-8 w-8 place-items-center rounded-lg text-content-subtle transition-colors hover:bg-surface-2 hover:text-content">
                  <Pencil className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => setToDelete(g)} aria-label="Eliminar" className="grid h-8 w-8 place-items-center rounded-lg text-content-subtle transition-colors hover:bg-danger/10 hover:text-danger">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal open={form.type === "create"} onClose={() => setForm({ type: "closed" })} title="Nuevo gasto" subtitle="Gasto suelto de la obra">
        <GastoForm obraId={obraId} onDone={() => { setForm({ type: "closed" }); router.refresh(); }} onCancel={() => setForm({ type: "closed" })} />
      </Modal>
      <Modal open={form.type === "edit"} onClose={() => setForm({ type: "closed" })} title="Editar gasto" subtitle={form.type === "edit" ? form.gasto.categoria : undefined}>
        {form.type === "edit" && (
          <GastoForm obraId={obraId} gasto={form.gasto} onDone={() => { setForm({ type: "closed" }); router.refresh(); }} onCancel={() => setForm({ type: "closed" })} />
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Eliminar gasto"
        description={toDelete ? `Se eliminará el gasto de ${formatMoney(toDelete.monto)} (${toDelete.categoria}).` : ""}
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}

function Stat({ label, value, muted, strong, tone }: { label: string; value: number | null; muted?: boolean; strong?: boolean; tone?: "brand" | "danger" }) {
  return (
    <div>
      <p className="text-[11px] font-medium text-content-subtle">{label}</p>
      <p className={cn(
        "mt-0.5 tabular-nums",
        strong ? "text-lg font-bold sm:text-xl" : "text-base font-bold sm:text-lg",
        tone === "danger" ? "text-rose-600 dark:text-rose-400" : tone === "brand" ? "text-brand" : muted ? "text-content-muted" : "text-content",
      )}>
        {value == null ? "—" : <CountUp value={value} duration={0.7} format={formatCurrency} />}
      </p>
    </div>
  );
}

function Fuente({ icon: Icon, label, value }: { icon: typeof Package; label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-line bg-surface/50 p-4 shadow-card">
      <p className="flex items-center gap-1.5 text-xs text-content-subtle">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </p>
      <p className="mt-1 text-base font-bold tabular-nums text-content sm:text-lg">
        <CountUp value={value} duration={0.7} format={formatCurrency} />
      </p>
    </div>
  );
}

function GastoForm({ obraId, gasto, onDone, onCancel }: { obraId: string; gasto?: GastoObra; onDone: () => void; onCancel: () => void }) {
  const isEdit = Boolean(gasto);
  const [categoria, setCategoria] = useState(gasto?.categoria ?? "");
  const [concepto, setConcepto] = useState(gasto?.concepto ?? "");
  const [monto, setMonto] = useState(gasto?.monto != null ? String(gasto.monto) : "");
  const [fecha, setFecha] = useState(gasto?.fecha ?? todayISO());
  const [notas, setNotas] = useState(gasto?.notas ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const inp = "h-11 w-full rounded-xl border border-line bg-surface/60 px-3.5 text-sm text-content placeholder:text-content-subtle focus:border-brand/50 focus:outline-none";

  function guardar() {
    setError(null);
    const payload = { categoria: categoria || "Otros", concepto, monto: Number(monto), fecha, notas };
    start(async () => {
      const res = isEdit ? await updateGasto(gasto!.id, obraId, payload) : await addGasto(obraId, payload);
      if (res.ok) onDone();
      else setError(res.error ?? "Error");
    });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-content-muted">Categoría</label>
            <SmartSelect
              value={categoria || null}
              onChange={setCategoria}
              categoria="gasto_categoria"
              defaults={CATEGORIAS_GASTO}
              placeholder="Combustible, Transporte…"
              ariaLabel="Categoría del gasto"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-content-muted">Monto (RD$)</label>
            <input type="number" min={0} step="0.01" inputMode="decimal" value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="0.00" className={cn(inp, "tabular-nums")} />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-content-muted">Fecha</label>
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className={inp} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-content-muted">Concepto</label>
          <input type="text" value={concepto} onChange={(e) => setConcepto(e.target.value)} placeholder="Ej. combustible para la mezcladora" className={inp} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-content-muted">Notas (opcional)</label>
          <textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={2} placeholder="Detalle…" className={cn(inp, "min-h-[64px] resize-y py-2.5")} />
        </div>
        {error && <p className="rounded-lg bg-danger/10 px-3 py-2 text-xs font-medium text-danger">{error}</p>}
      </div>
      <div className="flex shrink-0 items-center justify-end gap-2.5 border-t border-line px-5 py-4">
        <Button type="button" variant="secondary" size="md" onClick={onCancel} disabled={pending}>Cancelar</Button>
        <button type="button" onClick={guardar} disabled={pending} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-gradient px-5 text-sm font-semibold text-brand-ink shadow-glow transition-transform hover:scale-[1.02] active:scale-[0.99] disabled:opacity-70">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : isEdit ? "Guardar" : "Registrar gasto"}
        </button>
      </div>
    </div>
  );
}

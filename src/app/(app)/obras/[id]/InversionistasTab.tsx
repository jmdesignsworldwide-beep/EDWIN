"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, Trash2, Pencil, Handshake, AlertTriangle, PieChart, TrendingUp } from "lucide-react";
import { Reveal, CountUp, Button, EmptyState } from "@/components/primitives";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { addInversionista, updateInversionista, deleteInversionista, type InversionistasData } from "../inversionistas-actions";
import type { RepartoInversionista } from "@/lib/proyectos/types";
import { formatMoney, cn } from "@/lib/utils";

function todayISO(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function InversionistasTab({ obraId, data }: { obraId: string; data: InversionistasData }) {
  const router = useRouter();
  const { inversionistas, totalInvertido, ganancia, precioVentaDefinido, sumaPct } = data;
  const [form, setForm] = useState<{ type: "closed" } | { type: "create" } | { type: "edit"; inv: RepartoInversionista }>({ type: "closed" });
  const [toDelete, setToDelete] = useState<RepartoInversionista | null>(null);
  const [deleting, setDeleting] = useState(false);

  const sumaDescuadrada = inversionistas.length > 0 && Math.abs(sumaPct - 100) > 0.5;

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    await deleteInversionista(toDelete.id, obraId);
    setDeleting(false);
    setToDelete(null);
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-xs text-content-subtle"><PieChart className="h-3.5 w-3.5" />Total invertido</p>
          <p className="text-xl font-bold tabular-nums text-content sm:text-2xl"><CountUp value={totalInvertido} duration={0.8} format={formatMoney} /></p>
        </div>
        <Button icon={Plus} size="sm" onClick={() => setForm({ type: "create" })}>Agregar inversionista</Button>
      </div>

      {!precioVentaDefinido && inversionistas.length > 0 && (
        <div className="flex items-start gap-2.5 rounded-xl border border-sky-500/30 bg-sky-500/10 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-sky-600 dark:text-sky-400" />
          <p className="text-xs text-content">Define el <b>precio de venta</b> en <b>Financiero → Rentabilidad</b> para ver la parte de ganancia de cada inversionista.</p>
        </div>
      )}
      {sumaDescuadrada && (
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="text-xs text-content">Las participaciones suman <b>{sumaPct.toFixed(1)}%</b> (no 100%). Revisa los % manuales si lo acordaron distinto.</p>
        </div>
      )}

      {inversionistas.length === 0 ? (
        <div className="rounded-2xl border border-line bg-surface/50 shadow-card">
          <EmptyState icon={Handshake} title="Sin inversionistas" description="Agrega quién invirtió en esta obra y cuánto; el sistema calcula su % y, al cierre, su parte de la ganancia." actionLabel="Agregar inversionista" actionIcon={Plus} onAction={() => setForm({ type: "create" })} size="sm" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {inversionistas.map((inv) => (
            <Reveal key={inv.id}>
              <div className="rounded-2xl border border-line bg-surface/50 p-5 shadow-card">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-semibold text-content">{inv.nombre}</h3>
                    {inv.notas && <p className="truncate text-xs text-content-subtle">{inv.notas}</p>}
                  </div>
                  <span className="shrink-0 rounded-full bg-brand/12 px-2.5 py-1 text-sm font-bold tabular-nums text-brand ring-1 ring-inset ring-brand/25">
                    {inv.pct.toFixed(1)}%{inv.pct_manual != null && <span className="ml-1 text-[10px] font-medium opacity-70">manual</span>}
                  </span>
                </div>

                <dl className="mt-4 space-y-2 border-t border-line pt-3 text-sm">
                  <Row label="Capital invertido" value={formatMoney(inv.monto)} />
                  <Row label="Parte de la ganancia" value={ganancia != null ? formatMoney(inv.gananciaParte) : "—"} tone={inv.gananciaParte >= 0 ? "pos" : "neg"} />
                  <div className="flex items-center justify-between border-t border-line pt-2">
                    <dt className="flex items-center gap-1.5 text-sm font-semibold text-content"><TrendingUp className="h-3.5 w-3.5 text-brand" />Total a recibir</dt>
                    <dd className="text-base font-bold tabular-nums text-content">
                      {ganancia != null ? <CountUp value={inv.totalRecibir} duration={0.7} format={formatMoney} /> : formatMoney(inv.monto)}
                    </dd>
                  </div>
                </dl>

                <div className="mt-3 flex items-center justify-end gap-1">
                  <button type="button" onClick={() => setForm({ type: "edit", inv })} aria-label="Editar" className="grid h-8 w-8 place-items-center rounded-lg text-content-subtle transition-colors hover:bg-surface-2 hover:text-content"><Pencil className="h-4 w-4" /></button>
                  <button type="button" onClick={() => setToDelete(inv)} aria-label="Eliminar" className="grid h-8 w-8 place-items-center rounded-lg text-content-subtle transition-colors hover:bg-danger/10 hover:text-danger"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      )}

      {ganancia != null && inversionistas.length > 0 && (
        <p className="text-center text-xs text-content-subtle">Ganancia de la obra (de Rentabilidad): <b className="text-content">{formatMoney(ganancia)}</b>. La parte de cada uno = ganancia × su %.</p>
      )}

      <Modal open={form.type === "create"} onClose={() => setForm({ type: "closed" })} title="Nuevo inversionista" subtitle="Quién invirtió en esta obra">
        <InvForm obraId={obraId} onDone={() => { setForm({ type: "closed" }); router.refresh(); }} onCancel={() => setForm({ type: "closed" })} />
      </Modal>
      <Modal open={form.type === "edit"} onClose={() => setForm({ type: "closed" })} title="Editar inversionista" subtitle={form.type === "edit" ? form.inv.nombre : undefined}>
        {form.type === "edit" && <InvForm obraId={obraId} inv={form.inv} onDone={() => { setForm({ type: "closed" }); router.refresh(); }} onCancel={() => setForm({ type: "closed" })} />}
      </Modal>

      <ConfirmDialog open={Boolean(toDelete)} title="Eliminar inversionista" description={toDelete ? `Se eliminará a "${toDelete.nombre}" de esta obra.` : ""} loading={deleting} onConfirm={confirmDelete} onCancel={() => setToDelete(null)} />
    </div>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: "pos" | "neg" }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-content-muted">{label}</dt>
      <dd className={cn("font-semibold tabular-nums", tone === "pos" ? "text-emerald-700 dark:text-emerald-300" : tone === "neg" ? "text-rose-600 dark:text-rose-400" : "text-content")}>{value}</dd>
    </div>
  );
}

const inp = "h-11 w-full rounded-xl border border-line bg-surface/60 px-3.5 text-sm text-content placeholder:text-content-subtle focus:border-brand/50 focus:outline-none";

function InvForm({ obraId, inv, onDone, onCancel }: { obraId: string; inv?: RepartoInversionista; onDone: () => void; onCancel: () => void }) {
  const isEdit = Boolean(inv);
  const [nombre, setNombre] = useState(inv?.nombre ?? "");
  const [monto, setMonto] = useState(inv?.monto != null ? String(inv.monto) : "");
  const [fecha, setFecha] = useState(inv?.fecha ?? todayISO());
  const [pctManual, setPctManual] = useState(inv?.pct_manual != null ? String(inv.pct_manual) : "");
  const [notas, setNotas] = useState(inv?.notas ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function guardar() {
    setError(null);
    const payload = { nombre, monto: Number(monto), fecha, pct_manual: pctManual, cliente_id: null, notas };
    start(async () => {
      const res = isEdit ? await updateInversionista(inv!.id, obraId, payload) : await addInversionista(obraId, payload);
      if (res.ok) onDone();
      else setError(res.error ?? "Error");
    });
  }
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-content-muted">Nombre del inversionista</label>
          <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Pedro Martínez" className={inp} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-content-muted">Monto invertido (RD$)</label>
            <input type="number" min={0} step="0.01" inputMode="decimal" value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="0.00" className={cn(inp, "tabular-nums")} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-content-muted">Fecha</label>
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className={inp} />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-content-muted">% de participación (opcional)</label>
          <input type="number" min={0} max={100} step="0.01" inputMode="decimal" value={pctManual} onChange={(e) => setPctManual(e.target.value)} placeholder="Automático por monto" className={cn(inp, "tabular-nums")} />
          <p className="mt-1 text-[11px] text-content-subtle">Déjalo vacío para calcularlo por monto. Ponlo solo si acordaron un % distinto.</p>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-content-muted">Notas (opcional)</label>
          <textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={2} placeholder="Ej. aporta el terreno…" className={cn(inp, "min-h-[64px] resize-y py-2.5")} />
        </div>
        {error && <p className="rounded-lg bg-danger/10 px-3 py-2 text-xs font-medium text-danger">{error}</p>}
      </div>
      <div className="flex shrink-0 items-center justify-end gap-2.5 border-t border-line px-5 py-4">
        <Button type="button" variant="secondary" size="md" onClick={onCancel} disabled={pending}>Cancelar</Button>
        <button type="button" onClick={guardar} disabled={pending} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-gradient px-5 text-sm font-semibold text-brand-ink shadow-glow transition-transform hover:scale-[1.02] active:scale-[0.99] disabled:opacity-70">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : isEdit ? "Guardar" : "Agregar"}
        </button>
      </div>
    </div>
  );
}

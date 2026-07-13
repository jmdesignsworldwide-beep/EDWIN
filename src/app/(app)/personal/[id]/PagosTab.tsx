"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, Trash2, HandCoins, CheckCircle2, Circle } from "lucide-react";
import { Button, EmptyState } from "@/components/primitives";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Select } from "@/components/ui/Select";
import { addPago, deletePago, toggleSaldado } from "../pagos-actions";
import {
  PAGO_TIPOS,
  PAGO_TIPO_BADGE,
  PAGO_TIPO_LABEL,
  type PagoEmpleado,
  type PagoTipo,
} from "@/lib/proyectos/types";
import { formatMoney, cn } from "@/lib/utils";

function todayISO(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
function fmtFecha(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("es-DO", { day: "2-digit", month: "short", year: "numeric" });
}

export function PagosTab({ personaId, pagos }: { personaId: string; pagos: PagoEmpleado[] }) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [toDelete, setToDelete] = useState<PagoEmpleado | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [, start] = useTransition();

  function marcar(p: PagoEmpleado) {
    setBusyId(p.id);
    start(async () => {
      await toggleSaldado(p.id, personaId, !p.saldado);
      setBusyId(null);
      router.refresh();
    });
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    await deletePago(toDelete.id, personaId);
    setDeleting(false);
    setToDelete(null);
    router.refresh();
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-content-muted">Lo que Edwin le ha dado a esta persona.</p>
        <Button icon={Plus} size="sm" onClick={() => setAdding(true)}>Registrar entrega</Button>
      </div>

      {pagos.length === 0 ? (
        <div className="rounded-2xl border border-line bg-surface/50 shadow-card">
          <EmptyState
            icon={HandCoins}
            title="Sin entregas registradas"
            description="Registra adelantos, pagos o entregas de dinero a esta persona para llevar el historial."
            actionLabel="Registrar entrega"
            actionIcon={Plus}
            onAction={() => setAdding(true)}
            size="sm"
          />
        </div>
      ) : (
        <ul className="space-y-2.5">
          {pagos.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-surface/50 p-3.5 shadow-card">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", PAGO_TIPO_BADGE[p.tipo])}>
                    {PAGO_TIPO_LABEL[p.tipo]}
                  </span>
                  <span className="text-xs tabular-nums text-content-subtle">{fmtFecha(p.fecha)}</span>
                  {p.origen === "nomina" && (
                    <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-content-muted">Nómina</span>
                  )}
                </div>
                {p.concepto && <p className="mt-1 truncate text-sm text-content">{p.concepto}</p>}
                {p.notas && <p className="truncate text-xs text-content-subtle">{p.notas}</p>}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-bold tabular-nums text-content">{formatMoney(p.monto)}</span>
                {p.tipo === "adelanto" && (
                  <button
                    type="button"
                    onClick={() => marcar(p)}
                    disabled={busyId === p.id}
                    title={p.saldado ? "Adelanto saldado" : "Adelanto pendiente"}
                    className={cn(
                      "inline-flex h-8 items-center gap-1 rounded-lg px-2 text-[11px] font-semibold ring-1 ring-inset transition-colors disabled:opacity-60",
                      p.saldado
                        ? "bg-emerald-500/12 text-emerald-700 ring-emerald-500/25 dark:text-emerald-300"
                        : "bg-amber-500/12 text-amber-700 ring-amber-500/25 dark:text-amber-300",
                    )}
                  >
                    {busyId === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : p.saldado ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
                    {p.saldado ? "Saldado" : "Pendiente"}
                  </button>
                )}
                {p.origen === "manual" && (
                  <button
                    type="button"
                    onClick={() => setToDelete(p)}
                    aria-label="Eliminar"
                    className="grid h-8 w-8 place-items-center rounded-lg text-content-subtle transition-colors hover:bg-danger/10 hover:text-danger"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal open={adding} onClose={() => setAdding(false)} title="Registrar entrega" subtitle="Dinero que Edwin le da a esta persona">
        <PagoForm personaId={personaId} onDone={() => { setAdding(false); router.refresh(); }} onCancel={() => setAdding(false)} />
      </Modal>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Eliminar registro"
        description={toDelete ? `Se eliminará la entrega de ${formatMoney(toDelete.monto)} del ${fmtFecha(toDelete.fecha)}.` : ""}
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </>
  );
}

function PagoForm({ personaId, onDone, onCancel }: { personaId: string; onDone: () => void; onCancel: () => void }) {
  const [tipo, setTipo] = useState<PagoTipo>("adelanto");
  const [monto, setMonto] = useState("");
  const [concepto, setConcepto] = useState("");
  const [fecha, setFecha] = useState(todayISO());
  const [notas, setNotas] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const inp = "h-11 w-full rounded-xl border border-line bg-surface/60 px-3.5 text-sm text-content placeholder:text-content-subtle focus:border-brand/50 focus:outline-none";

  function guardar() {
    setError(null);
    start(async () => {
      const res = await addPago(personaId, { tipo, monto: Number(monto), concepto, fecha, notas });
      if (res.ok) onDone();
      else setError(res.error ?? "Error");
    });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-content-muted">Tipo</label>
            <Select
              value={tipo}
              onChange={(v) => setTipo(v as PagoTipo)}
              ariaLabel="Tipo de entrega"
              options={PAGO_TIPOS.map((t) => ({ value: t.value, label: t.label }))}
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
          <input type="text" value={concepto} onChange={(e) => setConcepto(e.target.value)} placeholder="Ej. adelanto del martes" className={inp} />
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
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Registrar"}
        </button>
      </div>
    </div>
  );
}

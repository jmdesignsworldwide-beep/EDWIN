"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { MessageSquare, Loader2, Trash2, Pencil, Plus, MessageCircle } from "lucide-react";
import { Reveal, Button, EmptyState } from "@/components/primitives";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Select } from "@/components/ui/Select";
import { listComunicaciones, addComunicacion, updateComunicacion, deleteComunicacion } from "../comunicaciones-actions";
import {
  COMUNICACION_TIPOS,
  COMUNICACION_TIPO_BADGE,
  whatsappLink,
  type ComunicacionObra,
  type ComunicacionTipo,
} from "@/lib/proyectos/types";
import { cn } from "@/lib/utils";

function fmtFecha(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("es-DO", { day: "2-digit", month: "short", year: "numeric" });
}
function todayISO(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function ComunicacionTab({ obraId, clienteNombre, clienteTelefono }: { obraId: string; clienteNombre: string | null; clienteTelefono: string | null }) {
  const [items, setItems] = useState<ComunicacionObra[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<{ type: "closed" } | { type: "create" } | { type: "edit"; item: ComunicacionObra }>({ type: "closed" });
  const [toDelete, setToDelete] = useState<ComunicacionObra | null>(null);
  const [deleting, startDelete] = useTransition();
  const wa = whatsappLink(clienteTelefono);

  const load = useCallback(() => {
    setLoading(true);
    listComunicaciones(obraId).then((c) => { setItems(c); setLoading(false); });
  }, [obraId]);
  useEffect(() => { load(); }, [load]);

  function confirmDelete() {
    if (!toDelete) return;
    startDelete(async () => {
      await deleteComunicacion(toDelete.id, obraId);
      setToDelete(null);
      load();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-content-muted">Historial con {clienteNombre ?? "el cliente"} · {items.length}</p>
        <div className="flex items-center gap-2">
          {wa && (
            <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-emerald-500/12 px-3.5 text-sm font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-500/25 transition-colors hover:bg-emerald-500/20 dark:text-emerald-300">
              <MessageCircle className="h-4 w-4" />WhatsApp
            </a>
          )}
          <Button icon={Plus} size="sm" onClick={() => setForm({ type: "create" })}>Registrar</Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2.5">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-surface-2/60" />)}</div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-line bg-surface/50 shadow-card">
          <EmptyState icon={MessageSquare} title="Sin comunicaciones registradas" description="Anota llamadas, mensajes y acuerdos con el cliente para tener el historial." actionLabel="Registrar" actionIcon={Plus} onAction={() => setForm({ type: "create" })} size="sm" />
        </div>
      ) : (
        <ul className="space-y-2.5">
          {items.map((c) => {
            const t = COMUNICACION_TIPO_BADGE[c.tipo];
            return (
              <Reveal key={c.id}>
                <div className="rounded-xl border border-line bg-surface/50 p-3.5 shadow-card">
                  <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", t.badge)}>{t.label}</span>
                      <span className="text-xs tabular-nums text-content-subtle">{fmtFecha(c.fecha)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => setForm({ type: "edit", item: c })} aria-label="Editar" className="grid h-7 w-7 place-items-center rounded-lg text-content-subtle transition-colors hover:bg-surface-2 hover:text-content"><Pencil className="h-3.5 w-3.5" /></button>
                      <button type="button" onClick={() => setToDelete(c)} aria-label="Eliminar" className="grid h-7 w-7 place-items-center rounded-lg text-content-subtle transition-colors hover:bg-danger/10 hover:text-danger"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-content">{c.resumen}</p>
                  {c.notas && <p className="mt-1 whitespace-pre-wrap text-xs text-content-subtle">{c.notas}</p>}
                </div>
              </Reveal>
            );
          })}
        </ul>
      )}

      <Modal open={form.type === "create"} onClose={() => setForm({ type: "closed" })} title="Registrar comunicación" subtitle="Llamada, WhatsApp, reunión…">
        <ComForm obraId={obraId} onDone={() => { setForm({ type: "closed" }); load(); }} onCancel={() => setForm({ type: "closed" })} />
      </Modal>
      <Modal open={form.type === "edit"} onClose={() => setForm({ type: "closed" })} title="Editar comunicación">
        {form.type === "edit" && <ComForm obraId={obraId} item={form.item} onDone={() => { setForm({ type: "closed" }); load(); }} onCancel={() => setForm({ type: "closed" })} />}
      </Modal>

      <ConfirmDialog open={Boolean(toDelete)} title="Eliminar registro" description="Se eliminará este registro de comunicación." loading={deleting} onConfirm={confirmDelete} onCancel={() => setToDelete(null)} />
    </div>
  );
}

const inp = "h-11 w-full rounded-xl border border-line bg-surface/60 px-3.5 text-sm text-content placeholder:text-content-subtle focus:border-brand/50 focus:outline-none";

function ComForm({ obraId, item, onDone, onCancel }: { obraId: string; item?: ComunicacionObra; onDone: () => void; onCancel: () => void }) {
  const isEdit = Boolean(item);
  const [tipo, setTipo] = useState<ComunicacionTipo>(item?.tipo ?? "llamada");
  const [fecha, setFecha] = useState(item?.fecha ?? todayISO());
  const [resumen, setResumen] = useState(item?.resumen ?? "");
  const [notas, setNotas] = useState(item?.notas ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function guardar() {
    setError(null);
    const payload = { tipo, fecha, resumen, notas };
    start(async () => {
      const res = isEdit ? await updateComunicacion(item!.id, obraId, payload) : await addComunicacion(obraId, payload);
      if (res.ok) onDone(); else setError(res.error ?? "Error");
    });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-content-muted">Tipo</label>
            <Select value={tipo} onChange={(v) => setTipo(v as ComunicacionTipo)} options={COMUNICACION_TIPOS.map((t) => ({ value: t.value, label: t.label }))} ariaLabel="Tipo de comunicación" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-content-muted">Fecha</label>
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className={inp} />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-content-muted">Resumen de lo hablado / acordado</label>
          <textarea value={resumen} onChange={(e) => setResumen(e.target.value)} rows={3} placeholder="Ej. El cliente aprobó el cambio de piso. Pagará el abono el viernes." className={cn(inp, "min-h-[90px] resize-y py-2.5")} />
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
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : isEdit ? "Guardar" : "Registrar"}
        </button>
      </div>
    </div>
  );
}

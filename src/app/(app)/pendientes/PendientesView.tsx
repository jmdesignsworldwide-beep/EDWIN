"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ListChecks,
  Plus,
  Loader2,
  Trash2,
  Pencil,
  Check,
  HardHat,
  Flag,
  CalendarClock,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Reveal, Stagger, Button, EmptyState } from "@/components/primitives";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Select } from "@/components/ui/Select";
import { addPendiente, updatePendiente, togglePendiente, deletePendiente } from "./actions";
import { SEVERIDAD_UI, type Notificacion, type Pendiente, type PrioridadPendiente } from "@/lib/proyectos/types";
import { cn } from "@/lib/utils";

function fmtFecha(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("es-DO", { day: "2-digit", month: "short", year: "numeric" });
}
function hoyISO(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function PendientesView({ pendientes, sistema, obras }: { pendientes: Pendiente[]; sistema: Notificacion[]; obras: { id: string; nombre: string }[] }) {
  const router = useRouter();
  const [form, setForm] = useState<{ type: "closed" } | { type: "create" } | { type: "edit"; p: Pendiente }>({ type: "closed" });
  const [toDelete, setToDelete] = useState<Pendiente | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [, start] = useTransition();

  const abiertos = pendientes.filter((p) => !p.hecho);
  const hechos = pendientes.filter((p) => p.hecho);
  const sistemaAbierto = sistema.filter((s) => !s.leida);

  function toggle(p: Pendiente) {
    setBusyId(p.id);
    start(async () => { await togglePendiente(p.id, !p.hecho); setBusyId(null); router.refresh(); });
  }
  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    await deletePendiente(toDelete.id);
    setDeleting(false); setToDelete(null); router.refresh();
  }

  return (
    <>
      <PageHeader
        title="Pendientes"
        subtitle="Lo que hay que hacer — tuyo y lo que el sistema detecta"
        action={<Button icon={Plus} onClick={() => setForm({ type: "create" })}>Nuevo pendiente</Button>}
      />

      {/* Del sistema (automáticos) */}
      {sistemaAbierto.length > 0 && (
        <div className="mb-6">
          <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-content"><Sparkles className="h-4 w-4 text-brand" />Del sistema<span className="text-content-subtle/70">· {sistemaAbierto.length}</span></p>
          <Stagger className="space-y-2">
            {sistemaAbierto.slice(0, 6).map((s) => {
              const sev = SEVERIDAD_UI[s.severidad];
              return (
                <Reveal key={s.clave}>
                  <Link href={s.href} className="group flex items-center gap-3 rounded-xl border border-line bg-surface/50 p-3 transition-colors hover:border-brand/40 hover:bg-surface-2/50">
                    <span className={cn("h-2 w-2 shrink-0 rounded-full", sev.dot)} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-content group-hover:text-brand">{s.titulo}</span>
                      <span className="block truncate text-xs text-content-subtle">{s.detalle}</span>
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-content-subtle group-hover:text-brand" />
                  </Link>
                </Reveal>
              );
            })}
          </Stagger>
        </div>
      )}

      {/* Mis pendientes */}
      {abiertos.length === 0 && hechos.length === 0 ? (
        <Reveal standalone>
          <div className="rounded-2xl border border-line bg-surface/50 shadow-card">
            <EmptyState icon={ListChecks} title="Sin pendientes" description="Anota lo que tienes que hacer: llamar a un proveedor, cobrarle a alguien, comprar material… con obra, prioridad y recordatorio." actionLabel="Nuevo pendiente" actionIcon={Plus} onAction={() => setForm({ type: "create" })} />
          </div>
        </Reveal>
      ) : (
        <div className="space-y-6">
          <Stagger className="space-y-2.5">
            {abiertos.map((p) => (
              <Reveal key={p.id}><PendienteRow p={p} busy={busyId === p.id} onToggle={() => toggle(p)} onEdit={() => setForm({ type: "edit", p })} onDelete={() => setToDelete(p)} /></Reveal>
            ))}
            {abiertos.length === 0 && <p className="rounded-xl border border-dashed border-line px-3 py-4 text-center text-sm text-content-muted">Todo hecho. 🎉</p>}
          </Stagger>

          {hechos.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-semibold text-content-muted">Hechos · {hechos.length}</p>
              <div className="space-y-2 opacity-70">
                {hechos.slice(0, 20).map((p) => (
                  <PendienteRow key={p.id} p={p} busy={busyId === p.id} onToggle={() => toggle(p)} onEdit={() => setForm({ type: "edit", p })} onDelete={() => setToDelete(p)} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <Modal open={form.type === "create"} onClose={() => setForm({ type: "closed" })} title="Nuevo pendiente" subtitle="Lo que hay que hacer">
        <PendienteForm obras={obras} onDone={() => { setForm({ type: "closed" }); router.refresh(); }} onCancel={() => setForm({ type: "closed" })} />
      </Modal>
      <Modal open={form.type === "edit"} onClose={() => setForm({ type: "closed" })} title="Editar pendiente">
        {form.type === "edit" && <PendienteForm obras={obras} pendiente={form.p} onDone={() => { setForm({ type: "closed" }); router.refresh(); }} onCancel={() => setForm({ type: "closed" })} />}
      </Modal>

      <ConfirmDialog open={Boolean(toDelete)} title="Eliminar pendiente" description={toDelete ? `Se eliminará "${toDelete.texto.slice(0, 60)}".` : ""} loading={deleting} onConfirm={confirmDelete} onCancel={() => setToDelete(null)} />
    </>
  );
}

function PendienteRow({ p, busy, onToggle, onEdit, onDelete }: { p: Pendiente; busy: boolean; onToggle: () => void; onEdit: () => void; onDelete: () => void }) {
  const vencido = !p.hecho && p.fecha != null && p.fecha < hoyISO();
  return (
    <div className={cn("flex items-center gap-3 rounded-xl border p-3.5 shadow-card", p.hecho ? "border-line bg-surface/40" : p.prioridad === "alta" ? "border-rose-500/25 bg-rose-500/[0.03]" : "border-line bg-surface/50")}>
      <button type="button" onClick={onToggle} disabled={busy} aria-label={p.hecho ? "Marcar no hecho" : "Marcar hecho"} className={cn("grid h-6 w-6 shrink-0 place-items-center rounded-md border-2 transition-colors", p.hecho ? "border-emerald-500 bg-emerald-500 text-white" : "border-line hover:border-brand")}>
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : p.hecho ? <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}><Check className="h-4 w-4" /></motion.span> : null}
      </button>
      <div className="min-w-0 flex-1">
        <p className={cn("truncate text-sm", p.hecho ? "text-content-muted line-through" : "font-medium text-content")}>{p.texto}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px]">
          {p.prioridad === "alta" && !p.hecho && <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/12 px-1.5 py-0.5 font-semibold text-rose-700 dark:text-rose-300"><Flag className="h-3 w-3" />Alta</span>}
          {p.obra && <Link href={`/obras/${p.obra.id}`} className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-1.5 py-0.5 font-medium text-content-muted hover:text-brand"><HardHat className="h-3 w-3" />{p.obra.nombre}</Link>}
          {p.fecha && <span className={cn("inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-medium", vencido ? "bg-rose-500/12 text-rose-700 dark:text-rose-300" : "bg-surface-2 text-content-muted")}><CalendarClock className="h-3 w-3" />{fmtFecha(p.fecha)}{vencido ? " · vencido" : ""}</span>}
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button type="button" onClick={onEdit} aria-label="Editar" className="grid h-8 w-8 place-items-center rounded-lg text-content-subtle transition-colors hover:bg-surface-2 hover:text-content"><Pencil className="h-4 w-4" /></button>
        <button type="button" onClick={onDelete} aria-label="Eliminar" className="grid h-8 w-8 place-items-center rounded-lg text-content-subtle transition-colors hover:bg-danger/10 hover:text-danger"><Trash2 className="h-4 w-4" /></button>
      </div>
    </div>
  );
}

const inp = "h-11 w-full rounded-xl border border-line bg-surface/60 px-3.5 text-sm text-content placeholder:text-content-subtle focus:border-brand/50 focus:outline-none";

function PendienteForm({ obras, pendiente, onDone, onCancel }: { obras: { id: string; nombre: string }[]; pendiente?: Pendiente; onDone: () => void; onCancel: () => void }) {
  const isEdit = Boolean(pendiente);
  const [texto, setTexto] = useState(pendiente?.texto ?? "");
  const [obraId, setObraId] = useState(pendiente?.obra_id ?? "");
  const [prioridad, setPrioridad] = useState<PrioridadPendiente>(pendiente?.prioridad ?? "normal");
  const [fecha, setFecha] = useState(pendiente?.fecha ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function guardar() {
    setError(null);
    if (!texto.trim()) { setError("Escribe el pendiente."); return; }
    const payload = { texto, obra_id: obraId || null, prioridad, fecha: fecha || null };
    start(async () => {
      const res = isEdit ? await updatePendiente(pendiente!.id, payload) : await addPendiente(payload);
      if (res.ok) onDone(); else setError(res.error ?? "Error");
    });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-content-muted">¿Qué hay que hacer?</label>
          <textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={2} placeholder="Ej. Llamar al proveedor de blocks. Cobrarle a Fulano." className={cn(inp, "min-h-[64px] resize-y py-2.5")} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-content-muted">Prioridad</label>
            <div className="inline-flex w-full overflow-hidden rounded-xl border border-line">
              {(["normal", "alta"] as PrioridadPendiente[]).map((pr) => (
                <button key={pr} type="button" onClick={() => setPrioridad(pr)} className={cn("flex-1 px-3 py-2.5 text-sm font-semibold transition-colors", prioridad === pr ? (pr === "alta" ? "bg-rose-500 text-white" : "bg-brand-gradient text-brand-ink") : "bg-surface text-content-muted hover:bg-surface-2")}>{pr === "alta" ? "Alta" : "Normal"}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-content-muted">Recordatorio (opcional)</label>
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className={inp} />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-content-muted">Obra (opcional)</label>
          <Select value={obraId} onChange={(v) => setObraId(v)} placeholder="General (sin obra)" ariaLabel="Obra" options={[{ value: "", label: "General (sin obra)" }, ...obras.map((o) => ({ value: o.id, label: o.nombre }))]} />
        </div>
        {error && <p className="rounded-lg bg-danger/10 px-3 py-2 text-xs font-medium text-danger">{error}</p>}
      </div>
      <div className="flex shrink-0 items-center justify-end gap-2.5 border-t border-line px-5 py-4">
        <Button type="button" variant="secondary" size="md" onClick={onCancel} disabled={pending}>Cancelar</Button>
        <button type="button" onClick={guardar} disabled={pending} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-gradient px-5 text-sm font-semibold text-brand-ink shadow-glow transition-transform hover:scale-[1.02] active:scale-[0.99] disabled:opacity-70">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : isEdit ? "Guardar" : "Crear pendiente"}
        </button>
      </div>
    </div>
  );
}

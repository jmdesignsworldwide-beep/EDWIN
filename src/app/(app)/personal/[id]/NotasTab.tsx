"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, Trash2, NotebookPen } from "lucide-react";
import { Button, EmptyState } from "@/components/primitives";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { addNota, deleteNota } from "../notas-actions";
import {
  NOTA_TIPOS,
  NOTA_TIPO_BADGE,
  type NotaEmpleado,
  type NotaTipo,
} from "@/lib/proyectos/types";
import { cn } from "@/lib/utils";

function todayISO(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
function fmtFecha(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("es-DO", { day: "2-digit", month: "long", year: "numeric" });
}

export function NotasTab({ personaId, notas }: { personaId: string; notas: NotaEmpleado[] }) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [toDelete, setToDelete] = useState<NotaEmpleado | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    await deleteNota(toDelete.id, personaId);
    setDeleting(false);
    setToDelete(null);
    router.refresh();
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-content-muted">Lo bueno y lo malo — bitácora del empleado.</p>
        <Button icon={Plus} size="sm" onClick={() => setAdding(true)}>Agregar nota</Button>
      </div>

      {notas.length === 0 ? (
        <div className="rounded-2xl border border-line bg-surface/50 shadow-card">
          <EmptyState
            icon={NotebookPen}
            title="Sin notas todavía"
            description="Registra observaciones fechadas: buen desempeño, faltas, acuerdos… queda en su historial."
            actionLabel="Agregar nota"
            actionIcon={Plus}
            onAction={() => setAdding(true)}
            size="sm"
          />
        </div>
      ) : (
        <ul className="space-y-2.5">
          {notas.map((n) => {
            const t = NOTA_TIPO_BADGE[n.tipo];
            return (
              <li key={n.id} className="flex items-start gap-3 rounded-xl border border-line bg-surface/50 p-3.5 shadow-card">
                <span className={cn("mt-1 h-2 w-2 shrink-0 rounded-full", t.dot)} />
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", t.badge)}>{t.label}</span>
                    <span className="text-xs tabular-nums text-content-subtle">{fmtFecha(n.fecha)}</span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-content">{n.nota}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setToDelete(n)}
                  aria-label="Eliminar nota"
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-content-subtle transition-colors hover:bg-danger/10 hover:text-danger"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <Modal open={adding} onClose={() => setAdding(false)} title="Nueva nota" subtitle="Observación fechada del empleado">
        <NotaForm personaId={personaId} onDone={() => { setAdding(false); router.refresh(); }} onCancel={() => setAdding(false)} />
      </Modal>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Eliminar nota"
        description="Se eliminará esta nota del historial del empleado."
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </>
  );
}

function NotaForm({ personaId, onDone, onCancel }: { personaId: string; onDone: () => void; onCancel: () => void }) {
  const [tipo, setTipo] = useState<NotaTipo>("neutral");
  const [fecha, setFecha] = useState(todayISO());
  const [nota, setNota] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const inp = "h-11 w-full rounded-xl border border-line bg-surface/60 px-3.5 text-sm text-content placeholder:text-content-subtle focus:border-brand/50 focus:outline-none";

  function guardar() {
    setError(null);
    start(async () => {
      const res = await addNota(personaId, { tipo, fecha, nota });
      if (res.ok) onDone();
      else setError(res.error ?? "Error");
    });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-content-muted">Tipo</label>
          <div className="inline-flex w-full overflow-hidden rounded-xl border border-line">
            {NOTA_TIPOS.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setTipo(t.value)}
                className={cn(
                  "flex-1 px-3 py-2.5 text-sm font-semibold transition-colors",
                  tipo === t.value ? "bg-brand-gradient text-brand-ink" : "bg-surface text-content-muted hover:bg-surface-2",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-content-muted">Fecha</label>
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className={inp} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-content-muted">Nota</label>
          <textarea value={nota} onChange={(e) => setNota(e.target.value)} rows={3} placeholder="Ej. Buen trabajador, puntual. / Faltó sin avisar el lunes." className={cn(inp, "min-h-[90px] resize-y py-2.5")} />
        </div>
        {error && <p className="rounded-lg bg-danger/10 px-3 py-2 text-xs font-medium text-danger">{error}</p>}
      </div>
      <div className="flex shrink-0 items-center justify-end gap-2.5 border-t border-line px-5 py-4">
        <Button type="button" variant="secondary" size="md" onClick={onCancel} disabled={pending}>Cancelar</Button>
        <button type="button" onClick={guardar} disabled={pending} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-gradient px-5 text-sm font-semibold text-brand-ink shadow-glow transition-transform hover:scale-[1.02] active:scale-[0.99] disabled:opacity-70">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar nota"}
        </button>
      </div>
    </div>
  );
}

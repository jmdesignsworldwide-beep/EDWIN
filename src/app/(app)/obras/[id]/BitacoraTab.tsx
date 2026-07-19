"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { BookOpen, Loader2, Trash2, Pencil, Plus, ImagePlus, X, User } from "lucide-react";
import { Reveal, Button, EmptyState } from "@/components/primitives";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { listBitacora, addEntrada, updateEntrada, deleteEntrada } from "../bitacora-actions";
import { compressImage } from "@/lib/image";
import type { BitacoraEntrada } from "@/lib/proyectos/types";
import { cn } from "@/lib/utils";

function fmtFecha(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("es-DO", { day: "2-digit", month: "long", year: "numeric" });
}
function todayISO(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function BitacoraTab({ obraId }: { obraId: string }) {
  const [entradas, setEntradas] = useState<BitacoraEntrada[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<{ type: "closed" } | { type: "create" } | { type: "edit"; entrada: BitacoraEntrada }>({ type: "closed" });
  const [toDelete, setToDelete] = useState<BitacoraEntrada | null>(null);
  const [deleting, startDelete] = useTransition();

  const load = useCallback(() => {
    setLoading(true);
    listBitacora(obraId).then((e) => { setEntradas(e); setLoading(false); });
  }, [obraId]);
  useEffect(() => { load(); }, [load]);

  function confirmDelete() {
    if (!toDelete) return;
    startDelete(async () => {
      await deleteEntrada(toDelete.id, obraId);
      setToDelete(null);
      load();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-content-muted">Diario de la obra · {entradas.length} entrada{entradas.length === 1 ? "" : "s"}</p>
        <Button icon={Plus} size="sm" onClick={() => setForm({ type: "create" })}>Nueva entrada</Button>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-surface-2/60" />)}</div>
      ) : entradas.length === 0 ? (
        <div className="rounded-2xl border border-line bg-surface/50 shadow-card">
          <EmptyState icon={BookOpen} title="Aún no hay entradas en la bitácora de esta obra" description="Anota lo que pasa cada día (con foto opcional). Ej: “Se fundió la losa del 2do nivel”." actionLabel="Nueva entrada" actionIcon={Plus} onAction={() => setForm({ type: "create" })} size="sm" />
        </div>
      ) : (
        <ul className="space-y-3">
          {entradas.map((e) => (
            <Reveal key={e.id}>
              <div className="rounded-2xl border border-line bg-surface/50 p-4 shadow-card">
                <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold tabular-nums text-content">{fmtFecha(e.fecha)}</span>
                  <div className="flex items-center gap-1">
                    {e.autor && <span className="mr-1 inline-flex items-center gap-1 text-[11px] text-content-subtle"><User className="h-3 w-3" />{e.autor}</span>}
                    <button type="button" onClick={() => setForm({ type: "edit", entrada: e })} aria-label="Editar" className="grid h-7 w-7 place-items-center rounded-lg text-content-subtle transition-colors hover:bg-surface-2 hover:text-content"><Pencil className="h-3.5 w-3.5" /></button>
                    <button type="button" onClick={() => setToDelete(e)} aria-label="Eliminar" className="grid h-7 w-7 place-items-center rounded-lg text-content-subtle transition-colors hover:bg-danger/10 hover:text-danger"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
                <p className="whitespace-pre-wrap text-sm text-content">{e.texto}</p>
                {(e.fotos ?? []).length > 0 && (
                  <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {(e.fotos ?? []).map((f) => f.url && (
                      <a key={f.id} href={f.url} target="_blank" rel="noopener noreferrer" className="block aspect-square overflow-hidden rounded-lg border border-line">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={f.url} alt="Foto del día" loading="lazy" className="h-full w-full object-cover" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </Reveal>
          ))}
        </ul>
      )}

      <Modal open={form.type === "create"} onClose={() => setForm({ type: "closed" })} title="Nueva entrada" subtitle="Qué pasó hoy en la obra">
        <EntradaForm obraId={obraId} onDone={() => { setForm({ type: "closed" }); load(); }} onCancel={() => setForm({ type: "closed" })} />
      </Modal>
      <Modal open={form.type === "edit"} onClose={() => setForm({ type: "closed" })} title="Editar entrada">
        {form.type === "edit" && <EntradaForm obraId={obraId} entrada={form.entrada} onDone={() => { setForm({ type: "closed" }); load(); }} onCancel={() => setForm({ type: "closed" })} />}
      </Modal>

      <ConfirmDialog open={Boolean(toDelete)} title="Eliminar entrada" description="Se eliminará esta entrada y sus fotos de forma permanente." loading={deleting} onConfirm={confirmDelete} onCancel={() => setToDelete(null)} />
    </div>
  );
}

const inp = "h-11 w-full rounded-xl border border-line bg-surface/60 px-3.5 text-sm text-content placeholder:text-content-subtle focus:border-brand/50 focus:outline-none";

function EntradaForm({ obraId, entrada, onDone, onCancel }: { obraId: string; entrada?: BitacoraEntrada; onDone: () => void; onCancel: () => void }) {
  const isEdit = Boolean(entrada);
  const [texto, setTexto] = useState(entrada?.texto ?? "");
  const [fecha, setFecha] = useState(entrada?.fecha ?? todayISO());
  const [fotos, setFotos] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function guardar() {
    setError(null);
    if (!texto.trim()) { setError("Escribe qué pasó."); return; }
    start(async () => {
      if (isEdit) {
        const res = await updateEntrada(entrada!.id, obraId, { texto, fecha });
        if (res.ok) onDone(); else setError(res.error ?? "Error");
      } else {
        const fd = new FormData();
        fd.append("texto", texto);
        fd.append("fecha", fecha);
        for (const f of fotos) {
          const opt = await compressImage(f);
          fd.append("fotos", opt);
        }
        const res = await addEntrada(obraId, fd);
        if (res.ok) onDone(); else setError(res.error ?? "Error");
      }
    });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-content-muted">Fecha</label>
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className={inp} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-content-muted">¿Qué pasó?</label>
          <textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={4} placeholder="Ej. Se fundió la losa del 2do nivel. Llegó el camión de blocks." className={cn(inp, "min-h-[110px] resize-y py-2.5")} />
        </div>
        {!isEdit && (
          <div>
            <label className="mb-1.5 block text-xs font-medium text-content-muted">Fotos del día (opcional)</label>
            <button type="button" onClick={() => inputRef.current?.click()} className="inline-flex h-10 items-center gap-2 rounded-xl border border-dashed border-line bg-surface/40 px-4 text-sm font-medium text-content-muted transition-colors hover:border-brand/40 hover:text-content">
              <ImagePlus className="h-4 w-4" />{fotos.length > 0 ? `${fotos.length} foto${fotos.length === 1 ? "" : "s"} seleccionada${fotos.length === 1 ? "" : "s"}` : "Agregar fotos"}
            </button>
            <input ref={inputRef} type="file" accept="image/*" multiple onChange={(e) => setFotos(Array.from(e.target.files ?? []))} className="hidden" />
            {fotos.length > 0 && (
              <button type="button" onClick={() => setFotos([])} className="ml-2 inline-flex items-center gap-1 text-xs text-content-subtle hover:text-danger"><X className="h-3 w-3" />quitar</button>
            )}
            <p className="mt-1 text-[11px] text-content-subtle">Estas fotos también aparecen en la Galería de la obra.</p>
          </div>
        )}
        {error && <p className="rounded-lg bg-danger/10 px-3 py-2 text-xs font-medium text-danger">{error}</p>}
      </div>
      <div className="flex shrink-0 items-center justify-end gap-2.5 border-t border-line px-5 py-4">
        <Button type="button" variant="secondary" size="md" onClick={onCancel} disabled={pending}>Cancelar</Button>
        <button type="button" onClick={guardar} disabled={pending} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-gradient px-5 text-sm font-semibold text-brand-ink shadow-glow transition-transform hover:scale-[1.02] active:scale-[0.99] disabled:opacity-70">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : isEdit ? "Guardar" : "Publicar entrada"}
        </button>
      </div>
    </div>
  );
}

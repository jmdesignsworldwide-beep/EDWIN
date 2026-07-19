"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { FileText, Loader2, Trash2, ExternalLink, Upload, Plus } from "lucide-react";
import { Button, EmptyState } from "@/components/primitives";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { SmartSelect } from "@/components/ui/SmartSelect";
import { listDocumentos, subirDocumento, deleteDocumento } from "../documentos-actions";
import { TIPOS_DOCUMENTO, type DocumentoObra } from "@/lib/proyectos/types";
import { cn } from "@/lib/utils";

function fmtFecha(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("es-DO", { day: "2-digit", month: "short", year: "numeric" });
}
function todayISO(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function DocumentosTab({ obraId }: { obraId: string }) {
  const [docs, setDocs] = useState<DocumentoObra[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [toDelete, setToDelete] = useState<DocumentoObra | null>(null);
  const [deleting, startDelete] = useTransition();

  const load = useCallback(() => {
    setLoading(true);
    listDocumentos(obraId).then((d) => { setDocs(d); setLoading(false); });
  }, [obraId]);
  useEffect(() => { load(); }, [load]);

  function confirmDelete() {
    if (!toDelete) return;
    startDelete(async () => {
      await deleteDocumento(toDelete.id, obraId, toDelete.path);
      setToDelete(null);
      load();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-content-muted">{docs.length} documento{docs.length === 1 ? "" : "s"}</p>
        <Button icon={Plus} size="sm" onClick={() => setAdding(true)}>Subir documento</Button>
      </div>

      {loading ? (
        <div className="space-y-2.5">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-surface-2/60" />)}</div>
      ) : docs.length === 0 ? (
        <div className="rounded-2xl border border-line bg-surface/50 shadow-card">
          <EmptyState icon={FileText} title="Sin documentos" description="Sube planos, contratos, permisos o facturas de la obra (PDF o imagen)." actionLabel="Subir documento" actionIcon={Upload} onAction={() => setAdding(true)} size="sm" />
        </div>
      ) : (
        <ul className="space-y-2.5">
          {docs.map((d) => (
            <li key={d.id} className="flex items-center gap-3 rounded-xl border border-line bg-surface/50 p-3.5 shadow-card">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand/12 text-brand ring-1 ring-inset ring-brand/25"><FileText className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate text-sm font-semibold text-content">{d.nombre}</span>
                  <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-semibold text-content-muted">{d.tipo}</span>
                </div>
                <p className="text-xs text-content-subtle">{fmtFecha(d.fecha)}{d.notas ? ` · ${d.notas}` : ""}</p>
              </div>
              {d.url && <a href={d.url} target="_blank" rel="noopener noreferrer" className="grid h-9 w-9 place-items-center rounded-lg text-content-subtle transition-colors hover:bg-surface-2 hover:text-brand" title="Ver / descargar"><ExternalLink className="h-4 w-4" /></a>}
              <button type="button" onClick={() => setToDelete(d)} aria-label="Eliminar" className="grid h-9 w-9 place-items-center rounded-lg text-content-subtle transition-colors hover:bg-danger/10 hover:text-danger"><Trash2 className="h-4 w-4" /></button>
            </li>
          ))}
        </ul>
      )}

      <Modal open={adding} onClose={() => setAdding(false)} title="Subir documento" subtitle="Plano, contrato, permiso…">
        <DocForm obraId={obraId} onDone={() => { setAdding(false); load(); }} onCancel={() => setAdding(false)} />
      </Modal>

      <ConfirmDialog open={Boolean(toDelete)} title="Eliminar documento" description={toDelete ? `Se eliminará "${toDelete.nombre}" de forma permanente.` : ""} loading={deleting} onConfirm={confirmDelete} onCancel={() => setToDelete(null)} />
    </div>
  );
}

const inp = "h-11 w-full rounded-xl border border-line bg-surface/60 px-3.5 text-sm text-content placeholder:text-content-subtle focus:border-brand/50 focus:outline-none";

function DocForm({ obraId, onDone, onCancel }: { obraId: string; onDone: () => void; onCancel: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState("");
  const [fecha, setFecha] = useState(todayISO());
  const [notas, setNotas] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function guardar() {
    setError(null);
    if (!file) { setError("Selecciona un archivo."); return; }
    const fd = new FormData();
    fd.append("file", file);
    fd.append("nombre", nombre || file.name);
    fd.append("tipo", tipo || "Otro");
    fd.append("fecha", fecha);
    fd.append("notas", notas);
    start(async () => {
      const res = await subirDocumento(obraId, fd);
      if (res.ok) onDone();
      else setError(res.error ?? "Error");
    });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-content-muted">Archivo (PDF o imagen, ≤25 MB)</label>
          <label className={cn("flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-line bg-surface/40 px-4 py-3 text-sm font-medium transition-colors hover:border-brand/40", file ? "text-content" : "text-content-muted")}>
            {file ? <FileText className="h-4 w-4 text-brand" /> : <Upload className="h-4 w-4" />}
            <span className="truncate">{file ? file.name : "Elegir archivo"}</span>
            <input type="file" accept="application/pdf,image/*" onChange={(e) => { const f = e.target.files?.[0] ?? null; setFile(f); if (f && !nombre) setNombre(f.name.replace(/\.[^.]+$/, "")); }} className="hidden" />
          </label>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-content-muted">Nombre</label>
          <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Contrato firmado" className={inp} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-content-muted">Tipo</label>
            <SmartSelect value={tipo || null} onChange={setTipo} categoria="documento_tipo" defaults={TIPOS_DOCUMENTO} placeholder="Plano, Contrato…" ariaLabel="Tipo de documento" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-content-muted">Fecha</label>
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className={inp} />
          </div>
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
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Subir"}
        </button>
      </div>
    </div>
  );
}

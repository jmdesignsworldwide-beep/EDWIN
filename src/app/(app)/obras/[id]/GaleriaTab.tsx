"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Camera, Loader2, Trash2, X, ImageIcon, Download, NotebookPen } from "lucide-react";
import { Reveal, Stagger, EmptyState } from "@/components/primitives";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { listFotos, subirFoto, deleteFoto } from "../galeria-actions";
import { compressImage } from "@/lib/image";
import type { FotoObra } from "@/lib/proyectos/types";

function fmtFecha(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("es-DO", { day: "2-digit", month: "short", year: "numeric" });
}

export function GaleriaTab({ obraId }: { obraId: string }) {
  const [fotos, setFotos] = useState<FotoObra[]>([]);
  const [loading, setLoading] = useState(true);
  const [progreso, setProgreso] = useState<{ hecho: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<FotoObra | null>(null);
  const [toDelete, setToDelete] = useState<FotoObra | null>(null);
  const [deleting, startDelete] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(() => {
    setLoading(true);
    listFotos(obraId).then((f) => { setFotos(f); setLoading(false); });
  }, [obraId]);
  useEffect(() => { load(); }, [load]);

  async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;
    setError(null);
    setProgreso({ hecho: 0, total: files.length });
    for (let i = 0; i < files.length; i++) {
      const optimized = await compressImage(files[i]);
      const fd = new FormData();
      fd.append("file", optimized);
      const res = await subirFoto(obraId, fd);
      if (!res.ok) setError(res.error ?? "Error al subir.");
      setProgreso({ hecho: i + 1, total: files.length });
    }
    setProgreso(null);
    load();
  }

  function confirmDelete() {
    if (!toDelete) return;
    startDelete(async () => {
      await deleteFoto(toDelete.id, obraId, toDelete.path);
      setToDelete(null);
      load();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-content-muted">{fotos.length} foto{fotos.length === 1 ? "" : "s"} · avance de la obra</p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={Boolean(progreso)}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand-gradient px-4 text-sm font-semibold text-brand-ink shadow-glow transition-transform hover:scale-[1.02] active:scale-[0.99] disabled:opacity-70"
        >
          {progreso ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
          {progreso ? `Subiendo ${progreso.hecho}/${progreso.total}…` : "Subir fotos"}
        </button>
        <input ref={inputRef} type="file" accept="image/*" multiple onChange={onFiles} className="hidden" />
      </div>

      {error && <p className="rounded-lg bg-danger/10 px-3 py-2 text-xs font-medium text-danger">{error}</p>}

      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="aspect-square animate-pulse rounded-xl bg-surface-2/60" />)}
        </div>
      ) : fotos.length === 0 ? (
        <div className="rounded-2xl border border-line bg-surface/50 shadow-card">
          <EmptyState icon={ImageIcon} title="Sin fotos todavía" description="Sube fotos del avance desde la cámara o la galería del teléfono." actionLabel="Subir fotos" actionIcon={Camera} onAction={() => inputRef.current?.click()} size="sm" />
        </div>
      ) : (
        <Stagger className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {fotos.map((f) => (
            <Reveal key={f.id}>
              <button type="button" onClick={() => setLightbox(f)} className="group relative block aspect-square w-full overflow-hidden rounded-xl border border-line bg-surface-2/40">
                {f.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={f.url} alt={f.caption ?? "Foto de obra"} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                ) : (
                  <span className="grid h-full w-full place-items-center text-content-subtle"><ImageIcon className="h-6 w-6" /></span>
                )}
                {f.bitacora_id && (
                  <span className="absolute left-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-black/50 text-white" title="De la bitácora"><NotebookPen className="h-3.5 w-3.5" /></span>
                )}
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1 text-left text-[10px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                  {fmtFecha(f.fecha)}
                </span>
              </button>
            </Reveal>
          ))}
        </Stagger>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <div className="fixed inset-0 z-[70] grid place-items-center p-4">
            <motion.div className="absolute inset-0 bg-black/80 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setLightbox(null)} />
            <motion.div className="relative z-10 flex max-h-[90vh] w-full max-w-3xl flex-col" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}>
              {lightbox.url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={lightbox.url} alt={lightbox.caption ?? "Foto"} className="max-h-[78vh] w-full rounded-2xl object-contain" />
              )}
              <div className="mt-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  {lightbox.caption && <p className="truncate text-sm font-medium text-white">{lightbox.caption}</p>}
                  <p className="text-xs text-white/70">{fmtFecha(lightbox.fecha)}</p>
                </div>
                <div className="flex items-center gap-2">
                  {lightbox.url && <a href={lightbox.url} download target="_blank" rel="noopener noreferrer" className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-white hover:bg-white/20" title="Descargar"><Download className="h-5 w-5" /></a>}
                  <button type="button" onClick={() => { setToDelete(lightbox); setLightbox(null); }} className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-white hover:bg-danger" title="Eliminar"><Trash2 className="h-5 w-5" /></button>
                  <button type="button" onClick={() => setLightbox(null)} className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-white hover:bg-white/20"><X className="h-5 w-5" /></button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmDialog open={Boolean(toDelete)} title="Eliminar foto" description="Se eliminará esta foto de la obra de forma permanente." loading={deleting} onConfirm={confirmDelete} onCancel={() => setToDelete(null)} />
    </div>
  );
}

"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { Button, ProgressBar } from "@/components/primitives";
import {
  ESTADOS_ETAPA,
  type Etapa,
  type EtapaInput,
  type EstadoEtapa,
} from "@/lib/proyectos/types";
import { createEtapa, updateEtapa } from "@/app/(app)/obras/etapas-actions";
import { Select } from "@/components/ui/Select";
import { cn } from "@/lib/utils";

const FASES_SUGERIDAS = [
  "Cimentación",
  "Estructura",
  "Mampostería",
  "Techado",
  "Instalaciones",
  "Acabados",
  "Entrega",
];

/**
 * EtapaForm — crear/editar una fase de la obra. Estado ↔ avance enlazados
 * (completada = 100%, pendiente = 0%). Persiste en Supabase.
 */
export function EtapaForm({
  obraId,
  etapa,
  onSaved,
  onCancel,
}: {
  obraId: string;
  etapa?: Etapa;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const isEdit = Boolean(etapa);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<EtapaInput>({
    nombre: etapa?.nombre ?? "",
    estado: etapa?.estado ?? "pendiente",
    fecha_inicio: etapa?.fecha_inicio ?? "",
    fecha_fin: etapa?.fecha_fin ?? "",
    porcentaje: etapa?.porcentaje ?? 0,
    notas: etapa?.notas ?? "",
  });

  function set<K extends keyof EtapaInput>(k: K, v: EtapaInput[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function setEstado(estado: EstadoEtapa) {
    setForm((f) => ({
      ...f,
      estado,
      porcentaje:
        estado === "completada" ? 100 : estado === "pendiente" ? 0 : f.porcentaje,
    }));
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.nombre.trim()) {
      setError("El nombre de la fase es obligatorio.");
      return;
    }
    start(async () => {
      const res = isEdit
        ? await updateEtapa(obraId, etapa!.id, form)
        : await createEtapa(obraId, form);
      if (res.ok) onSaved();
      else setError(res.error);
    });
  }

  return (
    <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-content-muted">
            Nombre de la fase <span className="text-brand">*</span>
          </label>
          <input
            type="text"
            list="fases-sugeridas"
            value={form.nombre}
            onChange={(e) => set("nombre", e.target.value)}
            required
            maxLength={160}
            placeholder="Ej. Cimentación"
            className={inp}
          />
          <datalist id="fases-sugeridas">
            {FASES_SUGERIDAS.map((f) => (
              <option key={f} value={f} />
            ))}
          </datalist>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-content-muted">
            Estado
          </label>
          <Select
            value={form.estado}
            onChange={(v) => setEstado(v as EstadoEtapa)}
            ariaLabel="Estado de la etapa"
            options={ESTADOS_ETAPA.map((e) => ({ value: e.value, label: e.label }))}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-content-muted">
              Fecha de inicio
            </label>
            <input
              type="date"
              value={form.fecha_inicio ?? ""}
              onChange={(e) => set("fecha_inicio", e.target.value)}
              className={inp}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-content-muted">
              Fin estimado
            </label>
            <input
              type="date"
              value={form.fecha_fin ?? ""}
              onChange={(e) => set("fecha_fin", e.target.value)}
              className={inp}
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-content-muted">
            Avance — {form.porcentaje}%
          </label>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={form.porcentaje}
            onChange={(e) => set("porcentaje", Number(e.target.value))}
            className="w-full accent-brand"
            aria-label="Avance de la fase"
          />
          <ProgressBar
            value={form.porcentaje}
            size="sm"
            className="mt-2"
            tone={form.porcentaje === 100 ? "success" : "brand"}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-content-muted">
            Notas / observaciones
          </label>
          <textarea
            value={form.notas ?? ""}
            onChange={(e) => set("notas", e.target.value)}
            rows={3}
            placeholder="Detalles de la fase…"
            className={cn(inp, "min-h-[80px] resize-y py-2.5")}
          />
        </div>

        {error && (
          <p className="rounded-lg bg-danger/10 px-3 py-2 text-xs font-medium text-danger">
            {error}
          </p>
        )}
      </div>

      <div className="flex shrink-0 items-center justify-end gap-2.5 border-t border-line px-5 py-4">
        <Button type="button" variant="secondary" size="md" onClick={onCancel} disabled={pending}>
          Cancelar
        </Button>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-gradient px-5 text-sm font-semibold text-brand-ink shadow-glow transition-transform hover:scale-[1.02] active:scale-[0.99] disabled:opacity-70"
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isEdit ? (
            "Guardar fase"
          ) : (
            "Agregar fase"
          )}
        </button>
      </div>
    </form>
  );
}

const inp =
  "h-11 w-full rounded-xl border border-line bg-surface/60 px-3.5 text-sm text-content placeholder:text-content-subtle transition-colors focus:border-brand/50 focus:bg-surface focus:outline-none";

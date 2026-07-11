"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/primitives";
import {
  UNIDADES,
  type Etapa,
  type Material,
  type MaterialInput,
} from "@/lib/proyectos/types";
import {
  createMaterial,
  updateMaterial,
} from "@/app/(app)/obras/materiales-actions";
import { cn } from "@/lib/utils";

/**
 * MaterialForm — crear/editar material de la obra. La etapa es opcional
 * ("Toda la obra"). Las cantidades y el costo son opcionales. Persiste en
 * Supabase.
 */
export function MaterialForm({
  obraId,
  etapas,
  material,
  onSaved,
  onCancel,
}: {
  obraId: string;
  etapas: Etapa[];
  material?: Material;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const isEdit = Boolean(material);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<MaterialInput>({
    nombre: material?.nombre ?? "",
    etapa_id: material?.etapa_id ?? null,
    unidad: material?.unidad ?? "",
    cantidad_comprada: material?.cantidad_comprada ?? null,
    cantidad_usada: material?.cantidad_usada ?? null,
    costo_unitario: material?.costo_unitario ?? null,
    notas: material?.notas ?? "",
  });

  function set<K extends keyof MaterialInput>(k: K, v: MaterialInput[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }
  function setNum(k: "cantidad_comprada" | "cantidad_usada" | "costo_unitario", v: string) {
    set(k, v === "" ? null : Number(v));
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.nombre.trim()) {
      setError("El nombre del material es obligatorio.");
      return;
    }
    start(async () => {
      const res = isEdit
        ? await updateMaterial(obraId, material!.id, form)
        : await createMaterial(obraId, form);
      if (res.ok) onSaved();
      else setError(res.error);
    });
  }

  return (
    <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-content-muted">
            Nombre del material <span className="text-brand">*</span>
          </label>
          <input
            type="text"
            value={form.nombre}
            onChange={(e) => set("nombre", e.target.value)}
            required
            maxLength={160}
            placeholder="Ej. Cemento, Varilla 1/2, Blocks"
            className={inp}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-content-muted">
              Etapa (opcional)
            </label>
            <select
              value={form.etapa_id ?? ""}
              onChange={(e) => set("etapa_id", e.target.value === "" ? null : e.target.value)}
              className={cn(inp, "appearance-none")}
            >
              <option value="">Toda la obra</option>
              {etapas.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-content-muted">
              Unidad
            </label>
            <input
              type="text"
              list="unidades"
              value={form.unidad ?? ""}
              onChange={(e) => set("unidad", e.target.value)}
              placeholder="sacos, m³, galones…"
              className={inp}
            />
            <datalist id="unidades">
              {UNIDADES.map((u) => (
                <option key={u} value={u} />
              ))}
            </datalist>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-content-muted">Comprada</label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={form.cantidad_comprada ?? ""}
              onChange={(e) => setNum("cantidad_comprada", e.target.value)}
              placeholder="0"
              className={inp}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-content-muted">Usada</label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={form.cantidad_usada ?? ""}
              onChange={(e) => setNum("cantidad_usada", e.target.value)}
              placeholder="0"
              className={inp}
            />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="mb-1.5 block text-xs font-medium text-content-muted">
              Costo unit. (RD$)
            </label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={form.costo_unitario ?? ""}
              onChange={(e) => setNum("costo_unitario", e.target.value)}
              placeholder="0.00"
              className={inp}
            />
          </div>
        </div>
        <p className="text-[11px] text-content-subtle">
          Cantidades y costo son opcionales. El costo es gasto de material de la obra (no cobros).
        </p>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-content-muted">
            Notas / observaciones
          </label>
          <textarea
            value={form.notas ?? ""}
            onChange={(e) => set("notas", e.target.value)}
            rows={2}
            placeholder="Proveedor, marca, detalle…"
            className={cn(inp, "min-h-[64px] resize-y py-2.5")}
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
            "Guardar material"
          ) : (
            "Agregar material"
          )}
        </button>
      </div>
    </form>
  );
}

const inp =
  "h-11 w-full rounded-xl border border-line bg-surface/60 px-3.5 text-sm text-content placeholder:text-content-subtle transition-colors focus:border-brand/50 focus:bg-surface focus:outline-none";

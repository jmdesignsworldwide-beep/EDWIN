"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/primitives";
import {
  ESTADOS,
  UBICACIONES_RD,
  type Cliente,
  type Proyecto,
  type ProyectoInput,
  type EstadoObra,
} from "@/lib/proyectos/types";
import { createProyecto, updateProyecto } from "@/app/(app)/obras/actions";
import { ClienteSelect } from "./ClienteSelect";
import { cn } from "@/lib/utils";

/**
 * ObraForm — crear/editar una obra (datos de la obra). El cliente es un cliente
 * registrado (selector + quick-add). Las etapas y el avance se gestionan en el
 * cronograma de la obra (/obras/[id]). Persiste en Supabase y refresca.
 */
export function ObraForm({
  proyecto,
  clientes: clientesProp,
  onSaved,
  onCancel,
}: {
  proyecto?: Proyecto;
  clientes: Cliente[];
  onSaved: () => void;
  onCancel: () => void;
}) {
  const isEdit = Boolean(proyecto);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [clientes, setClientes] = useState<Cliente[]>(clientesProp);

  const [form, setForm] = useState<ProyectoInput>({
    nombre: proyecto?.nombre ?? "",
    ubicacion: proyecto?.ubicacion ?? "",
    cliente_id: proyecto?.cliente_id ?? null,
    estado: proyecto?.estado ?? "planificacion",
    fecha_inicio: proyecto?.fecha_inicio ?? "",
    fecha_fin_estimada: proyecto?.fecha_fin_estimada ?? "",
    presupuesto: proyecto?.presupuesto ?? null,
    notas: proyecto?.notas ?? "",
  });

  function set<K extends keyof ProyectoInput>(key: K, value: ProyectoInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.nombre.trim()) {
      setError("El nombre de la obra es obligatorio.");
      return;
    }
    startTransition(async () => {
      const payload = {
        ...form,
        presupuesto:
          form.presupuesto === null || Number.isNaN(form.presupuesto)
            ? null
            : form.presupuesto,
      };
      const res = isEdit
        ? await updateProyecto(proyecto!.id, payload)
        : await createProyecto(payload);
      if (res.ok) onSaved();
      else setError(res.error);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
      {/* Campos: scrollean dentro del modal; el footer queda fijo abajo. */}
      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
        <Field label="Nombre de la obra" required>
          <input
            type="text"
            value={form.nombre}
            onChange={(e) => set("nombre", e.target.value)}
            required
            maxLength={160}
            placeholder="Ej. Residencial Los Cerros"
            className={inputCls}
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Ubicación">
            <input
              type="text"
              list="ubicaciones-rd"
              value={form.ubicacion ?? ""}
              onChange={(e) => set("ubicacion", e.target.value)}
              placeholder="Provincia o ciudad"
              className={inputCls}
            />
            <datalist id="ubicaciones-rd">
              {UBICACIONES_RD.map((u) => (
                <option key={u} value={u} />
              ))}
            </datalist>
          </Field>

          <Field label="Estado">
            <select
              value={form.estado}
              onChange={(e) => set("estado", e.target.value as EstadoObra)}
              className={cn(inputCls, "appearance-none")}
            >
              {ESTADOS.map((e) => (
                <option key={e.value} value={e.value}>
                  {e.label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Cliente / propietario">
          <ClienteSelect
            clientes={clientes}
            value={form.cliente_id}
            onChange={(id) => set("cliente_id", id)}
            onClienteCreated={(c) => setClientes((prev) => [c, ...prev])}
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Fecha de inicio">
            <input
              type="date"
              value={form.fecha_inicio ?? ""}
              onChange={(e) => set("fecha_inicio", e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Fin estimado">
            <input
              type="date"
              value={form.fecha_fin_estimada ?? ""}
              onChange={(e) => set("fecha_fin_estimada", e.target.value)}
              className={inputCls}
            />
          </Field>
        </div>

        <Field label="Presupuesto de la obra (RD$)">
          <input
            type="number"
            min={0}
            step="0.01"
            value={form.presupuesto ?? ""}
            onChange={(e) =>
              set(
                "presupuesto",
                e.target.value === "" ? null : Number(e.target.value),
              )
            }
            placeholder="0.00"
            className={inputCls}
          />
          <p className="mt-1 text-[11px] text-content-subtle">
            Presupuesto de la obra de Edwin (no cobros ni contratos).
          </p>
        </Field>

        <Field label="Notas / descripción">
          <textarea
            value={form.notas ?? ""}
            onChange={(e) => set("notas", e.target.value)}
            rows={3}
            placeholder="Detalles, alcance, observaciones…"
            className={cn(inputCls, "min-h-[84px] resize-y py-2.5")}
          />
        </Field>

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
            "Guardar cambios"
          ) : (
            "Crear obra"
          )}
        </button>
      </div>
    </form>
  );
}

const inputCls =
  "h-11 w-full rounded-xl border border-line bg-surface/60 px-3.5 text-sm text-content placeholder:text-content-subtle transition-colors focus:border-brand/50 focus:bg-surface focus:outline-none";

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-content-muted">
        {label}
        {required && <span className="text-brand"> *</span>}
      </label>
      {children}
    </div>
  );
}

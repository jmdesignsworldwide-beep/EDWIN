"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/primitives";
import {
  CATEGORIAS_PROVEEDOR,
  type Proveedor,
  type ProveedorInput,
} from "@/lib/proyectos/types";
import {
  createProveedor,
  updateProveedor,
} from "@/app/(app)/proveedores/actions";
import { cn } from "@/lib/utils";

/** ProveedorForm — crear/editar un proveedor del directorio. */
export function ProveedorForm({
  proveedor,
  onSaved,
  onCancel,
}: {
  proveedor?: Proveedor;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const isEdit = Boolean(proveedor);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<ProveedorInput>({
    nombre: proveedor?.nombre ?? "",
    telefono: proveedor?.telefono ?? "",
    rnc_cedula: proveedor?.rnc_cedula ?? "",
    categoria: proveedor?.categoria ?? "",
    contacto: proveedor?.contacto ?? "",
    notas: proveedor?.notas ?? "",
  });

  function set<K extends keyof ProveedorInput>(k: K, v: ProveedorInput[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.nombre.trim()) {
      setError("El nombre / razón social es obligatorio.");
      return;
    }
    start(async () => {
      const res = isEdit
        ? await updateProveedor(proveedor!.id, form)
        : await createProveedor(form);
      if (res.ok) onSaved();
      else setError(res.error);
    });
  }

  return (
    <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-content-muted">
            Nombre / razón social <span className="text-brand">*</span>
          </label>
          <input
            type="text"
            value={form.nombre}
            onChange={(e) => set("nombre", e.target.value)}
            required
            maxLength={180}
            placeholder="Ej. Ferretería Popular"
            className={inp}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-content-muted">Categoría / rubro</label>
            <input
              type="text"
              list="categorias-prov"
              value={form.categoria ?? ""}
              onChange={(e) => set("categoria", e.target.value)}
              placeholder="Ferretería, Bloquera…"
              className={inp}
            />
            <datalist id="categorias-prov">
              {CATEGORIAS_PROVEEDOR.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-content-muted">Teléfono</label>
            <input
              type="tel"
              value={form.telefono ?? ""}
              onChange={(e) => set("telefono", e.target.value)}
              placeholder="809-000-0000"
              className={inp}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-content-muted">RNC / cédula</label>
            <input
              type="text"
              value={form.rnc_cedula ?? ""}
              onChange={(e) => set("rnc_cedula", e.target.value)}
              placeholder="RNC (9 díg.) o cédula"
              className={inp}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-content-muted">Contacto</label>
            <input
              type="text"
              value={form.contacto ?? ""}
              onChange={(e) => set("contacto", e.target.value)}
              placeholder="Persona de contacto"
              className={inp}
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-content-muted">Notas</label>
          <textarea
            value={form.notas ?? ""}
            onChange={(e) => set("notas", e.target.value)}
            rows={2}
            placeholder="Condiciones, dirección, observaciones…"
            className={cn(inp, "min-h-[64px] resize-y py-2.5")}
          />
        </div>

        {error && (
          <p className="rounded-lg bg-danger/10 px-3 py-2 text-xs font-medium text-danger">{error}</p>
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
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : isEdit ? "Guardar proveedor" : "Registrar proveedor"}
        </button>
      </div>
    </form>
  );
}

const inp =
  "h-11 w-full rounded-xl border border-line bg-surface/60 px-3.5 text-sm text-content placeholder:text-content-subtle transition-colors focus:border-brand/50 focus:bg-surface focus:outline-none";

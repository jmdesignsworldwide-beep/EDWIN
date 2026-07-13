"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/primitives";
import type { Compra, CompraInput } from "@/lib/proyectos/types";
import {
  createCompra,
  updateCompra,
} from "@/app/(app)/proveedores/compras-actions";
import { Select } from "@/components/ui/Select";
import { cn } from "@/lib/utils";

/** CompraForm — registrar/editar una compra a un proveedor (registro simple). */
export function CompraForm({
  proveedorId,
  obras,
  compra,
  onSaved,
  onCancel,
}: {
  proveedorId: string;
  obras: { id: string; nombre: string }[];
  compra?: Compra;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const isEdit = Boolean(compra);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<CompraInput>({
    fecha: compra?.fecha ?? new Date().toISOString().slice(0, 10),
    descripcion: compra?.descripcion ?? "",
    monto: compra?.monto ?? null,
    obra_id: compra?.obra_id ?? null,
    notas: compra?.notas ?? "",
  });

  function set<K extends keyof CompraInput>(k: K, v: CompraInput[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.fecha) {
      setError("La fecha de la compra es obligatoria.");
      return;
    }
    start(async () => {
      const res = isEdit
        ? await updateCompra(proveedorId, compra!.id, form)
        : await createCompra(proveedorId, form);
      if (res.ok) onSaved();
      else setError(res.error);
    });
  }

  return (
    <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-content-muted">
              Fecha <span className="text-brand">*</span>
            </label>
            <input
              type="date"
              value={form.fecha}
              onChange={(e) => set("fecha", e.target.value)}
              required
              className={inp}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-content-muted">Monto (RD$)</label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={form.monto ?? ""}
              onChange={(e) => set("monto", e.target.value === "" ? null : Number(e.target.value))}
              placeholder="0.00"
              className={inp}
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-content-muted">Descripción</label>
          <input
            type="text"
            value={form.descripcion ?? ""}
            onChange={(e) => set("descripcion", e.target.value)}
            placeholder="Ej. 20 sacos cemento + 5 qq varilla"
            className={inp}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-content-muted">Obra (opcional)</label>
          <Select
            value={form.obra_id ?? ""}
            onChange={(v) => set("obra_id", v === "" ? null : v)}
            ariaLabel="Obra"
            options={[
              { value: "", label: "Sin obra específica" },
              ...obras.map((o) => ({ value: o.id, label: o.nombre })),
            ]}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-content-muted">Notas</label>
          <textarea
            value={form.notas ?? ""}
            onChange={(e) => set("notas", e.target.value)}
            rows={2}
            placeholder="Factura, condiciones…"
            className={cn(inp, "min-h-[64px] resize-y py-2.5")}
          />
        </div>

        <p className="text-[11px] text-content-subtle">
          El monto es gasto de material de la obra de Edwin (no cobros ni contratos).
        </p>

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
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : isEdit ? "Guardar compra" : "Registrar compra"}
        </button>
      </div>
    </form>
  );
}

const inp =
  "h-11 w-full rounded-xl border border-line bg-surface/60 px-3.5 text-sm text-content placeholder:text-content-subtle transition-colors focus:border-brand/50 focus:bg-surface focus:outline-none";

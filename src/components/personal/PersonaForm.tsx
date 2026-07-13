"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/primitives";
import {
  OFICIOS,
  JORNAL_TIPOS,
  type JornalTipo,
  type Persona,
  type PersonaInput,
} from "@/lib/proyectos/types";
import { createPersona, updatePersona } from "@/app/(app)/personal/actions";
import { Select } from "@/components/ui/Select";
import { SmartSelect } from "@/components/ui/SmartSelect";
import { cn } from "@/lib/utils";

/** PersonaForm — alta/edición de una persona. Jornal es dato sensible (server-only). */
export function PersonaForm({
  persona,
  onSaved,
  onCancel,
}: {
  persona?: Persona;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const isEdit = Boolean(persona);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<PersonaInput>({
    nombre: persona?.nombre ?? "",
    oficio: persona?.oficio ?? "",
    telefono: persona?.telefono ?? "",
    cedula: persona?.cedula ?? "",
    jornal: persona?.jornal ?? null,
    jornal_tipo: persona?.jornal_tipo ?? "dia",
    activo: persona?.activo ?? true,
    notas: persona?.notas ?? "",
  });

  function set<K extends keyof PersonaInput>(k: K, v: PersonaInput[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.nombre.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }
    start(async () => {
      const res = isEdit ? await updatePersona(persona!.id, form) : await createPersona(form);
      if (res.ok) onSaved();
      else setError(res.error);
    });
  }

  return (
    <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
        <Field label="Nombre completo" required>
          <input type="text" value={form.nombre} onChange={(e) => set("nombre", e.target.value)} required maxLength={180} placeholder="Ej. Juan Pérez" className={inp} />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Rol / oficio">
            <SmartSelect
              value={form.oficio ?? ""}
              onChange={(v) => set("oficio", v)}
              categoria="oficio"
              defaults={OFICIOS}
              placeholder="Maestro, Ayudante…"
              ariaLabel="Rol u oficio"
            />
          </Field>
          <Field label="Estado">
            <Select
              value={form.activo ? "1" : "0"}
              onChange={(v) => set("activo", v === "1")}
              ariaLabel="Estado"
              options={[
                { value: "1", label: "Activo" },
                { value: "0", label: "Inactivo" },
              ]}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Teléfono">
            <input type="tel" value={form.telefono ?? ""} onChange={(e) => set("telefono", e.target.value)} placeholder="809-000-0000" className={inp} />
          </Field>
          <Field label="Cédula">
            <input type="text" value={form.cedula ?? ""} onChange={(e) => set("cedula", e.target.value)} placeholder="000-0000000-0" className={inp} />
          </Field>
        </div>

        <Field label="Jornal / tarifa (RD$)">
          <div className="flex gap-2">
            <input
              type="number"
              min={0}
              step="0.01"
              value={form.jornal ?? ""}
              onChange={(e) => set("jornal", e.target.value === "" ? null : Number(e.target.value))}
              placeholder="0.00"
              className={inp}
            />
            <div className="w-40 shrink-0">
              <Select
                value={form.jornal_tipo}
                onChange={(v) => set("jornal_tipo", v as JornalTipo)}
                ariaLabel="Tipo de jornal"
                options={JORNAL_TIPOS.map((t) => ({ value: t.value, label: t.label }))}
              />
            </div>
          </div>
          <p className="mt-1 text-[11px] text-content-subtle">
            Pago de Edwin a su trabajador (dato sensible). No son cobros ni contratos.
          </p>
        </Field>

        <Field label="Notas">
          <textarea value={form.notas ?? ""} onChange={(e) => set("notas", e.target.value)} rows={2} placeholder="Observaciones…" className={cn(inp, "min-h-[64px] resize-y py-2.5")} />
        </Field>

        {error && <p className="rounded-lg bg-danger/10 px-3 py-2 text-xs font-medium text-danger">{error}</p>}
      </div>

      <div className="flex shrink-0 items-center justify-end gap-2.5 border-t border-line px-5 py-4">
        <Button type="button" variant="secondary" size="md" onClick={onCancel} disabled={pending}>Cancelar</Button>
        <button type="submit" disabled={pending} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-gradient px-5 text-sm font-semibold text-brand-ink shadow-glow transition-transform hover:scale-[1.02] active:scale-[0.99] disabled:opacity-70">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : isEdit ? "Guardar" : "Registrar persona"}
        </button>
      </div>
    </form>
  );
}

const inp =
  "h-11 w-full rounded-xl border border-line bg-surface/60 px-3.5 text-sm text-content placeholder:text-content-subtle transition-colors focus:border-brand/50 focus:bg-surface focus:outline-none";

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-content-muted">
        {label}{required && <span className="text-brand"> *</span>}
      </label>
      {children}
    </div>
  );
}

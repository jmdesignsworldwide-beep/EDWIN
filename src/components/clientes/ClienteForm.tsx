"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Loader2, User, Building2 } from "lucide-react";
import { Button } from "@/components/primitives";
import { createCliente, updateCliente } from "@/app/(app)/clientes/actions";
import {
  documentoLabel,
  type Cliente,
  type ClienteInput,
  type ClienteTipo,
} from "@/lib/proyectos/types";
import { cn } from "@/lib/utils";

/**
 * ClienteForm — crear/editar un cliente. El tipo (Persona/Empresa) es un toggle
 * que cambia los campos y las validaciones: Persona pide cédula; Empresa pide
 * razón social, RNC y persona de contacto.
 */
export function ClienteForm({
  cliente,
  onSaved,
  onCancel,
}: {
  cliente?: Cliente;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const isEdit = Boolean(cliente);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [tipo, setTipo] = useState<ClienteTipo>(cliente?.tipo ?? "persona");
  const [form, setForm] = useState<Omit<ClienteInput, "tipo">>({
    nombre: cliente?.nombre ?? "",
    telefono: cliente?.telefono ?? "",
    cedula_rnc: cliente?.cedula_rnc ?? "",
    email: cliente?.email ?? "",
    direccion: cliente?.direccion ?? "",
    contacto_nombre: cliente?.contacto_nombre ?? "",
    contacto_telefono: cliente?.contacto_telefono ?? "",
  });

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const payload: ClienteInput = { ...form, tipo };
    start(async () => {
      const res = isEdit
        ? await updateCliente(cliente!.id, payload)
        : await createCliente(payload);
      if (res.ok) onSaved();
      else setError(res.error);
    });
  }

  const esEmpresa = tipo === "empresa";

  return (
    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
        {/* Toggle de tipo */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-content-muted">Tipo de cliente</label>
          <div className="inline-flex w-full overflow-hidden rounded-xl border border-line">
            <TipoBtn active={!esEmpresa} onClick={() => setTipo("persona")} icon={User}>Persona</TipoBtn>
            <TipoBtn active={esEmpresa} onClick={() => setTipo("empresa")} icon={Building2}>Empresa</TipoBtn>
          </div>
        </div>

        <Field label={esEmpresa ? "Razón social" : "Nombre completo"} required>
          <input
            type="text"
            value={form.nombre}
            onChange={(e) => set("nombre", e.target.value)}
            required
            maxLength={180}
            placeholder={esEmpresa ? "Ej. Constructora del Cibao SRL" : "Ej. Juan Pérez"}
            className={inputCls}
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Teléfono">
            <input
              type="tel"
              value={form.telefono ?? ""}
              onChange={(e) => set("telefono", e.target.value)}
              placeholder="809-000-0000"
              className={inputCls}
            />
          </Field>
          <Field label={documentoLabel(tipo)}>
            <input
              type="text"
              value={form.cedula_rnc ?? ""}
              onChange={(e) => set("cedula_rnc", e.target.value)}
              placeholder={esEmpresa ? "RNC (9 dígitos)" : "000-0000000-0"}
              className={inputCls}
            />
          </Field>
        </div>

        {esEmpresa && (
          <div className="grid grid-cols-1 gap-4 rounded-xl border border-line bg-surface-2/30 p-3.5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <p className="text-xs font-semibold text-content">Persona de contacto</p>
              <p className="text-[11px] text-content-subtle">Quién atiende dentro de la empresa.</p>
            </div>
            <Field label="Nombre del contacto">
              <input
                type="text"
                value={form.contacto_nombre ?? ""}
                onChange={(e) => set("contacto_nombre", e.target.value)}
                placeholder="Ej. María Gómez"
                className={inputCls}
              />
            </Field>
            <Field label="Teléfono del contacto">
              <input
                type="tel"
                value={form.contacto_telefono ?? ""}
                onChange={(e) => set("contacto_telefono", e.target.value)}
                placeholder="809-000-0000"
                className={inputCls}
              />
            </Field>
          </div>
        )}

        <Field label="Correo electrónico">
          <input
            type="email"
            value={form.email ?? ""}
            onChange={(e) => set("email", e.target.value)}
            placeholder="correo@ejemplo.com"
            className={inputCls}
          />
        </Field>

        <Field label="Dirección">
          <input
            type="text"
            value={form.direccion ?? ""}
            onChange={(e) => set("direccion", e.target.value)}
            placeholder="Calle, sector, ciudad"
            className={inputCls}
          />
        </Field>

        {error && (
          <p className="rounded-lg bg-danger/10 px-3 py-2 text-xs font-medium text-danger">{error}</p>
        )}
      </div>

      <div className="flex shrink-0 items-center justify-end gap-2.5 border-t border-line px-5 py-4">
        <Button type="button" variant="secondary" size="md" onClick={onCancel} disabled={pending}>Cancelar</Button>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-gradient px-5 text-sm font-semibold text-brand-ink shadow-glow transition-transform hover:scale-[1.02] active:scale-[0.99] disabled:opacity-70"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : isEdit ? "Guardar cambios" : "Registrar cliente"}
        </button>
      </div>
    </form>
  );
}

const inputCls =
  "h-11 w-full rounded-xl border border-line bg-surface/60 px-3.5 text-sm text-content placeholder:text-content-subtle transition-colors focus:border-brand/50 focus:bg-surface focus:outline-none";

function TipoBtn({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof User;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-1 items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-semibold transition-colors",
        active ? "bg-brand-gradient text-brand-ink" : "bg-surface text-content-muted hover:bg-surface-2",
      )}
    >
      <Icon className="h-4 w-4" />
      {children}
    </button>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
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

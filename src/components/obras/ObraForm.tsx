"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Loader2, Paperclip, X, FileText, Upload, ExternalLink } from "lucide-react";
import { Button } from "@/components/primitives";
import {
  UBICACIONES_RD,
  TIPOS_OBRA,
  METODOS_ANTICIPO,
  type Cliente,
  type Proyecto,
  type ProyectoInput,
  type MetodoAnticipo,
} from "@/lib/proyectos/types";
import {
  createProyecto,
  updateProyecto,
  subirArchivoObra,
  signedArchivoUrl,
} from "@/app/(app)/obras/actions";
import { ClienteSelect } from "./ClienteSelect";
import { Select } from "@/components/ui/Select";
import { SmartSelect } from "@/components/ui/SmartSelect";
import { cn } from "@/lib/utils";

/**
 * ObraForm — crear/editar una obra, organizado por secciones para verse
 * profesional. Solo Nombre y Cliente son obligatorios; todo lo demás es
 * opcional (Edwin puede registrar rápido y completar luego).
 */
export function ObraForm({
  proyecto,
  clientes: clientesProp,
  personal,
  onSaved,
  onCancel,
}: {
  proyecto?: Proyecto;
  clientes: Cliente[];
  personal: { id: string; nombre: string }[];
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
    estado: proyecto?.estado ?? "en_curso",
    fecha_inicio: proyecto?.fecha_inicio ?? "",
    fecha_fin_estimada: proyecto?.fecha_fin_estimada ?? "",
    presupuesto: proyecto?.presupuesto ?? null,
    hora_entrada_esperada: proyecto?.hora_entrada_esperada ?? "",
    tipo_obra: proyecto?.tipo_obra ?? "",
    metros: proyecto?.metros ?? null,
    direccion: proyecto?.direccion ?? "",
    telefono_obra: proyecto?.telefono_obra ?? "",
    encargado_id: proyecto?.encargado_id ?? null,
    anticipo_monto: proyecto?.anticipo_monto ?? null,
    anticipo_metodo: proyecto?.anticipo_metodo ?? null,
    archivo_inicial: proyecto?.archivo_inicial ?? null,
    // Rentabilidad se edita en la pestaña Financiero; se conserva al guardar la obra.
    costo_estimado: proyecto?.costo_estimado ?? null,
    precio_venta: proyecto?.precio_venta ?? null,
    notas: proyecto?.notas ?? "",
  });

  const [archivoNombre, setArchivoNombre] = useState<string | null>(proyecto?.archivo_inicial ? "Archivo actual" : null);
  const [subiendo, setSubiendo] = useState(false);
  const [archivoError, setArchivoError] = useState<string | null>(null);

  function set<K extends keyof ProyectoInput>(key: K, value: ProyectoInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setArchivoError(null);
    setSubiendo(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await subirArchivoObra(fd);
    setSubiendo(false);
    if (res.ok) {
      set("archivo_inicial", res.path);
      setArchivoNombre(file.name);
    } else {
      setArchivoError(res.error);
    }
  }

  async function verArchivo() {
    if (!form.archivo_inicial) return;
    const url = await signedArchivoUrl(form.archivo_inicial);
    if (url) window.open(url, "_blank", "noopener");
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.nombre.trim()) {
      setError("El nombre de la obra es obligatorio.");
      return;
    }
    if (!form.cliente_id) {
      setError("Selecciona (o registra) el cliente de la obra.");
      return;
    }
    startTransition(async () => {
      const res = isEdit ? await updateProyecto(proyecto!.id, form) : await createProyecto(form);
      if (res.ok) onSaved();
      else setError(res.error);
    });
  }

  const personalOpts = [
    { value: "", label: "Sin encargado asignado" },
    ...personal.map((p) => ({ value: p.id, label: p.nombre })),
  ];

  return (
    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
        {/* Sección 1 — Datos generales */}
        <Section title="Datos generales">
          <Field label="Nombre de la obra" required>
            <input type="text" value={form.nombre} onChange={(e) => set("nombre", e.target.value)} required maxLength={160} placeholder="Ej. Residencial Los Cerros" className={inputCls} />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Tipo de obra">
              <SmartSelect
                value={form.tipo_obra ?? ""}
                onChange={(v) => set("tipo_obra", v)}
                categoria="tipo_obra"
                defaults={TIPOS_OBRA}
                placeholder="Residencial, Comercial…"
                ariaLabel="Tipo de obra"
              />
            </Field>
            <Field label="Tamaño (m²)">
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.metros ?? ""}
                onChange={(e) => set("metros", e.target.value === "" ? null : Number(e.target.value))}
                placeholder="Ej. 240"
                className={inputCls}
              />
            </Field>
          </div>
        </Section>

        {/* Sección 2 — Ubicación */}
        <Section title="Ubicación">
          <Field label="Provincia / ciudad">
            <input type="text" list="ubicaciones-rd" value={form.ubicacion ?? ""} onChange={(e) => set("ubicacion", e.target.value)} placeholder="Provincia o ciudad" className={inputCls} />
            <datalist id="ubicaciones-rd">
              {UBICACIONES_RD.map((u) => <option key={u} value={u} />)}
            </datalist>
          </Field>
          <Field label="Dirección exacta">
            <input type="text" value={form.direccion ?? ""} onChange={(e) => set("direccion", e.target.value)} placeholder="Calle, número, sector, referencia" className={inputCls} />
          </Field>
        </Section>

        {/* Sección 3 — Cliente y contacto */}
        <Section title="Cliente y contacto">
          <Field label="Cliente / propietario" required>
            <ClienteSelect
              clientes={clientes}
              value={form.cliente_id}
              onChange={(id) => set("cliente_id", id)}
              onClienteCreated={(c) => setClientes((prev) => [c, ...prev])}
            />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Teléfono de la obra">
              <input type="tel" value={form.telefono_obra ?? ""} onChange={(e) => set("telefono_obra", e.target.value)} placeholder="Contacto en sitio (opcional)" className={inputCls} />
            </Field>
            <Field label="Encargado / maestro responsable">
              <Select
                value={form.encargado_id ?? ""}
                onChange={(v) => set("encargado_id", v === "" ? null : v)}
                options={personalOpts}
                ariaLabel="Encargado de la obra"
                placeholder="Sin encargado asignado"
              />
            </Field>
          </div>
        </Section>

        {/* Sección 4 — Detalles económicos */}
        <Section title="Detalles económicos">
          <Field label="Presupuesto de la obra (RD$)">
            <input type="number" min={0} step="0.01" value={form.presupuesto ?? ""} onChange={(e) => set("presupuesto", e.target.value === "" ? null : Number(e.target.value))} placeholder="0.00" className={inputCls} />
            <p className="mt-1 text-[11px] text-content-subtle">Presupuesto de la obra de Edwin (no cobros ni contratos).</p>
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Anticipo del cliente (RD$)">
              <input type="number" min={0} step="0.01" value={form.anticipo_monto ?? ""} onChange={(e) => set("anticipo_monto", e.target.value === "" ? null : Number(e.target.value))} placeholder="0.00" className={inputCls} />
            </Field>
            <Field label="Forma de pago del anticipo">
              <Select
                value={form.anticipo_metodo ?? ""}
                onChange={(v) => set("anticipo_metodo", v === "" ? null : (v as MetodoAnticipo))}
                options={[{ value: "", label: "—" }, ...METODOS_ANTICIPO.map((m) => ({ value: m.value, label: m.label }))]}
                ariaLabel="Forma de pago del anticipo"
                placeholder="—"
              />
            </Field>
          </div>
          <p className="text-[11px] text-content-subtle">El anticipo es informativo por ahora; se conectará al panel financiero más adelante.</p>
        </Section>

        {/* Sección 5 — Fechas */}
        <Section title="Fechas">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Fecha de inicio">
              <input type="date" value={form.fecha_inicio ?? ""} onChange={(e) => set("fecha_inicio", e.target.value)} className={inputCls} />
            </Field>
            <Field label="Fin estimado">
              <input type="date" value={form.fecha_fin_estimada ?? ""} onChange={(e) => set("fecha_fin_estimada", e.target.value)} className={inputCls} />
            </Field>
          </div>
        </Section>

        {/* Sección 6 — Archivos y notas */}
        <Section title="Archivos y notas">
          <Field label="Foto o documento inicial (plano, contrato, terreno)">
            {form.archivo_inicial ? (
              <div className="flex items-center gap-2 rounded-xl border border-line bg-surface-2/40 p-2.5">
                <FileText className="h-4 w-4 shrink-0 text-brand" />
                <span className="min-w-0 flex-1 truncate text-sm text-content">{archivoNombre ?? "Archivo"}</span>
                <button type="button" onClick={verArchivo} className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-brand hover:bg-brand/10" title="Ver archivo">
                  <ExternalLink className="h-3.5 w-3.5" />Ver
                </button>
                <button type="button" onClick={() => { set("archivo_inicial", null); setArchivoNombre(null); }} aria-label="Quitar archivo" className="grid h-8 w-8 place-items-center rounded-lg text-content-subtle hover:bg-danger/10 hover:text-danger">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label className={cn("flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-line bg-surface/40 px-4 py-3 text-sm font-medium text-content-muted transition-colors hover:border-brand/40 hover:text-content", subiendo && "pointer-events-none opacity-70")}>
                {subiendo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {subiendo ? "Subiendo…" : "Subir imagen o PDF"}
                <input type="file" accept="image/*,application/pdf" onChange={onFile} className="hidden" disabled={subiendo} />
              </label>
            )}
            {archivoError && <p className="mt-1 text-[11px] font-medium text-danger">{archivoError}</p>}
            <p className="mt-1 flex items-center gap-1 text-[11px] text-content-subtle"><Paperclip className="h-3 w-3" />Imagen o PDF, hasta 10 MB. Guardado en almacenamiento privado.</p>
          </Field>
          <Field label="Notas / descripción">
            <textarea value={form.notas ?? ""} onChange={(e) => set("notas", e.target.value)} rows={3} placeholder="Detalles, alcance, observaciones…" className={cn(inputCls, "min-h-[84px] resize-y py-2.5")} />
          </Field>
        </Section>

        {error && <p className="rounded-lg bg-danger/10 px-3 py-2 text-xs font-medium text-danger">{error}</p>}
      </div>

      <div className="flex shrink-0 items-center justify-end gap-2.5 border-t border-line px-5 py-4">
        <Button type="button" variant="secondary" size="md" onClick={onCancel} disabled={pending}>Cancelar</Button>
        <button type="submit" disabled={pending || subiendo} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-gradient px-5 text-sm font-semibold text-brand-ink shadow-glow transition-transform hover:scale-[1.02] active:scale-[0.99] disabled:opacity-70">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : isEdit ? "Guardar cambios" : "Crear obra"}
        </button>
      </div>
    </form>
  );
}

const inputCls =
  "h-11 w-full rounded-xl border border-line bg-surface/60 px-3.5 text-sm text-content placeholder:text-content-subtle transition-colors focus:border-brand/50 focus:bg-surface focus:outline-none";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-content-subtle">
        <span className="h-1 w-6 rounded-full bg-brand-gradient" />
        {title}
      </h3>
      {children}
    </section>
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

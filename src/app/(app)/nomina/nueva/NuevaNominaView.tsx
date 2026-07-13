"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CalendarRange,
  Calculator,
  ArrowLeft,
  Loader2,
  Plus,
  Trash2,
  SlidersHorizontal,
  Save,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Reveal, Button, EmptyState, CountUp } from "@/components/primitives";
import { Modal } from "@/components/ui/Modal";
import { calcularPreview, guardarNomina } from "../actions";
import {
  round2,
  type PreviewLinea,
} from "@/lib/proyectos/types";
import { formatMoney, cn } from "@/lib/utils";

type ConceptoDraft = { id: string; concepto: string; monto: string };
type AjusteDraft = { extras: ConceptoDraft[]; descuentos: ConceptoDraft[] };

function monthRange() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  const y = d.getFullYear(), m = d.getMonth();
  return { desde: `${y}-${p(m + 1)}-01`, hasta: `${y}-${p(m + 1)}-${p(d.getDate())}` };
}

let seq = 0;
const uid = () => `c${seq++}`;

function sumaDraft(rows: ConceptoDraft[]): number {
  return round2(
    rows.reduce((acc, r) => {
      const n = Number(r.monto);
      return acc + (Number.isFinite(n) && n > 0 ? n : 0);
    }, 0),
  );
}

export function NuevaNominaView({ configured }: { configured: boolean }) {
  const router = useRouter();
  const init = monthRange();
  const [desde, setDesde] = useState(init.desde);
  const [hasta, setHasta] = useState(init.hasta);
  const [preview, setPreview] = useState<PreviewLinea[] | null>(null);
  const [ajustes, setAjustes] = useState<Record<string, AjusteDraft>>({});
  const [editing, setEditing] = useState<PreviewLinea | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [calc, startCalc] = useTransition();
  const [saving, startSave] = useTransition();

  const inp =
    "h-10 rounded-xl border border-line bg-surface/60 px-3 text-sm text-content focus:border-brand/50 focus:outline-none";

  function calcular() {
    setError(null);
    startCalc(async () => {
      const res = await calcularPreview(desde, hasta);
      if (res.ok) {
        setPreview(res.lineas);
        setAjustes({});
        if (res.lineas.length === 0) {
          setError("No hay asistencia registrada en ese rango.");
        }
      } else {
        setPreview(null);
        setError(res.error);
      }
    });
  }

  // Neto por persona = base + extras − descuentos (se recalcula en el servidor).
  const netoDe = (l: PreviewLinea): number => {
    const a = ajustes[l.persona_id];
    const ext = a ? sumaDraft(a.extras) : 0;
    const des = a ? sumaDraft(a.descuentos) : 0;
    return round2(l.base + ext - des);
  };

  const total = useMemo(() => {
    if (!preview) return 0;
    return round2(preview.reduce((acc, l) => acc + netoDe(l), 0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preview, ajustes]);

  function guardar() {
    if (!preview || preview.length === 0) return;
    setError(null);
    const payload = {
      desde,
      hasta,
      ajustes: preview.map((l) => {
        const a = ajustes[l.persona_id];
        return {
          persona_id: l.persona_id,
          extras: (a?.extras ?? []).map((e) => ({ concepto: e.concepto, monto: e.monto })),
          descuentos: (a?.descuentos ?? []).map((e) => ({ concepto: e.concepto, monto: e.monto })),
        };
      }),
    };
    startSave(async () => {
      const res = await guardarNomina(payload);
      if (res.ok) {
        router.push(`/nomina/${res.id}`);
      } else {
        setError(res.error);
      }
    });
  }

  function saveAjuste(personaId: string, draft: AjusteDraft) {
    setAjustes((prev) => ({ ...prev, [personaId]: draft }));
    setEditing(null);
  }

  return (
    <>
      <div className="mb-2">
        <Link
          href="/nomina"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-content-muted transition-colors hover:text-content"
        >
          <ArrowLeft className="h-4 w-4" />
          Nóminas
        </Link>
      </div>

      <PageHeader
        title="Nueva nómina"
        subtitle="Elige el rango. Se calcula con los días de asistencia y el jornal de cada persona."
      />

      {!configured ? (
        <Reveal standalone>
          <div className="rounded-2xl border border-line bg-surface/50 shadow-card">
            <EmptyState
              icon={CalendarRange}
              title="Falta conectar Supabase"
              description="En cuanto se configuren las llaves, aquí podrás calcular la nómina."
              tone="accent"
            />
          </div>
        </Reveal>
      ) : (
        <>
          {/* Rango + calcular */}
          <div className="mb-5 rounded-2xl border border-line bg-surface/50 p-4 shadow-card">
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-content-muted">Desde</label>
                <input type="date" value={desde} max={hasta} onChange={(e) => setDesde(e.target.value)} className={inp} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-content-muted">Hasta</label>
                <input type="date" value={hasta} min={desde} onChange={(e) => setHasta(e.target.value)} className={inp} />
              </div>
              <button
                type="button"
                onClick={calcular}
                disabled={calc}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-brand-gradient px-5 text-sm font-semibold text-brand-ink shadow-glow transition-transform hover:scale-[1.02] active:scale-[0.99] disabled:opacity-70"
              >
                {calc ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calculator className="h-4 w-4" />}
                Calcular
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-5 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3">
              <p className="text-sm font-medium text-danger">{error}</p>
            </div>
          )}

          {preview && preview.length > 0 && (
            <>
              {/* Tabla de personas */}
              <div className="overflow-hidden rounded-2xl border border-line bg-surface/50 shadow-card">
                <div className="hidden grid-cols-[1.6fr_repeat(4,1fr)_auto] gap-2 border-b border-line bg-surface-2/40 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-content-subtle sm:grid">
                  <span>Persona</span>
                  <span className="text-right">Días</span>
                  <span className="text-right">Base</span>
                  <span className="text-right">Extras</span>
                  <span className="text-right">Descuentos</span>
                  <span className="pl-2 text-right">Neto</span>
                </div>
                <ul className="divide-y divide-line">
                  {preview.map((l) => {
                    const a = ajustes[l.persona_id];
                    const ext = a ? sumaDraft(a.extras) : 0;
                    const des = a ? sumaDraft(a.descuentos) : 0;
                    const neto = round2(l.base + ext - des);
                    return (
                      <li
                        key={l.persona_id}
                        className="grid grid-cols-2 gap-x-2 gap-y-1 px-4 py-3 sm:grid-cols-[1.6fr_repeat(4,1fr)_auto] sm:items-center"
                      >
                        <div className="col-span-2 min-w-0 sm:col-span-1">
                          <p className="truncate text-sm font-semibold text-content">{l.persona_nombre}</p>
                          <p className="truncate text-xs text-content-subtle">
                            {l.dias.toLocaleString("es-DO", { maximumFractionDigits: 2 })} días ×{" "}
                            {formatMoney(l.jornal_diario)}/día
                          </p>
                        </div>
                        <Cell label="Días" className="tabular-nums text-content-muted">
                          {l.dias.toLocaleString("es-DO", { maximumFractionDigits: 2 })}
                        </Cell>
                        <Cell label="Base" className="tabular-nums text-content">
                          {formatMoney(l.base)}
                        </Cell>
                        <Cell label="Extras" className={cn("tabular-nums", ext > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-content-subtle")}>
                          {ext > 0 ? `+${formatMoney(ext)}` : "—"}
                        </Cell>
                        <Cell label="Descuentos" className={cn("tabular-nums", des > 0 ? "text-rose-600 dark:text-rose-400" : "text-content-subtle")}>
                          {des > 0 ? `−${formatMoney(des)}` : "—"}
                        </Cell>
                        <div className="col-span-2 flex items-center justify-between gap-2 border-t border-line/60 pt-2 sm:col-span-1 sm:justify-end sm:border-0 sm:pt-0 sm:pl-2">
                          <span className="text-xs font-medium text-content-muted sm:hidden">Neto</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold tabular-nums text-content">{formatMoney(neto)}</span>
                            <button
                              type="button"
                              onClick={() => setEditing(l)}
                              aria-label={`Ajustar ${l.persona_nombre}`}
                              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-content-subtle transition-colors hover:bg-surface-2 hover:text-brand"
                            >
                              <SlidersHorizontal className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>

                {/* Total */}
                <div className="flex items-center justify-between gap-3 border-t-2 border-line bg-surface-2/40 px-4 py-3.5">
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-content">
                    <Users className="h-4 w-4 text-content-subtle" />
                    Total ({preview.length} {preview.length === 1 ? "persona" : "personas"})
                  </span>
                  <CountUp
                    value={total}
                    duration={0.6}
                    format={formatMoney}
                    className="text-xl font-bold tabular-nums text-brand sm:text-2xl"
                  />
                </div>
              </div>

              <div className="mt-5 flex items-center justify-end gap-2.5">
                <Link href="/nomina">
                  <Button variant="secondary" size="md">Cancelar</Button>
                </Link>
                <button
                  type="button"
                  onClick={guardar}
                  disabled={saving}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-gradient px-5 text-sm font-semibold text-brand-ink shadow-glow transition-transform hover:scale-[1.02] active:scale-[0.99] disabled:opacity-70"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Guardar nómina
                </button>
              </div>
              <p className="mt-3 text-center text-xs text-content-subtle">
                Al guardar, los montos se recalculan y congelan en el servidor. Después podrás marcarla como pagada.
              </p>
            </>
          )}
        </>
      )}

      {/* Modal de ajustes por persona */}
      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing?.persona_nombre ?? "Ajustes"}
        subtitle={editing ? editing.supuesto : undefined}
      >
        {editing && (
          <AjusteForm
            linea={editing}
            initial={ajustes[editing.persona_id]}
            onSave={(d) => saveAjuste(editing.persona_id, d)}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>
    </>
  );
}

function Cell({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-1 sm:block sm:text-right">
      <span className="text-xs font-medium text-content-muted sm:hidden">{label}</span>
      <span className={cn("text-sm", className)}>{children}</span>
    </div>
  );
}

function AjusteForm({
  linea,
  initial,
  onSave,
  onCancel,
}: {
  linea: PreviewLinea;
  initial?: AjusteDraft;
  onSave: (d: AjusteDraft) => void;
  onCancel: () => void;
}) {
  const [extras, setExtras] = useState<ConceptoDraft[]>(initial?.extras ?? []);
  const [descuentos, setDescuentos] = useState<ConceptoDraft[]>(initial?.descuentos ?? []);

  const ext = sumaDraft(extras);
  const des = sumaDraft(descuentos);
  const neto = round2(linea.base + ext - des);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
        <div className="rounded-xl border border-line bg-surface-2/40 px-4 py-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-content-muted">Base</span>
            <span className="font-semibold tabular-nums text-content">{formatMoney(linea.base)}</span>
          </div>
        </div>

        <ConceptoList
          titulo="Extras"
          hint="Horas extra, bonos…"
          tone="extra"
          rows={extras}
          onChange={setExtras}
        />
        <ConceptoList
          titulo="Descuentos"
          hint="Adelantos, otros…"
          tone="descuento"
          rows={descuentos}
          onChange={setDescuentos}
        />
      </div>

      <div className="shrink-0 border-t border-line px-5 py-4">
        <div className="mb-3 flex items-center justify-between rounded-xl bg-surface-2/50 px-4 py-2.5">
          <span className="text-sm font-medium text-content-muted">Neto</span>
          <span className="text-lg font-bold tabular-nums text-brand">{formatMoney(neto)}</span>
        </div>
        <div className="flex items-center justify-end gap-2.5">
          <Button type="button" variant="secondary" size="md" onClick={onCancel}>Cancelar</Button>
          <button
            type="button"
            onClick={() => onSave({ extras, descuentos })}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-gradient px-5 text-sm font-semibold text-brand-ink shadow-glow transition-transform hover:scale-[1.02] active:scale-[0.99]"
          >
            Aplicar
          </button>
        </div>
      </div>
    </div>
  );
}

function ConceptoList({
  titulo,
  hint,
  tone,
  rows,
  onChange,
}: {
  titulo: string;
  hint: string;
  tone: "extra" | "descuento";
  rows: ConceptoDraft[];
  onChange: (rows: ConceptoDraft[]) => void;
}) {
  const inp =
    "h-10 w-full rounded-lg border border-line bg-surface/60 px-3 text-sm text-content placeholder:text-content-subtle focus:border-brand/50 focus:outline-none";

  function add() {
    onChange([...rows, { id: uid(), concepto: "", monto: "" }]);
  }
  function update(id: string, patch: Partial<ConceptoDraft>) {
    onChange(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }
  function remove(id: string) {
    onChange(rows.filter((r) => r.id !== id));
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <div>
          <p className={cn("text-sm font-semibold", tone === "extra" ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300")}>
            {titulo}
          </p>
          <p className="text-xs text-content-subtle">{hint}</p>
        </div>
        <button
          type="button"
          onClick={add}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line px-3 text-xs font-semibold text-content transition-colors hover:bg-surface-2"
        >
          <Plus className="h-3.5 w-3.5" />
          Agregar
        </button>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line px-3 py-2.5 text-center text-xs text-content-subtle">
          Sin {titulo.toLowerCase()}.
        </p>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center gap-2">
              <input
                type="text"
                value={r.concepto}
                onChange={(e) => update(r.id, { concepto: e.target.value })}
                placeholder="Concepto"
                className={cn(inp, "flex-1")}
              />
              <input
                type="number"
                min={0}
                step="0.01"
                inputMode="decimal"
                value={r.monto}
                onChange={(e) => update(r.id, { monto: e.target.value })}
                placeholder="0.00"
                className={cn(inp, "w-28 text-right tabular-nums")}
              />
              <button
                type="button"
                onClick={() => remove(r.id)}
                aria-label="Quitar"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-content-subtle transition-colors hover:bg-danger/10 hover:text-danger"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

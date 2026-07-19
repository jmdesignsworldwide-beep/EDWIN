"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Landmark,
  Plus,
  Database,
  ArrowRight,
  ArrowDownCircle,
  ArrowUpCircle,
  Loader2,
  CalendarClock,
  AlertTriangle,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Reveal, Stagger, Button, EmptyState, MagneticCard, CountUp } from "@/components/primitives";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { addPrestamo } from "./actions";
import type { Vencimiento } from "./actions";
import {
  PRESTAMO_TIPOS,
  PRESTAMO_ESTADO_BADGE,
  FRECUENCIAS,
  totalPrestamo,
  interesSimple,
  type Prestamo,
  type PrestamoTipo,
  type FrecuenciaCuota,
} from "@/lib/proyectos/types";
import { formatMoney, cn } from "@/lib/utils";

function todayISO(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
function fmtFecha(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("es-DO", { day: "2-digit", month: "short", year: "numeric" });
}
function saldoPendiente(p: Prestamo): number {
  return (p.cuotas ?? []).filter((c) => !c.pagada).reduce((a, c) => a + c.monto, 0);
}

type Filtro = "todos" | PrestamoTipo;

export function PrestamosView({
  prestamos,
  vencimientos,
  obras,
  configured,
}: {
  prestamos: Prestamo[];
  vencimientos: Vencimiento[];
  obras: { id: string; nombre: string }[];
  configured: boolean;
}) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [filtro, setFiltro] = useState<Filtro>("todos");

  const totales = useMemo(() => {
    let porPagar = 0, porCobrar = 0;
    for (const p of prestamos) {
      if (p.estado !== "activo") continue;
      const s = saldoPendiente(p);
      if (p.tipo === "por_pagar") porPagar += s;
      else porCobrar += s;
    }
    return { porPagar, porCobrar };
  }, [prestamos]);

  const visibles = filtro === "todos" ? prestamos : prestamos.filter((p) => p.tipo === filtro);

  return (
    <>
      <PageHeader
        title="Préstamos"
        subtitle="Dinero que pediste (por pagar) y que diste (por cobrar), con cuotas y vencimientos"
        action={configured ? <Button icon={Plus} onClick={() => setCreating(true)}>Nuevo préstamo</Button> : undefined}
      />

      {!configured ? (
        <Reveal standalone>
          <div className="rounded-2xl border border-line bg-surface/50 shadow-card">
            <EmptyState icon={Database} title="Falta conectar Supabase" description="En cuanto se configuren las llaves, aquí llevarás los préstamos." tone="accent" />
          </div>
        </Reveal>
      ) : (
        <>
          {/* Resumen */}
          <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <ResumenCard icon={ArrowUpCircle} label="Por pagar" value={totales.porPagar} tone="out" />
            <ResumenCard icon={ArrowDownCircle} label="Por cobrar" value={totales.porCobrar} tone="in" />
            <div className="rounded-2xl border border-line bg-surface/50 p-4 shadow-card">
              <p className="flex items-center gap-1.5 text-xs text-content-subtle"><CalendarClock className="h-3.5 w-3.5" />Próximos vencimientos</p>
              <p className="mt-1 text-lg font-bold tabular-nums text-content sm:text-xl">{vencimientos.length}</p>
            </div>
          </div>

          {/* Vencimientos */}
          {vencimientos.length > 0 && (
            <div className="mb-5 rounded-2xl border border-amber-500/30 bg-amber-500/[0.06] p-4">
              <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-amber-700 dark:text-amber-300"><AlertTriangle className="h-4 w-4" />Cuotas por vencer o vencidas</p>
              <ul className="space-y-1.5">
                {vencimientos.slice(0, 6).map((v) => {
                  const vencida = v.diasRestantes < 0;
                  return (
                    <li key={v.cuota.id} className="flex items-center justify-between gap-2 text-xs">
                      <Link href={`/prestamos/${v.prestamo.id}`} className="min-w-0 flex-1 truncate text-content hover:text-brand">
                        <span className="font-medium">{v.prestamo.contraparte}</span>
                        <span className="text-content-subtle"> · cuota {v.cuota.numero} · {fmtFecha(v.cuota.vence)}</span>
                      </Link>
                      <span className="tabular-nums font-semibold text-content">{formatMoney(v.cuota.monto)}</span>
                      <span className={cn("shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold", vencida ? "bg-rose-500/15 text-rose-700 dark:text-rose-300" : "bg-amber-500/15 text-amber-700 dark:text-amber-300")}>
                        {vencida ? `${Math.abs(v.diasRestantes)}d vencida` : v.diasRestantes === 0 ? "hoy" : `en ${v.diasRestantes}d`}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Filtro */}
          {prestamos.length > 0 && (
            <div className="mb-5 inline-flex rounded-xl border border-line bg-surface/60 p-1">
              {(["todos", "por_pagar", "por_cobrar"] as Filtro[]).map((f) => (
                <button key={f} type="button" onClick={() => setFiltro(f)} className={cn("rounded-lg px-3.5 py-2 text-sm font-medium transition-colors", filtro === f ? "bg-brand-gradient text-brand-ink shadow-glow" : "text-content-muted hover:text-content")}>
                  {f === "todos" ? "Todos" : f === "por_pagar" ? "Por pagar" : "Por cobrar"}
                </button>
              ))}
            </div>
          )}

          {prestamos.length === 0 ? (
            <Reveal standalone>
              <div className="rounded-2xl border border-line bg-surface/50 shadow-card">
                <EmptyState icon={Landmark} title="Sin préstamos" description="Registra un préstamo que pediste o que diste, con su tasa y cuotas." actionLabel="Nuevo préstamo" actionIcon={Plus} onAction={() => setCreating(true)} />
              </div>
            </Reveal>
          ) : (
            <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {visibles.map((p) => {
                const total = totalPrestamo(p.capital, p.tasa);
                const saldo = saldoPendiente(p);
                const est = PRESTAMO_ESTADO_BADGE[p.estado];
                return (
                  <Reveal key={p.id}>
                    <Link href={`/prestamos/${p.id}`} className="block">
                      <MagneticCard className="cursor-pointer p-5" intensity={4}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold", p.tipo === "por_pagar" ? "bg-rose-500/12 text-rose-700 dark:text-rose-300" : "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300")}>
                              {p.tipo === "por_pagar" ? <ArrowUpCircle className="h-3 w-3" /> : <ArrowDownCircle className="h-3 w-3" />}
                              {p.tipo === "por_pagar" ? "Por pagar" : "Por cobrar"}
                            </span>
                            <h3 className="mt-1.5 truncate text-base font-semibold text-content">{p.contraparte}</h3>
                          </div>
                          <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold", est.badge)}>{est.label}</span>
                        </div>
                        <dl className="mt-3 space-y-1 text-sm">
                          <div className="flex justify-between"><dt className="text-content-muted">Capital</dt><dd className="tabular-nums text-content">{formatMoney(p.capital)}</dd></div>
                          <div className="flex justify-between"><dt className="text-content-muted">Total ({p.tasa}%)</dt><dd className="tabular-nums font-semibold text-content">{formatMoney(total)}</dd></div>
                          <div className="flex justify-between border-t border-line pt-1"><dt className="text-content-muted">Pendiente</dt><dd className={cn("tabular-nums font-bold", saldo > 0 ? "text-content" : "text-emerald-700 dark:text-emerald-300")}>{formatMoney(saldo)}</dd></div>
                        </dl>
                        <div className="mt-3 flex items-center justify-between border-t border-line pt-2 text-xs text-content-subtle">
                          <span>{(p.cuotas ?? []).length} cuota{(p.cuotas ?? []).length === 1 ? "" : "s"}{p.obra ? ` · ${p.obra.nombre}` : ""}</span>
                          <ArrowRight className="h-3.5 w-3.5 text-brand" />
                        </div>
                      </MagneticCard>
                    </Link>
                  </Reveal>
                );
              })}
            </Stagger>
          )}
        </>
      )}

      <Modal open={creating} onClose={() => setCreating(false)} title="Nuevo préstamo" subtitle="Interés simple sobre el capital">
        <PrestamoForm obras={obras} onDone={(id) => { setCreating(false); if (id) router.push(`/prestamos/${id}`); else router.refresh(); }} onCancel={() => setCreating(false)} />
      </Modal>
    </>
  );
}

function ResumenCard({ icon: Icon, label, value, tone }: { icon: typeof Landmark; label: string; value: number; tone: "in" | "out" }) {
  return (
    <div className="rounded-2xl border border-line bg-surface/50 p-4 shadow-card">
      <p className="flex items-center gap-1.5 text-xs text-content-subtle"><Icon className="h-3.5 w-3.5" />{label}</p>
      <p className={cn("mt-1 text-lg font-bold tabular-nums sm:text-xl", tone === "out" ? "text-rose-600 dark:text-rose-400" : "text-emerald-700 dark:text-emerald-300")}>
        <CountUp value={value} duration={0.7} format={formatMoney} />
      </p>
    </div>
  );
}

const inp = "h-11 w-full rounded-xl border border-line bg-surface/60 px-3.5 text-sm text-content placeholder:text-content-subtle focus:border-brand/50 focus:outline-none";

function PrestamoForm({ obras, onDone, onCancel }: { obras: { id: string; nombre: string }[]; onDone: (id?: string) => void; onCancel: () => void }) {
  const [tipo, setTipo] = useState<PrestamoTipo>("por_pagar");
  const [contraparte, setContraparte] = useState("");
  const [capital, setCapital] = useState("");
  const [tasa, setTasa] = useState("");
  const [fecha, setFecha] = useState(todayISO());
  const [frecuencia, setFrecuencia] = useState<FrecuenciaCuota>("mensual");
  const [nCuotas, setNCuotas] = useState("1");
  const [obraId, setObraId] = useState("");
  const [notas, setNotas] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const cap = Number(capital) || 0;
  const t = Number(tasa) || 0;
  const interes = interesSimple(cap, t);
  const total = totalPrestamo(cap, t);
  const cuotasN = frecuencia === "unica" ? 1 : Math.max(1, Math.floor(Number(nCuotas) || 1));
  const porCuota = cuotasN > 0 ? total / cuotasN : 0;

  function guardar() {
    setError(null);
    start(async () => {
      const res = await addPrestamo({ tipo, contraparte, capital, tasa, fecha_inicio: fecha, frecuencia, numero_cuotas: cuotasN, obra_id: obraId || null, notas });
      if (res.ok) onDone(res.id);
      else setError(res.error ?? "Error");
    });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-content-muted">Tipo</label>
          <div className="inline-flex w-full overflow-hidden rounded-xl border border-line">
            {PRESTAMO_TIPOS.map((tp) => (
              <button key={tp.value} type="button" onClick={() => setTipo(tp.value)} className={cn("flex-1 px-3 py-2.5 text-sm font-semibold transition-colors", tipo === tp.value ? "bg-brand-gradient text-brand-ink" : "bg-surface text-content-muted hover:bg-surface-2")}>{tp.label}</button>
            ))}
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-content-muted">{tipo === "por_pagar" ? "Prestamista (a quién le debes)" : "Deudor (quién te debe)"}</label>
          <input type="text" value={contraparte} onChange={(e) => setContraparte(e.target.value)} placeholder="Nombre" className={inp} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-content-muted">Capital (RD$)</label>
            <input type="number" min={0} step="0.01" inputMode="decimal" value={capital} onChange={(e) => setCapital(e.target.value)} placeholder="0.00" className={cn(inp, "tabular-nums")} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-content-muted">Tasa de interés (%)</label>
            <input type="number" min={0} step="0.01" inputMode="decimal" value={tasa} onChange={(e) => setTasa(e.target.value)} placeholder="0" className={cn(inp, "tabular-nums")} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-content-muted">Fecha de inicio</label>
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className={inp} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-content-muted">Frecuencia</label>
            <Select value={frecuencia} onChange={(v) => setFrecuencia(v as FrecuenciaCuota)} options={FRECUENCIAS.map((f) => ({ value: f.value, label: f.label }))} ariaLabel="Frecuencia de cuotas" />
          </div>
        </div>
        {frecuencia !== "unica" && (
          <div>
            <label className="mb-1.5 block text-xs font-medium text-content-muted">Número de cuotas</label>
            <input type="number" min={1} max={360} step="1" value={nCuotas} onChange={(e) => setNCuotas(e.target.value)} className={cn(inp, "tabular-nums")} />
          </div>
        )}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-content-muted">Obra ligada (opcional)</label>
          <Select value={obraId} onChange={(v) => setObraId(v)} placeholder="Sin obra" ariaLabel="Obra ligada" options={[{ value: "", label: "Sin obra" }, ...obras.map((o) => ({ value: o.id, label: o.nombre }))]} />
        </div>

        {cap > 0 && (
          <div className="space-y-1 rounded-xl bg-surface-2/50 px-4 py-3 text-sm">
            <div className="flex justify-between"><span className="text-content-muted">Interés</span><span className="tabular-nums text-content">{formatMoney(interes)}</span></div>
            <div className="flex justify-between font-semibold"><span className="text-content-muted">Total a {tipo === "por_pagar" ? "pagar" : "cobrar"}</span><span className="tabular-nums text-content">{formatMoney(total)}</span></div>
            <div className="flex justify-between border-t border-line pt-1"><span className="text-content-muted">{cuotasN} cuota{cuotasN === 1 ? "" : "s"} de</span><span className="tabular-nums text-brand">{formatMoney(porCuota)}</span></div>
          </div>
        )}
        {error && <p className="rounded-lg bg-danger/10 px-3 py-2 text-xs font-medium text-danger">{error}</p>}
      </div>
      <div className="flex shrink-0 items-center justify-end gap-2.5 border-t border-line px-5 py-4">
        <Button type="button" variant="secondary" size="md" onClick={onCancel} disabled={pending}>Cancelar</Button>
        <button type="button" onClick={guardar} disabled={pending} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-gradient px-5 text-sm font-semibold text-brand-ink shadow-glow transition-transform hover:scale-[1.02] active:scale-[0.99] disabled:opacity-70">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Registrar préstamo"}
        </button>
      </div>
    </div>
  );
}

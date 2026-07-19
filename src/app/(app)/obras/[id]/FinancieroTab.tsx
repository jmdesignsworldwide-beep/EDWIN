"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Loader2,
  Trash2,
  Pencil,
  Package,
  Users,
  ShoppingCart,
  Receipt,
  Wallet,
  TrendingDown,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowDownCircle,
  ArrowUpCircle,
  Scale,
  Target,
} from "lucide-react";
import { Reveal, CountUp, Button, EmptyState } from "@/components/primitives";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Select } from "@/components/ui/Select";
import { SmartSelect } from "@/components/ui/SmartSelect";
import { addGasto, updateGasto, deleteGasto } from "../financiero-actions";
import { addCobro, updateCobro, deleteCobro, setRentabilidad, type DineroObra } from "../cobros-actions";
import {
  CATEGORIAS_GASTO,
  METODOS_ANTICIPO,
  METODO_ANTICIPO_LABEL,
  type GastoObra,
  type Cobro,
  type MetodoAnticipo,
} from "@/lib/proyectos/types";
import { formatMoney, cn } from "@/lib/utils";

function fmtFecha(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("es-DO", { day: "2-digit", month: "short", year: "numeric" });
}
function todayISO(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
function pctTxt(v: number | null): string {
  return v == null ? "—" : `${v.toFixed(1)}%`;
}

const SEMAFORO = {
  sano: { ring: "ring-emerald-500/30", bg: "bg-emerald-500/[0.06]", text: "text-emerald-700 dark:text-emerald-300", bar: "bg-emerald-500", icon: CheckCircle2, label: "En presupuesto" },
  alerta: { ring: "ring-amber-500/30", bg: "bg-amber-500/[0.06]", text: "text-amber-700 dark:text-amber-300", bar: "bg-amber-500", icon: AlertTriangle, label: "Cerca del límite" },
  excedido: { ring: "ring-rose-500/30", bg: "bg-rose-500/[0.06]", text: "text-rose-700 dark:text-rose-300", bar: "bg-rose-500", icon: XCircle, label: "Presupuesto excedido" },
  sin_presupuesto: { ring: "ring-line", bg: "bg-surface-2/40", text: "text-content-muted", bar: "bg-brand", icon: Wallet, label: "Sin presupuesto definido" },
} as const;

export function FinancieroTab({ obraId, dinero }: { obraId: string; dinero: DineroObra }) {
  const router = useRouter();
  const { financiero: resumen, gastos, cobros, anticipo, cobrado, caja, rentabilidad: r } = dinero;

  const [gastoForm, setGastoForm] = useState<{ type: "closed" } | { type: "create" } | { type: "edit"; gasto: GastoObra }>({ type: "closed" });
  const [cobroForm, setCobroForm] = useState<{ type: "closed" } | { type: "create" } | { type: "edit"; cobro: Cobro }>({ type: "closed" });
  const [rentaOpen, setRentaOpen] = useState(false);
  const [toDeleteGasto, setToDeleteGasto] = useState<GastoObra | null>(null);
  const [toDeleteCobro, setToDeleteCobro] = useState<Cobro | null>(null);
  const [busy, setBusy] = useState(false);

  const sem = SEMAFORO[resumen.estado];
  const SemIcon = sem.icon;
  const pct = resumen.ejecutado ?? 0;
  const excedido = resumen.estado === "excedido";

  async function delGasto() {
    if (!toDeleteGasto) return;
    setBusy(true); await deleteGasto(toDeleteGasto.id, obraId); setBusy(false);
    setToDeleteGasto(null); router.refresh();
  }
  async function delCobro() {
    if (!toDeleteCobro) return;
    setBusy(true); await deleteCobro(toDeleteCobro.id, obraId); setBusy(false);
    setToDeleteCobro(null); router.refresh();
  }

  return (
    <div className="space-y-8">
      {/* ── RENTABILIDAD ── */}
      <section className="space-y-3">
        <SectionHead icon={Target} title="Rentabilidad" action={<Button icon={Pencil} size="sm" variant="secondary" onClick={() => setRentaOpen(true)}>Estimado</Button>} />
        {r.precioVenta == null && r.costoEstimado == null ? (
          <div className="rounded-2xl border border-dashed border-line bg-surface/40 px-5 py-8 text-center">
            <p className="text-sm font-medium text-content">Aún sin rentabilidad definida</p>
            <p className="mx-auto mt-1 max-w-sm text-xs text-content-muted">Ingresa el precio de venta (lo que le cobras al cliente) y el costo estimado para ver la ganancia proyectada vs. la real.</p>
            <button type="button" onClick={() => setRentaOpen(true)} className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand-gradient px-3.5 text-xs font-semibold text-brand-ink">
              <Pencil className="h-3.5 w-3.5" />Definir estimado
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <GananciaCard titulo="Proyectada" subtitulo="Precio − costo estimado" monto={r.proyectadaMonto} pct={r.proyectadaPct} />
              <GananciaCard titulo="Real" subtitulo="Precio − gasto real" monto={r.realMonto} pct={r.realPct} destacado />
            </div>
            <div className="grid grid-cols-3 gap-3 rounded-2xl border border-line bg-surface/50 p-4 shadow-card">
              <MiniStat label="Precio de venta" value={r.precioVenta} />
              <MiniStat label="Costo estimado" value={r.costoEstimado} />
              <MiniStat label="Gasto real" value={r.gastoReal} />
            </div>
            {r.proyectadaPct != null && r.realPct != null && (
              <p className={cn("flex items-center gap-1.5 text-xs font-medium", r.realPct >= r.proyectadaPct ? "text-emerald-700 dark:text-emerald-300" : "text-amber-700 dark:text-amber-300")}>
                {r.realPct >= r.proyectadaPct ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                Proyectaste {pctTxt(r.proyectadaPct)} de margen; vas en {pctTxt(r.realPct)}.
              </p>
            )}
          </>
        )}
      </section>

      {/* ── FLUJO DE CAJA ── */}
      <section className="space-y-3">
        <SectionHead icon={Scale} title="Flujo de caja" />
        <div className={cn("grid grid-cols-3 gap-3 rounded-2xl border border-line p-5 shadow-card ring-1 ring-inset", caja >= 0 ? "ring-emerald-500/25 bg-emerald-500/[0.05]" : "ring-rose-500/25 bg-rose-500/[0.05]")}>
          <CajaStat icon={ArrowDownCircle} label="Cobrado" value={cobrado} tone="in" />
          <CajaStat icon={ArrowUpCircle} label="Gasto real" value={r.gastoReal} tone="out" />
          <CajaStat icon={Scale} label="Diferencia" value={caja} tone={caja >= 0 ? "pos" : "neg"} />
        </div>
        <p className="text-center text-xs text-content-subtle">
          Cobrado = anticipo + cobros. Las salidas son el gasto real del panel (no se cuentan dos veces).
        </p>
      </section>

      {/* ── PRESUPUESTO (gasto real) ── */}
      <section className="space-y-3">
        <SectionHead icon={Wallet} title="Presupuesto vs. gasto" />
        <Reveal standalone>
          <div className={cn("rounded-2xl border border-line p-5 shadow-card ring-1 ring-inset", sem.ring, sem.bg)}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <span className={cn("inline-flex items-center gap-1.5 text-sm font-semibold", sem.text)}>
                <SemIcon className="h-4 w-4" />{sem.label}
              </span>
              {resumen.ejecutado != null && <span className={cn("text-sm font-bold tabular-nums", sem.text)}>{resumen.ejecutado.toFixed(0)}% ejecutado</span>}
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Stat label="Presupuesto" value={resumen.presupuesto} muted />
              <Stat label="Gastado" value={resumen.gastado} strong />
              <Stat label="Restante" value={resumen.restante} tone={excedido ? "danger" : "brand"} />
            </div>
            {resumen.presupuesto != null && resumen.presupuesto > 0 && (
              <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-surface-2">
                <div className={cn("h-full rounded-full transition-all", sem.bar)} style={{ width: `${Math.min(100, pct)}%` }} />
              </div>
            )}
          </div>
        </Reveal>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Fuente icon={Package} label="Materiales" value={resumen.materiales} />
          <Fuente icon={Users} label="Mano de obra" value={resumen.manoObra} />
          <Fuente icon={ShoppingCart} label="Compras" value={resumen.compras} />
          <Fuente icon={Receipt} label="Gastos varios" value={resumen.gastosManuales} />
        </div>
      </section>

      {/* ── COBROS ── */}
      <section className="space-y-3">
        <SectionHead icon={ArrowDownCircle} title="Cobros" hint={`${cobros.length + (anticipo ? 1 : 0)}`} action={<Button icon={Plus} size="sm" onClick={() => setCobroForm({ type: "create" })}>Registrar cobro</Button>} />
        {cobros.length === 0 && !anticipo ? (
          <div className="rounded-2xl border border-line bg-surface/50 shadow-card">
            <EmptyState icon={ArrowDownCircle} title="Sin cobros" description="Registra lo que el cliente te ha pagado por la obra (anticipo, abonos, pago final)." actionLabel="Registrar cobro" actionIcon={Plus} onAction={() => setCobroForm({ type: "create" })} size="sm" />
          </div>
        ) : (
          <ul className="space-y-2.5">
            {anticipo && (
              <li className="flex flex-wrap items-center gap-3 rounded-xl border border-brand/25 bg-brand/[0.05] p-3.5 shadow-card">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-brand/12 px-2 py-0.5 text-[11px] font-semibold text-brand ring-1 ring-inset ring-brand/25">Anticipo</span>
                    {anticipo.metodo && <span className="text-xs text-content-subtle">{METODO_ANTICIPO_LABEL[anticipo.metodo]}</span>}
                  </div>
                  <p className="mt-1 truncate text-xs text-content-subtle">Del registro de la obra (edítalo en el formulario de la obra).</p>
                </div>
                <span className="text-sm font-bold tabular-nums text-content">{formatMoney(anticipo.monto)}</span>
              </li>
            )}
            {cobros.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-surface/50 p-3.5 shadow-card">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-emerald-500/12 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-500/25 dark:text-emerald-300">Cobro</span>
                    <span className="text-xs tabular-nums text-content-subtle">{fmtFecha(c.fecha)}</span>
                    {c.metodo && <span className="text-xs text-content-subtle">· {METODO_ANTICIPO_LABEL[c.metodo]}</span>}
                  </div>
                  {c.concepto && <p className="mt-1 truncate text-sm text-content">{c.concepto}</p>}
                  {c.notas && <p className="truncate text-xs text-content-subtle">{c.notas}</p>}
                </div>
                <span className="text-sm font-bold tabular-nums text-content">{formatMoney(c.monto)}</span>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => setCobroForm({ type: "edit", cobro: c })} aria-label="Editar" className="grid h-8 w-8 place-items-center rounded-lg text-content-subtle transition-colors hover:bg-surface-2 hover:text-content"><Pencil className="h-4 w-4" /></button>
                  <button type="button" onClick={() => setToDeleteCobro(c)} aria-label="Eliminar" className="grid h-8 w-8 place-items-center rounded-lg text-content-subtle transition-colors hover:bg-danger/10 hover:text-danger"><Trash2 className="h-4 w-4" /></button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── GASTOS VARIOS ── */}
      <section className="space-y-3">
        <SectionHead icon={Receipt} title="Gastos varios" hint={`${gastos.length}`} action={<Button icon={Plus} size="sm" onClick={() => setGastoForm({ type: "create" })}>Agregar gasto</Button>} />
        {gastos.length === 0 ? (
          <div className="rounded-2xl border border-line bg-surface/50 shadow-card">
            <EmptyState icon={TrendingDown} title="Sin gastos varios" description="Combustible, transporte, alquiler de equipo u otros gastos sueltos de la obra." actionLabel="Agregar gasto" actionIcon={Plus} onAction={() => setGastoForm({ type: "create" })} size="sm" />
          </div>
        ) : (
          <ul className="space-y-2.5">
            {gastos.map((g) => (
              <li key={g.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-surface/50 p-3.5 shadow-card">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-brand/12 px-2 py-0.5 text-[11px] font-semibold text-brand ring-1 ring-inset ring-brand/25">{g.categoria}</span>
                    <span className="text-xs tabular-nums text-content-subtle">{fmtFecha(g.fecha)}</span>
                  </div>
                  {g.concepto && <p className="mt-1 truncate text-sm text-content">{g.concepto}</p>}
                  {g.notas && <p className="truncate text-xs text-content-subtle">{g.notas}</p>}
                </div>
                <span className="text-sm font-bold tabular-nums text-content">{formatMoney(g.monto)}</span>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => setGastoForm({ type: "edit", gasto: g })} aria-label="Editar" className="grid h-8 w-8 place-items-center rounded-lg text-content-subtle transition-colors hover:bg-surface-2 hover:text-content"><Pencil className="h-4 w-4" /></button>
                  <button type="button" onClick={() => setToDeleteGasto(g)} aria-label="Eliminar" className="grid h-8 w-8 place-items-center rounded-lg text-content-subtle transition-colors hover:bg-danger/10 hover:text-danger"><Trash2 className="h-4 w-4" /></button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Modales */}
      <Modal open={rentaOpen} onClose={() => setRentaOpen(false)} title="Rentabilidad estimada" subtitle="Lo que le cobras al cliente y lo que estimas gastar">
        <RentabilidadForm obraId={obraId} costoEstimado={r.costoEstimado} precioVenta={r.precioVenta} onDone={() => { setRentaOpen(false); router.refresh(); }} onCancel={() => setRentaOpen(false)} />
      </Modal>

      <Modal open={cobroForm.type === "create"} onClose={() => setCobroForm({ type: "closed" })} title="Nuevo cobro" subtitle="Dinero que el cliente te paga">
        <CobroForm obraId={obraId} onDone={() => { setCobroForm({ type: "closed" }); router.refresh(); }} onCancel={() => setCobroForm({ type: "closed" })} />
      </Modal>
      <Modal open={cobroForm.type === "edit"} onClose={() => setCobroForm({ type: "closed" })} title="Editar cobro">
        {cobroForm.type === "edit" && <CobroForm obraId={obraId} cobro={cobroForm.cobro} onDone={() => { setCobroForm({ type: "closed" }); router.refresh(); }} onCancel={() => setCobroForm({ type: "closed" })} />}
      </Modal>

      <Modal open={gastoForm.type === "create"} onClose={() => setGastoForm({ type: "closed" })} title="Nuevo gasto" subtitle="Gasto suelto de la obra">
        <GastoForm obraId={obraId} onDone={() => { setGastoForm({ type: "closed" }); router.refresh(); }} onCancel={() => setGastoForm({ type: "closed" })} />
      </Modal>
      <Modal open={gastoForm.type === "edit"} onClose={() => setGastoForm({ type: "closed" })} title="Editar gasto" subtitle={gastoForm.type === "edit" ? gastoForm.gasto.categoria : undefined}>
        {gastoForm.type === "edit" && <GastoForm obraId={obraId} gasto={gastoForm.gasto} onDone={() => { setGastoForm({ type: "closed" }); router.refresh(); }} onCancel={() => setGastoForm({ type: "closed" })} />}
      </Modal>

      <ConfirmDialog open={Boolean(toDeleteGasto)} title="Eliminar gasto" description={toDeleteGasto ? `Se eliminará el gasto de ${formatMoney(toDeleteGasto.monto)} (${toDeleteGasto.categoria}).` : ""} loading={busy} onConfirm={delGasto} onCancel={() => setToDeleteGasto(null)} />
      <ConfirmDialog open={Boolean(toDeleteCobro)} title="Eliminar cobro" description={toDeleteCobro ? `Se eliminará el cobro de ${formatMoney(toDeleteCobro.monto)}.` : ""} loading={busy} onConfirm={delCobro} onCancel={() => setToDeleteCobro(null)} />
    </div>
  );
}

function SectionHead({ icon: Icon, title, hint, action }: { icon: typeof Wallet; title: string; hint?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h3 className="flex items-center gap-1.5 text-sm font-semibold text-content">
        <Icon className="h-4 w-4 text-content-subtle" />
        {title}
        {hint && <span className="text-content-subtle/70">· {hint}</span>}
      </h3>
      {action}
    </div>
  );
}

function GananciaCard({ titulo, subtitulo, monto, pct, destacado }: { titulo: string; subtitulo: string; monto: number | null; pct: number | null; destacado?: boolean }) {
  const positivo = (monto ?? 0) >= 0;
  return (
    <div className={cn("rounded-2xl border p-5 shadow-card", destacado ? "border-brand/30 bg-brand/[0.04]" : "border-line bg-surface/50")}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-content-subtle">{titulo}</p>
        {pct != null && (
          <span className={cn("rounded-full px-2 py-0.5 text-xs font-bold tabular-nums", positivo ? "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300" : "bg-rose-500/12 text-rose-700 dark:text-rose-300")}>
            {pctTxt(pct)}
          </span>
        )}
      </div>
      <p className={cn("mt-2 text-xl font-bold tabular-nums sm:text-2xl", monto == null ? "text-content-subtle" : positivo ? "text-content" : "text-rose-600 dark:text-rose-400")}>
        {monto == null ? "—" : <CountUp value={monto} duration={0.8} format={formatMoney} />}
      </p>
      <p className="mt-0.5 text-[11px] text-content-subtle">{subtitulo}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number | null }) {
  return (
    <div>
      <p className="text-[11px] font-medium text-content-subtle">{label}</p>
      <p className="mt-0.5 text-sm font-bold tabular-nums text-content">{value == null ? "—" : formatMoney(value)}</p>
    </div>
  );
}

function CajaStat({ icon: Icon, label, value, tone }: { icon: typeof Scale; label: string; value: number; tone: "in" | "out" | "pos" | "neg" }) {
  const color = tone === "in" ? "text-emerald-700 dark:text-emerald-300" : tone === "out" ? "text-content" : tone === "pos" ? "text-emerald-700 dark:text-emerald-300" : "text-rose-600 dark:text-rose-400";
  return (
    <div>
      <p className="flex items-center gap-1 text-[11px] font-medium text-content-subtle"><Icon className="h-3 w-3" />{label}</p>
      <p className={cn("mt-0.5 text-base font-bold tabular-nums sm:text-lg", color)}>
        <CountUp value={value} duration={0.7} format={formatMoney} />
      </p>
    </div>
  );
}

function Stat({ label, value, muted, strong, tone }: { label: string; value: number | null; muted?: boolean; strong?: boolean; tone?: "brand" | "danger" }) {
  return (
    <div>
      <p className="text-[11px] font-medium text-content-subtle">{label}</p>
      <p className={cn("mt-0.5 tabular-nums", strong ? "text-lg font-bold sm:text-xl" : "text-base font-bold sm:text-lg", tone === "danger" ? "text-rose-600 dark:text-rose-400" : tone === "brand" ? "text-brand" : muted ? "text-content-muted" : "text-content")}>
        {value == null ? "—" : <CountUp value={value} duration={0.7} format={formatMoney} />}
      </p>
    </div>
  );
}

function Fuente({ icon: Icon, label, value }: { icon: typeof Package; label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-line bg-surface/50 p-4 shadow-card">
      <p className="flex items-center gap-1.5 text-xs text-content-subtle"><Icon className="h-3.5 w-3.5" />{label}</p>
      <p className="mt-1 text-base font-bold tabular-nums text-content sm:text-lg"><CountUp value={value} duration={0.7} format={formatMoney} /></p>
    </div>
  );
}

const inp = "h-11 w-full rounded-xl border border-line bg-surface/60 px-3.5 text-sm text-content placeholder:text-content-subtle focus:border-brand/50 focus:outline-none";

function RentabilidadForm({ obraId, costoEstimado, precioVenta, onDone, onCancel }: { obraId: string; costoEstimado: number | null; precioVenta: number | null; onDone: () => void; onCancel: () => void }) {
  const [venta, setVenta] = useState(precioVenta != null ? String(precioVenta) : "");
  const [costo, setCosto] = useState(costoEstimado != null ? String(costoEstimado) : "");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const ganancia = venta !== "" && costo !== "" ? Number(venta) - Number(costo) : null;

  function guardar() {
    setError(null);
    start(async () => {
      const res = await setRentabilidad(obraId, { precio_venta: venta, costo_estimado: costo });
      if (res.ok) onDone();
      else setError(res.error ?? "Error");
    });
  }
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-content-muted">Precio de venta / contrato (RD$)</label>
          <input type="number" min={0} step="0.01" inputMode="decimal" value={venta} onChange={(e) => setVenta(e.target.value)} placeholder="Lo que le cobras al cliente" className={cn(inp, "tabular-nums")} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-content-muted">Costo estimado (RD$)</label>
          <input type="number" min={0} step="0.01" inputMode="decimal" value={costo} onChange={(e) => setCosto(e.target.value)} placeholder="Lo que estimas gastar" className={cn(inp, "tabular-nums")} />
        </div>
        {ganancia != null && (
          <div className="rounded-xl bg-surface-2/50 px-4 py-2.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-content-muted">Ganancia proyectada</span>
              <span className={cn("font-bold tabular-nums", ganancia >= 0 ? "text-emerald-700 dark:text-emerald-300" : "text-rose-600 dark:text-rose-400")}>{formatMoney(ganancia)}</span>
            </div>
          </div>
        )}
        {error && <p className="rounded-lg bg-danger/10 px-3 py-2 text-xs font-medium text-danger">{error}</p>}
      </div>
      <div className="flex shrink-0 items-center justify-end gap-2.5 border-t border-line px-5 py-4">
        <Button type="button" variant="secondary" size="md" onClick={onCancel} disabled={pending}>Cancelar</Button>
        <button type="button" onClick={guardar} disabled={pending} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-gradient px-5 text-sm font-semibold text-brand-ink shadow-glow transition-transform hover:scale-[1.02] active:scale-[0.99] disabled:opacity-70">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar"}
        </button>
      </div>
    </div>
  );
}

function CobroForm({ obraId, cobro, onDone, onCancel }: { obraId: string; cobro?: Cobro; onDone: () => void; onCancel: () => void }) {
  const isEdit = Boolean(cobro);
  const [monto, setMonto] = useState(cobro?.monto != null ? String(cobro.monto) : "");
  const [concepto, setConcepto] = useState(cobro?.concepto ?? "");
  const [fecha, setFecha] = useState(cobro?.fecha ?? todayISO());
  const [metodo, setMetodo] = useState<MetodoAnticipo | "">(cobro?.metodo ?? "");
  const [notas, setNotas] = useState(cobro?.notas ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function guardar() {
    setError(null);
    const payload = { monto: Number(monto), concepto, fecha, metodo, notas };
    start(async () => {
      const res = isEdit ? await updateCobro(cobro!.id, obraId, payload) : await addCobro(obraId, payload);
      if (res.ok) onDone();
      else setError(res.error ?? "Error");
    });
  }
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-content-muted">Monto (RD$)</label>
            <input type="number" min={0} step="0.01" inputMode="decimal" value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="0.00" className={cn(inp, "tabular-nums")} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-content-muted">Fecha</label>
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className={inp} />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-content-muted">Concepto</label>
          <input type="text" value={concepto} onChange={(e) => setConcepto(e.target.value)} placeholder="Ej. anticipo, abono, pago final" className={inp} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-content-muted">Forma de pago</label>
          <Select value={metodo} onChange={(v) => setMetodo(v as MetodoAnticipo | "")} ariaLabel="Forma de pago" placeholder="—" options={[{ value: "", label: "—" }, ...METODOS_ANTICIPO.map((m) => ({ value: m.value, label: m.label }))]} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-content-muted">Notas (opcional)</label>
          <textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={2} placeholder="Detalle…" className={cn(inp, "min-h-[64px] resize-y py-2.5")} />
        </div>
        {error && <p className="rounded-lg bg-danger/10 px-3 py-2 text-xs font-medium text-danger">{error}</p>}
      </div>
      <div className="flex shrink-0 items-center justify-end gap-2.5 border-t border-line px-5 py-4">
        <Button type="button" variant="secondary" size="md" onClick={onCancel} disabled={pending}>Cancelar</Button>
        <button type="button" onClick={guardar} disabled={pending} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-gradient px-5 text-sm font-semibold text-brand-ink shadow-glow transition-transform hover:scale-[1.02] active:scale-[0.99] disabled:opacity-70">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : isEdit ? "Guardar" : "Registrar cobro"}
        </button>
      </div>
    </div>
  );
}

function GastoForm({ obraId, gasto, onDone, onCancel }: { obraId: string; gasto?: GastoObra; onDone: () => void; onCancel: () => void }) {
  const isEdit = Boolean(gasto);
  const [categoria, setCategoria] = useState(gasto?.categoria ?? "");
  const [concepto, setConcepto] = useState(gasto?.concepto ?? "");
  const [monto, setMonto] = useState(gasto?.monto != null ? String(gasto.monto) : "");
  const [fecha, setFecha] = useState(gasto?.fecha ?? todayISO());
  const [notas, setNotas] = useState(gasto?.notas ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function guardar() {
    setError(null);
    const payload = { categoria: categoria || "Otros", concepto, monto: Number(monto), fecha, notas };
    start(async () => {
      const res = isEdit ? await updateGasto(gasto!.id, obraId, payload) : await addGasto(obraId, payload);
      if (res.ok) onDone();
      else setError(res.error ?? "Error");
    });
  }
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-content-muted">Categoría</label>
            <SmartSelect value={categoria || null} onChange={setCategoria} categoria="gasto_categoria" defaults={CATEGORIAS_GASTO} placeholder="Combustible…" ariaLabel="Categoría del gasto" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-content-muted">Monto (RD$)</label>
            <input type="number" min={0} step="0.01" inputMode="decimal" value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="0.00" className={cn(inp, "tabular-nums")} />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-content-muted">Fecha</label>
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className={inp} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-content-muted">Concepto</label>
          <input type="text" value={concepto} onChange={(e) => setConcepto(e.target.value)} placeholder="Ej. combustible para la mezcladora" className={inp} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-content-muted">Notas (opcional)</label>
          <textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={2} placeholder="Detalle…" className={cn(inp, "min-h-[64px] resize-y py-2.5")} />
        </div>
        {error && <p className="rounded-lg bg-danger/10 px-3 py-2 text-xs font-medium text-danger">{error}</p>}
      </div>
      <div className="flex shrink-0 items-center justify-end gap-2.5 border-t border-line px-5 py-4">
        <Button type="button" variant="secondary" size="md" onClick={onCancel} disabled={pending}>Cancelar</Button>
        <button type="button" onClick={guardar} disabled={pending} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-gradient px-5 text-sm font-semibold text-brand-ink shadow-glow transition-transform hover:scale-[1.02] active:scale-[0.99] disabled:opacity-70">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : isEdit ? "Guardar" : "Registrar gasto"}
        </button>
      </div>
    </div>
  );
}

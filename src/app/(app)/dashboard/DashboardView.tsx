"use client";

import Link from "next/link";
import {
  HardHat,
  Plus,
  Building2,
  Activity,
  CalendarClock,
  ShieldCheck,
  ArrowRight,
  ArrowDownCircle,
  ArrowUpCircle,
  TrendingUp,
  Database,
  AlertTriangle,
  XCircle,
  Info,
  Wallet,
  Percent,
  Receipt,
  NotebookPen,
  Landmark,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Panel } from "@/components/layout/Panel";
import { Reveal, Stagger, KPI, Button, EmptyState, MagneticCard, ProgressBar, CountUp } from "@/components/primitives";
import { EstadoBadge } from "@/components/obras/EstadoBadge";
import { formatCurrency, cn } from "@/lib/utils";
import type { DashboardData, ObraActivaKpi, Alerta, FeedItem } from "./actions";

const FIN_TONE: Record<ObraActivaKpi["estadoFin"], string> = {
  sano: "bg-emerald-500",
  alerta: "bg-amber-500",
  excedido: "bg-rose-500",
  sin_presupuesto: "bg-slate-400 dark:bg-slate-500",
};

export function DashboardView({ data }: { data: DashboardData }) {
  const { configured, kpis, obras, alertas, feed } = data;

  if (!configured) {
    return (
      <>
        <PageHeader title="Sala de Mando" subtitle="Tu constructora de un vistazo · Santiago, RD" />
        <Reveal standalone>
          <div className="rounded-2xl border border-line bg-surface/50 shadow-card">
            <EmptyState icon={Database} title="Falta conectar Supabase" description="En cuanto se configuren las llaves, aquí verás toda tu operación en vivo." tone="accent" />
          </div>
        </Reveal>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Sala de Mando"
        subtitle="Tu constructora de un vistazo · Santiago, RD"
        action={<Button href="/obras" icon={Plus} size="md">Agregar obra</Button>}
      />

      {/* ── KPIs principales ── */}
      <Stagger className="grid grid-cols-1 gap-4 xs:grid-cols-2 xl:grid-cols-4">
        <Reveal>
          <KPI label="Obras activas" value={kpis.obrasActivas} icon={HardHat} hint={`${kpis.obrasTerminadas} terminada${kpis.obrasTerminadas === 1 ? "" : "s"}`} href="/obras" empty={kpis.obrasActivas === 0 && kpis.obrasTerminadas === 0} />
        </Reveal>
        <Reveal>
          <KPI label="Por cobrar" value={kpis.porCobrar} icon={ArrowDownCircle} format={formatCurrency} hint="Pendiente de los clientes" href="/obras" tone="accent" empty={kpis.porCobrar === 0} />
        </Reveal>
        <Reveal>
          <KPI label="Por pagar" value={kpis.porPagar} icon={ArrowUpCircle} format={formatCurrency} hint={kpis.vencenPronto > 0 ? `${kpis.vencenPronto} cuota${kpis.vencenPronto === 1 ? "" : "s"} por vencer` : "Sin vencimientos"} href="/prestamos" empty={kpis.porPagar === 0} />
        </Reveal>
        <Reveal>
          <KPI label="Ganancia proyectada" value={kpis.gananciaProyectada} icon={TrendingUp} format={formatCurrency} hint="Portafolio de obras activas" href="/obras" tone="accent" empty={kpis.gananciaProyectada === 0} />
        </Reveal>
      </Stagger>

      {/* ── Mini-stats ── */}
      <Stagger className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MiniStat icon={Wallet} label="Presupuesto activo" value={kpis.presupuestoActivo} money />
        <MiniStat icon={Receipt} label="Gasto real" value={kpis.gastoRealActivo} money />
        <MiniStat icon={Percent} label="Avance promedio" value={kpis.avancePromedio} suffix="%" />
        <MiniStat icon={CalendarClock} label="Alertas" value={kpis.alertas} href="/notificaciones" />
      </Stagger>

      {/* ── Paneles ── */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Reveal standalone className="lg:col-span-2 lg:row-span-2">
          <Panel title="Obras en curso" icon={Building2} className="h-full" action={<Button href="/obras" variant="ghost" size="sm" iconRight={ArrowRight}>Ver todas</Button>}>
            {obras.length === 0 ? (
              <div className="grid flex-1 place-items-center">
                <EmptyState icon={HardHat} title="Aún no hay obras activas" description="Cuando agregues una obra, aparecerá aquí con su avance y su estado de presupuesto." actionLabel="Agregar obra" actionHref="/obras" actionIcon={Plus} />
              </div>
            ) : (
              <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {obras.map((o) => <ObraCard key={o.id} obra={o} />)}
              </Stagger>
            )}
          </Panel>
        </Reveal>

        <Reveal standalone delay={0.08}>
          <Panel title="Alertas y vencimientos" icon={CalendarClock} className="h-full">
            {alertas.length === 0 ? (
              <div className="grid flex-1 place-items-center">
                <EmptyState icon={ShieldCheck} title="Todo en orden" description="No hay obras pasadas de presupuesto, cuotas por vencer ni materiales bajos." size="sm" tone="accent" />
              </div>
            ) : (
              <Stagger className="space-y-2">
                {alertas.map((a) => <AlertaRow key={a.id} alerta={a} />)}
              </Stagger>
            )}
          </Panel>
        </Reveal>

        <Reveal standalone delay={0.14}>
          <Panel title="Actividad reciente" icon={Activity} className="h-full">
            {feed.length === 0 ? (
              <div className="grid flex-1 place-items-center">
                <EmptyState icon={Activity} title="Sin movimientos todavía" description="Cada registro —obras, cobros, bitácora— quedará aquí en orden." size="sm" />
              </div>
            ) : (
              <Stagger className="space-y-1">
                {feed.map((f) => <FeedRow key={f.id} item={f} />)}
              </Stagger>
            )}
          </Panel>
        </Reveal>
      </div>
    </>
  );
}

function MiniStat({ icon: Icon, label, value, money, suffix, href }: { icon: typeof Wallet; label: string; value: number; money?: boolean; suffix?: string; href?: string }) {
  const inner = (
    <MagneticCard className="p-4" intensity={3}>
      <p className="flex items-center gap-1.5 text-xs text-content-subtle"><Icon className="h-3.5 w-3.5" />{label}</p>
      <p className="mt-1 text-lg font-bold tabular-nums text-content sm:text-xl">
        <CountUp value={value} duration={0.9} format={money ? formatCurrency : undefined} suffix={suffix} />
      </p>
    </MagneticCard>
  );
  return href ? <Reveal><Link href={href} className="block">{inner}</Link></Reveal> : <Reveal>{inner}</Reveal>;
}

function ObraCard({ obra }: { obra: ObraActivaKpi }) {
  const excedido = obra.estadoFin === "excedido";
  return (
    <Reveal>
      <Link href={`/obras/${obra.id}`} className="block">
        <MagneticCard className={cn("p-4", excedido && "ring-1 ring-inset ring-rose-500/30")} intensity={4}>
          <div className="flex items-start justify-between gap-2">
            <h3 className="min-w-0 flex-1 truncate text-sm font-semibold text-content">{obra.nombre}</h3>
            <EstadoBadge estado={obra.estado} />
          </div>
          <div className="mt-3">
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-medium text-content-muted">Avance</span>
              <span className="font-semibold tabular-nums text-content">{obra.avance}%</span>
            </div>
            <ProgressBar value={obra.avance} size="sm" tone={obra.avance === 100 ? "success" : "brand"} />
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-line pt-2">
            <span className="flex items-center gap-1.5 text-xs text-content-subtle">
              <span className={cn("h-2 w-2 rounded-full", FIN_TONE[obra.estadoFin])} />
              {obra.ejecutado != null ? `${obra.ejecutado.toFixed(0)}% del presupuesto` : "Sin presupuesto"}
            </span>
            {excedido && <span className="rounded-full bg-rose-500/12 px-1.5 py-0.5 text-[10px] font-bold text-rose-700 dark:text-rose-300">Pasada</span>}
          </div>
        </MagneticCard>
      </Link>
    </Reveal>
  );
}

const SEV = {
  danger: { icon: XCircle, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-500/10" },
  warn: { icon: AlertTriangle, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10" },
  info: { icon: Info, color: "text-sky-600 dark:text-sky-400", bg: "bg-sky-500/10" },
} as const;

function AlertaRow({ alerta }: { alerta: Alerta }) {
  const s = SEV[alerta.severidad];
  const Icon = s.icon;
  return (
    <Reveal>
      <Link href={alerta.href} className="group flex items-center gap-3 rounded-xl border border-line bg-surface/50 p-3 transition-colors hover:border-brand/40 hover:bg-surface-2/50">
        <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-lg", s.bg, s.color)}><Icon className="h-4 w-4" /></span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-content group-hover:text-brand">{alerta.titulo}</span>
          <span className="block truncate text-xs text-content-subtle">{alerta.detalle}</span>
        </span>
        <ArrowRight className="h-4 w-4 shrink-0 text-content-subtle group-hover:text-brand" />
      </Link>
    </Reveal>
  );
}

const FEED_ICON = {
  obra: HardHat,
  cobro: ArrowDownCircle,
  bitacora: NotebookPen,
  prestamo: Landmark,
} as const;

function FeedRow({ item }: { item: FeedItem }) {
  const Icon = FEED_ICON[item.tipo];
  return (
    <Reveal>
      <Link href={item.href} className="group flex items-center gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-surface-2/50">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-surface-2 text-content-muted"><Icon className="h-3.5 w-3.5" /></span>
        <span className="min-w-0 flex-1 truncate text-sm text-content group-hover:text-brand">{item.texto}</span>
        <span className="shrink-0 text-[11px] tabular-nums text-content-subtle">{haceCuanto(item.ts)}</span>
      </Link>
    </Reveal>
  );
}

function haceCuanto(ts: string): string {
  const then = new Date(ts).getTime();
  const now = Date.now();
  const min = Math.max(0, Math.round((now - then) / 60000));
  if (min < 1) return "ahora";
  if (min < 60) return `${min}m`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h}h`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d}d`;
  return new Date(ts).toLocaleDateString("es-DO", { day: "2-digit", month: "short" });
}

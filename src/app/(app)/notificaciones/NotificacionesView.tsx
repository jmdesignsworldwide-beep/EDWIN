"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Bell,
  ShieldCheck,
  CheckCheck,
  ArrowRight,
  Landmark,
  Wallet,
  Boxes,
  UserSquare2,
  Circle,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Reveal, Stagger, EmptyState } from "@/components/primitives";
import { PushToggle } from "./PushToggle";
import { marcarLeida, marcarTodasLeidas } from "./actions";
import { SEVERIDAD_UI, type Notificacion, type NotificacionTipo } from "@/lib/proyectos/types";
import { cn } from "@/lib/utils";

const TIPO_ICON: Record<NotificacionTipo, typeof Bell> = {
  prestamo: Landmark,
  presupuesto: Wallet,
  material: Boxes,
  cliente: UserSquare2,
  cobro: Wallet,
};

type Filtro = "todas" | "no_leidas";

export function NotificacionesView({ items }: { items: Notificacion[] }) {
  const router = useRouter();
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [, start] = useTransition();

  const noLeidas = items.filter((i) => !i.leida).length;
  const visibles = useMemo(() => (filtro === "no_leidas" ? items.filter((i) => !i.leida) : items), [items, filtro]);

  function leer(clave: string) {
    start(async () => { await marcarLeida(clave); router.refresh(); });
  }
  function leerTodas() {
    start(async () => { await marcarTodasLeidas(items.filter((i) => !i.leida).map((i) => i.clave)); router.refresh(); });
  }

  return (
    <>
      <PageHeader
        title="Notificaciones"
        subtitle="Todo lo que necesita tu atención, en un solo lugar"
        action={
          noLeidas > 0 ? (
            <button type="button" onClick={leerTodas} className="inline-flex h-10 items-center gap-2 rounded-xl border border-line px-4 text-sm font-semibold text-content transition-colors hover:bg-surface-2">
              <CheckCheck className="h-4 w-4" />Marcar todas leídas
            </button>
          ) : undefined
        }
      />

      <div className="mb-5"><PushToggle /></div>

      {items.length > 0 && (
        <div className="mb-4 inline-flex rounded-xl border border-line bg-surface/60 p-1">
          <FiltroBtn active={filtro === "todas"} onClick={() => setFiltro("todas")}>Todas <span className="opacity-60">{items.length}</span></FiltroBtn>
          <FiltroBtn active={filtro === "no_leidas"} onClick={() => setFiltro("no_leidas")}>No leídas <span className="opacity-60">{noLeidas}</span></FiltroBtn>
        </div>
      )}

      {items.length === 0 ? (
        <Reveal standalone>
          <div className="rounded-2xl border border-line bg-surface/50 shadow-card">
            <EmptyState icon={ShieldCheck} title="Todo en orden" description="No hay cuotas por vencer, materiales bajos ni clientes por completar. Cuando algo necesite tu atención, aparecerá aquí." tone="accent" />
          </div>
        </Reveal>
      ) : (
        <Stagger className="space-y-2.5">
          {visibles.map((n) => {
            const s = SEVERIDAD_UI[n.severidad];
            const Icon = TIPO_ICON[n.tipo];
            return (
              <Reveal key={n.clave}>
                <div className={cn("group flex items-center gap-3 rounded-xl border p-3.5 shadow-card transition-colors", n.leida ? "border-line bg-surface/40" : "border-brand/25 bg-brand/[0.04]")}>
                  <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-lg", s.bg, s.color)}><Icon className="h-5 w-5" /></span>
                  <Link href={n.href} onClick={() => !n.leida && leer(n.clave)} className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      {!n.leida && <span className={cn("h-2 w-2 shrink-0 rounded-full", s.dot)} />}
                      <span className={cn("truncate text-sm", n.leida ? "font-medium text-content-muted" : "font-semibold text-content")}>{n.titulo}</span>
                    </span>
                    <span className="block truncate text-xs text-content-subtle">{n.detalle}</span>
                  </Link>
                  {!n.leida && (
                    <button type="button" onClick={() => leer(n.clave)} title="Marcar leída" className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-content-subtle transition-colors hover:bg-surface-2 hover:text-content"><Circle className="h-4 w-4" /></button>
                  )}
                  <Link href={n.href} onClick={() => !n.leida && leer(n.clave)} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-content-subtle transition-colors hover:bg-surface-2 hover:text-brand"><ArrowRight className="h-4 w-4" /></Link>
                </div>
              </Reveal>
            );
          })}
          {visibles.length === 0 && (
            <div className="rounded-2xl border border-line bg-surface/50 py-10 text-center shadow-card">
              <p className="text-sm font-medium text-content">Sin notificaciones sin leer</p>
              <p className="mt-1 text-xs text-content-muted">Estás al día.</p>
            </div>
          )}
        </Stagger>
      )}
    </>
  );
}

function FiltroBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={cn("inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors", active ? "bg-brand-gradient text-brand-ink shadow-glow" : "text-content-muted hover:text-content")}>
      {children}
    </button>
  );
}

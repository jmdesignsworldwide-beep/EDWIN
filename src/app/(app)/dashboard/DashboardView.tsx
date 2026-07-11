"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  HardHat,
  Percent,
  TrendingUp,
  Bell,
  Plus,
  Building2,
  Activity,
  CalendarClock,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Panel } from "@/components/layout/Panel";
import {
  Reveal,
  Stagger,
  KPI,
  Button,
  EmptyState,
  KPISkeleton,
  ObraCardSkeleton,
  RowSkeleton,
} from "@/components/primitives";
import { formatCurrency } from "@/lib/utils";

/**
 * Sala de Mando — primera pantalla tras el login. Arranca VACÍA (sistema real,
 * Edwin mete sus obras). Foco: layout premium + empty states elegantes.
 *
 * El estado `loading` simula el fetch futuro para mostrar los skeletons y la
 * transición con AnimatePresence; cuando se conecte Supabase, el mismo camino
 * sirve los datos reales. NOTA: sin precios de contrato ni datos de pago.
 */
export function DashboardView() {
  const reduced = useReducedMotion();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (reduced) {
      setLoading(false);
      return;
    }
    const t = setTimeout(() => setLoading(false), 750);
    return () => clearTimeout(t);
  }, [reduced]);

  return (
    <>
      <PageHeader
        title="Sala de Mando"
        subtitle="Tu constructora de un vistazo · Santiago, RD"
        action={
          <Button href="/obras" icon={Plus} size="md">
            Agregar obra
          </Button>
        }
      />

      {/* ── Fila de KPIs ── */}
      <Swap
        loading={loading}
        skeleton={
          <div className="grid grid-cols-1 gap-4 xs:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <KPISkeleton key={i} />
            ))}
          </div>
        }
      >
        <Stagger className="grid grid-cols-1 gap-4 xs:grid-cols-2 xl:grid-cols-4">
          <Reveal>
            <KPI
              label="Obras activas"
              value={0}
              icon={HardHat}
              empty
              hint="Sin registrar"
              href="/obras"
            />
          </Reveal>
          <Reveal>
            <KPI
              label="Inversión del mes"
              value={0}
              icon={TrendingUp}
              format={(n) => formatCurrency(n)}
              empty
              hint="Aún sin movimientos"
              href="/reportes"
              tone="accent"
            />
          </Reveal>
          <Reveal>
            <KPI
              label="Avance promedio"
              value={0}
              icon={Percent}
              suffix="%"
              empty
              hint="Sin obras aún"
              href="/obras"
            />
          </Reveal>
          <Reveal>
            <KPI
              label="Alertas"
              value={0}
              icon={Bell}
              empty
              hint="Todo en orden"
              href="/notificaciones"
              tone="accent"
            />
          </Reveal>
        </Stagger>
      </Swap>

      {/* ── Paneles ── */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Obras en curso — grande, izquierda */}
        <Reveal standalone className="lg:col-span-2 lg:row-span-2">
          <Panel
            title="Obras en curso"
            icon={Building2}
            className="h-full"
            action={
              <Button href="/obras" variant="ghost" size="sm" iconRight={ArrowRight}>
                Ver todas
              </Button>
            }
          >
            <Swap
              loading={loading}
              className="flex-1"
              skeleton={
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <ObraCardSkeleton key={i} />
                  ))}
                </div>
              }
            >
              <div className="grid flex-1 place-items-center">
                <EmptyState
                  icon={HardHat}
                  title="Aún no hay obras registradas"
                  description="Cuando agregues tu primera obra, aparecerá aquí con su avance, ubicación y equipo. Empieza registrando una."
                  actionLabel="Agregar obra"
                  actionHref="/obras"
                  actionIcon={Plus}
                />
              </div>
            </Swap>
          </Panel>
        </Reveal>

        {/* Alertas / vencimientos — derecha arriba */}
        <Reveal standalone delay={0.08}>
          <Panel title="Alertas y vencimientos" icon={CalendarClock} className="h-full">
            <Swap
              loading={loading}
              className="flex-1"
              skeleton={
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <RowSkeleton key={i} />
                  ))}
                </div>
              }
            >
              <div className="grid flex-1 place-items-center">
                <EmptyState
                  icon={ShieldCheck}
                  title="Todo en orden"
                  description="No hay alertas ni vencimientos próximos. Aquí verás pagos a proveedores, entregas y permisos por vencer."
                  size="sm"
                  tone="accent"
                />
              </div>
            </Swap>
          </Panel>
        </Reveal>

        {/* Actividad reciente — derecha abajo */}
        <Reveal standalone delay={0.14}>
          <Panel title="Actividad reciente" icon={Activity} className="h-full">
            <Swap
              loading={loading}
              className="flex-1"
              skeleton={
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <RowSkeleton key={i} />
                  ))}
                </div>
              }
            >
              <div className="grid flex-1 place-items-center">
                <EmptyState
                  icon={Activity}
                  title="Sin movimientos todavía"
                  description="Cada registro —avances, compras, asistencia— quedará aquí en orden cronológico."
                  size="sm"
                />
              </div>
            </Swap>
          </Panel>
        </Reveal>
      </div>
    </>
  );
}

/**
 * Swap — crossfade entre skeleton (cargando) y contenido (listo) con
 * AnimatePresence. Es el punto donde luego enchufamos los datos reales.
 */
function Swap({
  loading,
  skeleton,
  children,
  className,
}: {
  loading: boolean;
  skeleton: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <AnimatePresence mode="wait" initial={false}>
        {loading ? (
          <motion.div
            key="skeleton"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="h-full"
          >
            {skeleton}
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="flex h-full flex-col"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

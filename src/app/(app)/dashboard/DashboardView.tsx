"use client";

import {
  HardHat,
  Users,
  Percent,
  PackageCheck,
  MapPin,
  CalendarClock,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Reveal, Stagger, KPI, MagneticCard, ProgressBar } from "@/components/primitives";

/**
 * Panel — vitrina de los primitivos animados con datos de muestra.
 * NOTA: sin precios de contrato ni datos de pago (fuera del alcance del
 * sistema). Métricas puramente operativas de las obras.
 * Client component: usa iconos y primitivos animados directamente.
 */

const OBRAS = [
  { nombre: "Residencial Los Cerros", lugar: "Santiago", avance: 78 },
  { nombre: "Plaza Comercial Duarte", lugar: "Santiago", avance: 45 },
  { nombre: "Torre Bella Vista", lugar: "Santiago", avance: 62 },
  { nombre: "Villas del Jardín", lugar: "Moca", avance: 91 },
  { nombre: "Nave Industrial Cibao", lugar: "Santiago", avance: 34 },
];

const ENTREGAS = [
  { obra: "Villas del Jardín", fecha: "15 jul", estado: "Esta semana" },
  { obra: "Residencial Los Cerros", fecha: "28 jul", estado: "Este mes" },
  { obra: "Torre Bella Vista", fecha: "09 ago", estado: "Próximo mes" },
];

export function DashboardView() {
  return (
    <>
      <PageHeader
        title="Panel"
        subtitle="Resumen operativo de las obras · Constructora Edwin"
      />

      {/* KPIs */}
      <Stagger className="grid grid-cols-1 gap-4 xs:grid-cols-2 xl:grid-cols-4">
        <Reveal>
          <KPI label="Obras activas" value={8} icon={HardHat} trend={2} />
        </Reveal>
        <Reveal>
          <KPI
            label="Avance promedio"
            value={62}
            suffix="%"
            icon={Percent}
            trend={5}
            progress={62}
            tone="accent"
          />
        </Reveal>
        <Reveal>
          <KPI label="Personal en campo" value={47} icon={Users} trend={-3} />
        </Reveal>
        <Reveal>
          <KPI
            label="Materiales por recibir"
            value={12}
            icon={PackageCheck}
            trend={0}
            tone="accent"
          />
        </Reveal>
      </Stagger>

      {/* Obras + Entregas */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Reveal standalone className="lg:col-span-2">
          <MagneticCard className="h-full p-5" intensity={2}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-content">
                Avance de obras
              </h2>
              <span className="text-xs font-medium text-content-subtle">
                {OBRAS.length} en curso
              </span>
            </div>
            <Stagger className="space-y-4">
              {OBRAS.map((obra) => (
                <Reveal key={obra.nombre}>
                  <div>
                    <div className="mb-1.5 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-content">
                          {obra.nombre}
                        </p>
                        <p className="flex items-center gap-1 text-xs text-content-subtle">
                          <MapPin className="h-3 w-3" />
                          {obra.lugar}
                        </p>
                      </div>
                      <span className="shrink-0 text-sm font-semibold tabular-nums text-content">
                        {obra.avance}%
                      </span>
                    </div>
                    <ProgressBar
                      value={obra.avance}
                      tone={obra.avance >= 85 ? "success" : "brand"}
                      size="sm"
                    />
                  </div>
                </Reveal>
              ))}
            </Stagger>
          </MagneticCard>
        </Reveal>

        <Reveal standalone delay={0.1}>
          <MagneticCard className="h-full p-5" intensity={2}>
            <div className="mb-4 flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-brand" />
              <h2 className="text-base font-semibold text-content">
                Próximas entregas
              </h2>
            </div>
            <Stagger className="space-y-3">
              {ENTREGAS.map((e) => (
                <Reveal key={e.obra}>
                  <div className="flex items-center gap-3 rounded-xl border border-line bg-surface-2/50 p-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand/12 text-xs font-bold text-brand">
                      {e.fecha.split(" ")[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-content">
                        {e.obra}
                      </p>
                      <p className="text-xs text-content-subtle">{e.estado}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </Stagger>
          </MagneticCard>
        </Reveal>
      </div>
    </>
  );
}

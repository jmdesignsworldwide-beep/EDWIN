"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, GanttChartSquare, Package, AlertTriangle } from "lucide-react";
import { Reveal, ProgressBar, MagneticCard } from "@/components/primitives";
import { EstadoBadge } from "@/components/obras/EstadoBadge";
import { EtapasSection } from "./EtapasSection";
import { MaterialesSection } from "./MaterialesSection";
import {
  clienteNombre,
  etapasCompletadas,
  materialesEnAlerta,
  type Proyecto,
} from "@/lib/proyectos/types";
import { cn } from "@/lib/utils";

type Tab = "cronograma" | "materiales";

export function ObraWorkspace({
  proyecto,
  initialTab = "cronograma",
}: {
  proyecto: Proyecto;
  initialTab?: Tab;
}) {
  const [tab, setTab] = useState<Tab>(initialTab);

  const etapas = proyecto.etapas ?? [];
  const materiales = proyecto.materiales ?? [];
  const total = etapas.length;
  const done = etapasCompletadas(etapas);
  const cliente = clienteNombre(proyecto);
  const alertas = materialesEnAlerta(materiales);

  return (
    <>
      {/* Encabezado */}
      <div className="mb-6">
        <Link
          href="/obras"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-content-muted transition-colors hover:text-content"
        >
          <ArrowLeft className="h-4 w-4" />
          Obras
        </Link>
        <div className="flex items-center gap-2.5">
          <h1 className="truncate text-xl font-bold tracking-tight text-content sm:text-2xl">
            {proyecto.nombre}
          </h1>
          <EstadoBadge estado={proyecto.estado} />
        </div>
        <p className="mt-1 text-sm text-content-muted">
          {[proyecto.ubicacion, cliente].filter(Boolean).join(" · ") || "Detalle de la obra"}
        </p>
      </div>

      {/* Resumen de avance */}
      <Reveal standalone className="mb-6">
        <MagneticCard className="p-5" intensity={2}>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-content-muted">Avance general de la obra</span>
            <span className="text-sm font-semibold tabular-nums text-content">{proyecto.avance}%</span>
          </div>
          <ProgressBar value={proyecto.avance} tone={proyecto.avance === 100 ? "success" : "brand"} />
          <p className="mt-1.5 text-xs text-content-subtle">
            {done} de {total} etapas completadas
          </p>
        </MagneticCard>
      </Reveal>

      {/* Pestañas */}
      <div className="mb-5 inline-flex rounded-xl border border-line bg-surface/60 p-1">
        <TabBtn active={tab === "cronograma"} onClick={() => setTab("cronograma")} icon={GanttChartSquare}>
          Cronograma
        </TabBtn>
        <TabBtn active={tab === "materiales"} onClick={() => setTab("materiales")} icon={Package} badge={alertas}>
          Materiales
        </TabBtn>
      </div>

      {tab === "cronograma" ? (
        <EtapasSection proyecto={proyecto} />
      ) : (
        <MaterialesSection proyecto={proyecto} />
      )}
    </>
  );
}

function TabBtn({
  active,
  onClick,
  icon: Icon,
  badge,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Package;
  badge?: number;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
        active ? "bg-brand-gradient text-brand-ink shadow-glow" : "text-content-muted hover:text-content",
      )}
    >
      <Icon className="h-4 w-4" />
      {children}
      {badge != null && badge > 0 && (
        <span
          className={cn(
            "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold",
            active ? "bg-brand-ink/15 text-brand-ink" : "bg-rose-500/15 text-rose-600 dark:text-rose-300",
          )}
        >
          <AlertTriangle className="h-2.5 w-2.5" />
          {badge}
        </span>
      )}
    </button>
  );
}

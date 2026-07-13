"use client";

import { MapPin, User2, CalendarClock, CheckCircle2, RotateCcw, Loader2 } from "lucide-react";
import { MagneticCard, ProgressBar } from "@/components/primitives";
import { EstadoBadge } from "./EstadoBadge";
import { formatCurrency, cn } from "@/lib/utils";
import { clienteNombre, type Proyecto } from "@/lib/proyectos/types";

/**
 * ObraCard — tarjeta de obra en el grid. El cuerpo abre el expediente completo
 * (/obras/[id]); el pie tiene la acción verde "Terminada" (reversible), como
 * seguimiento visual del estado.
 */
export function ObraCard({
  proyecto,
  onOpen,
  onToggleEstado,
  busy,
}: {
  proyecto: Proyecto;
  onOpen: () => void;
  onToggleEstado: () => void;
  busy?: boolean;
}) {
  const { nombre, ubicacion, estado, avance, presupuesto, fecha_fin_estimada, etapas } = proyecto;
  const cliente = clienteNombre(proyecto);
  const total = etapas?.length ?? 0;
  const done = etapas?.filter((e) => e.completada).length ?? 0;
  const terminada = estado === "terminada";

  return (
    <MagneticCard className="p-5" intensity={4}>
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full flex-col text-left focus:outline-none"
        aria-label={`Abrir expediente de ${nombre}`}
      >
        <div className="flex items-start justify-between gap-3">
          <h3 className="min-w-0 flex-1 truncate text-base font-semibold text-content">{nombre}</h3>
          <EstadoBadge estado={estado} />
        </div>

        <div className="mt-3 space-y-1.5 text-sm text-content-muted">
          {ubicacion && (
            <p className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-content-subtle" />
              <span className="truncate">{ubicacion}</span>
            </p>
          )}
          {cliente && (
            <p className="flex items-center gap-1.5">
              <User2 className="h-3.5 w-3.5 shrink-0 text-content-subtle" />
              <span className="truncate">{cliente}</span>
            </p>
          )}
          {fecha_fin_estimada && (
            <p className="flex items-center gap-1.5">
              <CalendarClock className="h-3.5 w-3.5 shrink-0 text-content-subtle" />
              <span className="truncate">Entrega est. {formatDate(fecha_fin_estimada)}</span>
            </p>
          )}
        </div>

        <div className="mt-4 w-full">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-xs font-medium text-content-muted">
              {total > 0 ? `${done}/${total} etapas` : "Avance"}
            </span>
            <span className="text-xs font-semibold tabular-nums text-content">{avance}%</span>
          </div>
          <ProgressBar value={avance} size="sm" tone={terminada ? "success" : "brand"} />
        </div>
      </button>

      <div className="mt-4 flex items-center justify-between gap-2 border-t border-line pt-3">
        {presupuesto != null ? (
          <p className="min-w-0 text-sm">
            <span className="text-content-subtle">Presupuesto </span>
            <span className="font-semibold text-content">{formatCurrency(presupuesto)}</span>
          </p>
        ) : (
          <span className="text-xs text-content-subtle">Sin presupuesto</span>
        )}
        <button
          type="button"
          onClick={onToggleEstado}
          disabled={busy}
          className={cn(
            "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold ring-1 ring-inset transition-colors disabled:opacity-60",
            terminada
              ? "bg-surface-2 text-content-muted ring-line hover:bg-surface-2/70"
              : "bg-emerald-500/12 text-emerald-700 ring-emerald-500/25 hover:bg-emerald-500/20 dark:text-emerald-300",
          )}
        >
          {busy ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : terminada ? (
            <RotateCcw className="h-3.5 w-3.5" />
          ) : (
            <CheckCircle2 className="h-3.5 w-3.5" />
          )}
          {terminada ? "Reactivar" : "Terminada"}
        </button>
      </div>
    </MagneticCard>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("es-DO", { day: "2-digit", month: "short", year: "numeric" });
}

"use client";

import { MapPin, User2, CalendarClock } from "lucide-react";
import { MagneticCard, ProgressBar } from "@/components/primitives";
import { EstadoBadge } from "./EstadoBadge";
import { formatCurrency } from "@/lib/utils";
import { clienteNombre, type Proyecto } from "@/lib/proyectos/types";

/**
 * ObraCard — tarjeta de obra en el grid. Clickable (abre el detalle). Muestra
 * estado, ubicación, cliente, avance animado y presupuesto de la obra.
 */
export function ObraCard({
  proyecto,
  onClick,
}: {
  proyecto: Proyecto;
  onClick: () => void;
}) {
  const { nombre, ubicacion, estado, avance, presupuesto, fecha_fin_estimada, etapas } =
    proyecto;
  const cliente = clienteNombre(proyecto);
  const total = etapas?.length ?? 0;
  const done = etapas?.filter((e) => e.completada).length ?? 0;

  return (
    <MagneticCard className="cursor-pointer p-5" intensity={4}>
      <button
        type="button"
        onClick={onClick}
        className="flex w-full flex-col text-left focus:outline-none"
        aria-label={`Ver detalle de ${nombre}`}
      >
        <div className="flex items-start justify-between gap-3">
          <h3 className="min-w-0 flex-1 truncate text-base font-semibold text-content">
            {nombre}
          </h3>
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
              <span className="truncate">
                Entrega est. {formatDate(fecha_fin_estimada)}
              </span>
            </p>
          )}
        </div>

        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-xs font-medium text-content-muted">
              {total > 0 ? `${done}/${total} etapas` : "Avance"}
            </span>
            <span className="text-xs font-semibold tabular-nums text-content">
              {avance}%
            </span>
          </div>
          <ProgressBar
            value={avance}
            size="sm"
            tone={estado === "terminada" ? "success" : "brand"}
          />
        </div>

        {presupuesto != null && (
          <p className="mt-4 border-t border-line pt-3 text-sm">
            <span className="text-content-subtle">Presupuesto de obra </span>
            <span className="font-semibold text-content">
              {formatCurrency(presupuesto)}
            </span>
          </p>
        )}
      </button>
    </MagneticCard>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("es-DO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

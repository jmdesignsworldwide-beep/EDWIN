"use client";

import {
  MapPin,
  User2,
  CalendarClock,
  CalendarCheck,
  Wallet,
  FileText,
  Pencil,
  Trash2,
  Layers,
} from "lucide-react";
import { Button, ProgressBar } from "@/components/primitives";
import { EstadoBadge } from "./EstadoBadge";
import { formatCurrency } from "@/lib/utils";
import type { Proyecto } from "@/lib/proyectos/types";

/**
 * ObraDetail — contenido del panel de detalle. Muestra toda la info capturada
 * de la obra. Deja lugar para materiales/etapas/equipo en tandas futuras.
 */
export function ObraDetail({
  proyecto,
  onEdit,
  onDelete,
}: {
  proyecto: Proyecto;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const {
    ubicacion,
    cliente,
    estado,
    avance,
    presupuesto,
    fecha_inicio,
    fecha_fin_estimada,
    notas,
  } = proyecto;

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-6">
        <div className="flex items-center justify-between gap-3">
          <EstadoBadge estado={estado} />
          <span className="text-xs text-content-subtle">
            Actualizada {formatDateTime(proyecto.updated_at)}
          </span>
        </div>

        {/* Avance */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-sm font-medium text-content-muted">Avance</span>
            <span className="text-sm font-semibold tabular-nums text-content">
              {avance}%
            </span>
          </div>
          <ProgressBar value={avance} tone={estado === "terminada" ? "success" : "brand"} />
        </div>

        {/* Datos */}
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Item icon={MapPin} label="Ubicación" value={ubicacion} />
          <Item icon={User2} label="Cliente / propietario" value={cliente} />
          <Item icon={CalendarClock} label="Inicio" value={formatDate(fecha_inicio)} />
          <Item icon={CalendarCheck} label="Fin estimado" value={formatDate(fecha_fin_estimada)} />
          <Item
            icon={Wallet}
            label="Presupuesto de la obra"
            value={presupuesto != null ? formatCurrency(presupuesto) : null}
            full
          />
        </dl>

        {notas && (
          <div>
            <p className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-content-muted">
              <FileText className="h-4 w-4 text-content-subtle" />
              Notas
            </p>
            <p className="whitespace-pre-wrap rounded-xl border border-line bg-surface-2/40 p-3.5 text-sm text-content">
              {notas}
            </p>
          </div>
        )}

        {/* Próximamente (patrón de profundidad) */}
        <div className="rounded-xl border border-dashed border-line p-4">
          <p className="flex items-center gap-2 text-sm font-medium text-content">
            <Layers className="h-4 w-4 text-brand" />
            Materiales, etapas y equipo
          </p>
          <p className="mt-1 text-xs text-content-muted">
            Se engancharán a esta obra en las próximas tandas.
          </p>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between gap-2.5 border-t border-line pt-4">
        <button
          type="button"
          onClick={onDelete}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-line px-4 text-sm font-semibold text-danger transition-colors hover:bg-danger/10"
        >
          <Trash2 className="h-4 w-4" />
          Eliminar
        </button>
        <Button variant="primary" size="md" icon={Pencil} onClick={onEdit}>
          Editar obra
        </Button>
      </div>
    </div>
  );
}

function Item({
  icon: Icon,
  label,
  value,
  full,
}: {
  icon: typeof MapPin;
  label: string;
  value: string | null;
  full?: boolean;
}) {
  return (
    <div className={full ? "sm:col-span-2" : undefined}>
      <dt className="flex items-center gap-1.5 text-xs text-content-subtle">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </dt>
      <dd className="mt-0.5 text-sm font-medium text-content">
        {value ?? <span className="text-content-subtle">—</span>}
      </dd>
    </div>
  );
}

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso + "T00:00:00").toLocaleDateString("es-DO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString("es-DO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

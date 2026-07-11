"use client";

import Link from "next/link";
import {
  MapPin,
  User2,
  CalendarClock,
  CalendarCheck,
  Wallet,
  FileText,
  Pencil,
  Trash2,
  GanttChartSquare,
  Package,
  ArrowRight,
} from "lucide-react";
import { Button, ProgressBar } from "@/components/primitives";
import { EstadoBadge } from "./EstadoBadge";
import { formatCurrency } from "@/lib/utils";
import {
  clienteNombre,
  etapasCompletadas,
  materialesEnAlerta,
  totalMateriales,
  type Proyecto,
} from "@/lib/proyectos/types";

/**
 * ObraDetail — contenido del panel de detalle (SlideOver). Resume la obra y sus
 * etapas, y enlaza al cronograma (Gantt) para gestionarlas.
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
    estado,
    avance,
    presupuesto,
    fecha_inicio,
    fecha_fin_estimada,
    notas,
    etapas,
  } = proyecto;
  const cliente = clienteNombre(proyecto);
  const total = etapas?.length ?? 0;
  const done = etapasCompletadas(etapas ?? []);
  const materiales = proyecto.materiales ?? [];
  const totalMat = totalMateriales(materiales);
  const alertasMat = materialesEnAlerta(materiales);

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
          {total > 0 && (
            <p className="mt-1.5 text-xs text-content-subtle">
              {done} de {total} etapas completadas
            </p>
          )}
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

        {/* Cronograma (etapas) — enlace a la vista completa con Gantt */}
        <Link
          href={`/obras/${proyecto.id}`}
          className="group flex items-center gap-3 rounded-xl border border-line bg-surface-2/40 p-3.5 transition-colors hover:border-brand/40 hover:bg-surface-2"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand/12 text-brand ring-1 ring-brand/25">
            <GanttChartSquare className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-content">
              Cronograma y etapas
            </span>
            <span className="block text-xs text-content-muted">
              {total > 0
                ? `${done} de ${total} etapas completadas`
                : "Aún sin etapas — agrega la primera fase"}
            </span>
          </span>
          <ArrowRight className="h-4 w-4 shrink-0 text-content-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-brand" />
        </Link>

        {/* Materiales — enlace a la vista de materiales */}
        <Link
          href={`/obras/${proyecto.id}?vista=materiales`}
          className="group flex items-center gap-3 rounded-xl border border-line bg-surface-2/40 p-3.5 transition-colors hover:border-brand/40 hover:bg-surface-2"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand/12 text-brand ring-1 ring-brand/25">
            <Package className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2 text-sm font-semibold text-content">
              Materiales
              {alertasMat > 0 && (
                <span className="inline-flex items-center rounded-full bg-rose-500/12 px-1.5 py-0.5 text-[10px] font-bold text-rose-700 dark:text-rose-300">
                  {alertasMat} en alerta
                </span>
              )}
            </span>
            <span className="block text-xs text-content-muted">
              {materiales.length === 0
                ? "Aún sin materiales — agrega el primero"
                : `${materiales.length} materiales${totalMat > 0 ? ` · ${formatCurrency(totalMat)}` : ""}`}
            </span>
          </span>
          <ArrowRight className="h-4 w-4 shrink-0 text-content-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-brand" />
        </Link>

        {/* Próximamente (patrón de profundidad) */}
        <div className="rounded-xl border border-dashed border-line p-4">
          <p className="flex items-center gap-2 text-sm font-medium text-content">
            <Package className="h-4 w-4 text-brand" />
            Equipo y maquinaria
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

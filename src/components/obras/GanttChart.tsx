"use client";

import { motion, useReducedMotion } from "framer-motion";
import { CalendarRange } from "lucide-react";
import {
  ETAPA_BAR,
  ESTADO_ETAPA_BADGE,
  type Etapa,
} from "@/lib/proyectos/types";
import { cn } from "@/lib/utils";

/**
 * GanttChart — cronograma de la obra. Cada etapa es una barra posicionada por
 * sus fechas; el relleno interno refleja el % de avance; el color el estado.
 * Línea "Hoy", eje por meses, entrada en cascada, scroll horizontal en móvil.
 * Respeta prefers-reduced-motion. Contraste cuidado en ambos temas.
 */

const DAY = 86400000;
const toDate = (s: string) => new Date(s + "T00:00:00");
const diffDays = (a: Date, b: Date) => Math.round((b.getTime() - a.getTime()) / DAY);
const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

export function GanttChart({
  etapas,
  onEtapaClick,
}: {
  etapas: Etapa[];
  onEtapaClick: (e: Etapa) => void;
}) {
  const reduced = useReducedMotion();

  // Rango temporal a partir de las etapas con fechas.
  const spans = etapas
    .map((e) => {
      const ini = e.fecha_inicio ? toDate(e.fecha_inicio) : null;
      const fin = e.fecha_fin ? toDate(e.fecha_fin) : null;
      const start = ini ?? fin;
      const end = fin ?? ini;
      return start && end ? { etapa: e, start, end } : { etapa: e, start: null, end: null };
    });

  const dated = spans.filter((s) => s.start && s.end) as {
    etapa: Etapa;
    start: Date;
    end: Date;
  }[];

  if (dated.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-dashed border-line px-6 py-10 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand/12 text-brand">
          <CalendarRange className="h-6 w-6" />
        </span>
        <p className="mt-3 text-sm font-medium text-content">Cronograma sin fechas</p>
        <p className="mt-1 max-w-sm text-xs text-content-muted">
          Agrega fecha de inicio y fin a las etapas para verlas en la línea de tiempo.
        </p>
      </div>
    );
  }

  let min = dated[0].start;
  let max = dated[0].end;
  for (const s of dated) {
    if (s.start < min) min = s.start;
    if (s.end > max) max = s.end;
  }
  // Padding de una semana a cada lado.
  min = new Date(min.getTime() - 4 * DAY);
  max = new Date(max.getTime() + 4 * DAY);
  const totalDays = Math.max(1, diffDays(min, max));

  const pxPerDay = Math.max(4, Math.min(14, Math.round(820 / totalDays)));
  const trackWidth = totalDays * pxPerDay;

  // Marcas de mes.
  const months: { x: number; label: string }[] = [];
  const cur = new Date(min.getFullYear(), min.getMonth(), 1);
  while (cur <= max) {
    const x = diffDays(min, cur) * pxPerDay;
    if (x >= 0) {
      months.push({
        x,
        label: `${MESES[cur.getMonth()]}${cur.getMonth() === 0 ? ` ${String(cur.getFullYear()).slice(2)}` : ""}`,
      });
    }
    cur.setMonth(cur.getMonth() + 1);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayX =
    today >= min && today <= max ? diffDays(min, today) * pxPerDay : null;

  const LABEL_W = "9rem";

  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-surface/40">
      <div style={{ width: `calc(${LABEL_W} + ${trackWidth}px)` }} className="min-w-full">
        {/* Eje de meses */}
        <div className="flex border-b border-line">
          <div
            className="sticky left-0 z-20 shrink-0 border-r border-line bg-surface/80 backdrop-blur"
            style={{ width: LABEL_W }}
          >
            <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-content-subtle">
              Fase
            </div>
          </div>
          <div className="relative h-8" style={{ width: trackWidth }}>
            {months.map((m, i) => (
              <div
                key={i}
                className="absolute top-0 h-full border-l border-line/70"
                style={{ left: m.x }}
              >
                <span className="ml-1 text-[11px] font-medium text-content-subtle">
                  {m.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Filas */}
        <div className="relative">
          {/* Línea de Hoy (sobre todas las filas) */}
          {todayX != null && (
            <div
              className="pointer-events-none absolute bottom-0 top-0 z-10"
              style={{ left: `calc(${LABEL_W} + ${todayX}px)` }}
            >
              <div className="h-full w-px bg-brand/70" />
              <span className="absolute -top-0 left-1 rounded bg-brand px-1 text-[9px] font-bold text-brand-ink">
                Hoy
              </span>
            </div>
          )}

          {spans.map((s, i) => (
            <div key={s.etapa.id} className="flex items-stretch border-b border-line/60 last:border-b-0">
              {/* Etiqueta sticky */}
              <button
                type="button"
                onClick={() => onEtapaClick(s.etapa)}
                className="sticky left-0 z-10 flex shrink-0 items-center gap-2 border-r border-line bg-surface/80 px-3 py-2.5 text-left backdrop-blur transition-colors hover:bg-surface-2"
                style={{ width: LABEL_W }}
              >
                <span className={cn("h-2 w-2 shrink-0 rounded-full", ESTADO_ETAPA_BADGE[s.etapa.estado].dot)} />
                <span className="min-w-0 flex-1 truncate text-xs font-medium text-content">
                  {s.etapa.nombre}
                </span>
              </button>

              {/* Track */}
              <div className="relative py-2.5" style={{ width: trackWidth, minHeight: "2.75rem" }}>
                {s.start && s.end ? (
                  <motion.button
                    type="button"
                    onClick={() => onEtapaClick(s.etapa)}
                    initial={reduced ? false : { opacity: 0, scaleX: 0.6 }}
                    animate={{ opacity: 1, scaleX: 1 }}
                    transition={{
                      delay: reduced ? 0 : i * 0.06,
                      type: "spring",
                      stiffness: 260,
                      damping: 26,
                    }}
                    style={{
                      left: diffDays(min, s.start) * pxPerDay,
                      width: Math.max(pxPerDay, (diffDays(s.start, s.end) + 1) * pxPerDay),
                      transformOrigin: "left",
                    }}
                    className="absolute top-1/2 h-6 -translate-y-1/2 overflow-hidden rounded-md bg-surface-2 ring-1 ring-inset ring-line"
                    aria-label={`${s.etapa.nombre}: ${s.etapa.porcentaje ?? 0}%`}
                  >
                    <span
                      className={cn("absolute inset-y-0 left-0 rounded-md", ETAPA_BAR[s.etapa.estado])}
                      style={{ width: `${s.etapa.porcentaje ?? 0}%` }}
                    />
                    <span className="absolute inset-0 grid place-items-center px-1 text-[10px] font-semibold text-content mix-blend-luminosity">
                      {s.etapa.porcentaje ?? 0}%
                    </span>
                  </motion.button>
                ) : (
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[11px] italic text-content-subtle">
                    sin fechas
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarCheck } from "lucide-react";
import {
  listAsistenciaPersona,
  type AsistenciaConObra,
} from "@/app/(app)/asistencia/actions";
import {
  diasTrabajados,
  puntualidad,
  PUNTUALIDAD_BADGE,
  ESTADO_ASISTENCIA_UI,
  ESTADOS_ASISTENCIA,
} from "@/lib/proyectos/types";
import { cn } from "@/lib/utils";

function monthRange() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  const y = d.getFullYear(), m = d.getMonth();
  return { desde: `${y}-${p(m + 1)}-01`, hasta: `${y}-${p(m + 1)}-${p(d.getDate())}` };
}

/** Consolidado de asistencia por persona en un rango. Muestra el total de días
 *  trabajados (presente=1, medio=0.5) — base de la nómina futura. */
export function AsistenciaConsolidado({ personaId }: { personaId: string }) {
  const init = monthRange();
  const [desde, setDesde] = useState(init.desde);
  const [hasta, setHasta] = useState(init.hasta);
  const [rows, setRows] = useState<AsistenciaConObra[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    listAsistenciaPersona(personaId, desde, hasta).then((r) => {
      if (alive) {
        setRows(r);
        setLoading(false);
      }
    });
    return () => {
      alive = false;
    };
  }, [personaId, desde, hasta]);

  const dias = diasTrabajados(rows);
  const conteo = { presente: 0, medio: 0, ausente: 0 };
  let tardanzas = 0;
  for (const r of rows) {
    conteo[r.estado]++;
    if (puntualidad(r.hora_entrada, r.obra?.hora_entrada_esperada)?.estado === "tarde") tardanzas++;
  }

  const inp = "h-9 rounded-lg border border-line bg-surface px-2.5 text-xs text-content focus:border-brand/50 focus:outline-none";

  return (
    <div>
      <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-content-muted">
        <CalendarCheck className="h-4 w-4 text-content-subtle" />
        Asistencia
      </p>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <input type="date" value={desde} max={hasta} onChange={(e) => setDesde(e.target.value)} className={inp} aria-label="Desde" />
        <span className="text-xs text-content-subtle">a</span>
        <input type="date" value={hasta} min={desde} onChange={(e) => setHasta(e.target.value)} className={inp} aria-label="Hasta" />
      </div>

      <div className="rounded-xl border border-line bg-surface-2/40 p-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs text-content-muted">Días trabajados en el rango</p>
            <p className="text-2xl font-bold tabular-nums text-content">
              {loading ? "—" : dias.toLocaleString("es-DO", { maximumFractionDigits: 1 })}
            </p>
            {!loading && tardanzas > 0 && (
              <p className="mt-0.5 text-xs font-medium text-amber-700 dark:text-amber-300">
                {tardanzas} {tardanzas === 1 ? "tardanza" : "tardanzas"} en el rango
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {ESTADOS_ASISTENCIA.map((e) => (
              <span key={e.value} className="inline-flex items-center gap-1 rounded-full bg-surface px-2 py-0.5 font-medium text-content-muted">
                <span className={cn("h-2 w-2 rounded-full", ESTADO_ASISTENCIA_UI[e.value].dot)} />
                <span className="font-semibold text-content">{conteo[e.value]}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {!loading && rows.length > 0 && (
        <ul className="mt-2 max-h-48 space-y-1.5 overflow-y-auto">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center gap-2.5 rounded-lg border border-line bg-surface-2/30 px-3 py-2">
              <span className={cn("h-2 w-2 shrink-0 rounded-full", ESTADO_ASISTENCIA_UI[r.estado].dot)} />
              <span className="w-20 shrink-0 text-xs tabular-nums text-content-muted">{fmt(r.fecha)}</span>
              {r.obra ? (
                <Link href={`/obras/${r.obra.id}?vista=asistencia`} className="min-w-0 flex-1 truncate text-xs text-content hover:text-brand">
                  {r.obra.nombre}
                </Link>
              ) : (
                <span className="min-w-0 flex-1 truncate text-xs text-content-subtle">Obra</span>
              )}
              {(() => {
                const p = puntualidad(r.hora_entrada, r.obra?.hora_entrada_esperada);
                if (!p || p.estado === "a_tiempo") return null;
                return (
                  <span className={cn("hidden shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold sm:inline-block", PUNTUALIDAD_BADGE[p.estado].badge)}>
                    {PUNTUALIDAD_BADGE[p.estado].label}
                  </span>
                );
              })()}
              <span className={cn("shrink-0 text-[11px] font-semibold", ESTADO_ASISTENCIA_UI[r.estado].text)}>
                {r.estado === "medio" ? "½ día" : r.estado === "presente" ? "Presente" : "Ausente"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function fmt(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("es-DO", { day: "2-digit", month: "short" });
}

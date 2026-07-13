"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { CalendarDays, MoreHorizontal, Loader2, Users } from "lucide-react";
import { Reveal, Stagger, EmptyState, Button } from "@/components/primitives";
import { Modal } from "@/components/ui/Modal";
import {
  getPaseLista,
  marcarAsistencia,
} from "@/app/(app)/asistencia/actions";
import {
  ESTADOS_ASISTENCIA,
  ESTADO_ASISTENCIA_UI,
  type EstadoAsistencia,
  type PaseListaRow,
} from "@/lib/proyectos/types";
import { cn } from "@/lib/utils";

function todayISO(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function AsistenciaTab({ obraId }: { obraId: string }) {
  const [fecha, setFecha] = useState(todayISO());
  const [rows, setRows] = useState<PaseListaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [detalle, setDetalle] = useState<PaseListaRow | null>(null);
  const [, start] = useTransition();

  const load = useCallback(() => {
    setLoading(true);
    getPaseLista(obraId, fecha).then((r) => {
      setRows(r);
      setLoading(false);
    });
  }, [obraId, fecha]);
  useEffect(() => {
    load();
  }, [load]);

  function marcar(personaId: string, estado: EstadoAsistencia) {
    setRows((prev) =>
      prev.map((r) =>
        r.persona.id === personaId
          ? {
              ...r,
              asistencia: {
                id: r.asistencia?.id ?? "tmp",
                persona_id: personaId,
                obra_id: obraId,
                fecha,
                estado,
                horas: r.asistencia?.horas ?? null,
                hora_entrada: r.asistencia?.hora_entrada ?? null,
                hora_salida: r.asistencia?.hora_salida ?? null,
                notas: r.asistencia?.notas ?? null,
              },
            }
          : r,
      ),
    );
    start(async () => {
      await marcarAsistencia(personaId, obraId, fecha, estado);
    });
  }

  const conteo = { presente: 0, medio: 0, ausente: 0, sin: 0 };
  for (const r of rows) {
    if (!r.asistencia) conteo.sin++;
    else conteo[r.asistencia.estado]++;
  }

  return (
    <>
      {/* Fecha + resumen del día */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <label className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface/60 px-3 py-2">
          <CalendarDays className="h-4 w-4 text-content-subtle" />
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value || todayISO())}
            className="bg-transparent text-sm text-content focus:outline-none"
            aria-label="Fecha de asistencia"
          />
        </label>
        {rows.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Chip tone="presente" n={conteo.presente} label="presentes" />
            <Chip tone="medio" n={conteo.medio} label="medio" />
            <Chip tone="ausente" n={conteo.ausente} label="ausentes" />
            {conteo.sin > 0 && (
              <span className="rounded-full bg-surface-2 px-2 py-0.5 font-medium text-content-muted">
                {conteo.sin} sin marcar
              </span>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-2.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-surface-2/60" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <Reveal standalone>
          <div className="rounded-2xl border border-line bg-surface/50 shadow-card">
            <EmptyState
              icon={Users}
              title="Sin personal asignado"
              description="Asigna personal a esta obra (pestaña Equipo) para poder pasar lista."
              size="sm"
            />
          </div>
        </Reveal>
      ) : (
        <Stagger className="space-y-2.5">
          {rows.map((r) => (
            <Reveal key={r.persona.id}>
              <div className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-surface/50 p-3 shadow-card">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-content">{r.persona.nombre}</p>
                  <p className="truncate text-xs text-content-subtle">
                    {r.rol_en_obra || r.persona.oficio || "—"}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="inline-flex overflow-hidden rounded-lg border border-line">
                    {ESTADOS_ASISTENCIA.map((e) => {
                      const active = r.asistencia?.estado === e.value;
                      return (
                        <button
                          key={e.value}
                          type="button"
                          onClick={() => marcar(r.persona.id, e.value)}
                          aria-pressed={active}
                          title={e.label}
                          className={cn(
                            "min-w-[44px] px-3 py-2 text-xs font-bold transition-colors",
                            active
                              ? ESTADO_ASISTENCIA_UI[e.value].on
                              : "bg-surface text-content-muted hover:bg-surface-2",
                          )}
                        >
                          {e.corto}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    onClick={() => setDetalle(r)}
                    aria-label="Detalle del día"
                    className="grid h-9 w-9 place-items-center rounded-lg text-content-subtle transition-colors hover:bg-surface-2 hover:text-content"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </Reveal>
          ))}
        </Stagger>
      )}

      <Modal
        open={Boolean(detalle)}
        onClose={() => setDetalle(null)}
        title={detalle?.persona.nombre ?? "Detalle"}
        subtitle={`Asistencia · ${fecha}`}
      >
        {detalle && (
          <DetalleForm
            row={detalle}
            obraId={obraId}
            fecha={fecha}
            onSaved={() => {
              setDetalle(null);
              load();
            }}
            onCancel={() => setDetalle(null)}
          />
        )}
      </Modal>
    </>
  );
}

function Chip({ tone, n, label }: { tone: EstadoAsistencia; n: number; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2 py-0.5 font-medium text-content-muted">
      <span className={cn("h-2 w-2 rounded-full", ESTADO_ASISTENCIA_UI[tone].dot)} />
      <span className="font-semibold text-content">{n}</span> {label}
    </span>
  );
}

function DetalleForm({
  row,
  obraId,
  fecha,
  onSaved,
  onCancel,
}: {
  row: PaseListaRow;
  obraId: string;
  fecha: string;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const a = row.asistencia;
  const [estado, setEstado] = useState<EstadoAsistencia>(a?.estado ?? "presente");
  const [horas, setHoras] = useState(a?.horas != null ? String(a.horas) : "");
  const [entrada, setEntrada] = useState(a?.hora_entrada ?? "");
  const [salida, setSalida] = useState(a?.hora_salida ?? "");
  const [notas, setNotas] = useState(a?.notas ?? "");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function guardar() {
    setError(null);
    start(async () => {
      const res = await marcarAsistencia(row.persona.id, obraId, fecha, estado, {
        horas: horas === "" ? null : Number(horas),
        hora_entrada: entrada || null,
        hora_salida: salida || null,
        notas: notas || null,
      });
      if (res.ok) onSaved();
      else setError(res.error);
    });
  }

  const inp =
    "h-11 w-full rounded-xl border border-line bg-surface/60 px-3.5 text-sm text-content placeholder:text-content-subtle focus:border-brand/50 focus:outline-none";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-content-muted">Estado</label>
          <div className="inline-flex w-full overflow-hidden rounded-xl border border-line">
            {ESTADOS_ASISTENCIA.map((e) => (
              <button
                key={e.value}
                type="button"
                onClick={() => setEstado(e.value)}
                className={cn(
                  "flex-1 px-3 py-2.5 text-sm font-semibold transition-colors",
                  estado === e.value ? ESTADO_ASISTENCIA_UI[e.value].on : "bg-surface text-content-muted hover:bg-surface-2",
                )}
              >
                {e.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-content-muted">Horas trabajadas (opcional)</label>
          <input type="number" min={0} max={24} step="0.5" value={horas} onChange={(e) => setHoras(e.target.value)} placeholder="Ej. 8" className={inp} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-content-muted">Entrada</label>
            <input type="time" value={entrada} onChange={(e) => setEntrada(e.target.value)} className={inp} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-content-muted">Salida</label>
            <input type="time" value={salida} onChange={(e) => setSalida(e.target.value)} className={inp} />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-content-muted">Notas del día</label>
          <textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={2} placeholder="Ej. salió temprano, horas extra…" className={cn(inp, "min-h-[64px] resize-y py-2.5")} />
        </div>
        {error && <p className="rounded-lg bg-danger/10 px-3 py-2 text-xs font-medium text-danger">{error}</p>}
      </div>
      <div className="flex shrink-0 items-center justify-end gap-2.5 border-t border-line px-5 py-4">
        <Button type="button" variant="secondary" size="md" onClick={onCancel} disabled={pending}>Cancelar</Button>
        <button type="button" onClick={guardar} disabled={pending} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-gradient px-5 text-sm font-semibold text-brand-ink shadow-glow transition-transform hover:scale-[1.02] active:scale-[0.99] disabled:opacity-70">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar"}
        </button>
      </div>
    </div>
  );
}

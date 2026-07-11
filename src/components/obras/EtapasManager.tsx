"use client";

import { useState, type KeyboardEvent } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Check, Plus, Trash2, ListChecks } from "lucide-react";
import { ProgressBar } from "@/components/primitives";
import { calcularAvance, type EtapaDraft } from "@/lib/proyectos/types";
import { cn } from "@/lib/utils";

/**
 * EtapasManager — Edwin define las etapas de la obra y las marca completadas.
 * El avance se calcula solo (completadas ÷ total). Estado local; persiste al
 * guardar la obra. Base del futuro módulo Etapas + Gantt.
 */
export function EtapasManager({
  etapas,
  onChange,
}: {
  etapas: EtapaDraft[];
  onChange: (next: EtapaDraft[]) => void;
}) {
  const reduced = useReducedMotion();
  const [nombre, setNombre] = useState("");

  const total = etapas.length;
  const done = etapas.filter((e) => e.completada).length;
  const avance = calcularAvance(etapas);

  function add() {
    const n = nombre.trim();
    if (!n) return;
    onChange([...etapas, { nombre: n, completada: false, orden: etapas.length }]);
    setNombre("");
  }
  function toggle(i: number) {
    onChange(
      etapas.map((e, idx) =>
        idx === i ? { ...e, completada: !e.completada } : e,
      ),
    );
  }
  function remove(i: number) {
    onChange(etapas.filter((_, idx) => idx !== i).map((e, idx) => ({ ...e, orden: idx })));
  }
  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      add();
    }
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className="text-xs font-medium text-content-muted">
          Avance por etapas
        </label>
        <span className="text-xs font-semibold tabular-nums text-content">
          {avance}%
        </span>
      </div>

      {total > 0 ? (
        <>
          <ProgressBar value={avance} size="sm" tone={avance === 100 ? "success" : "brand"} />
          <p className="mt-1.5 text-xs text-content-subtle">
            {done} de {total} etapas completadas
          </p>

          <ul className="mt-3 space-y-1.5">
            <AnimatePresence initial={false}>
              {etapas.map((e, i) => (
                <motion.li
                  key={e.id ?? `new-${i}-${e.nombre}`}
                  initial={reduced ? false : { opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduced ? { opacity: 0 } : { opacity: 0, x: -8 }}
                  className="flex items-center gap-2.5 rounded-xl border border-line bg-surface-2/40 px-3 py-2"
                >
                  <button
                    type="button"
                    onClick={() => toggle(i)}
                    aria-pressed={e.completada}
                    aria-label={e.completada ? "Marcar pendiente" : "Marcar completada"}
                    className={cn(
                      "grid h-6 w-6 shrink-0 place-items-center rounded-md border transition-colors",
                      e.completada
                        ? "border-success bg-success text-white"
                        : "border-line bg-surface hover:border-brand/50",
                    )}
                  >
                    <AnimatePresence>
                      {e.completada && (
                        <motion.span
                          initial={reduced ? false : { scale: 0.4, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.4, opacity: 0 }}
                          transition={{ type: "spring", stiffness: 500, damping: 22 }}
                        >
                          <Check className="h-4 w-4" strokeWidth={3} />
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </button>
                  <span
                    className={cn(
                      "min-w-0 flex-1 truncate text-sm",
                      e.completada
                        ? "text-content-subtle line-through"
                        : "text-content",
                    )}
                  >
                    {e.nombre}
                  </span>
                  <button
                    type="button"
                    onClick={() => remove(i)}
                    className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-content-subtle transition-colors hover:bg-danger/10 hover:text-danger"
                    aria-label={`Eliminar etapa ${e.nombre}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </>
      ) : (
        <div className="flex flex-col items-center rounded-xl border border-dashed border-line px-4 py-6 text-center">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand/12 text-brand">
            <ListChecks className="h-5 w-5" />
          </span>
          <p className="mt-2 text-xs text-content-muted">
            Agrega las etapas de esta obra para llevar el avance.
          </p>
        </div>
      )}

      {/* Agregar etapa */}
      <div className="mt-2.5 flex gap-2">
        <input
          type="text"
          value={nombre}
          onChange={(ev) => setNombre(ev.target.value)}
          onKeyDown={onKey}
          placeholder="Ej. Cimentación, Estructura, Techado…"
          className="h-10 w-full rounded-xl border border-line bg-surface/60 px-3 text-sm text-content placeholder:text-content-subtle transition-colors focus:border-brand/50 focus:bg-surface focus:outline-none"
        />
        <button
          type="button"
          onClick={add}
          disabled={!nombre.trim()}
          className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl border border-line bg-surface px-3 text-sm font-semibold text-content transition-colors hover:border-brand/50 hover:text-brand disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          Agregar
        </button>
      </div>
    </div>
  );
}

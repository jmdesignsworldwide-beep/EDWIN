"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown, Check, Plus, Search, Loader2 } from "lucide-react";
import { listOpciones, addOpcion } from "@/app/(app)/opciones/actions";
import type { CategoriaOpcion } from "@/lib/proyectos/types";
import { cn } from "@/lib/utils";

/**
 * SmartSelect — selector premium que APRENDE. Muestra opciones de ejemplo +
 * las que Edwin ha guardado; permite escribir para filtrar y, si el texto no
 * existe, ofrece "+ Agregar 'X'" — que se usa de inmediato y se guarda para la
 * próxima vez. Se expande inline (no rompe el scroll de los modales). Coherente
 * en ambos temas; respeta prefers-reduced-motion.
 */
export function SmartSelect({
  value,
  onChange,
  categoria,
  defaults = [],
  placeholder = "Seleccionar o escribir…",
  ariaLabel,
}: {
  value: string | null;
  onChange: (value: string) => void;
  categoria: CategoriaOpcion;
  defaults?: string[];
  placeholder?: string;
  ariaLabel?: string;
}) {
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [saved, setSaved] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [pending, start] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  // Carga las opciones guardadas la primera vez que se abre.
  useEffect(() => {
    if (!open || loaded) return;
    let alive = true;
    listOpciones(categoria).then((opts) => {
      if (alive) {
        setSaved(opts);
        setLoaded(true);
      }
    });
    return () => {
      alive = false;
    };
  }, [open, loaded, categoria]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Une ejemplos + guardadas + el valor actual (por si es texto libre previo).
  const opciones = useMemo(() => {
    const set = new Map<string, string>(); // lower → display
    for (const v of defaults) set.set(v.toLowerCase(), v);
    for (const v of saved) set.set(v.toLowerCase(), v);
    if (value) set.set(value.toLowerCase(), value);
    return [...set.values()].sort((a, b) => a.localeCompare(b));
  }, [defaults, saved, value]);

  const q = query.trim();
  const filtered = useMemo(() => {
    const lq = q.toLowerCase();
    if (!lq) return opciones;
    return opciones.filter((o) => o.toLowerCase().includes(lq));
  }, [opciones, q]);

  const exists = q !== "" && opciones.some((o) => o.toLowerCase() === q.toLowerCase());

  function pick(v: string) {
    onChange(v);
    setOpen(false);
    setQuery("");
  }

  function agregar() {
    const nuevo = q;
    if (!nuevo) return;
    start(async () => {
      const res = await addOpcion(categoria, nuevo);
      const valor = res.ok ? res.valor : nuevo;
      setSaved((prev) => (prev.some((v) => v.toLowerCase() === valor.toLowerCase()) ? prev : [...prev, valor]));
      pick(valor);
    });
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        className="flex h-11 w-full items-center justify-between gap-2 rounded-xl border border-line bg-surface/60 px-3.5 text-sm transition-colors hover:border-brand/40 focus:border-brand/50 focus:outline-none"
      >
        <span className={cn("truncate", value ? "text-content" : "text-content-subtle")}>
          {value || placeholder}
        </span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-content-subtle transition-transform", open && "rotate-180")} />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={reduced ? false : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="mt-2 rounded-xl border border-line bg-surface-2/60 p-2 shadow-card backdrop-blur-sm">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-content-subtle" />
                <input
                  type="text"
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (q && !exists) agregar();
                      else if (filtered.length === 1) pick(filtered[0]);
                    }
                  }}
                  placeholder="Buscar o escribir…"
                  className="h-9 w-full rounded-lg border border-line bg-surface pl-8 pr-3 text-sm text-content placeholder:text-content-subtle focus:border-brand/50 focus:outline-none"
                />
              </div>

              <ul className="mt-2 max-h-52 space-y-0.5 overflow-y-auto" role="listbox">
                {filtered.map((o) => {
                  const active = value?.toLowerCase() === o.toLowerCase();
                  return (
                    <li key={o} role="option" aria-selected={active}>
                      <button
                        type="button"
                        onClick={() => pick(o)}
                        className={cn(
                          "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                          active ? "bg-brand/12 text-brand ring-1 ring-inset ring-brand/25" : "text-content hover:bg-brand/10 hover:text-brand",
                        )}
                      >
                        <span className="truncate">{o}</span>
                        {active && <Check className="h-4 w-4 shrink-0" />}
                      </button>
                    </li>
                  );
                })}
                {!loaded && (
                  <li className="flex items-center gap-2 px-3 py-2 text-xs text-content-subtle">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Cargando opciones…
                  </li>
                )}
                {loaded && filtered.length === 0 && !q && (
                  <li className="px-3 py-2 text-xs text-content-subtle">Escribe para agregar una opción.</li>
                )}
              </ul>

              {q !== "" && !exists && (
                <div className="mt-1 border-t border-line pt-1">
                  <button
                    type="button"
                    onClick={agregar}
                    disabled={pending}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-brand transition-colors hover:bg-brand/10 disabled:opacity-70"
                  >
                    {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    Agregar “{q}”
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

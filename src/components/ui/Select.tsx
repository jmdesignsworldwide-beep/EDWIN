"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type SelectOption = { value: string; label: string; hint?: string };

/**
 * Select — desplegable premium propio (reemplaza el `<select>` nativo blanco del
 * navegador). Coherente con el tema oscuro/dorado: fondo oscuro, bordes
 * redondeados, opción activa en dorado y hover dorado. Se expande inline (no
 * flota) para no romper el scroll dentro de los modales. Teclado: Escape cierra;
 * clic fuera cierra. Respeta prefers-reduced-motion.
 */
export function Select({
  value,
  onChange,
  options,
  placeholder = "Seleccionar…",
  disabled,
  className,
  ariaLabel,
  id,
}: {
  value: string | null;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
  id?: string;
}) {
  const reduced = useReducedMotion();
  const autoId = useId();
  const listId = id ?? autoId;
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value) ?? null;

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

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        className={cn(
          "flex h-11 w-full items-center justify-between gap-2 rounded-xl border border-line bg-surface/60 px-3.5 text-sm transition-colors hover:border-brand/40 focus:border-brand/50 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60",
        )}
      >
        <span className={cn("truncate", selected ? "text-content" : "text-content-subtle")}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-content-subtle transition-transform",
            open && "rotate-180",
          )}
        />
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
            <ul
              role="listbox"
              id={listId}
              className="mt-2 max-h-56 space-y-0.5 overflow-y-auto rounded-xl border border-line bg-surface-2/60 p-1.5 shadow-card backdrop-blur-sm"
            >
              {options.map((o) => {
                const active = o.value === value;
                return (
                  <li key={o.value} role="option" aria-selected={active}>
                    <button
                      type="button"
                      onClick={() => {
                        onChange(o.value);
                        setOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                        active
                          ? "bg-brand/12 text-brand ring-1 ring-inset ring-brand/25"
                          : "text-content hover:bg-brand/10 hover:text-brand",
                      )}
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{o.label}</span>
                        {o.hint && (
                          <span className="block truncate text-xs text-content-subtle">{o.hint}</span>
                        )}
                      </span>
                      {active && <Check className="h-4 w-4 shrink-0" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

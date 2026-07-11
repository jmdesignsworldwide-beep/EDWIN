"use client";

import { useMemo, useState, useTransition } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown, Search, UserPlus, Check, Loader2, X } from "lucide-react";
import { createPersona } from "@/app/(app)/personal/actions";
import type { Persona } from "@/lib/proyectos/types";
import { cn } from "@/lib/utils";

/**
 * PersonalSelect — selector de persona con búsqueda + quick-add (mismo patrón
 * que ClienteSelect / ProveedorSelect). Se expande inline.
 */
export function PersonalSelect({
  personal,
  value,
  onChange,
  onCreated,
  excludeIds = [],
}: {
  personal: Persona[];
  value: string | null;
  onChange: (id: string | null) => void;
  onCreated: (p: Persona) => void;
  excludeIds?: string[];
}) {
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);

  const selected = personal.find((p) => p.id === value) ?? null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return personal
      .filter((p) => !excludeIds.includes(p.id))
      .filter((p) => !q || p.nombre.toLowerCase().includes(q) || (p.oficio ?? "").toLowerCase().includes(q));
  }, [personal, query, excludeIds]);

  return (
    <div>
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex h-11 w-full items-center justify-between gap-2 rounded-xl border border-line bg-surface/60 px-3.5 text-sm transition-colors hover:border-brand/40 focus:border-brand/50 focus:outline-none" aria-expanded={open}>
        <span className={cn("truncate", selected ? "text-content" : "text-content-subtle")}>{selected ? selected.nombre : "Elegir persona…"}</span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-content-subtle transition-transform", open && "rotate-180")} />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={reduced ? false : { opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={reduced ? { opacity: 0 } : { opacity: 0, height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="mt-2 rounded-xl border border-line bg-surface-2/40 p-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-content-subtle" />
                <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar persona…" className="h-9 w-full rounded-lg border border-line bg-surface pl-8 pr-3 text-sm text-content placeholder:text-content-subtle focus:border-brand/50 focus:outline-none" />
              </div>

              {!adding && (
                <ul className="mt-2 max-h-44 space-y-0.5 overflow-y-auto">
                  {filtered.length === 0 && <li className="px-2 py-2 text-xs text-content-subtle">Sin coincidencias. Registra abajo.</li>}
                  {filtered.map((p) => (
                    <li key={p.id}>
                      <button type="button" onClick={() => { onChange(p.id); setOpen(false); }} className={cn("flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-surface", p.id === value ? "text-brand" : "text-content")}>
                        <span className="min-w-0">
                          <span className="block truncate font-medium">{p.nombre}</span>
                          {p.oficio && <span className="block truncate text-xs text-content-subtle">{p.oficio}</span>}
                        </span>
                        {p.id === value && <Check className="h-4 w-4 shrink-0" />}
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-2 border-t border-line pt-2">
                {adding ? (
                  <QuickAdd initialNombre={query} onCancel={() => setAdding(false)} onCreated={(p) => { onCreated(p); onChange(p.id); setAdding(false); setOpen(false); setQuery(""); }} />
                ) : (
                  <button type="button" onClick={() => setAdding(true)} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-semibold text-brand transition-colors hover:bg-brand/10">
                    <UserPlus className="h-4 w-4" />Registrar persona
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function QuickAdd({ initialNombre, onCreated, onCancel }: { initialNombre: string; onCreated: (p: Persona) => void; onCancel: () => void }) {
  const [nombre, setNombre] = useState(initialNombre);
  const [oficio, setOficio] = useState("");
  const [telefono, setTelefono] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function guardar() {
    setError(null);
    if (!nombre.trim()) { setError("El nombre es obligatorio."); return; }
    start(async () => {
      const res = await createPersona({ nombre, oficio: oficio || null, telefono: telefono || null, cedula: null, jornal: null, jornal_tipo: "dia", activo: true, notas: null });
      if (res.ok) onCreated(res.persona);
      else setError(res.error);
    });
  }

  const inp = "h-9 w-full rounded-lg border border-line bg-surface px-3 text-sm text-content placeholder:text-content-subtle focus:border-brand/50 focus:outline-none";
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-content">Nueva persona</p>
        <button type="button" onClick={onCancel} className="grid h-6 w-6 place-items-center rounded text-content-subtle hover:text-content" aria-label="Cancelar"><X className="h-4 w-4" /></button>
      </div>
      <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre completo *" className={inp} />
      <input type="text" value={oficio} onChange={(e) => setOficio(e.target.value)} placeholder="Oficio (Ayudante…)" className={inp} />
      <input type="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="Teléfono" className={inp} />
      {error && <p className="text-xs font-medium text-danger">{error}</p>}
      <button type="button" onClick={guardar} disabled={pending} className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-brand-gradient text-sm font-semibold text-brand-ink transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar persona"}
      </button>
    </div>
  );
}

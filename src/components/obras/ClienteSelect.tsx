"use client";

import { useMemo, useState, useTransition } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown, Search, UserPlus, Check, Loader2, X, User, Building2 } from "lucide-react";
import { createCliente } from "@/app/(app)/obras/clientes-actions";
import type { Cliente, ClienteTipo } from "@/lib/proyectos/types";
import { cn } from "@/lib/utils";

/**
 * ClienteSelect — selector de cliente registrado con búsqueda + quick-add.
 * Se expande inline (no flota) para no romper el scroll del modal. Al
 * registrar un cliente nuevo queda seleccionado y disponible para futuras obras.
 */
export function ClienteSelect({
  clientes,
  value,
  onChange,
  onClienteCreated,
}: {
  clientes: Cliente[];
  value: string | null;
  onChange: (id: string | null) => void;
  onClienteCreated: (c: Cliente) => void;
}) {
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);

  const selected = clientes.find((c) => c.id === value) ?? null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clientes;
    return clientes.filter(
      (c) =>
        c.nombre.toLowerCase().includes(q) ||
        (c.telefono ?? "").toLowerCase().includes(q) ||
        (c.cedula_rnc ?? "").toLowerCase().includes(q),
    );
  }, [clientes, query]);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-11 w-full items-center justify-between gap-2 rounded-xl border border-line bg-surface/60 px-3.5 text-sm transition-colors hover:border-brand/40 focus:border-brand/50 focus:outline-none"
        aria-expanded={open}
      >
        <span className={cn("truncate", selected ? "text-content" : "text-content-subtle")}>
          {selected ? selected.nombre : "Seleccionar cliente…"}
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
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-2 rounded-xl border border-line bg-surface-2/40 p-2">
              {/* Buscar */}
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-content-subtle" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar cliente…"
                  className="h-9 w-full rounded-lg border border-line bg-surface pl-8 pr-3 text-sm text-content placeholder:text-content-subtle focus:border-brand/50 focus:outline-none"
                />
              </div>

              {/* Lista */}
              {!adding && (
                <ul className="mt-2 max-h-44 space-y-0.5 overflow-y-auto">
                  {filtered.length === 0 && (
                    <li className="px-2 py-2 text-xs text-content-subtle">
                      Sin coincidencias. Registra el cliente abajo.
                    </li>
                  )}
                  {filtered.map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => {
                          onChange(c.id);
                          setOpen(false);
                        }}
                        className={cn(
                          "flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-surface",
                          c.id === value ? "text-brand" : "text-content",
                        )}
                      >
                        <span className="min-w-0">
                          <span className="block truncate font-medium">{c.nombre}</span>
                          {(c.telefono || c.cedula_rnc) && (
                            <span className="block truncate text-xs text-content-subtle">
                              {[c.telefono, c.cedula_rnc].filter(Boolean).join(" · ")}
                            </span>
                          )}
                        </span>
                        {c.id === value && <Check className="h-4 w-4 shrink-0" />}
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {/* Quick-add */}
              <div className="mt-2 border-t border-line pt-2">
                {adding ? (
                  <QuickAdd
                    initialNombre={query}
                    onCancel={() => setAdding(false)}
                    onCreated={(c) => {
                      onClienteCreated(c);
                      onChange(c.id);
                      setAdding(false);
                      setOpen(false);
                      setQuery("");
                    }}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setAdding(true)}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-semibold text-brand transition-colors hover:bg-brand/10"
                  >
                    <UserPlus className="h-4 w-4" />
                    Registrar nuevo cliente
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {selected && !open && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="mt-1 text-xs text-content-subtle hover:text-danger"
        >
          Quitar cliente
        </button>
      )}
    </div>
  );
}

function QuickAdd({
  initialNombre,
  onCreated,
  onCancel,
}: {
  initialNombre: string;
  onCreated: (c: Cliente) => void;
  onCancel: () => void;
}) {
  const [tipo, setTipo] = useState<ClienteTipo>("persona");
  const [nombre, setNombre] = useState(initialNombre);
  const [telefono, setTelefono] = useState("");
  const [cedula, setCedula] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function guardar() {
    setError(null);
    if (!nombre.trim()) {
      setError(tipo === "empresa" ? "La razón social es obligatoria." : "El nombre es obligatorio.");
      return;
    }
    start(async () => {
      const res = await createCliente({
        nombre,
        tipo,
        telefono: telefono || null,
        cedula_rnc: cedula || null,
      });
      if (res.ok) onCreated(res.cliente);
      else setError(res.error);
    });
  }

  const inp =
    "h-9 w-full rounded-lg border border-line bg-surface px-3 text-sm text-content placeholder:text-content-subtle focus:border-brand/50 focus:outline-none";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-content">Nuevo cliente</p>
        <button
          type="button"
          onClick={onCancel}
          className="grid h-6 w-6 place-items-center rounded text-content-subtle hover:text-content"
          aria-label="Cancelar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="inline-flex w-full overflow-hidden rounded-lg border border-line">
        {(["persona", "empresa"] as ClienteTipo[]).map((t) => {
          const Icon = t === "empresa" ? Building2 : User;
          return (
            <button
              key={t}
              type="button"
              onClick={() => setTipo(t)}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-semibold transition-colors",
                tipo === t ? "bg-brand-gradient text-brand-ink" : "bg-surface text-content-muted hover:bg-surface-2",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {t === "empresa" ? "Empresa" : "Persona"}
            </button>
          );
        })}
      </div>
      <input
        type="text"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        placeholder={tipo === "empresa" ? "Razón social *" : "Nombre *"}
        className={inp}
      />
      <input
        type="tel"
        value={telefono}
        onChange={(e) => setTelefono(e.target.value)}
        placeholder="Teléfono (809-000-0000)"
        className={inp}
      />
      <input
        type="text"
        value={cedula}
        onChange={(e) => setCedula(e.target.value)}
        placeholder={tipo === "empresa" ? "RNC (9 dígitos)" : "Cédula (000-0000000-0)"}
        className={inp}
      />
      {error && <p className="text-xs font-medium text-danger">{error}</p>}
      <button
        type="button"
        onClick={guardar}
        disabled={pending}
        className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-brand-gradient text-sm font-semibold text-brand-ink transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar cliente"}
      </button>
    </div>
  );
}

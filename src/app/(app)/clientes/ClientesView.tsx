"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  UserSquare2,
  Plus,
  Database,
  Phone,
  HardHat,
  AlertTriangle,
  Search,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Reveal, Stagger, Button, EmptyState, MagneticCard } from "@/components/primitives";
import { SlideOver } from "@/components/ui/SlideOver";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ClienteForm } from "@/components/clientes/ClienteForm";
import { ClienteDetail } from "@/components/clientes/ClienteDetail";
import { ClienteTipoBadge } from "@/components/clientes/ClienteTipoBadge";
import { deleteCliente, type ClienteConObras } from "./actions";
import { cn } from "@/lib/utils";

type Filtro = "todos" | "incompletos";
type FormPanel = { type: "closed" } | { type: "create" } | { type: "edit"; cliente: ClienteConObras };

export function ClientesView({
  clientes,
  incompletos,
  configured,
  loadError,
}: {
  clientes: ClienteConObras[];
  incompletos: number;
  configured: boolean;
  loadError?: string;
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<FormPanel>({ type: "closed" });
  const [toDelete, setToDelete] = useState<ClienteConObras | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [query, setQuery] = useState("");

  const selected = clientes.find((c) => c.id === selectedId) ?? null;
  const closeForm = () => setForm({ type: "closed" });

  const visibles = useMemo(() => {
    const q = query.trim().toLowerCase();
    return clientes.filter((c) => {
      if (filtro === "incompletos" && c.datos_completos) return false;
      if (!q) return true;
      return (
        c.nombre.toLowerCase().includes(q) ||
        (c.telefono ?? "").toLowerCase().includes(q) ||
        (c.cedula_rnc ?? "").toLowerCase().includes(q)
      );
    });
  }, [clientes, filtro, query]);

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    setDeleteError(null);
    const res = await deleteCliente(toDelete.id);
    setDeleting(false);
    if (res.ok) {
      if (selectedId === toDelete.id) setSelectedId(null);
      setToDelete(null);
      router.refresh();
    } else {
      setDeleteError(res.error ?? "No se pudo eliminar.");
    }
  }

  return (
    <>
      <PageHeader
        title="Clientes"
        subtitle="Directorio de clientes: personas y empresas"
        action={
          configured ? (
            <Button icon={Plus} onClick={() => setForm({ type: "create" })}>Agregar cliente</Button>
          ) : undefined
        }
      />

      {loadError && (
        <div className="mb-5 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3">
          <p className="text-sm font-medium text-danger">{loadError}</p>
        </div>
      )}

      {configured && clientes.length > 0 && (
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-xl border border-line bg-surface/60 p-1">
            <FiltroBtn active={filtro === "todos"} onClick={() => setFiltro("todos")}>
              Todos <span className="opacity-60">{clientes.length}</span>
            </FiltroBtn>
            <FiltroBtn active={filtro === "incompletos"} onClick={() => setFiltro("incompletos")} warn={incompletos > 0}>
              Por completar <span className="opacity-60">{incompletos}</span>
            </FiltroBtn>
          </div>
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-subtle" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre, teléfono o documento…"
              className="h-10 w-full rounded-xl border border-line bg-surface/60 pl-9 pr-3 text-sm text-content placeholder:text-content-subtle focus:border-brand/50 focus:outline-none"
            />
          </div>
        </div>
      )}

      {!configured ? (
        <Reveal standalone>
          <div className="rounded-2xl border border-line bg-surface/50 shadow-card">
            <EmptyState
              icon={Database}
              title="Falta conectar Supabase"
              description="En cuanto se configuren las llaves, aquí podrás gestionar tus clientes."
              tone="accent"
            />
          </div>
        </Reveal>
      ) : clientes.length === 0 ? (
        <Reveal standalone>
          <div className="rounded-2xl border border-line bg-surface/50 shadow-card">
            <EmptyState
              icon={UserSquare2}
              title="Aún no hay clientes"
              description="Registra tu primer cliente — persona o empresa — con sus datos de contacto."
              actionLabel="Agregar cliente"
              actionIcon={Plus}
              onAction={() => setForm({ type: "create" })}
            />
          </div>
        </Reveal>
      ) : visibles.length === 0 ? (
        <Reveal standalone>
          <div className="rounded-2xl border border-line bg-surface/50 shadow-card">
            <EmptyState
              icon={Search}
              title="Sin coincidencias"
              description="Ningún cliente coincide con el filtro o la búsqueda actual."
              size="sm"
            />
          </div>
        </Reveal>
      ) : (
        <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibles.map((c) => {
            const nObras = c.obras?.length ?? 0;
            return (
              <Reveal key={c.id}>
                <MagneticCard className="cursor-pointer p-5" intensity={4}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(c.id)}
                    className="flex w-full flex-col text-left focus:outline-none"
                    aria-label={`Ver ${c.nombre}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="min-w-0 flex-1 truncate text-base font-semibold text-content">{c.nombre}</h3>
                      <ClienteTipoBadge tipo={c.tipo} />
                    </div>
                    {c.telefono && (
                      <p className="mt-2 flex items-center gap-1.5 text-sm text-content-muted">
                        <Phone className="h-3.5 w-3.5 text-content-subtle" />
                        {c.telefono}
                      </p>
                    )}
                    <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
                      <span className="flex items-center gap-1.5 text-xs text-content-subtle">
                        <HardHat className="h-3.5 w-3.5" />
                        {nObras} {nObras === 1 ? "obra" : "obras"}
                      </span>
                      {!c.datos_completos && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/12 px-2 py-0.5 text-[11px] font-semibold text-amber-700 ring-1 ring-inset ring-amber-500/25 dark:text-amber-300">
                          <AlertTriangle className="h-3 w-3" />
                          Completar datos
                        </span>
                      )}
                    </div>
                  </button>
                </MagneticCard>
              </Reveal>
            );
          })}
        </Stagger>
      )}

      <SlideOver
        open={Boolean(selected)}
        onClose={() => setSelectedId(null)}
        title={selected?.nombre ?? "Cliente"}
        subtitle={selected ? (selected.tipo === "empresa" ? "Empresa" : "Persona") : undefined}
        widthClass="max-w-lg"
      >
        {selected && (
          <ClienteDetail
            cliente={selected}
            onEdit={() => setForm({ type: "edit", cliente: selected })}
            onDelete={() => setToDelete(selected)}
          />
        )}
      </SlideOver>

      <Modal open={form.type === "create"} onClose={closeForm} title="Nuevo cliente" subtitle="Persona o empresa">
        <ClienteForm onSaved={() => { closeForm(); router.refresh(); }} onCancel={closeForm} />
      </Modal>
      <Modal
        open={form.type === "edit"}
        onClose={closeForm}
        title="Editar cliente"
        subtitle={form.type === "edit" ? form.cliente.nombre : undefined}
      >
        {form.type === "edit" && (
          <ClienteForm
            cliente={form.cliente}
            onSaved={() => { closeForm(); router.refresh(); }}
            onCancel={closeForm}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Eliminar cliente"
        description={
          deleteError
            ? deleteError
            : toDelete
              ? `Se eliminará "${toDelete.nombre}" del directorio. Esta acción no se puede deshacer.`
              : ""
        }
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => { setToDelete(null); setDeleteError(null); }}
      />
    </>
  );
}

function FiltroBtn({
  active,
  warn,
  onClick,
  children,
}: {
  active: boolean;
  warn?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-brand-gradient text-brand-ink shadow-glow"
          : warn
            ? "text-amber-700 hover:text-amber-800 dark:text-amber-300"
            : "text-content-muted hover:text-content",
      )}
    >
      {children}
    </button>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Truck, Plus, Database, RefreshCw, Phone, ShoppingCart } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Reveal, Stagger, Button, EmptyState, MagneticCard } from "@/components/primitives";
import { SlideOver } from "@/components/ui/SlideOver";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ProveedorForm } from "@/components/proveedores/ProveedorForm";
import { ProveedorDetail } from "@/components/proveedores/ProveedorDetail";
import { deleteProveedor } from "./actions";
import { totalComprado, type Proveedor } from "@/lib/proyectos/types";
import { formatCurrency } from "@/lib/utils";

type FormPanel = { type: "closed" } | { type: "create" } | { type: "edit"; proveedor: Proveedor };

export function ProveedoresView({
  proveedores,
  obras,
  configured,
  loadError,
}: {
  proveedores: Proveedor[];
  obras: { id: string; nombre: string }[];
  configured: boolean;
  loadError?: string;
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<FormPanel>({ type: "closed" });
  const [toDelete, setToDelete] = useState<Proveedor | null>(null);
  const [deleting, setDeleting] = useState(false);

  const selected = proveedores.find((p) => p.id === selectedId) ?? null;
  const closeForm = () => setForm({ type: "closed" });

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    const res = await deleteProveedor(toDelete.id);
    setDeleting(false);
    if (res.ok) {
      if (selectedId === toDelete.id) setSelectedId(null);
      setToDelete(null);
      router.refresh();
    }
  }

  return (
    <>
      <PageHeader
        title="Proveedores"
        subtitle="Directorio de proveedores y compras"
        action={
          configured ? (
            <Button icon={Plus} onClick={() => setForm({ type: "create" })}>
              Agregar proveedor
            </Button>
          ) : undefined
        }
      />

      {loadError && (
        <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3">
          <p className="text-sm font-medium text-danger">{loadError}</p>
          <button type="button" onClick={() => router.refresh()} className="inline-flex items-center gap-1.5 text-xs font-semibold text-danger hover:underline">
            <RefreshCw className="h-3.5 w-3.5" />
            Reintentar
          </button>
        </div>
      )}

      {!configured ? (
        <Reveal standalone>
          <div className="rounded-2xl border border-line bg-surface/50 shadow-card">
            <EmptyState
              icon={Database}
              title="Falta conectar Supabase"
              description="En cuanto se configuren las llaves, aquí podrás registrar proveedores y sus compras."
              tone="accent"
            />
          </div>
        </Reveal>
      ) : proveedores.length === 0 ? (
        <Reveal standalone>
          <div className="rounded-2xl border border-line bg-surface/50 shadow-card">
            <EmptyState
              icon={Truck}
              title="Aún no hay proveedores"
              description="Registra tu primer proveedor (ferretería, bloquera, agregados…) y lleva a quién le compras."
              actionLabel="Agregar proveedor"
              actionIcon={Plus}
              onAction={() => setForm({ type: "create" })}
            />
          </div>
        </Reveal>
      ) : (
        <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {proveedores.map((p) => {
            const compras = p.compras ?? [];
            const total = totalComprado(compras);
            return (
              <Reveal key={p.id}>
                <MagneticCard className="cursor-pointer p-5" intensity={4}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(p.id)}
                    className="flex w-full flex-col text-left focus:outline-none"
                    aria-label={`Ver ${p.nombre}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="min-w-0 flex-1 truncate text-base font-semibold text-content">{p.nombre}</h3>
                      {p.categoria && (
                        <span className="shrink-0 rounded-full bg-brand/12 px-2.5 py-1 text-xs font-semibold text-brand ring-1 ring-inset ring-brand/25">
                          {p.categoria}
                        </span>
                      )}
                    </div>
                    {p.telefono && (
                      <p className="mt-2 flex items-center gap-1.5 text-sm text-content-muted">
                        <Phone className="h-3.5 w-3.5 text-content-subtle" />
                        {p.telefono}
                      </p>
                    )}
                    <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
                      <span className="flex items-center gap-1.5 text-xs text-content-subtle">
                        <ShoppingCart className="h-3.5 w-3.5" />
                        {compras.length} compras
                      </span>
                      {total > 0 && (
                        <span className="text-sm font-semibold text-content">{formatCurrency(total)}</span>
                      )}
                    </div>
                  </button>
                </MagneticCard>
              </Reveal>
            );
          })}
        </Stagger>
      )}

      {/* Detalle */}
      <SlideOver
        open={Boolean(selected)}
        onClose={() => setSelectedId(null)}
        title={selected?.nombre ?? "Proveedor"}
        subtitle={selected?.categoria ?? undefined}
        widthClass="max-w-lg"
      >
        {selected && (
          <ProveedorDetail
            proveedor={selected}
            obras={obras}
            onEdit={() => setForm({ type: "edit", proveedor: selected })}
            onDelete={() => setToDelete(selected)}
          />
        )}
      </SlideOver>

      {/* Crear / editar proveedor */}
      <Modal open={form.type === "create"} onClose={closeForm} title="Nuevo proveedor" subtitle="Directorio">
        <ProveedorForm onSaved={() => { closeForm(); router.refresh(); }} onCancel={closeForm} />
      </Modal>
      <Modal
        open={form.type === "edit"}
        onClose={closeForm}
        title="Editar proveedor"
        subtitle={form.type === "edit" ? form.proveedor.nombre : undefined}
      >
        {form.type === "edit" && (
          <ProveedorForm
            proveedor={form.proveedor}
            onSaved={() => { closeForm(); router.refresh(); }}
            onCancel={closeForm}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Eliminar proveedor"
        description={
          toDelete
            ? `Se eliminará "${toDelete.nombre}" y sus compras. Los materiales que lo referencian quedarán sin proveedor.`
            : ""
        }
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Phone,
  IdCard,
  User2,
  FileText,
  Tag,
  Pencil,
  Trash2,
  Plus,
  ShoppingCart,
} from "lucide-react";
import { Button } from "@/components/primitives";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { CompraForm } from "./CompraForm";
import { deleteCompra } from "@/app/(app)/proveedores/compras-actions";
import {
  totalComprado,
  ultimaCompra,
  type Compra,
  type Proveedor,
} from "@/lib/proyectos/types";
import { formatCurrency } from "@/lib/utils";

type CompraPanel =
  | { type: "closed" }
  | { type: "create" }
  | { type: "edit"; compra: Compra };

export function ProveedorDetail({
  proveedor,
  obras,
  onEdit,
  onDelete,
}: {
  proveedor: Proveedor;
  obras: { id: string; nombre: string }[];
  onEdit: () => void;
  onDelete: () => void;
}) {
  const router = useRouter();
  const [panel, setPanel] = useState<CompraPanel>({ type: "closed" });
  const [toDelete, setToDelete] = useState<Compra | null>(null);
  const [deleting, startDelete] = useTransition();

  const compras = (proveedor.compras ?? [])
    .slice()
    .sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
  const total = totalComprado(compras);
  const ultima = ultimaCompra(compras);

  const obraNombre = (id: string | null) =>
    id ? obras.find((o) => o.id === id)?.nombre ?? null : null;

  const close = () => setPanel({ type: "closed" });
  const savedAndClose = () => {
    close();
    router.refresh();
  };

  function confirmDelete() {
    if (!toDelete) return;
    startDelete(async () => {
      const res = await deleteCompra(proveedor.id, toDelete.id);
      if (res.ok) {
        setToDelete(null);
        router.refresh();
      }
    });
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-6">
        {/* Datos */}
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Item icon={Tag} label="Categoría" value={proveedor.categoria} />
          <Item icon={Phone} label="Teléfono" value={proveedor.telefono} />
          <Item icon={IdCard} label="RNC / cédula" value={proveedor.rnc_cedula} />
          <Item icon={User2} label="Contacto" value={proveedor.contacto} />
        </dl>

        {proveedor.notas && (
          <div>
            <p className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-content-muted">
              <FileText className="h-4 w-4 text-content-subtle" />
              Notas
            </p>
            <p className="whitespace-pre-wrap rounded-xl border border-line bg-surface-2/40 p-3.5 text-sm text-content">
              {proveedor.notas}
            </p>
          </div>
        )}

        {/* Resumen de compras */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-line bg-surface-2/40 p-3.5">
            <p className="text-xs text-content-muted">Total comprado</p>
            <p className="mt-0.5 text-lg font-bold text-content">{formatCurrency(total)}</p>
          </div>
          <div className="rounded-xl border border-line bg-surface-2/40 p-3.5">
            <p className="text-xs text-content-muted">Última compra</p>
            <p className="mt-0.5 text-sm font-semibold text-content">
              {ultima ? formatDate(ultima) : "—"}
            </p>
          </div>
        </div>

        {/* Historial de compras */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-sm font-medium text-content-muted">
              <ShoppingCart className="h-4 w-4 text-content-subtle" />
              Compras
              <span className="text-content-subtle/70">· {compras.length}</span>
            </p>
            <Button icon={Plus} size="sm" variant="secondary" onClick={() => setPanel({ type: "create" })}>
              Agregar
            </Button>
          </div>

          {compras.length === 0 ? (
            <p className="rounded-xl border border-dashed border-line px-3 py-4 text-center text-xs text-content-muted">
              Aún no hay compras registradas a este proveedor.
            </p>
          ) : (
            <ul className="space-y-2">
              {compras.map((c) => (
                <li
                  key={c.id}
                  className="flex items-start gap-3 rounded-xl border border-line bg-surface-2/40 p-3"
                >
                  <button
                    type="button"
                    onClick={() => setPanel({ type: "edit", compra: c })}
                    className="min-w-0 flex-1 text-left"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-content-subtle">{formatDate(c.fecha)}</span>
                      {c.monto != null && (
                        <span className="text-sm font-semibold text-content">{formatCurrency(c.monto)}</span>
                      )}
                    </div>
                    {c.descripcion && (
                      <p className="mt-0.5 truncate text-sm text-content">{c.descripcion}</p>
                    )}
                    {obraNombre(c.obra_id) && (
                      <p className="mt-0.5 truncate text-xs text-content-subtle">
                        Obra: {obraNombre(c.obra_id)}
                      </p>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setToDelete(c)}
                    aria-label="Eliminar compra"
                    className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-content-subtle transition-colors hover:bg-danger/10 hover:text-danger"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Acciones proveedor */}
      <div className="mt-6 flex items-center justify-between gap-2.5 border-t border-line pt-4">
        <button
          type="button"
          onClick={onDelete}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-line px-4 text-sm font-semibold text-danger transition-colors hover:bg-danger/10"
        >
          <Trash2 className="h-4 w-4" />
          Eliminar
        </button>
        <Button variant="primary" size="md" icon={Pencil} onClick={onEdit}>
          Editar proveedor
        </Button>
      </div>

      {/* Modales de compra */}
      <Modal open={panel.type === "create"} onClose={close} title="Nueva compra" subtitle={proveedor.nombre}>
        <CompraForm proveedorId={proveedor.id} obras={obras} onSaved={savedAndClose} onCancel={close} />
      </Modal>
      <Modal
        open={panel.type === "edit"}
        onClose={close}
        title="Editar compra"
        subtitle={proveedor.nombre}
      >
        {panel.type === "edit" && (
          <CompraForm
            proveedorId={proveedor.id}
            obras={obras}
            compra={panel.compra}
            onSaved={savedAndClose}
            onCancel={close}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Eliminar compra"
        description="Se eliminará este registro de compra de forma permanente."
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}

function Item({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Phone;
  label: string;
  value: string | null;
}) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-xs text-content-subtle">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </dt>
      <dd className="mt-0.5 text-sm font-medium text-content">
        {value ?? <span className="text-content-subtle">—</span>}
      </dd>
    </div>
  );
}

function formatDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("es-DO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

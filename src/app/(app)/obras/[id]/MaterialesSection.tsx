"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Package, Trash2, Pencil, Layers } from "lucide-react";
import { Reveal, Stagger, Button, EmptyState, ProgressBar } from "@/components/primitives";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { MaterialForm } from "@/components/obras/MaterialForm";
import { deleteMaterial } from "@/app/(app)/obras/materiales-actions";
import {
  EXISTENCIA_BADGE,
  materialRestante,
  materialSubtotal,
  nivelExistencia,
  totalMateriales,
  type Material,
  type Proyecto,
} from "@/lib/proyectos/types";
import { formatCurrency, cn } from "@/lib/utils";

type Panel =
  | { type: "closed" }
  | { type: "create" }
  | { type: "edit"; material: Material };

export function MaterialesSection({ proyecto }: { proyecto: Proyecto }) {
  const router = useRouter();
  const [panel, setPanel] = useState<Panel>({ type: "closed" });
  const [toDelete, setToDelete] = useState<Material | null>(null);
  const [deleting, startDelete] = useTransition();

  const etapas = proyecto.etapas ?? [];
  const materiales = proyecto.materiales ?? [];
  const total = totalMateriales(materiales);

  const close = () => setPanel({ type: "closed" });
  const savedAndClose = () => {
    close();
    router.refresh();
  };

  // Agrupar: etapas (en orden) con sus materiales, y "Toda la obra" (etapa_id null).
  const grupos = useMemo(() => {
    const porEtapa = new Map<string, Material[]>();
    const generales: Material[] = [];
    for (const m of materiales) {
      if (m.etapa_id) {
        const arr = porEtapa.get(m.etapa_id) ?? [];
        arr.push(m);
        porEtapa.set(m.etapa_id, arr);
      } else generales.push(m);
    }
    const out: { titulo: string; items: Material[] }[] = [];
    for (const e of etapas) {
      const items = porEtapa.get(e.id);
      if (items?.length) out.push({ titulo: e.nombre, items });
    }
    if (generales.length) out.push({ titulo: "Toda la obra", items: generales });
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proyecto.materiales, proyecto.etapas]);

  function confirmDelete() {
    if (!toDelete) return;
    startDelete(async () => {
      const res = await deleteMaterial(proyecto.id, toDelete.id);
      if (res.ok) {
        setToDelete(null);
        router.refresh();
      }
    });
  }

  return (
    <>
      {materiales.length === 0 ? (
        <Reveal standalone>
          <div className="rounded-2xl border border-line bg-surface/50 shadow-card">
            <EmptyState
              icon={Package}
              title="Esta obra aún no tiene materiales"
              description="Agrega el primero (cemento, varilla, blocks…). Puedes ligarlo a una etapa o dejarlo para toda la obra."
              actionLabel="Agregar el primer material"
              actionIcon={Plus}
              onAction={() => setPanel({ type: "create" })}
            />
          </div>
        </Reveal>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            {total > 0 ? (
              <div className="rounded-xl border border-line bg-surface/60 px-3.5 py-2">
                <span className="text-xs text-content-muted">Total de materiales </span>
                <span className="text-sm font-semibold text-content">{formatCurrency(total)}</span>
              </div>
            ) : (
              <span className="text-sm text-content-muted">{materiales.length} materiales</span>
            )}
            <Button icon={Plus} size="sm" onClick={() => setPanel({ type: "create" })}>
              Agregar material
            </Button>
          </div>

          <div className="space-y-6">
            {grupos.map((g) => (
              <div key={g.titulo}>
                <p className="mb-2 flex items-center gap-1.5 px-1 text-xs font-semibold uppercase tracking-wide text-content-subtle">
                  <Layers className="h-3.5 w-3.5" />
                  {g.titulo}
                  <span className="text-content-subtle/70">· {g.items.length}</span>
                </p>
                <Stagger className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {g.items.map((m) => (
                    <Reveal key={m.id}>
                      <MaterialCard
                        material={m}
                        onEdit={() => setPanel({ type: "edit", material: m })}
                        onDelete={() => setToDelete(m)}
                      />
                    </Reveal>
                  ))}
                </Stagger>
              </div>
            ))}
          </div>
        </>
      )}

      <Modal open={panel.type === "create"} onClose={close} title="Nuevo material" subtitle={proyecto.nombre}>
        <MaterialForm obraId={proyecto.id} etapas={etapas} onSaved={savedAndClose} onCancel={close} />
      </Modal>
      <Modal
        open={panel.type === "edit"}
        onClose={close}
        title="Editar material"
        subtitle={panel.type === "edit" ? panel.material.nombre : undefined}
      >
        {panel.type === "edit" && (
          <MaterialForm
            obraId={proyecto.id}
            etapas={etapas}
            material={panel.material}
            onSaved={savedAndClose}
            onCancel={close}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Eliminar material"
        description={toDelete ? `Se eliminará "${toDelete.nombre}" de la obra.` : ""}
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </>
  );
}

function MaterialCard({
  material,
  onEdit,
  onDelete,
}: {
  material: Material;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const rest = materialRestante(material);
  const nivel = nivelExistencia(material);
  const subtotal = materialSubtotal(material);
  const comprada = material.cantidad_comprada;
  const usada = material.cantidad_usada ?? 0;
  const usoPct = comprada ? Math.min(100, Math.round((usada / comprada) * 100)) : 0;

  return (
    <div className="flex flex-col rounded-xl border border-line bg-surface/50 p-4 shadow-card">
      <div className="flex items-start justify-between gap-2">
        <button type="button" onClick={onEdit} className="min-w-0 flex-1 text-left">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate text-sm font-semibold text-content">{material.nombre}</span>
            {material.unidad && (
              <span className="rounded-md bg-surface-2 px-1.5 py-0.5 text-[11px] font-medium text-content-muted">
                {material.unidad}
              </span>
            )}
          </div>
        </button>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onEdit}
            aria-label={`Editar ${material.nombre}`}
            className="grid h-7 w-7 place-items-center rounded-lg text-content-subtle transition-colors hover:bg-surface-2 hover:text-content"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label={`Eliminar ${material.nombre}`}
            className="grid h-7 w-7 place-items-center rounded-lg text-content-subtle transition-colors hover:bg-danger/10 hover:text-danger"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {comprada != null && (
        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="text-content-muted">
              Restante <span className="font-semibold tabular-nums text-content">{fmt(rest)}</span>
              {material.unidad ? ` ${material.unidad}` : ""}
            </span>
            {nivel === "bajo" || nivel === "agotado" ? (
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold",
                  EXISTENCIA_BADGE[nivel].badge,
                )}
              >
                {EXISTENCIA_BADGE[nivel].label}
              </span>
            ) : null}
          </div>
          <ProgressBar value={usoPct} size="sm" tone={nivel === "agotado" ? "danger" : "brand"} />
          <p className="mt-1 text-[11px] text-content-subtle">
            {fmt(comprada)} compradas · {fmt(usada)} usadas
          </p>
        </div>
      )}

      {subtotal != null && (
        <p className="mt-3 border-t border-line pt-2.5 text-xs">
          <span className="text-content-subtle">Subtotal </span>
          <span className="font-semibold text-content">{formatCurrency(subtotal)}</span>
        </p>
      )}

      {material.notas && (
        <p className="mt-2 truncate text-xs text-content-subtle" title={material.notas}>
          {material.notas}
        </p>
      )}
    </div>
  );
}

function fmt(n: number | null): string {
  if (n == null) return "—";
  return n.toLocaleString("es-DO", { maximumFractionDigits: 2 });
}

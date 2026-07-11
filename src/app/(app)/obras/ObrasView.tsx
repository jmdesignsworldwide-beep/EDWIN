"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { HardHat, Plus, Database, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  Reveal,
  Stagger,
  Button,
  EmptyState,
} from "@/components/primitives";
import { SlideOver } from "@/components/ui/SlideOver";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ObraCard } from "@/components/obras/ObraCard";
import { ObraForm } from "@/components/obras/ObraForm";
import { ObraDetail } from "@/components/obras/ObraDetail";
import { deleteProyecto } from "./actions";
import type { Proyecto } from "@/lib/proyectos/types";

type PanelState =
  | { type: "closed" }
  | { type: "create" }
  | { type: "edit"; proyecto: Proyecto }
  | { type: "detail"; proyecto: Proyecto };

export function ObrasView({
  proyectos,
  configured,
  loadError,
}: {
  proyectos: Proyecto[];
  configured: boolean;
  loadError?: string;
}) {
  const router = useRouter();
  const [panel, setPanel] = useState<PanelState>({ type: "closed" });
  const [toDelete, setToDelete] = useState<Proyecto | null>(null);
  const [deleting, startDelete] = useTransition();

  const close = () => setPanel({ type: "closed" });
  const refreshAndClose = () => {
    close();
    router.refresh();
  };

  function confirmDelete() {
    if (!toDelete) return;
    startDelete(async () => {
      const res = await deleteProyecto(toDelete.id);
      if (res.ok) {
        setToDelete(null);
        close();
        router.refresh();
      }
    });
  }

  const hasObras = proyectos.length > 0;

  return (
    <>
      <PageHeader
        title="Obras"
        subtitle="Proyectos y obras en ejecución de la constructora"
        action={
          configured ? (
            <Button icon={Plus} onClick={() => setPanel({ type: "create" })}>
              Agregar obra
            </Button>
          ) : undefined
        }
      />

      {loadError && (
        <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3">
          <p className="text-sm font-medium text-danger">{loadError}</p>
          <button
            type="button"
            onClick={() => router.refresh()}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-danger hover:underline"
          >
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
              description="Los cimientos del módulo Obras están listos. En cuanto se configuren las llaves de Supabase, aquí podrás registrar y gestionar las obras con datos reales."
              tone="accent"
            />
          </div>
        </Reveal>
      ) : hasObras ? (
        <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {proyectos.map((p) => (
            <Reveal key={p.id}>
              <ObraCard
                proyecto={p}
                onClick={() => setPanel({ type: "detail", proyecto: p })}
              />
            </Reveal>
          ))}
        </Stagger>
      ) : (
        <Reveal standalone>
          <div className="rounded-2xl border border-line bg-surface/50 shadow-card">
            <EmptyState
              icon={HardHat}
              title="Aún no hay obras registradas"
              description="Agrega tu primera obra y aparecerá aquí con su avance, ubicación y equipo. Empieza registrando una."
              actionLabel="Agregar obra"
              actionIcon={Plus}
              onAction={() => setPanel({ type: "create" })}
            />
          </div>
        </Reveal>
      )}

      {/* Panel crear */}
      <SlideOver
        open={panel.type === "create"}
        onClose={close}
        title="Nueva obra"
        subtitle="Registra una obra de la constructora"
      >
        <ObraForm onSaved={refreshAndClose} onCancel={close} />
      </SlideOver>

      {/* Panel editar */}
      <SlideOver
        open={panel.type === "edit"}
        onClose={close}
        title="Editar obra"
        subtitle={panel.type === "edit" ? panel.proyecto.nombre : undefined}
      >
        {panel.type === "edit" && (
          <ObraForm
            proyecto={panel.proyecto}
            onSaved={refreshAndClose}
            onCancel={close}
          />
        )}
      </SlideOver>

      {/* Panel detalle */}
      <SlideOver
        open={panel.type === "detail"}
        onClose={close}
        title={panel.type === "detail" ? panel.proyecto.nombre : "Detalle"}
        subtitle={panel.type === "detail" ? panel.proyecto.ubicacion ?? undefined : undefined}
        widthClass="max-w-lg"
      >
        {panel.type === "detail" && (
          <ObraDetail
            proyecto={panel.proyecto}
            onEdit={() => setPanel({ type: "edit", proyecto: panel.proyecto })}
            onDelete={() => setToDelete(panel.proyecto)}
          />
        )}
      </SlideOver>

      {/* Confirmar borrado */}
      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Eliminar obra"
        description={
          toDelete
            ? `Se eliminará "${toDelete.nombre}" de forma permanente. Esta acción no se puede deshacer.`
            : ""
        }
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </>
  );
}

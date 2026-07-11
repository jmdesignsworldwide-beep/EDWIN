"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  GanttChartSquare,
  List,
  CalendarClock,
  Trash2,
  Pencil,
} from "lucide-react";
import {
  Reveal,
  Stagger,
  Button,
  EmptyState,
  ProgressBar,
  MagneticCard,
} from "@/components/primitives";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EstadoBadge } from "@/components/obras/EstadoBadge";
import { EtapaBadge } from "@/components/obras/EtapaBadge";
import { GanttChart } from "@/components/obras/GanttChart";
import { EtapaForm } from "@/components/obras/EtapaForm";
import { deleteEtapa } from "@/app/(app)/obras/etapas-actions";
import {
  clienteNombre,
  etapasCompletadas,
  type Etapa,
  type Proyecto,
} from "@/lib/proyectos/types";
import { cn } from "@/lib/utils";

type Panel =
  | { type: "closed" }
  | { type: "create" }
  | { type: "edit"; etapa: Etapa };

export function EtapasWorkspace({ proyecto }: { proyecto: Proyecto }) {
  const router = useRouter();
  const [view, setView] = useState<"gantt" | "list">("gantt");
  const [panel, setPanel] = useState<Panel>({ type: "closed" });
  const [toDelete, setToDelete] = useState<Etapa | null>(null);
  const [deleting, startDelete] = useTransition();

  const etapas = proyecto.etapas ?? [];
  const total = etapas.length;
  const done = etapasCompletadas(etapas);
  const cliente = clienteNombre(proyecto);

  const close = () => setPanel({ type: "closed" });
  const savedAndClose = () => {
    close();
    router.refresh();
  };

  function confirmDelete() {
    if (!toDelete) return;
    startDelete(async () => {
      const res = await deleteEtapa(proyecto.id, toDelete.id);
      if (res.ok) {
        setToDelete(null);
        router.refresh();
      }
    });
  }

  return (
    <>
      {/* Encabezado */}
      <div className="mb-6">
        <Link
          href="/obras"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-content-muted transition-colors hover:text-content"
        >
          <ArrowLeft className="h-4 w-4" />
          Obras
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <h1 className="truncate text-xl font-bold tracking-tight text-content sm:text-2xl">
                {proyecto.nombre}
              </h1>
              <EstadoBadge estado={proyecto.estado} />
            </div>
            <p className="mt-1 text-sm text-content-muted">
              {[proyecto.ubicacion, cliente].filter(Boolean).join(" · ") ||
                "Cronograma de la obra"}
            </p>
          </div>
          <Button icon={Plus} onClick={() => setPanel({ type: "create" })}>
            Agregar fase
          </Button>
        </div>
      </div>

      {/* Resumen de avance */}
      <Reveal standalone className="mb-6">
        <MagneticCard className="p-5" intensity={2}>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-content-muted">
              Avance general de la obra
            </span>
            <span className="text-sm font-semibold tabular-nums text-content">
              {proyecto.avance}%
            </span>
          </div>
          <ProgressBar
            value={proyecto.avance}
            tone={proyecto.avance === 100 ? "success" : "brand"}
          />
          <p className="mt-1.5 text-xs text-content-subtle">
            {done} de {total} etapas completadas
          </p>
        </MagneticCard>
      </Reveal>

      {total === 0 ? (
        <Reveal standalone>
          <div className="rounded-2xl border border-line bg-surface/50 shadow-card">
            <EmptyState
              icon={GanttChartSquare}
              title="Esta obra aún no tiene etapas"
              description="Agrega la primera fase (cimentación, estructura, techado…) y el cronograma tomará forma."
              actionLabel="Agregar la primera fase"
              actionIcon={Plus}
              onAction={() => setPanel({ type: "create" })}
            />
          </div>
        </Reveal>
      ) : (
        <>
          {/* Toggle de vista */}
          <div className="mb-4 inline-flex rounded-xl border border-line bg-surface/60 p-1">
            <Toggle active={view === "gantt"} onClick={() => setView("gantt")} icon={GanttChartSquare}>
              Gantt
            </Toggle>
            <Toggle active={view === "list"} onClick={() => setView("list")} icon={List}>
              Lista
            </Toggle>
          </div>

          {view === "gantt" ? (
            <Reveal standalone>
              <GanttChart etapas={etapas} onEtapaClick={(e) => setPanel({ type: "edit", etapa: e })} />
            </Reveal>
          ) : (
            <Stagger className="space-y-2.5">
              {etapas.map((e) => (
                <Reveal key={e.id}>
                  <div className="flex items-center gap-3 rounded-xl border border-line bg-surface/50 p-3.5 shadow-card">
                    <button
                      type="button"
                      onClick={() => setPanel({ type: "edit", etapa: e })}
                      className="flex min-w-0 flex-1 flex-col text-left"
                    >
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold text-content">
                          {e.nombre}
                        </span>
                        <EtapaBadge estado={e.estado} />
                      </div>
                      {(e.fecha_inicio || e.fecha_fin) && (
                        <span className="mt-1 flex items-center gap-1.5 text-xs text-content-subtle">
                          <CalendarClock className="h-3 w-3" />
                          {formatRange(e.fecha_inicio, e.fecha_fin)}
                        </span>
                      )}
                      <ProgressBar
                        value={e.porcentaje ?? 0}
                        size="sm"
                        className="mt-2"
                        tone={(e.porcentaje ?? 0) === 100 ? "success" : "brand"}
                      />
                    </button>
                    <div className="flex shrink-0 items-center gap-1">
                      <span className="w-10 text-right text-xs font-semibold tabular-nums text-content">
                        {e.porcentaje ?? 0}%
                      </span>
                      <button
                        type="button"
                        onClick={() => setPanel({ type: "edit", etapa: e })}
                        className="grid h-8 w-8 place-items-center rounded-lg text-content-subtle transition-colors hover:bg-surface-2 hover:text-content"
                        aria-label={`Editar ${e.nombre}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setToDelete(e)}
                        className="grid h-8 w-8 place-items-center rounded-lg text-content-subtle transition-colors hover:bg-danger/10 hover:text-danger"
                        aria-label={`Eliminar ${e.nombre}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </Reveal>
              ))}
            </Stagger>
          )}
        </>
      )}

      {/* Modal crear/editar fase */}
      <Modal
        open={panel.type === "create"}
        onClose={close}
        title="Nueva fase"
        subtitle={proyecto.nombre}
      >
        <EtapaForm obraId={proyecto.id} onSaved={savedAndClose} onCancel={close} />
      </Modal>
      <Modal
        open={panel.type === "edit"}
        onClose={close}
        title="Editar fase"
        subtitle={panel.type === "edit" ? panel.etapa.nombre : undefined}
      >
        {panel.type === "edit" && (
          <EtapaForm
            obraId={proyecto.id}
            etapa={panel.etapa}
            onSaved={savedAndClose}
            onCancel={close}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Eliminar fase"
        description={
          toDelete
            ? `Se eliminará la fase "${toDelete.nombre}" de forma permanente.`
            : ""
        }
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </>
  );
}

function Toggle({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof List;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
        active
          ? "bg-brand-gradient text-brand-ink shadow-glow"
          : "text-content-muted hover:text-content",
      )}
    >
      <Icon className="h-4 w-4" />
      {children}
    </button>
  );
}

function formatRange(ini: string | null, fin: string | null): string {
  const f = (s: string) =>
    new Date(s + "T00:00:00").toLocaleDateString("es-DO", {
      day: "2-digit",
      month: "short",
    });
  if (ini && fin) return `${f(ini)} — ${f(fin)}`;
  return f((ini ?? fin) as string);
}

"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { HardHat, Plus, Database, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Reveal, Stagger, Button, EmptyState } from "@/components/primitives";
import { Modal } from "@/components/ui/Modal";
import { ObraCard } from "@/components/obras/ObraCard";
import { ObraForm } from "@/components/obras/ObraForm";
import { setEstadoObra } from "./actions";
import { cn } from "@/lib/utils";
import type { Cliente, Proyecto } from "@/lib/proyectos/types";

type Filtro = "activas" | "terminadas" | "todas";

export function ObrasView({
  proyectos,
  clientes,
  configured,
  loadError,
}: {
  proyectos: Proyecto[];
  clientes: Cliente[];
  configured: boolean;
  loadError?: string;
}) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [filtro, setFiltro] = useState<Filtro>("activas");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [, start] = useTransition();

  const counts = useMemo(() => {
    let activas = 0;
    let terminadas = 0;
    for (const p of proyectos) {
      if (p.estado === "terminada") terminadas++;
      else activas++;
    }
    return { activas, terminadas, todas: proyectos.length };
  }, [proyectos]);

  const visibles = useMemo(() => {
    if (filtro === "todas") return proyectos;
    if (filtro === "terminadas") return proyectos.filter((p) => p.estado === "terminada");
    return proyectos.filter((p) => p.estado !== "terminada");
  }, [proyectos, filtro]);

  function toggleEstado(p: Proyecto) {
    setBusyId(p.id);
    start(async () => {
      const nuevo = p.estado === "terminada" ? "en_curso" : "terminada";
      await setEstadoObra(p.id, nuevo);
      setBusyId(null);
      router.refresh();
    });
  }

  return (
    <>
      <PageHeader
        title="Obras"
        subtitle="Proyectos y obras de la constructora"
        action={
          configured ? (
            <Button icon={Plus} onClick={() => setCreating(true)}>Agregar obra</Button>
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

      {configured && proyectos.length > 0 && (
        <div className="mb-5 inline-flex rounded-xl border border-line bg-surface/60 p-1">
          <FiltroBtn active={filtro === "activas"} onClick={() => setFiltro("activas")}>
            Activas <span className="opacity-60">{counts.activas}</span>
          </FiltroBtn>
          <FiltroBtn active={filtro === "terminadas"} onClick={() => setFiltro("terminadas")}>
            Terminadas <span className="opacity-60">{counts.terminadas}</span>
          </FiltroBtn>
          <FiltroBtn active={filtro === "todas"} onClick={() => setFiltro("todas")}>
            Todas <span className="opacity-60">{counts.todas}</span>
          </FiltroBtn>
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
      ) : proyectos.length === 0 ? (
        <Reveal standalone>
          <div className="rounded-2xl border border-line bg-surface/50 shadow-card">
            <EmptyState
              icon={HardHat}
              title="Aún no hay obras registradas"
              description="Agrega tu primera obra y aparecerá aquí con su avance, ubicación y equipo. Empieza registrando una."
              actionLabel="Agregar obra"
              actionIcon={Plus}
              onAction={() => setCreating(true)}
            />
          </div>
        </Reveal>
      ) : visibles.length === 0 ? (
        <Reveal standalone>
          <div className="rounded-2xl border border-line bg-surface/50 shadow-card">
            <EmptyState
              icon={HardHat}
              title={filtro === "terminadas" ? "Sin obras terminadas" : "Sin obras activas"}
              description={
                filtro === "terminadas"
                  ? "Cuando marques una obra como terminada, quedará archivada aquí con su expediente."
                  : "Todas las obras están terminadas. Cambia el filtro para verlas."
              }
              size="sm"
            />
          </div>
        </Reveal>
      ) : (
        <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibles.map((p) => (
            <Reveal key={p.id}>
              <ObraCard
                proyecto={p}
                onOpen={() => router.push(`/obras/${p.id}`)}
                onToggleEstado={() => toggleEstado(p)}
                busy={busyId === p.id}
              />
            </Reveal>
          ))}
        </Stagger>
      )}

      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        title="Nueva obra"
        subtitle="Registra una obra de la constructora"
      >
        <ObraForm
          clientes={clientes}
          onSaved={() => { setCreating(false); router.refresh(); }}
          onCancel={() => setCreating(false)}
        />
      </Modal>
    </>
  );
}

function FiltroBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
        active ? "bg-brand-gradient text-brand-ink shadow-glow" : "text-content-muted hover:text-content",
      )}
    >
      {children}
    </button>
  );
}

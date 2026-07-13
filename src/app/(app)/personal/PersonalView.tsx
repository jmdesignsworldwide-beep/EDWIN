"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Plus, Database, RefreshCw, Briefcase, HardHat, Phone } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Reveal, Stagger, Button, EmptyState, MagneticCard } from "@/components/primitives";
import { Modal } from "@/components/ui/Modal";
import { PersonaForm } from "@/components/personal/PersonaForm";
import type { Persona } from "@/lib/proyectos/types";
import { cn } from "@/lib/utils";

export function PersonalView({
  personal,
  configured,
  loadError,
}: {
  personal: Persona[];
  configured: boolean;
  loadError?: string;
}) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);

  return (
    <>
      <PageHeader
        title="Personal"
        subtitle="Directorio de personal y cuadrillas"
        action={configured ? <Button icon={Plus} onClick={() => setCreating(true)}>Agregar persona</Button> : undefined}
      />

      {loadError && (
        <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3">
          <p className="text-sm font-medium text-danger">{loadError}</p>
          <button type="button" onClick={() => router.refresh()} className="inline-flex items-center gap-1.5 text-xs font-semibold text-danger hover:underline">
            <RefreshCw className="h-3.5 w-3.5" />Reintentar
          </button>
        </div>
      )}

      {!configured ? (
        <Reveal standalone>
          <div className="rounded-2xl border border-line bg-surface/50 shadow-card">
            <EmptyState icon={Database} title="Falta conectar Supabase" description="En cuanto se configuren las llaves, aquí podrás registrar al personal." tone="accent" />
          </div>
        </Reveal>
      ) : personal.length === 0 ? (
        <Reveal standalone>
          <div className="rounded-2xl border border-line bg-surface/50 shadow-card">
            <EmptyState
              icon={Users}
              title="Aún no hay personal registrado"
              description="Registra a tu primera persona (maestro, ayudante, plomero…) y asígnala a las obras."
              actionLabel="Agregar persona"
              actionIcon={Plus}
              onAction={() => setCreating(true)}
            />
          </div>
        </Reveal>
      ) : (
        <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {personal.map((p) => {
            const nObras = p.obras?.length ?? 0;
            return (
              <Reveal key={p.id}>
                <MagneticCard className="cursor-pointer p-5" intensity={4}>
                  <button type="button" onClick={() => router.push(`/personal/${p.id}`)} className="flex w-full flex-col text-left focus:outline-none" aria-label={`Abrir expediente de ${p.nombre}`}>
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="min-w-0 flex-1 truncate text-base font-semibold text-content">{p.nombre}</h3>
                      <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset", p.activo ? "bg-emerald-500/12 text-emerald-700 ring-emerald-500/25 dark:text-emerald-300" : "bg-slate-500/12 text-slate-600 ring-slate-500/25 dark:text-slate-300")}>
                        {p.activo ? "Activo" : "Inactivo"}
                      </span>
                    </div>
                    {p.oficio && (
                      <p className="mt-1.5 flex items-center gap-1.5 text-sm text-content-muted"><Briefcase className="h-3.5 w-3.5 text-content-subtle" />{p.oficio}</p>
                    )}
                    {p.telefono && (
                      <p className="mt-1 flex items-center gap-1.5 text-sm text-content-muted"><Phone className="h-3.5 w-3.5 text-content-subtle" />{p.telefono}</p>
                    )}
                    <div className="mt-4 flex items-center gap-1.5 border-t border-line pt-3 text-xs text-content-subtle">
                      <HardHat className="h-3.5 w-3.5" />
                      {nObras === 0 ? "Sin obras asignadas" : `${nObras} obra${nObras === 1 ? "" : "s"}`}
                    </div>
                  </button>
                </MagneticCard>
              </Reveal>
            );
          })}
        </Stagger>
      )}

      <Modal open={creating} onClose={() => setCreating(false)} title="Nueva persona" subtitle="Directorio de personal">
        <PersonaForm onSaved={() => { setCreating(false); router.refresh(); }} onCancel={() => setCreating(false)} />
      </Modal>
    </>
  );
}

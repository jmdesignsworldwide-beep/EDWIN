"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Users, Plus, X, Briefcase, MessageCircle, ArrowRight } from "lucide-react";
import { Reveal, Stagger, EmptyState } from "@/components/primitives";
import { PersonalSelect } from "@/components/personal/PersonalSelect";
import {
  asignarPersonaObra,
  quitarAsignacion,
} from "@/app/(app)/personal/asignaciones-actions";
import { whatsappLink, type Persona, type Proyecto } from "@/lib/proyectos/types";

export function EquipoSection({
  proyecto,
  personal: personalProp,
}: {
  proyecto: Proyecto;
  personal: Persona[];
}) {
  const router = useRouter();
  const [personal, setPersonal] = useState<Persona[]>(personalProp);
  const [personaId, setPersonaId] = useState<string | null>(null);
  const [rol, setRol] = useState("");
  const [busy, start] = useTransition();

  const equipo = proyecto.equipo ?? [];
  const asignadosIds = equipo.map((a) => a.persona?.id).filter(Boolean) as string[];

  function asignar() {
    if (!personaId) return;
    start(async () => {
      const res = await asignarPersonaObra(personaId, proyecto.id, rol || null);
      if (res.ok) {
        setPersonaId(null);
        setRol("");
        router.refresh();
      }
    });
  }
  function quitar(personaIdToRemove: string) {
    start(async () => {
      const res = await quitarAsignacion(personaIdToRemove, proyecto.id);
      if (res.ok) router.refresh();
    });
  }

  return (
    <>
      {/* Asignar */}
      <div className="mb-5 rounded-2xl border border-line bg-surface/40 p-4">
        <p className="mb-2.5 text-sm font-semibold text-content">Asignar personal a esta obra</p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
          <div className="flex-1">
            <PersonalSelect
              personal={personal}
              value={personaId}
              onChange={setPersonaId}
              onCreated={(p) => setPersonal((prev) => [...prev, p])}
              excludeIds={asignadosIds}
            />
          </div>
          <input type="text" value={rol} onChange={(e) => setRol(e.target.value)} placeholder="Rol en la obra (opcional)" className="h-11 rounded-xl border border-line bg-surface/60 px-3.5 text-sm text-content placeholder:text-content-subtle focus:border-brand/50 focus:outline-none sm:w-52" />
          <button type="button" onClick={asignar} disabled={busy || !personaId} className="inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-brand-gradient px-4 text-sm font-semibold text-brand-ink shadow-glow transition-transform hover:scale-[1.02] disabled:opacity-50">
            <Plus className="h-4 w-4" />Asignar
          </button>
        </div>
      </div>

      {equipo.length === 0 ? (
        <Reveal standalone>
          <div className="rounded-2xl border border-line bg-surface/50 shadow-card">
            <EmptyState icon={Users} title="Sin personal asignado" description="Asigna personas a esta obra desde el selector de arriba, o registra una nueva." size="sm" />
          </div>
        </Reveal>
      ) : (
        <Stagger className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {equipo.map((a) => {
            const p = a.persona;
            if (!p) return null;
            const wa = whatsappLink(p.telefono);
            return (
              <Reveal key={a.id}>
                <div className="flex items-center gap-3 rounded-xl border border-line bg-surface/50 p-3.5 shadow-card">
                  <Link href={`/personal?persona=${p.id}`} className="group grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-gradient text-sm font-bold text-brand-ink" title="Ver persona">
                    {initials(p.nombre)}
                  </Link>
                  <Link href={`/personal?persona=${p.id}`} className="group min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-semibold text-content group-hover:text-brand">{p.nombre}</span>
                      {!p.activo && <span className="shrink-0 rounded-full bg-slate-500/12 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-300">Inactivo</span>}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-content-subtle">
                      <Briefcase className="h-3 w-3" />
                      {a.rol_en_obra || p.oficio || "—"}
                    </span>
                  </Link>
                  {wa && (
                    <a href={wa} target="_blank" rel="noopener noreferrer" aria-label={`WhatsApp a ${p.nombre}`} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-emerald-500/12 text-emerald-700 ring-1 ring-inset ring-emerald-500/25 transition-colors hover:bg-emerald-500/20 dark:text-emerald-300">
                      <MessageCircle className="h-4 w-4" />
                    </a>
                  )}
                  <button type="button" onClick={() => quitar(p.id)} disabled={busy} aria-label={`Quitar a ${p.nombre}`} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-content-subtle transition-colors hover:bg-danger/10 hover:text-danger disabled:opacity-50">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </Reveal>
            );
          })}
        </Stagger>
      )}
    </>
  );
}

function initials(nombre: string): string {
  const parts = nombre.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

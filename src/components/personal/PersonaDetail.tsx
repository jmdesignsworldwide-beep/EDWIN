"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Phone,
  IdCard,
  Wallet,
  Briefcase,
  HardHat,
  Pencil,
  Trash2,
  Plus,
  X,
  ArrowRight,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/primitives";
import { EstadoBadge } from "@/components/obras/EstadoBadge";
import {
  JORNAL_TIPO_CORTO,
  whatsappLink,
  type Persona,
} from "@/lib/proyectos/types";
import { AsistenciaConsolidado } from "./AsistenciaConsolidado";
import { formatCurrency, cn } from "@/lib/utils";
import {
  asignarPersonaObra,
  quitarAsignacion,
} from "@/app/(app)/personal/asignaciones-actions";

export function PersonaDetail({
  persona,
  obras,
  onEdit,
  onDelete,
}: {
  persona: Persona;
  obras: { id: string; nombre: string }[];
  onEdit: () => void;
  onDelete: () => void;
}) {
  const router = useRouter();
  const [busy, start] = useTransition();
  const [nuevaObra, setNuevaObra] = useState("");
  const [rol, setRol] = useState("");

  const asignadas = persona.obras ?? [];
  const wa = whatsappLink(persona.telefono);

  const disponibles = useMemo(
    () => {
      const asg = persona.obras ?? [];
      return obras.filter((o) => !asg.some((a) => a.obra_id === o.id));
    },
    [obras, persona.obras],
  );

  function asignar() {
    if (!nuevaObra) return;
    start(async () => {
      const res = await asignarPersonaObra(persona.id, nuevaObra, rol || null);
      if (res.ok) {
        setNuevaObra("");
        setRol("");
        router.refresh();
      }
    });
  }
  function quitar(obraId: string) {
    start(async () => {
      const res = await quitarAsignacion(persona.id, obraId);
      if (res.ok) router.refresh();
    });
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-6">
        {/* Estado + WhatsApp */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {persona.oficio && (
              <span className="inline-flex items-center gap-1 rounded-full bg-brand/12 px-2.5 py-1 text-xs font-semibold text-brand ring-1 ring-inset ring-brand/25">
                <Briefcase className="h-3 w-3" />
                {persona.oficio}
              </span>
            )}
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
                persona.activo
                  ? "bg-emerald-500/12 text-emerald-700 ring-emerald-500/25 dark:text-emerald-300"
                  : "bg-slate-500/12 text-slate-600 ring-slate-500/25 dark:text-slate-300",
              )}
            >
              {persona.activo ? "Activo" : "Inactivo"}
            </span>
          </div>
          {wa && (
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-500/12 px-3 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-500/25 transition-colors hover:bg-emerald-500/20 dark:text-emerald-300"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              WhatsApp
            </a>
          )}
        </div>

        {/* Datos */}
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Item icon={Phone} label="Teléfono" value={persona.telefono} />
          <Item icon={IdCard} label="Cédula" value={persona.cedula} />
          <Item
            icon={Wallet}
            label="Jornal / tarifa"
            value={
              persona.jornal != null
                ? `${formatCurrency(persona.jornal)} / ${JORNAL_TIPO_CORTO[persona.jornal_tipo]}`
                : null
            }
            full
          />
        </dl>

        {persona.notas && (
          <p className="whitespace-pre-wrap rounded-xl border border-line bg-surface-2/40 p-3.5 text-sm text-content">
            {persona.notas}
          </p>
        )}

        {/* Obras asignadas */}
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-content-muted">
            <HardHat className="h-4 w-4 text-content-subtle" />
            Obras asignadas
            <span className="text-content-subtle/70">· {asignadas.length}</span>
          </p>

          {asignadas.length > 0 && (
            <ul className="mb-3 space-y-2">
              {asignadas.map((a) => (
                <li key={a.id} className="flex items-center gap-2 rounded-xl border border-line bg-surface-2/40 p-3">
                  <Link href={`/obras/${a.obra_id}?vista=equipo`} className="group flex min-w-0 flex-1 items-center gap-2">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-content group-hover:text-brand">
                        {a.obra?.nombre ?? "Obra"}
                      </span>
                      {a.rol_en_obra && (
                        <span className="block truncate text-xs text-content-subtle">{a.rol_en_obra}</span>
                      )}
                    </span>
                    {a.obra && <EstadoBadge estado={a.obra.estado} />}
                    <ArrowRight className="h-4 w-4 shrink-0 text-content-subtle group-hover:text-brand" />
                  </Link>
                  <button type="button" onClick={() => quitar(a.obra_id)} disabled={busy} aria-label="Quitar de la obra" className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-content-subtle transition-colors hover:bg-danger/10 hover:text-danger disabled:opacity-50">
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {disponibles.length > 0 ? (
            <div className="rounded-xl border border-line bg-surface-2/40 p-2.5">
              <div className="flex flex-col gap-2 sm:flex-row">
                <select value={nuevaObra} onChange={(e) => setNuevaObra(e.target.value)} className={cn(mini, "flex-1 appearance-none")}>
                  <option value="">Asignar a una obra…</option>
                  {disponibles.map((o) => <option key={o.id} value={o.id}>{o.nombre}</option>)}
                </select>
                <input type="text" value={rol} onChange={(e) => setRol(e.target.value)} placeholder="Rol (opcional)" className={cn(mini, "sm:w-36")} />
                <button type="button" onClick={asignar} disabled={busy || !nuevaObra} className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-brand-gradient px-3 text-xs font-semibold text-brand-ink transition-transform hover:scale-[1.02] disabled:opacity-50">
                  <Plus className="h-3.5 w-3.5" />Asignar
                </button>
              </div>
            </div>
          ) : (
            asignadas.length === 0 && (
              <p className="rounded-xl border border-dashed border-line px-3 py-3 text-center text-xs text-content-muted">
                {obras.length === 0 ? "No hay obras registradas todavía." : "Ya está en todas las obras."}
              </p>
            )
          )}
        </div>

        {/* Consolidado de asistencia (base de nómina) */}
        <AsistenciaConsolidado personaId={persona.id} />
      </div>

      <div className="mt-6 flex items-center justify-between gap-2.5 border-t border-line pt-4">
        <button type="button" onClick={onDelete} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-line px-4 text-sm font-semibold text-danger transition-colors hover:bg-danger/10">
          <Trash2 className="h-4 w-4" />Eliminar
        </button>
        <Button variant="primary" size="md" icon={Pencil} onClick={onEdit}>Editar</Button>
      </div>
    </div>
  );
}

const mini = "h-9 rounded-lg border border-line bg-surface px-3 text-sm text-content placeholder:text-content-subtle focus:border-brand/50 focus:outline-none";

function Item({ icon: Icon, label, value, full }: { icon: typeof Phone; label: string; value: string | null; full?: boolean }) {
  return (
    <div className={full ? "sm:col-span-2" : undefined}>
      <dt className="flex items-center gap-1.5 text-xs text-content-subtle"><Icon className="h-3.5 w-3.5" />{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-content">{value ?? <span className="text-content-subtle">—</span>}</dd>
    </div>
  );
}

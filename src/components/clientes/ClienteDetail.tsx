"use client";

import Link from "next/link";
import {
  Phone,
  IdCard,
  Mail,
  MapPin,
  UserRound,
  MessageCircle,
  Pencil,
  Trash2,
  HardHat,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/primitives";
import { EstadoBadge } from "@/components/obras/EstadoBadge";
import { ClienteTipoBadge } from "./ClienteTipoBadge";
import {
  documentoLabel,
  whatsappLink,
  type ClienteTipo,
} from "@/lib/proyectos/types";
import type { ClienteConObras } from "@/app/(app)/clientes/actions";
import { cn } from "@/lib/utils";

export function ClienteDetail({
  cliente,
  onEdit,
  onDelete,
}: {
  cliente: ClienteConObras;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const wa = whatsappLink(cliente.telefono);
  const obras = cliente.obras ?? [];
  const esEmpresa = cliente.tipo === "empresa";

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <ClienteTipoBadge tipo={cliente.tipo} />
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

        {!cliente.datos_completos && (
          <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="text-sm font-semibold text-content">Datos por completar</p>
              <p className="text-xs text-content-muted">
                Este cliente se registró rápido. Completa su información con el botón Editar.
              </p>
            </div>
          </div>
        )}

        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Item icon={Phone} label="Teléfono" value={cliente.telefono} />
          <Item icon={IdCard} label={documentoLabel(cliente.tipo)} value={cliente.cedula_rnc} />
          <Item icon={Mail} label="Correo" value={cliente.email} />
          <Item icon={MapPin} label="Dirección" value={cliente.direccion} full />
        </dl>

        {esEmpresa && (cliente.contacto_nombre || cliente.contacto_telefono) && (
          <div className="rounded-xl border border-line bg-surface-2/40 p-3.5">
            <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-content-muted">
              <UserRound className="h-3.5 w-3.5" />
              Persona de contacto
            </p>
            <p className="text-sm font-medium text-content">{cliente.contacto_nombre ?? "—"}</p>
            {cliente.contacto_telefono && (
              <p className="text-xs text-content-subtle">{cliente.contacto_telefono}</p>
            )}
          </div>
        )}

        {/* Obras del cliente */}
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-content-muted">
            <HardHat className="h-4 w-4 text-content-subtle" />
            Obras
            <span className="text-content-subtle/70">· {obras.length}</span>
          </p>
          {obras.length > 0 ? (
            <ul className="space-y-2">
              {obras.map((o) => (
                <li key={o.id}>
                  <Link
                    href={`/obras/${o.id}`}
                    className="group flex items-center gap-2 rounded-xl border border-line bg-surface-2/40 p-3 transition-colors hover:border-brand/40 hover:bg-surface-2"
                  >
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-content group-hover:text-brand">
                      {o.nombre}
                    </span>
                    <EstadoBadge estado={o.estado} />
                    <ArrowRight className="h-4 w-4 shrink-0 text-content-subtle group-hover:text-brand" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-xl border border-dashed border-line px-3 py-3 text-center text-xs text-content-muted">
              Sin obras registradas para este cliente.
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between gap-2.5 border-t border-line pt-4">
        <button
          type="button"
          onClick={onDelete}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-line px-4 text-sm font-semibold text-danger transition-colors hover:bg-danger/10"
        >
          <Trash2 className="h-4 w-4" />
          Eliminar
        </button>
        <Button variant="primary" size="md" icon={Pencil} onClick={onEdit}>Editar</Button>
      </div>
    </div>
  );
}

function Item({
  icon: Icon,
  label,
  value,
  full,
}: {
  icon: typeof Phone;
  label: string;
  value: string | null;
  full?: boolean;
}) {
  return (
    <div className={full ? "sm:col-span-2" : undefined}>
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

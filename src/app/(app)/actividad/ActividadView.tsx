"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  History,
  Search,
  ChevronLeft,
  ChevronRight,
  User,
  Clock,
  ArrowRight,
  X,
  ShieldCheck,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Reveal, Stagger, EmptyState } from "@/components/primitives";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import type { AuditoriaFiltros, AuditoriaResult } from "./actions";
import {
  ACCIONES_AUDITORIA,
  ACCION_AUDITORIA_UI,
  ENTIDAD_LABEL,
  type RegistroAuditoria,
} from "@/lib/proyectos/types";
import { cn } from "@/lib/utils";

function fmtFechaHora(iso: string): string {
  return new Date(iso).toLocaleString("es-DO", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
function entidadHref(r: RegistroAuditoria): string | null {
  if (!r.entidad_id) return null;
  switch (r.entidad_tipo) {
    case "obra": case "cobro": case "gasto": case "inversionista": case "rentabilidad": return `/obras/${r.entidad_id}`;
    case "cliente": return `/clientes`;
    case "nomina": return `/nomina/${r.entidad_id}`;
    case "prestamo": return `/prestamos/${r.entidad_id}`;
    case "personal": case "pago_empleado": return `/personal/${r.entidad_id}`;
    default: return null;
  }
}

export function ActividadView({ data, filtros }: { data: AuditoriaResult; filtros: AuditoriaFiltros }) {
  const router = useRouter();
  const [q, setQ] = useState(filtros.q ?? "");
  const [detalle, setDetalle] = useState<RegistroAuditoria | null>(null);

  const { items, total, page, pageSize, usuarios, tipos, configured } = data;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function navegar(next: Partial<AuditoriaFiltros>) {
    const merged = { ...filtros, ...next };
    const params = new URLSearchParams();
    if (merged.accion) params.set("accion", merged.accion);
    if (merged.entidad_tipo) params.set("tipo", merged.entidad_tipo);
    if (merged.usuario_id) params.set("usuario", merged.usuario_id);
    if (merged.desde) params.set("desde", merged.desde);
    if (merged.hasta) params.set("hasta", merged.hasta);
    if (merged.q) params.set("q", merged.q);
    if (merged.page) params.set("page", String(merged.page));
    router.push(`/actividad${params.toString() ? `?${params}` : ""}`);
  }

  const inp = "h-10 rounded-xl border border-line bg-surface/60 px-3 text-sm text-content focus:border-brand/50 focus:outline-none";

  return (
    <>
      <PageHeader title="Actividad" subtitle="Historial inviolable de todo lo que pasa en el sistema · solo admin" />

      {/* Filtros */}
      <div className="mb-5 rounded-2xl border border-line bg-surface/50 p-4 shadow-card">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <label className="mb-1 block text-[11px] font-medium text-content-muted">Acción</label>
            <Select value={filtros.accion ?? ""} onChange={(v) => navegar({ accion: v as any, page: 0 })} ariaLabel="Acción" options={[{ value: "", label: "Todas" }, ...ACCIONES_AUDITORIA.map((a) => ({ value: a.value, label: a.label }))]} />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-content-muted">Módulo</label>
            <Select value={filtros.entidad_tipo ?? ""} onChange={(v) => navegar({ entidad_tipo: v, page: 0 })} ariaLabel="Módulo" options={[{ value: "", label: "Todos" }, ...tipos.map((t) => ({ value: t, label: ENTIDAD_LABEL[t] ?? t }))]} />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-content-muted">Usuario</label>
            <Select value={filtros.usuario_id ?? ""} onChange={(v) => navegar({ usuario_id: v, page: 0 })} ariaLabel="Usuario" options={[{ value: "", label: "Todos" }, ...usuarios.map((u) => ({ value: u.id, label: u.nombre }))]} />
          </div>
          <form onSubmit={(e) => { e.preventDefault(); navegar({ q, page: 0 }); }}>
            <label className="mb-1 block text-[11px] font-medium text-content-muted">Buscar</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-content-subtle" />
              <input type="text" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar…" className={cn(inp, "w-full pl-8")} />
            </div>
          </form>
        </div>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-[11px] font-medium text-content-muted">Desde</label>
            <input type="date" value={filtros.desde ?? ""} max={filtros.hasta || undefined} onChange={(e) => navegar({ desde: e.target.value, page: 0 })} className={inp} />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-content-muted">Hasta</label>
            <input type="date" value={filtros.hasta ?? ""} min={filtros.desde || undefined} onChange={(e) => navegar({ hasta: e.target.value, page: 0 })} className={inp} />
          </div>
          {(filtros.accion || filtros.entidad_tipo || filtros.usuario_id || filtros.desde || filtros.hasta || filtros.q) && (
            <button type="button" onClick={() => { setQ(""); router.push("/actividad"); }} className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-line px-3 text-sm font-medium text-content-muted hover:bg-surface-2"><X className="h-3.5 w-3.5" />Limpiar</button>
          )}
        </div>
      </div>

      {!configured ? (
        <Reveal standalone><div className="rounded-2xl border border-line bg-surface/50 shadow-card"><EmptyState icon={ShieldCheck} title="Falta conectar Supabase" description="El historial aparecerá aquí." tone="accent" /></div></Reveal>
      ) : items.length === 0 ? (
        <Reveal standalone><div className="rounded-2xl border border-line bg-surface/50 shadow-card"><EmptyState icon={History} title="Sin actividad" description="Cuando se creen, editen o eliminen registros, quedarán aquí con quién, qué y cuándo." /></div></Reveal>
      ) : (
        <>
          <Stagger className="space-y-2">
            {items.map((r) => {
              const ui = ACCION_AUDITORIA_UI[r.accion];
              return (
                <Reveal key={r.id}>
                  <button type="button" onClick={() => setDetalle(r)} className="flex w-full items-center gap-3 rounded-xl border border-line bg-surface/50 p-3.5 text-left shadow-card transition-colors hover:border-brand/40 hover:bg-surface-2/40">
                    <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-lg", ui.badge)}>
                      <span className={cn("h-2.5 w-2.5 rounded-full", ui.dot)} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-x-1.5 text-sm">
                        <span className="font-semibold text-content">{r.usuario_nombre}</span>
                        <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-bold", ui.badge)}>{ui.label}</span>
                        <span className="truncate text-content">{r.entidad_label}</span>
                      </span>
                      <span className="mt-0.5 flex items-center gap-1 text-[11px] text-content-subtle"><Clock className="h-3 w-3" />{fmtFechaHora(r.created_at)}{r.detalle?.antes !== undefined && r.detalle?.despues !== undefined ? ` · ${String(r.detalle.antes)} → ${String(r.detalle.despues)}` : ""}</span>
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-content-subtle" />
                  </button>
                </Reveal>
              );
            })}
          </Stagger>

          <div className="mt-5 flex items-center justify-between gap-3">
            <p className="text-xs text-content-subtle">{total} registro{total === 1 ? "" : "s"} · página {page + 1} de {totalPages}</p>
            <div className="flex items-center gap-2">
              <button type="button" disabled={page <= 0} onClick={() => navegar({ page: page - 1 })} className="inline-flex h-9 items-center gap-1 rounded-lg border border-line px-3 text-sm font-medium text-content transition-colors hover:bg-surface-2 disabled:opacity-40"><ChevronLeft className="h-4 w-4" />Anterior</button>
              <button type="button" disabled={page + 1 >= totalPages} onClick={() => navegar({ page: page + 1 })} className="inline-flex h-9 items-center gap-1 rounded-lg border border-line px-3 text-sm font-medium text-content transition-colors hover:bg-surface-2 disabled:opacity-40">Siguiente<ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
        </>
      )}

      <Modal open={Boolean(detalle)} onClose={() => setDetalle(null)} title="Detalle de la acción" subtitle={detalle ? fmtFechaHora(detalle.created_at) : undefined}>
        {detalle && (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
              <Campo icon={User} label="Quién" value={detalle.usuario_nombre} />
              <div>
                <p className="text-xs text-content-subtle">Acción</p>
                <span className={cn("mt-0.5 inline-flex rounded-full px-2 py-0.5 text-xs font-bold", ACCION_AUDITORIA_UI[detalle.accion].badge)}>{ACCION_AUDITORIA_UI[detalle.accion].label}</span>
              </div>
              <Campo icon={History} label="Sobre" value={`${ENTIDAD_LABEL[detalle.entidad_tipo] ?? detalle.entidad_tipo} — ${detalle.entidad_label}`} />
              <Campo icon={Clock} label="Cuándo" value={fmtFechaHora(detalle.created_at)} />
              {detalle.detalle && (
                <div className="rounded-xl border border-line bg-surface-2/40 p-3.5">
                  <p className="mb-1 text-xs font-medium text-content-muted">Detalle</p>
                  {detalle.detalle.antes !== undefined || detalle.detalle.despues !== undefined ? (
                    <p className="text-sm text-content">
                      {detalle.detalle.campo ?? "Valor"}: <span className="font-semibold tabular-nums">{String(detalle.detalle.antes ?? "—")}</span> → <span className="font-semibold tabular-nums text-brand">{String(detalle.detalle.despues ?? "—")}</span>
                    </p>
                  ) : null}
                  {detalle.detalle.nota && <p className="mt-1 text-xs text-content-subtle">{detalle.detalle.nota}</p>}
                </div>
              )}
              {entidadHref(detalle) && (
                <Link href={entidadHref(detalle)!} className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline">Ver el registro <ArrowRight className="h-4 w-4" /></Link>
              )}
              <p className="rounded-lg bg-surface-2/50 px-3 py-2 text-[11px] text-content-subtle">Este registro es inviolable: no se puede editar ni eliminar.</p>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

function Campo({ icon: Icon, label, value }: { icon: typeof User; label: string; value: string }) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-xs text-content-subtle"><Icon className="h-3.5 w-3.5" />{label}</p>
      <p className="mt-0.5 text-sm font-medium text-content">{value}</p>
    </div>
  );
}

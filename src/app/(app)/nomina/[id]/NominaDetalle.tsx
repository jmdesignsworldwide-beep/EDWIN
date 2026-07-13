"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarRange,
  Users,
  Wallet,
  CheckCircle2,
  Ban,
  Trash2,
  Loader2,
  ChevronDown,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/primitives";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { marcarPagada, anularNomina, deleteNomina } from "../actions";
import {
  NOMINA_ESTADO_BADGE,
  METODOS_PAGO,
  METODO_PAGO_LABEL,
  type MetodoPago,
  type Nomina,
  type NominaLinea,
} from "@/lib/proyectos/types";
import { formatMoney, cn } from "@/lib/utils";

function fmtFecha(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("es-DO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
function todayISO(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function NominaDetalle({ nomina, isAdmin }: { nomina: Nomina; isAdmin: boolean }) {
  const router = useRouter();
  const est = NOMINA_ESTADO_BADGE[nomina.estado];
  const lineas = nomina.lineas ?? [];

  const [pagarOpen, setPagarOpen] = useState(false);
  const [anularOpen, setAnularOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [busy, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function doAnular() {
    setError(null);
    start(async () => {
      const res = await anularNomina(nomina.id);
      if (res.ok) {
        setAnularOpen(false);
        router.refresh();
      } else setError(res.error ?? "Error");
    });
  }
  function doDelete() {
    setError(null);
    start(async () => {
      const res = await deleteNomina(nomina.id);
      if (res.ok) {
        router.push("/nomina");
      } else setError(res.error ?? "Error");
    });
  }

  return (
    <>
      <div className="mb-2">
        <Link
          href="/nomina"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-content-muted transition-colors hover:text-content"
        >
          <ArrowLeft className="h-4 w-4" />
          Nóminas
        </Link>
      </div>

      <PageHeader
        title="Detalle de nómina"
        subtitle={`Cerrada el ${fmtFecha(nomina.fecha_cierre.slice(0, 10))}`}
        action={
          <span className={cn("rounded-full px-3 py-1.5 text-sm font-semibold", est.badge)}>
            {est.label}
          </span>
        }
      />

      {/* Resumen */}
      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <InfoCard icon={CalendarRange} label="Período">
          {fmtFecha(nomina.desde)} — {fmtFecha(nomina.hasta)}
        </InfoCard>
        <InfoCard icon={Users} label="Personas">
          {lineas.length}
        </InfoCard>
        <InfoCard icon={Wallet} label="Total" accent>
          {formatMoney(nomina.total)}
        </InfoCard>
      </div>

      {nomina.estado === "pagada" && (
        <div className="mb-5 flex flex-wrap items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <span className="font-medium text-content">
            Marcada como pagada{nomina.fecha_pago ? ` el ${fmtFecha(nomina.fecha_pago)}` : ""}
            {nomina.metodo_pago ? ` · ${METODO_PAGO_LABEL[nomina.metodo_pago]}` : ""}
          </span>
        </div>
      )}

      {nomina.notas && (
        <p className="mb-5 whitespace-pre-wrap rounded-xl border border-line bg-surface-2/40 p-3.5 text-sm text-content">
          {nomina.notas}
        </p>
      )}

      {/* Desglose por persona */}
      <div className="overflow-hidden rounded-2xl border border-line bg-surface/50 shadow-card">
        <div className="hidden grid-cols-[1.6fr_repeat(4,1fr)] gap-2 border-b border-line bg-surface-2/40 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-content-subtle sm:grid">
          <span>Persona</span>
          <span className="text-right">Base</span>
          <span className="text-right">Extras</span>
          <span className="text-right">Descuentos</span>
          <span className="text-right">Neto</span>
        </div>
        <ul className="divide-y divide-line">
          {lineas.map((l) => (
            <LineaRow key={l.id} linea={l} />
          ))}
        </ul>
        <div className="flex items-center justify-between gap-3 border-t-2 border-line bg-surface-2/40 px-4 py-3.5">
          <span className="text-sm font-semibold text-content">Total</span>
          <span className="text-xl font-bold tabular-nums text-brand sm:text-2xl">{formatMoney(nomina.total)}</span>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3">
          <p className="text-sm font-medium text-danger">{error}</p>
        </div>
      )}

      {/* Acciones */}
      {nomina.estado !== "anulada" && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-2.5 border-t border-line pt-5">
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setAnularOpen(true)}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-line px-4 text-sm font-semibold text-content-muted transition-colors hover:bg-surface-2 hover:text-content"
            >
              <Ban className="h-4 w-4" />
              Anular
            </button>
            {isAdmin && (
              <button
                type="button"
                onClick={() => setDeleteOpen(true)}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-line px-4 text-sm font-semibold text-danger transition-colors hover:bg-danger/10"
              >
                <Trash2 className="h-4 w-4" />
                Eliminar
              </button>
            )}
          </div>
          {nomina.estado === "pendiente" && (
            <Button variant="primary" size="md" icon={CheckCircle2} onClick={() => setPagarOpen(true)}>
              Marcar como pagada
            </Button>
          )}
        </div>
      )}

      {isAdmin && nomina.estado === "anulada" && (
        <div className="mt-6 flex items-center justify-end border-t border-line pt-5">
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-line px-4 text-sm font-semibold text-danger transition-colors hover:bg-danger/10"
          >
            <Trash2 className="h-4 w-4" />
            Eliminar definitivamente
          </button>
        </div>
      )}

      <Modal open={pagarOpen} onClose={() => setPagarOpen(false)} title="Marcar como pagada" subtitle="Solo es una etiqueta contable — el sistema no ejecuta el pago.">
        <PagarForm
          onDone={() => {
            setPagarOpen(false);
            router.refresh();
          }}
          onCancel={() => setPagarOpen(false)}
          nominaId={nomina.id}
        />
      </Modal>

      <ConfirmDialog
        open={anularOpen}
        title="Anular nómina"
        description="La nómina quedará anulada como registro contable (no se borra). ¿Continuar?"
        confirmLabel="Anular"
        loading={busy}
        onConfirm={doAnular}
        onCancel={() => setAnularOpen(false)}
      />
      <ConfirmDialog
        open={deleteOpen}
        title="Eliminar nómina"
        description="Se eliminará esta nómina y todo su desglose de forma definitiva. Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        loading={busy}
        onConfirm={doDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </>
  );
}

function InfoCard({
  icon: Icon,
  label,
  children,
  accent,
}: {
  icon: typeof Wallet;
  label: string;
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-line bg-surface/50 p-4 shadow-card">
      <p className="flex items-center gap-1.5 text-xs text-content-subtle">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </p>
      <p className={cn("mt-1 text-lg font-bold tabular-nums", accent ? "text-brand" : "text-content")}>
        {children}
      </p>
    </div>
  );
}

function LineaRow({ linea }: { linea: NominaLinea }) {
  const [open, setOpen] = useState(false);
  const tieneConceptos = (linea.conceptos ?? []).length > 0;
  return (
    <li>
      <div className="grid grid-cols-2 gap-x-2 gap-y-1 px-4 py-3 sm:grid-cols-[1.6fr_repeat(4,1fr)] sm:items-center">
        <div className="col-span-2 min-w-0 sm:col-span-1">
          <button
            type="button"
            onClick={() => tieneConceptos && setOpen((v) => !v)}
            className={cn("flex items-center gap-1.5 text-left", tieneConceptos && "cursor-pointer")}
          >
            <span className="truncate text-sm font-semibold text-content">{linea.persona_nombre}</span>
            {tieneConceptos && (
              <ChevronDown className={cn("h-3.5 w-3.5 shrink-0 text-content-subtle transition-transform", open && "rotate-180")} />
            )}
          </button>
          <p className="truncate text-xs text-content-subtle">
            {linea.dias.toLocaleString("es-DO", { maximumFractionDigits: 2 })} días × {formatMoney(linea.jornal_diario)}/día
          </p>
        </div>
        <NumCell label="Base" className="text-content">{formatMoney(linea.base)}</NumCell>
        <NumCell label="Extras" className={linea.extras > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-content-subtle"}>
          {linea.extras > 0 ? `+${formatMoney(linea.extras)}` : "—"}
        </NumCell>
        <NumCell label="Descuentos" className={linea.descuentos > 0 ? "text-rose-600 dark:text-rose-400" : "text-content-subtle"}>
          {linea.descuentos > 0 ? `−${formatMoney(linea.descuentos)}` : "—"}
        </NumCell>
        <NumCell label="Neto" className="font-bold text-content">{formatMoney(linea.neto)}</NumCell>
      </div>
      {open && tieneConceptos && (
        <ul className="space-y-1 border-t border-line/60 bg-surface-2/30 px-4 py-2.5 sm:pl-6">
          {linea.conceptos.map((c, i) => (
            <li key={i} className="flex items-center justify-between text-xs">
              <span className="text-content-muted">
                <span className={cn("mr-1.5 font-semibold", c.tipo === "extra" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
                  {c.tipo === "extra" ? "Extra" : "Descuento"}
                </span>
                {c.concepto}
              </span>
              <span className={cn("font-semibold tabular-nums", c.tipo === "extra" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
                {c.tipo === "extra" ? "+" : "−"}{formatMoney(c.monto)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

function NumCell({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-1 sm:block sm:text-right">
      <span className="text-xs font-medium text-content-muted sm:hidden">{label}</span>
      <span className={cn("text-sm tabular-nums", className)}>{children}</span>
    </div>
  );
}

function PagarForm({
  nominaId,
  onDone,
  onCancel,
}: {
  nominaId: string;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [fecha, setFecha] = useState(todayISO());
  const [metodo, setMetodo] = useState<MetodoPago>("efectivo");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const inp =
    "h-11 w-full rounded-xl border border-line bg-surface/60 px-3.5 text-sm text-content focus:border-brand/50 focus:outline-none";

  function guardar() {
    setError(null);
    start(async () => {
      const res = await marcarPagada(nominaId, fecha, metodo);
      if (res.ok) onDone();
      else setError(res.error ?? "Error");
    });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-content-muted">Fecha de pago</label>
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className={inp} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-content-muted">Método</label>
          <div className="inline-flex w-full overflow-hidden rounded-xl border border-line">
            {METODOS_PAGO.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => setMetodo(m.value)}
                className={cn(
                  "flex-1 px-3 py-2.5 text-sm font-semibold transition-colors",
                  metodo === m.value ? "bg-brand-gradient text-brand-ink" : "bg-surface text-content-muted hover:bg-surface-2",
                )}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
        {error && <p className="rounded-lg bg-danger/10 px-3 py-2 text-xs font-medium text-danger">{error}</p>}
      </div>
      <div className="flex shrink-0 items-center justify-end gap-2.5 border-t border-line px-5 py-4">
        <Button type="button" variant="secondary" size="md" onClick={onCancel} disabled={pending}>Cancelar</Button>
        <button
          type="button"
          onClick={guardar}
          disabled={pending}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-gradient px-5 text-sm font-semibold text-brand-ink shadow-glow transition-transform hover:scale-[1.02] active:scale-[0.99] disabled:opacity-70"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar"}
        </button>
      </div>
    </div>
  );
}

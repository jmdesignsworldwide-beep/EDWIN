"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  LayoutDashboard,
  GanttChartSquare,
  Package,
  AlertTriangle,
  Users,
  CalendarCheck,
  Images,
  FileText,
  BookOpen,
  Wallet,
  Hammer,
  MapPin,
  User2,
  CalendarClock,
  CheckCircle2,
  RotateCcw,
  Pencil,
  Trash2,
  Loader2,
  Building2,
  Ruler,
  Phone,
  HandCoins,
  HardHat,
  ExternalLink,
} from "lucide-react";
import { Reveal, ProgressBar, MagneticCard, CountUp, Button } from "@/components/primitives";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EstadoBadge } from "@/components/obras/EstadoBadge";
import { ObraForm } from "@/components/obras/ObraForm";
import { EtapasSection } from "./EtapasSection";
import { MaterialesSection } from "./MaterialesSection";
import { EquipoSection } from "./EquipoSection";
import { AsistenciaTab } from "./AsistenciaTab";
import { FinancieroTab } from "./FinancieroTab";
import type { DineroObra } from "../cobros-actions";
import { setEstadoObra, deleteProyecto, signedArchivoUrl } from "../actions";
import {
  clienteNombre,
  etapasCompletadas,
  materialesEnAlerta,
  METODO_ANTICIPO_LABEL,
  type Cliente,
  type Persona,
  type Proveedor,
  type Proyecto,
} from "@/lib/proyectos/types";
import { formatCurrency, cn } from "@/lib/utils";

type Tab =
  | "resumen"
  | "cronograma"
  | "materiales"
  | "equipo"
  | "asistencia"
  | "galeria"
  | "documentos"
  | "bitacora"
  | "financiero";

export function ObraWorkspace({
  proyecto,
  proveedores,
  personal,
  clientes,
  dinero,
  initialTab = "resumen",
}: {
  proyecto: Proyecto;
  proveedores: Proveedor[];
  personal: Persona[];
  clientes: Cliente[];
  dinero: DineroObra;
  initialTab?: Tab;
}) {
  const personalResumen = personal.map((p) => ({ id: p.id, nombre: p.nombre }));
  const router = useRouter();
  const [tab, setTab] = useState<Tab>(initialTab);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [busy, start] = useTransition();

  const etapas = proyecto.etapas ?? [];
  const materiales = proyecto.materiales ?? [];
  const total = etapas.length;
  const done = etapasCompletadas(etapas);
  const alertas = materialesEnAlerta(materiales);
  const nEquipo = (proyecto.equipo ?? []).length;
  const terminada = proyecto.estado === "terminada";

  function toggleEstado() {
    start(async () => {
      await setEstadoObra(proyecto.id, terminada ? "en_curso" : "terminada");
      router.refresh();
    });
  }

  function doDelete() {
    setDeleting(true);
    start(async () => {
      const res = await deleteProyecto(proyecto.id);
      setDeleting(false);
      if (res.ok) router.push("/obras");
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
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="truncate text-xl font-bold tracking-tight text-content sm:text-2xl">
            {proyecto.nombre}
          </h1>
          <EstadoBadge estado={proyecto.estado} />
        </div>
        <p className="mt-1 text-sm text-content-muted">
          {[proyecto.ubicacion, clienteNombre(proyecto)].filter(Boolean).join(" · ") || "Expediente de la obra"}
        </p>
      </div>

      {/* Pestañas (scroll horizontal en móvil) */}
      <div className="mb-5 -mx-1 overflow-x-auto px-1 pb-1">
        <div className="inline-flex min-w-max gap-1 rounded-xl border border-line bg-surface/60 p-1">
          <TabBtn active={tab === "resumen"} onClick={() => setTab("resumen")} icon={LayoutDashboard}>Resumen</TabBtn>
          <TabBtn active={tab === "cronograma"} onClick={() => setTab("cronograma")} icon={GanttChartSquare}>Cronograma</TabBtn>
          <TabBtn active={tab === "materiales"} onClick={() => setTab("materiales")} icon={Package} badge={alertas}>Materiales</TabBtn>
          <TabBtn active={tab === "equipo"} onClick={() => setTab("equipo")} icon={Users} count={nEquipo}>Equipo</TabBtn>
          <TabBtn active={tab === "asistencia"} onClick={() => setTab("asistencia")} icon={CalendarCheck}>Asistencia</TabBtn>
          <TabBtn active={tab === "galeria"} onClick={() => setTab("galeria")} icon={Images} soon>Galería</TabBtn>
          <TabBtn active={tab === "documentos"} onClick={() => setTab("documentos")} icon={FileText} soon>Documentos</TabBtn>
          <TabBtn active={tab === "bitacora"} onClick={() => setTab("bitacora")} icon={BookOpen} soon>Bitácora</TabBtn>
          <TabBtn active={tab === "financiero"} onClick={() => setTab("financiero")} icon={Wallet}>Financiero</TabBtn>
        </div>
      </div>

      {tab === "resumen" ? (
        <ObraResumen
          proyecto={proyecto}
          done={done}
          total={total}
          nEquipo={nEquipo}
          gastado={dinero.financiero.gastado}
          materialesCount={materiales.length}
          terminada={terminada}
          busy={busy}
          onToggleEstado={toggleEstado}
          onEdit={() => setEditing(true)}
          onDelete={() => setConfirmDel(true)}
        />
      ) : tab === "cronograma" ? (
        <EtapasSection proyecto={proyecto} />
      ) : tab === "materiales" ? (
        <MaterialesSection proyecto={proyecto} proveedores={proveedores} />
      ) : tab === "equipo" ? (
        <EquipoSection proyecto={proyecto} personal={personal} />
      ) : tab === "asistencia" ? (
        <AsistenciaTab obraId={proyecto.id} horaEsperada={proyecto.hora_entrada_esperada} />
      ) : tab === "galeria" ? (
        <ComingSoon icon={Images} title="Galería de fotos" description="Sube fotos del avance de la obra desde el celular, organizadas por fecha. Llega en el próximo bloque del rediseño." />
      ) : tab === "documentos" ? (
        <ComingSoon icon={FileText} title="Documentos" description="Planos, contratos y permisos de la obra (PDF e imágenes). Llega en el próximo bloque del rediseño." />
      ) : tab === "bitacora" ? (
        <ComingSoon icon={BookOpen} title="Bitácora de obra" description="El diario de la obra: registra lo que pasa cada día, con fecha y foto opcional. Llega en el próximo bloque del rediseño." />
      ) : (
        <FinancieroTab obraId={proyecto.id} dinero={dinero} />
      )}

      <Modal open={editing} onClose={() => setEditing(false)} title="Editar obra" subtitle={proyecto.nombre}>
        <ObraForm
          proyecto={proyecto}
          clientes={clientes}
          personal={personalResumen}
          onSaved={() => { setEditing(false); router.refresh(); }}
          onCancel={() => setEditing(false)}
        />
      </Modal>

      <ConfirmDialog
        open={confirmDel}
        title="Eliminar obra"
        description={`Se eliminará "${proyecto.nombre}" y todo su expediente de forma permanente. Esta acción no se puede deshacer.`}
        loading={deleting}
        onConfirm={doDelete}
        onCancel={() => setConfirmDel(false)}
      />
    </>
  );
}

function ObraResumen({
  proyecto,
  done,
  total,
  nEquipo,
  gastado,
  materialesCount,
  terminada,
  busy,
  onToggleEstado,
  onEdit,
  onDelete,
}: {
  proyecto: Proyecto;
  done: number;
  total: number;
  nEquipo: number;
  gastado: number;
  materialesCount: number;
  terminada: boolean;
  busy: boolean;
  onToggleEstado: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const cliente = clienteNombre(proyecto);

  return (
    <div className="space-y-5">
      {/* Avance */}
      <Reveal standalone>
        <MagneticCard className="p-5" intensity={2}>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-content-muted">Avance general de la obra</span>
            <span className="text-sm font-semibold tabular-nums text-content">{proyecto.avance}%</span>
          </div>
          <ProgressBar value={proyecto.avance} tone={terminada ? "success" : "brand"} />
          <p className="mt-1.5 text-xs text-content-subtle">{done} de {total} etapas completadas</p>
        </MagneticCard>
      </Reveal>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard icon={GanttChartSquare} label="Etapas" value={`${done}/${total}`} />
        <KpiCard icon={Users} label="Equipo" value={String(nEquipo)} />
        <KpiCard icon={Package} label="Materiales" value={String(materialesCount)} />
        <KpiCard icon={Wallet} label="Gastado" money={gastado} />
      </div>

      {/* Datos generales */}
      <Reveal standalone>
        <div className="rounded-2xl border border-line bg-surface/50 p-5 shadow-card">
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Item icon={Building2} label="Tipo de obra" value={proyecto.tipo_obra} />
            <Item icon={Ruler} label="Tamaño" value={proyecto.metros != null ? `${proyecto.metros.toLocaleString("es-DO")} m²` : null} />
            <Item icon={MapPin} label="Ubicación" value={proyecto.ubicacion} />
            <Item icon={MapPin} label="Dirección" value={proyecto.direccion} />
            <div>
              <dt className="flex items-center gap-1.5 text-xs text-content-subtle">
                <User2 className="h-3.5 w-3.5" />
                Cliente / propietario
              </dt>
              <dd className="mt-0.5 text-sm font-medium text-content">
                {cliente ? (
                  <Link href="/clientes" className="text-brand hover:underline">{cliente}</Link>
                ) : (
                  <span className="text-content-subtle">—</span>
                )}
              </dd>
            </div>
            <Item icon={Phone} label="Teléfono de la obra" value={proyecto.telefono_obra} />
            <div>
              <dt className="flex items-center gap-1.5 text-xs text-content-subtle">
                <HardHat className="h-3.5 w-3.5" />
                Encargado
              </dt>
              <dd className="mt-0.5 text-sm font-medium text-content">
                {proyecto.encargado_rel ? (
                  <Link href={`/personal/${proyecto.encargado_rel.id}`} className="text-brand hover:underline">{proyecto.encargado_rel.nombre}</Link>
                ) : (
                  <span className="text-content-subtle">—</span>
                )}
              </dd>
            </div>
            <Item icon={CalendarClock} label="Inicio" value={formatDate(proyecto.fecha_inicio)} />
            <Item icon={CalendarCheck} label="Fin estimado" value={formatDate(proyecto.fecha_fin_estimada)} />
            <Item
              icon={Wallet}
              label="Presupuesto de la obra"
              value={proyecto.presupuesto != null ? formatCurrency(proyecto.presupuesto) : null}
            />
            <Item
              icon={HandCoins}
              label="Anticipo del cliente"
              value={
                proyecto.anticipo_monto != null
                  ? `${formatCurrency(proyecto.anticipo_monto)}${proyecto.anticipo_metodo ? ` · ${METODO_ANTICIPO_LABEL[proyecto.anticipo_metodo]}` : ""}`
                  : null
              }
            />
            {proyecto.archivo_inicial && (
              <div className="sm:col-span-2">
                <dt className="flex items-center gap-1.5 text-xs text-content-subtle">
                  <FileText className="h-3.5 w-3.5" />
                  Archivo inicial
                </dt>
                <dd className="mt-1">
                  <ArchivoLink path={proyecto.archivo_inicial} />
                </dd>
              </div>
            )}
          </dl>

          {proyecto.notas && (
            <div className="mt-4 border-t border-line pt-4">
              <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-content-muted">
                <FileText className="h-3.5 w-3.5" />
                Notas
              </p>
              <p className="whitespace-pre-wrap text-sm text-content">{proyecto.notas}</p>
            </div>
          )}
        </div>
      </Reveal>

      {/* Acciones */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 border-t border-line pt-5">
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onToggleEstado}
            disabled={busy}
            className={cn(
              "inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold ring-1 ring-inset transition-colors disabled:opacity-60",
              terminada
                ? "bg-surface-2 text-content-muted ring-line hover:bg-surface-2/70"
                : "bg-emerald-500/12 text-emerald-700 ring-emerald-500/25 hover:bg-emerald-500/20 dark:text-emerald-300",
            )}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : terminada ? <RotateCcw className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
            {terminada ? "Reactivar obra" : "Marcar terminada"}
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-line px-4 text-sm font-semibold text-danger transition-colors hover:bg-danger/10"
          >
            <Trash2 className="h-4 w-4" />
            Eliminar
          </button>
        </div>
        <Button variant="primary" size="md" icon={Pencil} onClick={onEdit}>Editar obra</Button>
      </div>
    </div>
  );
}

function ArchivoLink({ path }: { path: string }) {
  const [loading, setLoading] = useState(false);
  async function abrir() {
    setLoading(true);
    const url = await signedArchivoUrl(path);
    setLoading(false);
    if (url) window.open(url, "_blank", "noopener");
  }
  return (
    <button
      type="button"
      onClick={abrir}
      disabled={loading}
      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-surface/60 px-3 text-sm font-semibold text-brand transition-colors hover:bg-brand/10 disabled:opacity-70"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
      Ver archivo
    </button>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  money,
}: {
  icon: typeof Wallet;
  label: string;
  value?: string;
  money?: number;
}) {
  return (
    <div className="rounded-2xl border border-line bg-surface/50 p-4 shadow-card">
      <p className="flex items-center gap-1.5 text-xs text-content-subtle">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </p>
      <p className="mt-1 text-lg font-bold tabular-nums text-content">
        {money != null ? <CountUp value={money} duration={0.8} format={formatCurrency} /> : value}
      </p>
    </div>
  );
}

function ComingSoon({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Wallet;
  title: string;
  description: string;
}) {
  return (
    <Reveal standalone>
      <div className="glass flex flex-col items-center justify-center rounded-2xl px-6 py-16 text-center shadow-card">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand/12 text-brand ring-1 ring-brand/25">
          <Icon className="h-7 w-7" strokeWidth={1.8} />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-content">{title}</h2>
        <p className="mt-1.5 max-w-md text-sm text-content-muted">{description}</p>
        <span className="mt-5 inline-flex items-center gap-2 rounded-full border border-line bg-surface/60 px-3 py-1.5 text-xs font-medium text-content-subtle">
          <Hammer className="h-3.5 w-3.5" />
          Próximamente
        </span>
      </div>
    </Reveal>
  );
}

function Item({
  icon: Icon,
  label,
  value,
  full,
}: {
  icon: typeof MapPin;
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

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso + "T00:00:00").toLocaleDateString("es-DO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function TabBtn({
  active,
  onClick,
  icon: Icon,
  badge,
  count,
  soon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Package;
  badge?: number;
  count?: number;
  soon?: boolean;
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
      <Icon className="h-4 w-4" />
      {children}
      {badge != null && badge > 0 && (
        <span
          className={cn(
            "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold",
            active ? "bg-brand-ink/15 text-brand-ink" : "bg-rose-500/15 text-rose-600 dark:text-rose-300",
          )}
        >
          <AlertTriangle className="h-2.5 w-2.5" />
          {badge}
        </span>
      )}
      {count != null && count > 0 && (
        <span
          className={cn(
            "inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-bold",
            active ? "bg-brand-ink/15 text-brand-ink" : "bg-surface-2 text-content-muted",
          )}
        >
          {count}
        </span>
      )}
      {soon && !active && (
        <span className="inline-flex h-1.5 w-1.5 rounded-full bg-brand/50" title="Próximamente" />
      )}
    </button>
  );
}

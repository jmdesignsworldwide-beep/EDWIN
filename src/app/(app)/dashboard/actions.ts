"use server";

import { requireUser } from "@/lib/auth";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { listProyectos } from "../obras/actions";
import { getDineroObra } from "../obras/cobros-actions";
import { listPrestamos, listVencimientos } from "../prestamos/actions";
import { listClientes } from "../clientes/actions";
import {
  round2,
  materialesEnAlerta,
  type EstadoObra,
  type FinancieroResumen,
} from "@/lib/proyectos/types";

/**
 * ⚠️ Sala de Mando: SOLO LEE de las fuentes de verdad existentes (Panel
 * Financiero, Rentabilidad, Cobros, Préstamos…). No recalcula ni duplica: usa
 * getDineroObra por obra —la misma función de cada módulo— para que los números
 * coincidan exactamente con los de cada pantalla.
 */

export type ObraActivaKpi = {
  id: string;
  nombre: string;
  estado: EstadoObra;
  avance: number;
  ejecutado: number | null;
  estadoFin: FinancieroResumen["estado"];
  gastado: number;
  presupuesto: number | null;
};

export type Alerta = {
  id: string;
  severidad: "danger" | "warn" | "info";
  titulo: string;
  detalle: string;
  href: string;
};

export type FeedItem = {
  id: string;
  tipo: "obra" | "cobro" | "bitacora" | "prestamo";
  texto: string;
  ts: string;
  href: string;
};

export type DashboardData = {
  configured: boolean;
  kpis: {
    obrasActivas: number;
    obrasTerminadas: number;
    presupuestoActivo: number;
    gastoRealActivo: number;
    porCobrar: number;
    porPagar: number;
    vencenPronto: number;
    gananciaProyectada: number;
    avancePromedio: number;
    alertas: number;
  };
  obras: ObraActivaKpi[];
  alertas: Alerta[];
  feed: FeedItem[];
};

function empty(): DashboardData {
  return {
    configured: false,
    kpis: { obrasActivas: 0, obrasTerminadas: 0, presupuestoActivo: 0, gastoRealActivo: 0, porCobrar: 0, porPagar: 0, vencenPronto: 0, gananciaProyectada: 0, avancePromedio: 0, alertas: 0 },
    obras: [], alertas: [], feed: [],
  };
}

export async function getDashboard(): Promise<DashboardData> {
  await requireUser();
  if (!isSupabaseConfigured()) return empty();
  try {
    const [{ proyectos }, prestamos, vencimientos, { incompletos }] = await Promise.all([
      listProyectos(),
      listPrestamos(),
      listVencimientos(7),
      listClientes(),
    ]);

    const activas = proyectos.filter((p) => p.estado !== "terminada");
    const terminadas = proyectos.length - activas.length;

    // Dinero por obra activa desde la fuente de verdad (getDineroObra).
    const dineros = await Promise.all(activas.map((p) => getDineroObra(p.id)));

    let presupuestoActivo = 0, gastoRealActivo = 0, porCobrar = 0, gananciaProyectada = 0, sumaAvance = 0;
    const obras: ObraActivaKpi[] = [];
    const alertas: Alerta[] = [];

    activas.forEach((p, i) => {
      const d = dineros[i];
      presupuestoActivo = round2(presupuestoActivo + (d.financiero.presupuesto ?? 0));
      gastoRealActivo = round2(gastoRealActivo + d.financiero.gastado);
      gananciaProyectada = round2(gananciaProyectada + (d.rentabilidad.proyectadaMonto ?? 0));
      if (d.rentabilidad.precioVenta != null) {
        porCobrar = round2(porCobrar + Math.max(0, round2(d.rentabilidad.precioVenta - d.cobrado)));
      }
      sumaAvance += p.avance;
      obras.push({
        id: p.id, nombre: p.nombre, estado: p.estado, avance: p.avance,
        ejecutado: d.financiero.ejecutado, estadoFin: d.financiero.estado,
        gastado: d.financiero.gastado, presupuesto: d.financiero.presupuesto,
      });
      if (d.financiero.estado === "excedido") {
        alertas.push({ id: `exc-${p.id}`, severidad: "danger", titulo: `${p.nombre}: pasada de presupuesto`, detalle: `Gastado ${d.financiero.ejecutado?.toFixed(0) ?? "—"}% del presupuesto`, href: `/obras/${p.id}` });
      }
      const bajos = materialesEnAlerta(p.materiales ?? []);
      if (bajos > 0) {
        alertas.push({ id: `mat-${p.id}`, severidad: "warn", titulo: `${p.nombre}: ${bajos} material${bajos === 1 ? "" : "es"} bajo${bajos === 1 ? "" : "s"}`, detalle: "Existencias por reponer", href: `/obras/${p.id}?vista=materiales` });
      }
    });

    const avancePromedio = activas.length > 0 ? Math.round(sumaAvance / activas.length) : 0;

    // Préstamos: total por pagar (saldo pendiente de activos por_pagar) + vencimientos.
    let porPagar = 0;
    for (const pr of prestamos) {
      if (pr.tipo !== "por_pagar" || pr.estado !== "activo") continue;
      const saldo = (pr.cuotas ?? []).filter((c) => !c.pagada).reduce((a, c) => a + c.monto, 0);
      porPagar = round2(porPagar + saldo);
    }
    for (const v of vencimientos) {
      const vencida = v.diasRestantes < 0;
      alertas.push({
        id: `venc-${v.cuota.id}`,
        severidad: vencida ? "danger" : "warn",
        titulo: `${v.prestamo.tipo === "por_pagar" ? "Pago" : "Cobro"} a ${v.prestamo.contraparte}`,
        detalle: vencida ? `Cuota ${v.cuota.numero} vencida hace ${Math.abs(v.diasRestantes)}d` : `Cuota ${v.cuota.numero} vence ${v.diasRestantes === 0 ? "hoy" : `en ${v.diasRestantes}d`}`,
        href: `/prestamos/${v.prestamo.id}`,
      });
    }
    if (incompletos > 0) {
      alertas.push({ id: "cli-inc", severidad: "info", titulo: `${incompletos} cliente${incompletos === 1 ? "" : "s"} por completar`, detalle: "Datos incompletos del registro rápido", href: "/clientes" });
    }

    const feed = await getFeed();

    return {
      configured: true,
      kpis: {
        obrasActivas: activas.length, obrasTerminadas: terminadas,
        presupuestoActivo, gastoRealActivo, porCobrar, porPagar,
        vencenPronto: vencimientos.length, gananciaProyectada, avancePromedio,
        alertas: alertas.length,
      },
      obras: obras.sort((a, b) => (a.estadoFin === "excedido" ? -1 : 0) - (b.estadoFin === "excedido" ? -1 : 0)),
      alertas: alertas.slice(0, 12),
      feed,
    };
  } catch {
    return { ...empty(), configured: true };
  }
}

async function getFeed(): Promise<FeedItem[]> {
  try {
    const supabase = createAdminClient();
    const [obras, cobros, bitacora, prestamos] = await Promise.all([
      supabase.from("proyectos").select("id,nombre,created_at").order("created_at", { ascending: false }).limit(5),
      supabase.from("cobros_obra").select("id,monto,created_at,obra:proyectos(id,nombre)").order("created_at", { ascending: false }).limit(5),
      supabase.from("bitacora_obra").select("id,texto,created_at,obra_id,obra:proyectos(id,nombre)").order("created_at", { ascending: false }).limit(5),
      supabase.from("prestamos").select("id,contraparte,tipo,created_at").order("created_at", { ascending: false }).limit(5),
    ]);
    const items: FeedItem[] = [];
    for (const o of (obras.data ?? []) as any[]) items.push({ id: `o-${o.id}`, tipo: "obra", texto: `Nueva obra: ${o.nombre}`, ts: o.created_at, href: `/obras/${o.id}` });
    for (const c of (cobros.data ?? []) as any[]) {
      const obra = Array.isArray(c.obra) ? c.obra[0] : c.obra;
      items.push({ id: `c-${c.id}`, tipo: "cobro", texto: `Cobro registrado${obra ? ` · ${obra.nombre}` : ""}`, ts: c.created_at, href: obra ? `/obras/${obra.id}` : "/obras" });
    }
    for (const b of (bitacora.data ?? []) as any[]) {
      const obra = Array.isArray(b.obra) ? b.obra[0] : b.obra;
      items.push({ id: `b-${b.id}`, tipo: "bitacora", texto: `Bitácora${obra ? ` · ${obra.nombre}` : ""}: ${String(b.texto).slice(0, 40)}`, ts: b.created_at, href: obra ? `/obras/${b.obra_id}` : "/obras" });
    }
    for (const p of (prestamos.data ?? []) as any[]) items.push({ id: `p-${p.id}`, tipo: "prestamo", texto: `Préstamo ${p.tipo === "por_pagar" ? "por pagar" : "por cobrar"}: ${p.contraparte}`, ts: p.created_at, href: `/prestamos/${p.id}` });

    return items.sort((a, b) => (a.ts < b.ts ? 1 : -1)).slice(0, 8);
  } catch {
    return [];
  }
}

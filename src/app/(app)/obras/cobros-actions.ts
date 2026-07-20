"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { getFinancieroObra, type FinancieroData } from "./financiero-actions";
import { registrarAuditoria } from "@/lib/auditoria";
import { formatMoney } from "@/lib/utils";
import {
  round2,
  type Cobro,
  type MetodoAnticipo,
  type Rentabilidad,
} from "@/lib/proyectos/types";

/**
 * ⚠️ DINERO: todo el cálculo ocurre en el SERVIDOR. Fuentes de verdad:
 *  - Gasto real / salidas → se LEE del Panel Financiero (no se recalcula aquí).
 *  - Cobrado → anticipo del registro de la obra + Σ cobros_obra (nuevo).
 *  - Rentabilidad → precio de venta − (costo estimado | gasto real).
 */

const METODOS: MetodoAnticipo[] = ["efectivo", "transferencia", "cheque", "otro"];

export type DineroObra = {
  financiero: FinancieroData["resumen"];
  gastos: FinancieroData["gastos"];
  cobros: Cobro[];
  /** Anticipo sembrado en el registro de la obra (primer cobro, informativo). */
  anticipo: { monto: number; metodo: MetodoAnticipo | null } | null;
  cobrado: number;
  /** Caja = cobrado − gasto real. */
  caja: number;
  rentabilidad: Rentabilidad;
};

export async function getDineroObra(obraId: string): Promise<DineroObra> {
  await requireUser();
  const empty: DineroObra = {
    financiero: {
      presupuesto: null, materiales: 0, manoObra: 0, compras: 0, gastosManuales: 0,
      gastado: 0, restante: null, ejecutado: null, estado: "sin_presupuesto",
    },
    gastos: [],
    cobros: [],
    anticipo: null,
    cobrado: 0,
    caja: 0,
    rentabilidad: {
      costoEstimado: null, precioVenta: null, gastoReal: 0,
      proyectadaMonto: null, proyectadaPct: null, realMonto: null, realPct: null,
    },
  };
  if (!isSupabaseConfigured() || !obraId) return empty;

  try {
    const supabase = createAdminClient();
    const [financiero, obraRes, cobrosRes] = await Promise.all([
      getFinancieroObra(obraId),
      supabase.from("proyectos").select("costo_estimado, precio_venta, anticipo_monto, anticipo_metodo").eq("id", obraId).single(),
      supabase.from("cobros_obra").select("*").eq("obra_id", obraId).order("fecha", { ascending: false }),
    ]);

    const obra = obraRes.data as {
      costo_estimado: number | null; precio_venta: number | null;
      anticipo_monto: number | null; anticipo_metodo: MetodoAnticipo | null;
    } | null;
    const cobros = (cobrosRes.data ?? []) as Cobro[];

    const anticipoMonto = obra?.anticipo_monto ?? 0;
    const anticipo = anticipoMonto > 0 ? { monto: anticipoMonto, metodo: obra?.anticipo_metodo ?? null } : null;

    let cobrado = anticipoMonto;
    for (const c of cobros) cobrado = round2(cobrado + (c.monto ?? 0));

    const gastoReal = financiero.resumen.gastado;
    const caja = round2(cobrado - gastoReal);

    const costoEstimado = obra?.costo_estimado ?? null;
    const precioVenta = obra?.precio_venta ?? null;
    const pct = (monto: number | null): number | null =>
      monto != null && precioVenta != null && precioVenta > 0 ? round2((monto / precioVenta) * 100) : null;
    const proyectadaMonto = precioVenta != null && costoEstimado != null ? round2(precioVenta - costoEstimado) : null;
    const realMonto = precioVenta != null ? round2(precioVenta - gastoReal) : null;

    return {
      financiero: financiero.resumen,
      gastos: financiero.gastos,
      cobros,
      anticipo,
      cobrado,
      caja,
      rentabilidad: {
        costoEstimado, precioVenta, gastoReal,
        proyectadaMonto, proyectadaPct: pct(proyectadaMonto),
        realMonto, realPct: pct(realMonto),
      },
    };
  } catch {
    return empty;
  }
}

// ── CRUD de cobros ─────────────────────────────────────────

type CobroParsed = { monto: number; concepto: string | null; fecha: string; metodo: MetodoAnticipo | null; notas: string | null };

function parse(raw: unknown): CobroParsed | { error: string } {
  const d = (raw ?? {}) as Record<string, unknown>;
  const monto = Number(d.monto);
  if (!Number.isFinite(monto) || monto <= 0) return { error: "El monto debe ser mayor que cero." };
  const fecha = String(d.fecha ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return { error: "Fecha inválida." };
  const metodoRaw = String(d.metodo ?? "").trim();
  const metodo = metodoRaw && METODOS.includes(metodoRaw as MetodoAnticipo) ? (metodoRaw as MetodoAnticipo) : null;
  const str = (v: unknown) => {
    const s = String(v ?? "").trim();
    return s === "" ? null : s;
  };
  return { monto: round2(monto), concepto: str(d.concepto), fecha, metodo, notas: str(d.notas) };
}

export async function addCobro(obraId: string, raw: unknown): Promise<{ ok: boolean; error?: string }> {
  await requireUser();
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase no configurado." };
  if (!obraId) return { ok: false, error: "Falta la obra." };
  const parsed = parse(raw);
  if ("error" in parsed) return { ok: false, error: parsed.error };
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("cobros_obra").insert({ obra_id: obraId, ...parsed });
    if (error) throw error;
    await registrarAuditoria("crear", "cobro", obraId, `Cobro · ${formatMoney(parsed.monto)}`, { campo: "monto", despues: parsed.monto });
    revalidatePath(`/obras/${obraId}`);
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo registrar el cobro." };
  }
}

export async function updateCobro(id: string, obraId: string, raw: unknown): Promise<{ ok: boolean; error?: string }> {
  await requireUser();
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase no configurado." };
  if (!id) return { ok: false, error: "Falta el identificador." };
  const parsed = parse(raw);
  if ("error" in parsed) return { ok: false, error: parsed.error };
  try {
    const supabase = createAdminClient();
    const { data: prev } = await supabase.from("cobros_obra").select("monto").eq("id", id).single();
    const { error } = await supabase.from("cobros_obra").update(parsed).eq("id", id);
    if (error) throw error;
    await registrarAuditoria("editar", "cobro", obraId, `Cobro · ${formatMoney(parsed.monto)}`, { campo: "monto", antes: (prev as any)?.monto, despues: parsed.monto });
    revalidatePath(`/obras/${obraId}`);
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudieron guardar los cambios." };
  }
}

export async function deleteCobro(id: string, obraId: string): Promise<{ ok: boolean; error?: string }> {
  await requireUser();
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase no configurado." };
  if (!id) return { ok: false, error: "Falta el identificador." };
  try {
    const supabase = createAdminClient();
    const { data: prev } = await supabase.from("cobros_obra").select("monto").eq("id", id).single();
    const { error } = await supabase.from("cobros_obra").delete().eq("id", id);
    if (error) throw error;
    await registrarAuditoria("eliminar", "cobro", obraId, `Cobro · ${formatMoney((prev as any)?.monto ?? 0)}`, { campo: "monto", antes: (prev as any)?.monto });
    revalidatePath(`/obras/${obraId}`);
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo eliminar el cobro." };
  }
}

/** Guarda costo estimado y precio de venta (rentabilidad) de la obra. */
export async function setRentabilidad(
  obraId: string,
  raw: unknown,
): Promise<{ ok: boolean; error?: string }> {
  await requireUser();
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase no configurado." };
  if (!obraId) return { ok: false, error: "Falta la obra." };
  const d = (raw ?? {}) as Record<string, unknown>;
  const num = (v: unknown): number | null => {
    if (v === "" || v == null) return null;
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? round2(n) : null;
  };
  try {
    const supabase = createAdminClient();
    const { data: prev } = await supabase.from("proyectos").select("costo_estimado, precio_venta, nombre").eq("id", obraId).single();
    const costo = num(d.costo_estimado);
    const precio = num(d.precio_venta);
    const { error } = await supabase
      .from("proyectos")
      .update({ costo_estimado: costo, precio_venta: precio })
      .eq("id", obraId);
    if (error) throw error;
    await registrarAuditoria("editar", "rentabilidad", obraId, `Rentabilidad · ${(prev as any)?.nombre ?? "obra"}`, {
      campo: "precio_venta",
      antes: (prev as any)?.precio_venta,
      despues: precio,
      nota: `Costo estimado: ${(prev as any)?.costo_estimado ?? "—"} → ${costo ?? "—"}`,
    });
    revalidatePath(`/obras/${obraId}`);
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo guardar la rentabilidad." };
  }
}

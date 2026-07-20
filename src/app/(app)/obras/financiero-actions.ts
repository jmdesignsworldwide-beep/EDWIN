"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { registrarAuditoria } from "@/lib/auditoria";
import { formatMoney } from "@/lib/utils";
import {
  jornalDiario,
  round2,
  type EstadoAsistencia,
  type FinancieroResumen,
  type GastoObra,
  type JornalTipo,
} from "@/lib/proyectos/types";

/**
 * ⚠️ DINERO: todo el cálculo del gasto real ocurre AQUÍ, en el servidor. El
 * cliente solo muestra los números que devuelve esta función; nunca los calcula.
 *
 * Gasto real = materiales comprados + mano de obra (asistencia × jornal) +
 * compras de la obra + gastos manuales.
 */

function pesoDia(estado: EstadoAsistencia): number {
  return estado === "presente" ? 1 : estado === "medio" ? 0.5 : 0;
}

export type FinancieroData = {
  resumen: FinancieroResumen;
  gastos: GastoObra[];
};

const EMPTY: FinancieroResumen = {
  presupuesto: null,
  materiales: 0,
  manoObra: 0,
  compras: 0,
  gastosManuales: 0,
  gastado: 0,
  restante: null,
  ejecutado: null,
  estado: "sin_presupuesto",
};

export async function getFinancieroObra(obraId: string): Promise<FinancieroData> {
  await requireUser();
  if (!isSupabaseConfigured() || !obraId) return { resumen: EMPTY, gastos: [] };
  try {
    const supabase = createAdminClient();

    const [obraRes, matRes, asisRes, compraRes, gastoRes] = await Promise.all([
      supabase.from("proyectos").select("presupuesto").eq("id", obraId).single(),
      supabase.from("materiales").select("cantidad_comprada, costo_unitario").eq("obra_id", obraId),
      supabase.from("asistencia").select("estado, persona:personal(jornal, jornal_tipo)").eq("obra_id", obraId),
      supabase.from("compras").select("monto").eq("obra_id", obraId),
      supabase.from("gastos_obra").select("*").eq("obra_id", obraId).order("fecha", { ascending: false }),
    ]);

    const presupuesto =
      obraRes.data?.presupuesto != null ? Number(obraRes.data.presupuesto) : null;

    // Materiales: Σ (comprada × costo unitario).
    let materiales = 0;
    for (const m of (matRes.data ?? []) as { cantidad_comprada: number | null; costo_unitario: number | null }[]) {
      if (m.cantidad_comprada != null && m.costo_unitario != null) {
        materiales = round2(materiales + m.cantidad_comprada * m.costo_unitario);
      }
    }

    // Mano de obra: Σ (peso del día × jornal/día) de la asistencia de esta obra.
    // `persona` embebido puede venir como objeto o arreglo según el tipado.
    let manoObra = 0;
    for (const a of (asisRes.data ?? []) as any[]) {
      const per = Array.isArray(a.persona) ? a.persona[0] : a.persona;
      const jornal: number = per?.jornal ?? 0;
      const tipo: JornalTipo = (per?.jornal_tipo as JornalTipo) ?? "dia";
      manoObra = round2(manoObra + pesoDia(a.estado as EstadoAsistencia) * jornalDiario(jornal, tipo));
    }

    // Compras ligadas a la obra.
    let compras = 0;
    for (const c of (compraRes.data ?? []) as { monto: number | null }[]) {
      compras = round2(compras + (c.monto ?? 0));
    }

    const gastos = (gastoRes.data ?? []) as GastoObra[];
    let gastosManuales = 0;
    for (const g of gastos) gastosManuales = round2(gastosManuales + (g.monto ?? 0));

    const gastado = round2(materiales + manoObra + compras + gastosManuales);
    const restante = presupuesto != null ? round2(presupuesto - gastado) : null;
    const ejecutado =
      presupuesto != null && presupuesto > 0 ? round2((gastado / presupuesto) * 100) : null;

    let estado: FinancieroResumen["estado"] = "sin_presupuesto";
    if (presupuesto != null && presupuesto > 0) {
      estado = gastado > presupuesto ? "excedido" : gastado >= presupuesto * 0.85 ? "alerta" : "sano";
    }

    return {
      resumen: { presupuesto, materiales, manoObra, compras, gastosManuales, gastado, restante, ejecutado, estado },
      gastos,
    };
  } catch {
    return { resumen: EMPTY, gastos: [] };
  }
}

// ── CRUD de gastos manuales ────────────────────────────────

function parse(raw: unknown): GastoInputParsed | { error: string } {
  const d = (raw ?? {}) as Record<string, unknown>;
  const monto = Number(d.monto);
  if (!Number.isFinite(monto) || monto <= 0) return { error: "El monto debe ser mayor que cero." };
  const fecha = String(d.fecha ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return { error: "Fecha inválida." };
  const str = (v: unknown) => {
    const s = String(v ?? "").trim();
    return s === "" ? null : s;
  };
  const categoria = str(d.categoria) ?? "Otros";
  if (categoria.length > 80) return { error: "La categoría es demasiado larga." };
  return { categoria, concepto: str(d.concepto), monto: round2(monto), fecha, notas: str(d.notas) };
}

type GastoInputParsed = { categoria: string; concepto: string | null; monto: number; fecha: string; notas: string | null };

export async function addGasto(obraId: string, raw: unknown): Promise<{ ok: boolean; error?: string }> {
  await requireUser();
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase no configurado." };
  if (!obraId) return { ok: false, error: "Falta la obra." };
  const parsed = parse(raw);
  if ("error" in parsed) return { ok: false, error: parsed.error };
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("gastos_obra").insert({ obra_id: obraId, ...parsed });
    if (error) throw error;
    await registrarAuditoria("crear", "gasto", obraId, `Gasto ${parsed.categoria} · ${formatMoney(parsed.monto)}`, { campo: "monto", despues: parsed.monto });
    revalidatePath(`/obras/${obraId}`);
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo registrar el gasto." };
  }
}

export async function updateGasto(id: string, obraId: string, raw: unknown): Promise<{ ok: boolean; error?: string }> {
  await requireUser();
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase no configurado." };
  if (!id) return { ok: false, error: "Falta el identificador." };
  const parsed = parse(raw);
  if ("error" in parsed) return { ok: false, error: parsed.error };
  try {
    const supabase = createAdminClient();
    const { data: prev } = await supabase.from("gastos_obra").select("monto").eq("id", id).single();
    const { error } = await supabase.from("gastos_obra").update(parsed).eq("id", id);
    if (error) throw error;
    await registrarAuditoria("editar", "gasto", obraId, `Gasto ${parsed.categoria} · ${formatMoney(parsed.monto)}`, { campo: "monto", antes: (prev as any)?.monto, despues: parsed.monto });
    revalidatePath(`/obras/${obraId}`);
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudieron guardar los cambios." };
  }
}

export async function deleteGasto(id: string, obraId: string): Promise<{ ok: boolean; error?: string }> {
  await requireUser();
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase no configurado." };
  if (!id) return { ok: false, error: "Falta el identificador." };
  try {
    const supabase = createAdminClient();
    const { data: prev } = await supabase.from("gastos_obra").select("monto, categoria").eq("id", id).single();
    const { error } = await supabase.from("gastos_obra").delete().eq("id", id);
    if (error) throw error;
    await registrarAuditoria("eliminar", "gasto", obraId, `Gasto ${(prev as any)?.categoria ?? ""} · ${formatMoney((prev as any)?.monto ?? 0)}`, { campo: "monto", antes: (prev as any)?.monto });
    revalidatePath(`/obras/${obraId}`);
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo eliminar el gasto." };
  }
}

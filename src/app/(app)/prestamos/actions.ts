"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/server";
import {
  round2,
  totalPrestamo,
  type FrecuenciaCuota,
  type Prestamo,
  type PrestamoCuota,
  type PrestamoTipo,
} from "@/lib/proyectos/types";

/**
 * ⚠️ DINERO: todo el cálculo (interés, cuotas) ocurre en el SERVIDOR. Préstamos
 * FORMALES — distintos de los adelantos a empleados (pagos_empleado, Bloque 2).
 */

const TIPOS: PrestamoTipo[] = ["por_pagar", "por_cobrar"];
const FRECS: FrecuenciaCuota[] = ["unica", "semanal", "quincenal", "mensual"];

function pad(n: number) {
  return String(n).padStart(2, "0");
}
function fmtISO(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
/** Fecha de la cuota i (1..n) a partir de la fecha de inicio y la frecuencia. */
function venceCuota(fechaInicio: string, frecuencia: FrecuenciaCuota, i: number): string {
  const d = new Date(fechaInicio + "T00:00:00");
  if (frecuencia === "semanal") d.setDate(d.getDate() + 7 * i);
  else if (frecuencia === "quincenal") d.setDate(d.getDate() + 15 * i);
  else if (frecuencia === "mensual") d.setMonth(d.getMonth() + i);
  return fmtISO(d);
}

/** Genera las cuotas repartiendo el total; la última absorbe el redondeo (cuadra al centavo). */
function generarCuotas(total: number, n: number, fechaInicio: string, frecuencia: FrecuenciaCuota) {
  if (frecuencia === "unica" || n <= 1) {
    return [{ numero: 1, monto: round2(total), vence: fechaInicio }];
  }
  const base = round2(total / n);
  const cuotas: { numero: number; monto: number; vence: string }[] = [];
  let acum = 0;
  for (let i = 1; i <= n; i++) {
    const monto = i < n ? base : round2(total - acum);
    acum = round2(acum + base);
    cuotas.push({ numero: i, monto, vence: venceCuota(fechaInicio, frecuencia, i) });
  }
  return cuotas;
}

export async function listPrestamos(): Promise<Prestamo[]> {
  await requireUser();
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("prestamos")
      .select("*, obra:proyectos(id,nombre), cuotas:prestamo_cuotas(*)")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return ((data ?? []) as any[]).map((p) => ({
      ...p,
      obra: p.obra ?? null,
      cuotas: (p.cuotas ?? []).sort((a: PrestamoCuota, b: PrestamoCuota) => a.numero - b.numero),
    })) as Prestamo[];
  } catch {
    return [];
  }
}

export async function getPrestamo(id: string): Promise<Prestamo | null> {
  await requireUser();
  if (!isSupabaseConfigured() || !id) return null;
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("prestamos")
      .select("*, obra:proyectos(id,nombre), cuotas:prestamo_cuotas(*)")
      .eq("id", id)
      .single();
    if (error || !data) return null;
    const p = data as any;
    p.cuotas = (p.cuotas ?? []).sort((a: PrestamoCuota, b: PrestamoCuota) => a.numero - b.numero);
    p.obra = p.obra ?? null;
    return p as Prestamo;
  } catch {
    return null;
  }
}

/** Cuotas no pagadas próximas a vencer o vencidas (para Dashboard/Notificaciones). */
export type Vencimiento = {
  cuota: PrestamoCuota;
  prestamo: { id: string; tipo: PrestamoTipo; contraparte: string };
  diasRestantes: number;
};
export async function listVencimientos(dias = 7): Promise<Vencimiento[]> {
  await requireUser();
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("prestamo_cuotas")
      .select("*, prestamo:prestamos(id,tipo,contraparte,estado)")
      .eq("pagada", false)
      .order("vence", { ascending: true });
    if (error) throw error;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const limite = new Date(hoy);
    limite.setDate(limite.getDate() + dias);
    const res: Vencimiento[] = [];
    for (const c of (data ?? []) as any[]) {
      if (!c.prestamo || c.prestamo.estado !== "activo") continue;
      const v = new Date(c.vence + "T00:00:00");
      if (v > limite) continue; // solo vencidas o dentro de la ventana
      const diasRestantes = Math.round((v.getTime() - hoy.getTime()) / 86400000);
      res.push({
        cuota: c as PrestamoCuota,
        prestamo: { id: c.prestamo.id, tipo: c.prestamo.tipo, contraparte: c.prestamo.contraparte },
        diasRestantes,
      });
    }
    return res;
  } catch {
    return [];
  }
}

export async function addPrestamo(raw: unknown): Promise<{ ok: boolean; error?: string; id?: string }> {
  await requireUser();
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase no configurado." };
  const d = (raw ?? {}) as Record<string, unknown>;

  const tipo = String(d.tipo ?? "por_pagar") as PrestamoTipo;
  if (!TIPOS.includes(tipo)) return { ok: false, error: "Tipo inválido." };
  const contraparte = String(d.contraparte ?? "").trim();
  if (!contraparte) return { ok: false, error: tipo === "por_pagar" ? "Falta el prestamista." : "Falta el deudor." };
  const capital = Number(d.capital);
  if (!Number.isFinite(capital) || capital <= 0) return { ok: false, error: "El capital debe ser mayor que cero." };
  const tasa = Number(d.tasa ?? 0);
  if (!Number.isFinite(tasa) || tasa < 0) return { ok: false, error: "La tasa es inválida." };
  const fecha_inicio = String(d.fecha_inicio ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha_inicio)) return { ok: false, error: "Fecha de inicio inválida." };
  const frecuencia = String(d.frecuencia ?? "mensual") as FrecuenciaCuota;
  if (!FRECS.includes(frecuencia)) return { ok: false, error: "Frecuencia inválida." };
  let nCuotas = Number(d.numero_cuotas ?? 1);
  if (!Number.isFinite(nCuotas) || nCuotas < 1) nCuotas = 1;
  nCuotas = Math.min(360, Math.floor(nCuotas));
  const str = (v: unknown) => {
    const s = String(v ?? "").trim();
    return s === "" ? null : s;
  };

  const total = totalPrestamo(round2(capital), round2(tasa));
  const cuotas = generarCuotas(total, frecuencia === "unica" ? 1 : nCuotas, fecha_inicio, frecuencia);

  try {
    const supabase = createAdminClient();
    const { data: prestamo, error } = await supabase
      .from("prestamos")
      .insert({ tipo, contraparte, obra_id: str(d.obra_id), capital: round2(capital), tasa: round2(tasa), fecha_inicio, estado: "activo", notas: str(d.notas) })
      .select("id")
      .single();
    if (error) throw error;
    const prestamoId = (prestamo as { id: string }).id;
    const { error: eCuotas } = await supabase
      .from("prestamo_cuotas")
      .insert(cuotas.map((c) => ({ ...c, prestamo_id: prestamoId })));
    if (eCuotas) {
      await supabase.from("prestamos").delete().eq("id", prestamoId);
      throw eCuotas;
    }
    revalidatePath("/prestamos");
    return { ok: true, id: prestamoId };
  } catch {
    return { ok: false, error: "No se pudo registrar el préstamo." };
  }
}

/** Edita datos básicos (no capital/tasa/cuotas: para eso, elimina y recrea). */
export async function updatePrestamo(id: string, raw: unknown): Promise<{ ok: boolean; error?: string }> {
  await requireUser();
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase no configurado." };
  if (!id) return { ok: false, error: "Falta el identificador." };
  const d = (raw ?? {}) as Record<string, unknown>;
  const contraparte = String(d.contraparte ?? "").trim();
  if (!contraparte) return { ok: false, error: "Falta la contraparte." };
  const str = (v: unknown) => {
    const s = String(v ?? "").trim();
    return s === "" ? null : s;
  };
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("prestamos").update({ contraparte, obra_id: str(d.obra_id), notas: str(d.notas) }).eq("id", id);
    if (error) throw error;
    revalidatePath("/prestamos");
    revalidatePath(`/prestamos/${id}`);
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudieron guardar los cambios." };
  }
}

/** Marca/desmarca una cuota como pagada; si todas quedan pagadas, salda el préstamo. */
export async function marcarCuota(cuotaId: string, prestamoId: string, pagada: boolean): Promise<{ ok: boolean; error?: string }> {
  await requireUser();
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase no configurado." };
  if (!cuotaId) return { ok: false, error: "Falta la cuota." };
  try {
    const supabase = createAdminClient();
    const hoy = new Date();
    const fecha_pago = pagada ? `${hoy.getFullYear()}-${pad(hoy.getMonth() + 1)}-${pad(hoy.getDate())}` : null;
    const { error } = await supabase.from("prestamo_cuotas").update({ pagada, fecha_pago }).eq("id", cuotaId);
    if (error) throw error;
    // Estado del préstamo según cuotas restantes.
    const { data: rest } = await supabase.from("prestamo_cuotas").select("pagada").eq("prestamo_id", prestamoId);
    const todas = (rest ?? []).length > 0 && (rest ?? []).every((c: { pagada: boolean }) => c.pagada);
    await supabase.from("prestamos").update({ estado: todas ? "saldado" : "activo" }).eq("id", prestamoId).neq("estado", "anulado");
    revalidatePath("/prestamos");
    revalidatePath(`/prestamos/${prestamoId}`);
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo actualizar la cuota." };
  }
}

export async function anularPrestamo(id: string): Promise<{ ok: boolean; error?: string }> {
  await requireUser();
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase no configurado." };
  if (!id) return { ok: false, error: "Falta el identificador." };
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("prestamos").update({ estado: "anulado" }).eq("id", id);
    if (error) throw error;
    revalidatePath("/prestamos");
    revalidatePath(`/prestamos/${id}`);
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo anular el préstamo." };
  }
}

export async function deletePrestamo(id: string): Promise<{ ok: boolean; error?: string }> {
  await requireUser();
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase no configurado." };
  if (!id) return { ok: false, error: "Falta el identificador." };
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("prestamos").delete().eq("id", id);
    if (error) throw error;
    revalidatePath("/prestamos");
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo eliminar el préstamo." };
  }
}

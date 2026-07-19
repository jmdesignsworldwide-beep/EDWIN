"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { getDineroObra } from "./cobros-actions";
import {
  round2,
  type Inversionista,
  type RepartoInversionista,
} from "@/lib/proyectos/types";

/**
 * ⚠️ DINERO: la ganancia se LEE del módulo Rentabilidad (Tanda 2), no se
 * recalcula. Reparto de cada inversionista = capital + ganancia × su %.
 */

export type InversionistasData = {
  inversionistas: RepartoInversionista[];
  totalInvertido: number;
  ganancia: number | null; // ganancia real de la obra (precio − gasto real)
  precioVentaDefinido: boolean;
  sumaPct: number;
};

export async function getInversionistas(obraId: string): Promise<InversionistasData> {
  await requireUser();
  const empty: InversionistasData = { inversionistas: [], totalInvertido: 0, ganancia: null, precioVentaDefinido: false, sumaPct: 0 };
  if (!isSupabaseConfigured() || !obraId) return empty;
  try {
    const supabase = createAdminClient();
    const [{ data }, dinero] = await Promise.all([
      supabase.from("inversionistas").select("*").eq("obra_id", obraId).order("created_at", { ascending: true }),
      getDineroObra(obraId),
    ]);

    const rows = (data ?? []) as Inversionista[];
    const totalInvertido = round2(rows.reduce((a, r) => a + (r.monto ?? 0), 0));
    const ganancia = dinero.rentabilidad.realMonto; // null si no hay precio de venta
    const precioVentaDefinido = dinero.rentabilidad.precioVenta != null;

    let sumaPct = 0;
    const inversionistas: RepartoInversionista[] = rows.map((r) => {
      const pctAuto = totalInvertido > 0 ? round2((r.monto / totalInvertido) * 100) : 0;
      const pct = r.pct_manual != null ? round2(r.pct_manual) : pctAuto;
      sumaPct = round2(sumaPct + pct);
      const gananciaParte = ganancia != null ? round2(ganancia * (pct / 100)) : 0;
      const totalRecibir = round2(r.monto + gananciaParte);
      return { ...r, pct, gananciaParte, totalRecibir };
    });

    return { inversionistas, totalInvertido, ganancia, precioVentaDefinido, sumaPct };
  } catch {
    return empty;
  }
}

type Parsed = { nombre: string; cliente_id: string | null; monto: number; fecha: string; pct_manual: number | null; notas: string | null };

function parse(raw: unknown): Parsed | { error: string } {
  const d = (raw ?? {}) as Record<string, unknown>;
  const nombre = String(d.nombre ?? "").trim();
  if (!nombre) return { error: "El nombre del inversionista es obligatorio." };
  if (nombre.length > 180) return { error: "El nombre es demasiado largo." };
  const monto = Number(d.monto);
  if (!Number.isFinite(monto) || monto < 0) return { error: "El monto es inválido." };
  const fecha = String(d.fecha ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return { error: "Fecha inválida." };

  let pct_manual: number | null = null;
  if (d.pct_manual !== "" && d.pct_manual != null) {
    const p = Number(d.pct_manual);
    if (!Number.isFinite(p) || p < 0 || p > 100) return { error: "El % debe estar entre 0 y 100." };
    pct_manual = round2(p);
  }
  const str = (v: unknown) => {
    const s = String(v ?? "").trim();
    return s === "" ? null : s;
  };
  return { nombre, cliente_id: str(d.cliente_id), monto: round2(monto), fecha, pct_manual, notas: str(d.notas) };
}

export async function addInversionista(obraId: string, raw: unknown): Promise<{ ok: boolean; error?: string }> {
  await requireUser();
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase no configurado." };
  if (!obraId) return { ok: false, error: "Falta la obra." };
  const parsed = parse(raw);
  if ("error" in parsed) return { ok: false, error: parsed.error };
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("inversionistas").insert({ obra_id: obraId, ...parsed });
    if (error) throw error;
    revalidatePath(`/obras/${obraId}`);
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo agregar el inversionista." };
  }
}

export async function updateInversionista(id: string, obraId: string, raw: unknown): Promise<{ ok: boolean; error?: string }> {
  await requireUser();
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase no configurado." };
  if (!id) return { ok: false, error: "Falta el identificador." };
  const parsed = parse(raw);
  if ("error" in parsed) return { ok: false, error: parsed.error };
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("inversionistas").update(parsed).eq("id", id);
    if (error) throw error;
    revalidatePath(`/obras/${obraId}`);
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudieron guardar los cambios." };
  }
}

export async function deleteInversionista(id: string, obraId: string): Promise<{ ok: boolean; error?: string }> {
  await requireUser();
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase no configurado." };
  if (!id) return { ok: false, error: "Falta el identificador." };
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("inversionistas").delete().eq("id", id);
    if (error) throw error;
    revalidatePath(`/obras/${obraId}`);
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo eliminar el inversionista." };
  }
}

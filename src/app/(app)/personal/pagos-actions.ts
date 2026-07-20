"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { registrarAuditoria } from "@/lib/auditoria";
import { formatMoney } from "@/lib/utils";
import { round2, type PagoEmpleado, type PagoTipo } from "@/lib/proyectos/types";

const TIPOS: PagoTipo[] = ["adelanto", "pago", "entrega", "otro"];

/** Historial de pagos/entregas de una persona (más recientes primero). */
export async function listPagos(personaId: string): Promise<PagoEmpleado[]> {
  await requireUser();
  if (!isSupabaseConfigured() || !personaId) return [];
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("pagos_empleado")
      .select("*")
      .eq("persona_id", personaId)
      .order("fecha", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as PagoEmpleado[];
  } catch {
    return [];
  }
}

/** Registra una entrega de dinero al empleado (adelanto/pago/entrega). */
export async function addPago(
  personaId: string,
  raw: unknown,
): Promise<{ ok: boolean; error?: string }> {
  await requireUser();
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase no configurado." };
  if (!personaId) return { ok: false, error: "Falta la persona." };

  const d = (raw ?? {}) as Record<string, unknown>;
  const tipo = String(d.tipo ?? "adelanto") as PagoTipo;
  if (!TIPOS.includes(tipo)) return { ok: false, error: "Tipo inválido." };

  const monto = Number(d.monto);
  if (!Number.isFinite(monto) || monto <= 0) return { ok: false, error: "El monto debe ser mayor que cero." };

  const fecha = String(d.fecha ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return { ok: false, error: "Fecha inválida." };

  const str = (v: unknown) => {
    const s = String(v ?? "").trim();
    return s === "" ? null : s;
  };

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("pagos_empleado").insert({
      persona_id: personaId,
      tipo,
      monto: round2(monto),
      concepto: str(d.concepto),
      fecha,
      origen: "manual",
      notas: str(d.notas),
    });
    if (error) throw error;
    const { data: per } = await supabase.from("personal").select("nombre").eq("id", personaId).single();
    await registrarAuditoria("crear", "pago_empleado", personaId, `${tipo} a ${(per as any)?.nombre ?? "empleado"} · ${formatMoney(round2(monto))}`, { campo: "monto", despues: round2(monto) });
    revalidatePath(`/personal/${personaId}`);
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo registrar la entrega." };
  }
}

/** Marca/desmarca un adelanto como saldado (descontado). Registro manual. */
export async function toggleSaldado(
  id: string,
  personaId: string,
  saldado: boolean,
): Promise<{ ok: boolean; error?: string }> {
  await requireUser();
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase no configurado." };
  if (!id) return { ok: false, error: "Falta el identificador." };
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("pagos_empleado").update({ saldado }).eq("id", id);
    if (error) throw error;
    revalidatePath(`/personal/${personaId}`);
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo actualizar." };
  }
}

/** Elimina un registro de pago/entrega (solo los manuales). */
export async function deletePago(
  id: string,
  personaId: string,
): Promise<{ ok: boolean; error?: string }> {
  await requireUser();
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase no configurado." };
  if (!id) return { ok: false, error: "Falta el identificador." };
  try {
    const supabase = createAdminClient();
    const { data: prev } = await supabase.from("pagos_empleado").select("monto, tipo").eq("id", id).single();
    const { error } = await supabase
      .from("pagos_empleado")
      .delete()
      .eq("id", id)
      .eq("origen", "manual");
    if (error) throw error;
    await registrarAuditoria("eliminar", "pago_empleado", personaId, `Entrega ${(prev as any)?.tipo ?? ""} · ${formatMoney((prev as any)?.monto ?? 0)}`, { campo: "monto", antes: (prev as any)?.monto });
    revalidatePath(`/personal/${personaId}`);
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo eliminar." };
  }
}

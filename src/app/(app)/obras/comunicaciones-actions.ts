"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { ComunicacionObra, ComunicacionTipo } from "@/lib/proyectos/types";

const TIPOS: ComunicacionTipo[] = ["llamada", "whatsapp", "reunion", "correo", "otro"];

export async function listComunicaciones(obraId: string): Promise<ComunicacionObra[]> {
  await requireUser();
  if (!isSupabaseConfigured() || !obraId) return [];
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("comunicaciones_obra")
      .select("*")
      .eq("obra_id", obraId)
      .order("fecha", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as ComunicacionObra[];
  } catch {
    return [];
  }
}

type Parsed = { tipo: ComunicacionTipo; resumen: string; notas: string | null; fecha: string };

function parse(raw: unknown): Parsed | { error: string } {
  const d = (raw ?? {}) as Record<string, unknown>;
  const tipo = String(d.tipo ?? "llamada") as ComunicacionTipo;
  if (!TIPOS.includes(tipo)) return { error: "Tipo inválido." };
  const resumen = String(d.resumen ?? "").trim();
  if (!resumen) return { error: "Escribe un resumen de lo hablado." };
  if (resumen.length > 2000) return { error: "El resumen es demasiado largo." };
  const fecha = String(d.fecha ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return { error: "Fecha inválida." };
  const notas = String(d.notas ?? "").trim() || null;
  return { tipo, resumen, notas, fecha };
}

export async function addComunicacion(obraId: string, raw: unknown): Promise<{ ok: boolean; error?: string }> {
  await requireUser();
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase no configurado." };
  if (!obraId) return { ok: false, error: "Falta la obra." };
  const parsed = parse(raw);
  if ("error" in parsed) return { ok: false, error: parsed.error };
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("comunicaciones_obra").insert({ obra_id: obraId, ...parsed });
    if (error) throw error;
    revalidatePath(`/obras/${obraId}`);
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo registrar la comunicación." };
  }
}

export async function updateComunicacion(id: string, obraId: string, raw: unknown): Promise<{ ok: boolean; error?: string }> {
  await requireUser();
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase no configurado." };
  if (!id) return { ok: false, error: "Falta el identificador." };
  const parsed = parse(raw);
  if ("error" in parsed) return { ok: false, error: parsed.error };
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("comunicaciones_obra").update(parsed).eq("id", id);
    if (error) throw error;
    revalidatePath(`/obras/${obraId}`);
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudieron guardar los cambios." };
  }
}

export async function deleteComunicacion(id: string, obraId: string): Promise<{ ok: boolean; error?: string }> {
  await requireUser();
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase no configurado." };
  if (!id) return { ok: false, error: "Falta el identificador." };
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("comunicaciones_obra").delete().eq("id", id);
    if (error) throw error;
    revalidatePath(`/obras/${obraId}`);
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo eliminar la comunicación." };
  }
}

/** Conteos del expediente (para badges/resumen). */
export async function getExpedienteCounts(obraId: string): Promise<{ fotos: number; documentos: number; bitacora: number; comunicaciones: number }> {
  await requireUser();
  const zero = { fotos: 0, documentos: 0, bitacora: 0, comunicaciones: 0 };
  if (!isSupabaseConfigured() || !obraId) return zero;
  try {
    const supabase = createAdminClient();
    const count = async (tabla: string) => {
      const { count } = await supabase.from(tabla).select("id", { count: "exact", head: true }).eq("obra_id", obraId);
      return count ?? 0;
    };
    const [fotos, documentos, bitacora, comunicaciones] = await Promise.all([
      count("fotos_obra"), count("documentos_obra"), count("bitacora_obra"), count("comunicaciones_obra"),
    ]);
    return { fotos, documentos, bitacora, comunicaciones };
  } catch {
    return zero;
  }
}

"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { Pendiente, PrioridadPendiente } from "@/lib/proyectos/types";

const PRIORIDADES: PrioridadPendiente[] = ["alta", "normal"];

export async function listPendientes(): Promise<Pendiente[]> {
  await requireUser();
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("pendientes")
      .select("*, obra:proyectos(id,nombre)")
      .order("hecho", { ascending: true })
      .order("fecha", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false });
    if (error) throw error;
    return ((data ?? []) as any[]).map((p) => ({ ...p, obra: p.obra ?? null })) as Pendiente[];
  } catch {
    return [];
  }
}

type Parsed = { texto: string; obra_id: string | null; prioridad: PrioridadPendiente; fecha: string | null };

function parse(raw: unknown): Parsed | { error: string } {
  const d = (raw ?? {}) as Record<string, unknown>;
  const texto = String(d.texto ?? "").trim();
  if (!texto) return { error: "Escribe el pendiente." };
  if (texto.length > 400) return { error: "El pendiente es demasiado largo." };
  const prioridad = String(d.prioridad ?? "normal") as PrioridadPendiente;
  if (!PRIORIDADES.includes(prioridad)) return { error: "Prioridad inválida." };
  const str = (v: unknown) => {
    const s = String(v ?? "").trim();
    return s === "" ? null : s;
  };
  const fechaRaw = str(d.fecha);
  const fecha = fechaRaw && /^\d{4}-\d{2}-\d{2}$/.test(fechaRaw) ? fechaRaw : null;
  return { texto, obra_id: str(d.obra_id), prioridad, fecha };
}

export async function addPendiente(raw: unknown): Promise<{ ok: boolean; error?: string }> {
  const user = await requireUser();
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase no configurado." };
  const parsed = parse(raw);
  if ("error" in parsed) return { ok: false, error: parsed.error };
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("pendientes").insert({ ...parsed, autor: user.nombre });
    if (error) throw error;
    revalidatePath("/pendientes");
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo crear el pendiente." };
  }
}

export async function updatePendiente(id: string, raw: unknown): Promise<{ ok: boolean; error?: string }> {
  await requireUser();
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase no configurado." };
  if (!id) return { ok: false, error: "Falta el identificador." };
  const parsed = parse(raw);
  if ("error" in parsed) return { ok: false, error: parsed.error };
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("pendientes").update(parsed).eq("id", id);
    if (error) throw error;
    revalidatePath("/pendientes");
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudieron guardar los cambios." };
  }
}

export async function togglePendiente(id: string, hecho: boolean): Promise<{ ok: boolean; error?: string }> {
  await requireUser();
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase no configurado." };
  if (!id) return { ok: false, error: "Falta el identificador." };
  try {
    const supabase = createAdminClient();
    const hecho_at = hecho ? new Date().toISOString() : null;
    const { error } = await supabase.from("pendientes").update({ hecho, hecho_at }).eq("id", id);
    if (error) throw error;
    revalidatePath("/pendientes");
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo actualizar." };
  }
}

export async function deletePendiente(id: string): Promise<{ ok: boolean; error?: string }> {
  await requireUser();
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase no configurado." };
  if (!id) return { ok: false, error: "Falta el identificador." };
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("pendientes").delete().eq("id", id);
    if (error) throw error;
    revalidatePath("/pendientes");
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo eliminar." };
  }
}

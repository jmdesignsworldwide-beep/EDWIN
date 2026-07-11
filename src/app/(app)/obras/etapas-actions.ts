"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import {
  createAdminClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";
import {
  calcularAvance,
  type EstadoEtapa,
  type EtapaInput,
} from "@/lib/proyectos/types";
import type { SupabaseClient } from "@supabase/supabase-js";

const ESTADOS: EstadoEtapa[] = [
  "pendiente",
  "en_curso",
  "completada",
  "retrasada",
];

export type EtapaMutationResult = { ok: true } | { ok: false; error: string };

/** Normaliza y valida la entrada de una etapa; enlaza estado ↔ porcentaje. */
function parse(raw: unknown): EtapaInput | { error: string } {
  const d = (raw ?? {}) as Record<string, unknown>;

  const nombre = String(d.nombre ?? "").trim();
  if (!nombre) return { error: "El nombre de la fase es obligatorio." };
  if (nombre.length > 160) return { error: "El nombre es demasiado largo." };

  const estado = String(d.estado ?? "pendiente") as EstadoEtapa;
  if (!ESTADOS.includes(estado)) return { error: "Estado inválido." };

  let porcentaje = Math.max(0, Math.min(100, Math.round(Number(d.porcentaje ?? 0))));
  if (!Number.isFinite(porcentaje)) porcentaje = 0;
  // Coherencia estado ↔ avance.
  if (estado === "completada") porcentaje = 100;
  if (estado === "pendiente") porcentaje = 0;

  const str = (v: unknown) => {
    const s = String(v ?? "").trim();
    return s === "" ? null : s;
  };

  return {
    nombre,
    estado,
    fecha_inicio: str(d.fecha_inicio),
    fecha_fin: str(d.fecha_fin),
    porcentaje,
    notas: str(d.notas),
  };
}

/** Recalcula y persiste el avance de la obra (promedio de % de etapas). */
async function recomputeAvance(supabase: SupabaseClient, obraId: string) {
  const { data } = await supabase
    .from("etapas")
    .select("porcentaje")
    .eq("obra_id", obraId);
  const avance = calcularAvance(data ?? []);
  await supabase.from("proyectos").update({ avance }).eq("id", obraId);
}

function row(input: EtapaInput) {
  return {
    nombre: input.nombre,
    estado: input.estado,
    completada: input.estado === "completada",
    fecha_inicio: input.fecha_inicio,
    fecha_fin: input.fecha_fin,
    porcentaje: input.porcentaje,
    notas: input.notas,
  };
}

function revalidate(obraId: string) {
  revalidatePath("/obras");
  revalidatePath(`/obras/${obraId}`);
  revalidatePath("/dashboard");
}

export async function createEtapa(
  obraId: string,
  raw: unknown,
): Promise<EtapaMutationResult> {
  requireSession();
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase no configurado." };
  if (!obraId) return { ok: false, error: "Falta la obra." };
  const parsed = parse(raw);
  if ("error" in parsed) return { ok: false, error: parsed.error };

  try {
    const supabase = createAdminClient();
    const { count } = await supabase
      .from("etapas")
      .select("id", { count: "exact", head: true })
      .eq("obra_id", obraId);
    const { error } = await supabase
      .from("etapas")
      .insert({ ...row(parsed), obra_id: obraId, orden: count ?? 0 });
    if (error) throw error;
    await recomputeAvance(supabase, obraId);
    revalidate(obraId);
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo crear la etapa." };
  }
}

export async function updateEtapa(
  obraId: string,
  etapaId: string,
  raw: unknown,
): Promise<EtapaMutationResult> {
  requireSession();
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase no configurado." };
  if (!obraId || !etapaId) return { ok: false, error: "Falta identificador." };
  const parsed = parse(raw);
  if ("error" in parsed) return { ok: false, error: parsed.error };

  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("etapas")
      .update(row(parsed))
      .eq("id", etapaId)
      .eq("obra_id", obraId);
    if (error) throw error;
    await recomputeAvance(supabase, obraId);
    revalidate(obraId);
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo guardar la etapa." };
  }
}

export async function deleteEtapa(
  obraId: string,
  etapaId: string,
): Promise<EtapaMutationResult> {
  requireSession();
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase no configurado." };
  if (!obraId || !etapaId) return { ok: false, error: "Falta identificador." };

  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("etapas")
      .delete()
      .eq("id", etapaId)
      .eq("obra_id", obraId);
    if (error) throw error;
    await recomputeAvance(supabase, obraId);
    revalidate(obraId);
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo eliminar la etapa." };
  }
}

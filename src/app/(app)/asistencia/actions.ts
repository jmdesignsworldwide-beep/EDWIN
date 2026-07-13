"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type {
  Asistencia,
  EstadoAsistencia,
  PaseListaRow,
} from "@/lib/proyectos/types";

const ESTADOS: EstadoAsistencia[] = ["presente", "ausente", "medio"];

export type MarcarResult = { ok: true } | { ok: false; error: string };

/** Pase de lista: personal asignado a la obra + su asistencia en esa fecha. */
export async function getPaseLista(
  obraId: string,
  fecha: string,
): Promise<PaseListaRow[]> {
  await requireUser();
  if (!isSupabaseConfigured() || !obraId || !fecha) return [];
  try {
    const supabase = createAdminClient();
    const [{ data: asig }, { data: asis }] = await Promise.all([
      supabase
        .from("personal_obra")
        .select("rol_en_obra, persona:personal(id,nombre,oficio,telefono,activo)")
        .eq("obra_id", obraId),
      supabase.from("asistencia").select("*").eq("obra_id", obraId).eq("fecha", fecha),
    ]);
    const byPersona = new Map<string, Asistencia>();
    for (const a of (asis ?? []) as Asistencia[]) byPersona.set(a.persona_id, a);

    const rows: PaseListaRow[] = ((asig ?? []) as any[])
      .filter((x) => x.persona)
      .map((x) => ({
        persona: x.persona,
        rol_en_obra: x.rol_en_obra,
        asistencia: byPersona.get(x.persona.id) ?? null,
      }));
    rows.sort((a, b) => a.persona.nombre.localeCompare(b.persona.nombre));
    return rows;
  } catch {
    return [];
  }
}

/** Marca (upsert) la asistencia de una persona en una obra y fecha. */
export async function marcarAsistencia(
  personaId: string,
  obraId: string,
  fecha: string,
  estado: EstadoAsistencia,
  extra?: { horas?: number | null; hora_entrada?: string | null; hora_salida?: string | null; excusa?: string | null; notas?: string | null },
): Promise<MarcarResult> {
  await requireUser();
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase no configurado." };
  if (!personaId || !obraId || !fecha) return { ok: false, error: "Faltan datos." };
  if (!ESTADOS.includes(estado)) return { ok: false, error: "Estado inválido." };

  let horas: number | null = null;
  if (extra?.horas != null && extra.horas !== undefined) {
    const n = Number(extra.horas);
    if (!Number.isFinite(n) || n < 0 || n > 24) return { ok: false, error: "Horas inválidas." };
    horas = n;
  }
  const clean = (v: unknown) => {
    const s = String(v ?? "").trim();
    return s === "" ? null : s;
  };

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("asistencia").upsert(
      {
        persona_id: personaId,
        obra_id: obraId,
        fecha,
        estado,
        horas,
        hora_entrada: clean(extra?.hora_entrada),
        hora_salida: clean(extra?.hora_salida),
        excusa: clean(extra?.excusa),
        notas: clean(extra?.notas),
      },
      { onConflict: "persona_id,obra_id,fecha" },
    );
    if (error) throw error;
    revalidatePath(`/obras/${obraId}`);
    revalidatePath("/personal");
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo marcar la asistencia." };
  }
}

export type AsistenciaConObra = Asistencia & {
  obra: { id: string; nombre: string; hora_entrada_esperada: string | null } | null;
};

/** Historial de asistencia de una persona en un rango (consolidado / nómina). */
export async function listAsistenciaPersona(
  personaId: string,
  desde: string,
  hasta: string,
): Promise<AsistenciaConObra[]> {
  await requireUser();
  if (!isSupabaseConfigured() || !personaId || !desde || !hasta) return [];
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("asistencia")
      .select("*, obra:proyectos(id,nombre,hora_entrada_esperada)")
      .eq("persona_id", personaId)
      .gte("fecha", desde)
      .lte("fecha", hasta)
      .order("fecha", { ascending: false });
    if (error) throw error;
    return (data ?? []) as AsistenciaConObra[];
  } catch {
    return [];
  }
}

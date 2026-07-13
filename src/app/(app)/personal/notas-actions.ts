"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { NotaEmpleado, NotaTipo } from "@/lib/proyectos/types";

const TIPOS: NotaTipo[] = ["positiva", "negativa", "neutral"];

/** Notas/bitácora de una persona (más recientes primero). */
export async function listNotas(personaId: string): Promise<NotaEmpleado[]> {
  await requireUser();
  if (!isSupabaseConfigured() || !personaId) return [];
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("notas_empleado")
      .select("*")
      .eq("persona_id", personaId)
      .order("fecha", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as NotaEmpleado[];
  } catch {
    return [];
  }
}

/** Agrega una nota fechada al empleado. */
export async function addNota(
  personaId: string,
  raw: unknown,
): Promise<{ ok: boolean; error?: string }> {
  await requireUser();
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase no configurado." };
  if (!personaId) return { ok: false, error: "Falta la persona." };

  const d = (raw ?? {}) as Record<string, unknown>;
  const nota = String(d.nota ?? "").trim();
  if (!nota) return { ok: false, error: "La nota no puede estar vacía." };
  if (nota.length > 800) return { ok: false, error: "La nota es demasiado larga." };

  const tipo = String(d.tipo ?? "neutral") as NotaTipo;
  if (!TIPOS.includes(tipo)) return { ok: false, error: "Tipo inválido." };

  const fecha = String(d.fecha ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return { ok: false, error: "Fecha inválida." };

  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("notas_empleado")
      .insert({ persona_id: personaId, nota, tipo, fecha });
    if (error) throw error;
    revalidatePath(`/personal/${personaId}`);
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo guardar la nota." };
  }
}

/** Elimina una nota. */
export async function deleteNota(
  id: string,
  personaId: string,
): Promise<{ ok: boolean; error?: string }> {
  await requireUser();
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase no configurado." };
  if (!id) return { ok: false, error: "Falta el identificador." };
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("notas_empleado").delete().eq("id", id);
    if (error) throw error;
    revalidatePath(`/personal/${personaId}`);
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo eliminar la nota." };
  }
}

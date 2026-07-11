"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/server";

export type AsignacionResult = { ok: true } | { ok: false; error: string };

/** Asigna una persona a una obra (idempotente por el único (persona, obra)). */
export async function asignarPersonaObra(
  personalId: string,
  obraId: string,
  rolEnObra?: string | null,
): Promise<AsignacionResult> {
  await requireUser();
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase no configurado." };
  if (!personalId || !obraId) return { ok: false, error: "Faltan datos." };

  const rol = (rolEnObra ?? "").trim() || null;
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("personal_obra")
      .upsert(
        { personal_id: personalId, obra_id: obraId, rol_en_obra: rol },
        { onConflict: "personal_id,obra_id" },
      );
    if (error) throw error;
    revalidatePath("/personal");
    revalidatePath("/obras");
    revalidatePath(`/obras/${obraId}`);
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo asignar." };
  }
}

/** Quita una asignación persona↔obra. */
export async function quitarAsignacion(
  personalId: string,
  obraId: string,
): Promise<AsignacionResult> {
  await requireUser();
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase no configurado." };
  if (!personalId || !obraId) return { ok: false, error: "Faltan datos." };
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("personal_obra")
      .delete()
      .eq("personal_id", personalId)
      .eq("obra_id", obraId);
    if (error) throw error;
    revalidatePath("/personal");
    revalidatePath("/obras");
    revalidatePath(`/obras/${obraId}`);
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo quitar la asignación." };
  }
}

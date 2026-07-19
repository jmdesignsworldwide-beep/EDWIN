"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { uploadObraFile, signPaths, removeObraFiles } from "@/lib/obras/storage";
import type { FotoObra } from "@/lib/proyectos/types";

const TIPOS_IMG = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
const MAX = 10 * 1024 * 1024;

/** Fotos de la obra (galería) con URL firmada temporal. */
export async function listFotos(obraId: string): Promise<FotoObra[]> {
  await requireUser();
  if (!isSupabaseConfigured() || !obraId) return [];
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("fotos_obra")
      .select("*")
      .eq("obra_id", obraId)
      .order("fecha", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) throw error;
    const fotos = (data ?? []) as FotoObra[];
    const urls = await signPaths(fotos.map((f) => f.path));
    return fotos.map((f) => ({ ...f, url: urls.get(f.path) ?? null }));
  } catch {
    return [];
  }
}

/** Sube una foto a la galería de la obra. */
export async function subirFoto(obraId: string, formData: FormData): Promise<{ ok: boolean; error?: string }> {
  await requireUser();
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase no configurado." };
  if (!obraId) return { ok: false, error: "Falta la obra." };
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "No se recibió la imagen." };
  if (file.size > MAX) return { ok: false, error: "La imagen supera los 10 MB." };
  if (!TIPOS_IMG.includes(file.type)) return { ok: false, error: "Solo imágenes (JPG, PNG, HEIC, WEBP)." };

  const caption = String(formData.get("caption") ?? "").trim() || null;
  const etapaId = String(formData.get("etapa_id") ?? "").trim() || null;

  const up = await uploadObraFile(file, `galeria/${obraId}`);
  if (!up.ok) return up;
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("fotos_obra").insert({ obra_id: obraId, path: up.path, caption, etapa_id: etapaId });
    if (error) throw error;
    revalidatePath(`/obras/${obraId}`);
    return { ok: true };
  } catch {
    await removeObraFiles([up.path]);
    return { ok: false, error: "No se pudo guardar la foto." };
  }
}

export async function deleteFoto(id: string, obraId: string, path: string): Promise<{ ok: boolean; error?: string }> {
  await requireUser();
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase no configurado." };
  if (!id) return { ok: false, error: "Falta el identificador." };
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("fotos_obra").delete().eq("id", id);
    if (error) throw error;
    if (path) await removeObraFiles([path]);
    revalidatePath(`/obras/${obraId}`);
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo eliminar la foto." };
  }
}

"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { uploadObraFile, signPaths, removeObraFiles } from "@/lib/obras/storage";
import type { BitacoraEntrada, FotoObra } from "@/lib/proyectos/types";

const TIPOS_IMG = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
const MAX = 10 * 1024 * 1024;

/** Entradas de bitácora con sus fotos (URLs firmadas). */
export async function listBitacora(obraId: string): Promise<BitacoraEntrada[]> {
  await requireUser();
  if (!isSupabaseConfigured() || !obraId) return [];
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("bitacora_obra")
      .select("*, fotos:fotos_obra(*)")
      .eq("obra_id", obraId)
      .order("fecha", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) throw error;
    const entradas = (data ?? []) as (BitacoraEntrada & { fotos: FotoObra[] })[];
    const allPaths = entradas.flatMap((e) => (e.fotos ?? []).map((f) => f.path));
    const urls = await signPaths(allPaths);
    return entradas.map((e) => ({
      ...e,
      fotos: (e.fotos ?? []).map((f) => ({ ...f, url: urls.get(f.path) ?? null })),
    }));
  } catch {
    return [];
  }
}

/** Crea una entrada de bitácora con fotos opcionales (que también van a la galería). */
export async function addEntrada(obraId: string, formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const user = await requireUser();
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase no configurado." };
  if (!obraId) return { ok: false, error: "Falta la obra." };
  const texto = String(formData.get("texto") ?? "").trim();
  if (!texto) return { ok: false, error: "Escribe qué pasó en la obra." };
  if (texto.length > 4000) return { ok: false, error: "El texto es demasiado largo." };
  const fechaRaw = String(formData.get("fecha") ?? "").trim();
  const fecha = /^\d{4}-\d{2}-\d{2}$/.test(fechaRaw) ? fechaRaw : undefined;

  const files = formData.getAll("fotos").filter((f): f is File => f instanceof File && f.size > 0);
  for (const f of files) {
    if (f.size > MAX) return { ok: false, error: "Una foto supera los 10 MB." };
    if (!TIPOS_IMG.includes(f.type)) return { ok: false, error: "Solo imágenes en las fotos." };
  }

  try {
    const supabase = createAdminClient();
    const { data: entrada, error } = await supabase
      .from("bitacora_obra")
      .insert({ obra_id: obraId, texto, autor: user.nombre, ...(fecha ? { fecha } : {}) })
      .select("id, fecha")
      .single();
    if (error) throw error;
    const bitacoraId = (entrada as { id: string; fecha: string }).id;

    const uploaded: string[] = [];
    for (const f of files) {
      const up = await uploadObraFile(f, `bitacora/${obraId}`);
      if (up.ok) uploaded.push(up.path);
    }
    if (uploaded.length > 0) {
      const { error: eF } = await supabase.from("fotos_obra").insert(
        uploaded.map((path) => ({ obra_id: obraId, path, bitacora_id: bitacoraId, fecha: (entrada as any).fecha })),
      );
      if (eF) await removeObraFiles(uploaded);
    }
    revalidatePath(`/obras/${obraId}`);
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo guardar la entrada." };
  }
}

export async function updateEntrada(id: string, obraId: string, raw: unknown): Promise<{ ok: boolean; error?: string }> {
  await requireUser();
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase no configurado." };
  if (!id) return { ok: false, error: "Falta el identificador." };
  const d = (raw ?? {}) as Record<string, unknown>;
  const texto = String(d.texto ?? "").trim();
  if (!texto) return { ok: false, error: "El texto no puede estar vacío." };
  const fechaRaw = String(d.fecha ?? "").trim();
  const fecha = /^\d{4}-\d{2}-\d{2}$/.test(fechaRaw) ? fechaRaw : undefined;
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("bitacora_obra").update({ texto, ...(fecha ? { fecha } : {}) }).eq("id", id);
    if (error) throw error;
    revalidatePath(`/obras/${obraId}`);
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudieron guardar los cambios." };
  }
}

export async function deleteEntrada(id: string, obraId: string): Promise<{ ok: boolean; error?: string }> {
  await requireUser();
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase no configurado." };
  if (!id) return { ok: false, error: "Falta el identificador." };
  try {
    const supabase = createAdminClient();
    // Rutas de las fotos para borrarlas del storage (las filas caen por cascade).
    const { data: fotos } = await supabase.from("fotos_obra").select("path").eq("bitacora_id", id);
    const { error } = await supabase.from("bitacora_obra").delete().eq("id", id);
    if (error) throw error;
    const paths = (fotos ?? []).map((f: { path: string }) => f.path);
    if (paths.length > 0) await removeObraFiles(paths);
    revalidatePath(`/obras/${obraId}`);
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo eliminar la entrada." };
  }
}

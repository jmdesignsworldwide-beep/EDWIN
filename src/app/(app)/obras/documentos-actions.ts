"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { uploadObraFile, signPaths, removeObraFiles } from "@/lib/obras/storage";
import type { DocumentoObra } from "@/lib/proyectos/types";

const TIPOS_DOC = ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
const MAX = 25 * 1024 * 1024;

export async function listDocumentos(obraId: string): Promise<DocumentoObra[]> {
  await requireUser();
  if (!isSupabaseConfigured() || !obraId) return [];
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("documentos_obra")
      .select("*")
      .eq("obra_id", obraId)
      .order("fecha", { ascending: false });
    if (error) throw error;
    const docs = (data ?? []) as DocumentoObra[];
    const urls = await signPaths(docs.map((d) => d.path));
    return docs.map((d) => ({ ...d, url: urls.get(d.path) ?? null }));
  } catch {
    return [];
  }
}

export async function subirDocumento(obraId: string, formData: FormData): Promise<{ ok: boolean; error?: string }> {
  await requireUser();
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase no configurado." };
  if (!obraId) return { ok: false, error: "Falta la obra." };
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "No se recibió el archivo." };
  if (file.size > MAX) return { ok: false, error: "El archivo supera los 25 MB." };
  if (!TIPOS_DOC.includes(file.type)) return { ok: false, error: "Solo PDF o imágenes." };

  const nombre = String(formData.get("nombre") ?? "").trim() || file.name;
  const tipo = String(formData.get("tipo") ?? "").trim() || "Otro";
  const notas = String(formData.get("notas") ?? "").trim() || null;
  const fechaRaw = String(formData.get("fecha") ?? "").trim();
  const fecha = /^\d{4}-\d{2}-\d{2}$/.test(fechaRaw) ? fechaRaw : undefined;

  const up = await uploadObraFile(file, `documentos/${obraId}`);
  if (!up.ok) return up;
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("documentos_obra").insert({ obra_id: obraId, path: up.path, nombre: nombre.slice(0, 200), tipo: tipo.slice(0, 80), notas, ...(fecha ? { fecha } : {}) });
    if (error) throw error;
    revalidatePath(`/obras/${obraId}`);
    return { ok: true };
  } catch {
    await removeObraFiles([up.path]);
    return { ok: false, error: "No se pudo guardar el documento." };
  }
}

export async function deleteDocumento(id: string, obraId: string, path: string): Promise<{ ok: boolean; error?: string }> {
  await requireUser();
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase no configurado." };
  if (!id) return { ok: false, error: "Falta el identificador." };
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("documentos_obra").delete().eq("id", id);
    if (error) throw error;
    if (path) await removeObraFiles([path]);
    revalidatePath(`/obras/${obraId}`);
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo eliminar el documento." };
  }
}

import "server-only";

import { createAdminClient } from "@/lib/supabase/server";

/**
 * Utilidades de Storage para el expediente de obra. Bucket PRIVADO 'obras': los
 * archivos NUNCA son públicos; se suben y firman solo desde el servidor con
 * service_role. Se sirven por URL firmada temporal.
 */

const BUCKET = "obras";
const SIGNED_TTL = 3600; // 1 hora

function extOf(name: string): string {
  return name.includes(".") ? name.split(".").pop()!.toLowerCase().slice(0, 8) : "bin";
}

/** Sube un archivo al bucket privado bajo un prefijo. Devuelve la ruta. */
export async function uploadObraFile(
  file: File,
  prefix: string,
): Promise<{ ok: true; path: string } | { ok: false; error: string }> {
  try {
    const supabase = createAdminClient();
    const path = `${prefix}/${crypto.randomUUID()}.${extOf(file.name)}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });
    if (error) throw error;
    return { ok: true, path };
  } catch {
    return { ok: false, error: "No se pudo subir el archivo." };
  }
}

/** Firma varias rutas (URLs temporales). Devuelve mapa path → url. */
export async function signPaths(paths: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const clean = paths.filter(Boolean);
  if (clean.length === 0) return map;
  try {
    const supabase = createAdminClient();
    const { data } = await supabase.storage.from(BUCKET).createSignedUrls(clean, SIGNED_TTL);
    for (const item of data ?? []) {
      if (item.path && item.signedUrl) map.set(item.path, item.signedUrl);
    }
  } catch {
    /* degradar sin URLs */
  }
  return map;
}

/** Elimina archivos del bucket (best-effort). */
export async function removeObraFiles(paths: string[]): Promise<void> {
  const clean = paths.filter(Boolean);
  if (clean.length === 0) return;
  try {
    const supabase = createAdminClient();
    await supabase.storage.from(BUCKET).remove(clean);
  } catch {
    /* best-effort */
  }
}

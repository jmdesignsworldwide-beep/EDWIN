"use server";

import { requireUser } from "@/lib/auth";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { CategoriaOpcion } from "@/lib/proyectos/types";

const CATEGORIAS: CategoriaOpcion[] = ["proveedor_categoria", "oficio", "unidad_material", "tipo_obra"];

/** Opciones guardadas por Edwin para una categoría de selector inteligente. */
export async function listOpciones(categoria: CategoriaOpcion): Promise<string[]> {
  await requireUser();
  if (!isSupabaseConfigured() || !CATEGORIAS.includes(categoria)) return [];
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("opciones_selector")
      .select("valor")
      .eq("categoria", categoria)
      .order("valor", { ascending: true });
    if (error) throw error;
    return (data ?? []).map((r: { valor: string }) => r.valor);
  } catch {
    return [];
  }
}

/**
 * Guarda una opción nueva escrita por Edwin (idempotente por unique). Devuelve
 * el valor normalizado para usarlo de inmediato en el registro.
 */
export async function addOpcion(
  categoria: CategoriaOpcion,
  valorRaw: string,
): Promise<{ ok: true; valor: string } | { ok: false; error: string }> {
  await requireUser();
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase no configurado." };
  if (!CATEGORIAS.includes(categoria)) return { ok: false, error: "Categoría inválida." };
  const valor = valorRaw.trim().replace(/\s+/g, " ");
  if (!valor) return { ok: false, error: "El valor está vacío." };
  if (valor.length > 80) return { ok: false, error: "El valor es demasiado largo." };
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("opciones_selector")
      .upsert({ categoria, valor }, { onConflict: "categoria,valor", ignoreDuplicates: true });
    if (error) throw error;
    return { ok: true, valor };
  } catch {
    return { ok: false, error: "No se pudo guardar la opción." };
  }
}

"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import {
  createAdminClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";
import type { MaterialInput } from "@/lib/proyectos/types";

export type MaterialMutationResult = { ok: true } | { ok: false; error: string };

function num(v: unknown): number | null | { error: string } {
  if (v === "" || v == null) return null;
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) return { error: "Cantidad/costo inválido." };
  return n;
}

function parse(raw: unknown): MaterialInput | { error: string } {
  const d = (raw ?? {}) as Record<string, unknown>;

  const nombre = String(d.nombre ?? "").trim();
  if (!nombre) return { error: "El nombre del material es obligatorio." };
  if (nombre.length > 160) return { error: "El nombre es demasiado largo." };

  const comprada = num(d.cantidad_comprada);
  if (comprada && typeof comprada === "object") return comprada;
  const usada = num(d.cantidad_usada);
  if (usada && typeof usada === "object") return usada;
  const costo = num(d.costo_unitario);
  if (costo && typeof costo === "object") return costo;

  const str = (v: unknown) => {
    const s = String(v ?? "").trim();
    return s === "" ? null : s;
  };

  return {
    nombre,
    etapa_id: str(d.etapa_id),
    proveedor_id: str(d.proveedor_id),
    unidad: str(d.unidad),
    cantidad_comprada: comprada as number | null,
    cantidad_usada: usada as number | null,
    costo_unitario: costo as number | null,
    notas: str(d.notas),
  };
}

function revalidate(obraId: string) {
  revalidatePath("/obras");
  revalidatePath(`/obras/${obraId}`);
}

export async function createMaterial(
  obraId: string,
  raw: unknown,
): Promise<MaterialMutationResult> {
  await requireUser();
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase no configurado." };
  if (!obraId) return { ok: false, error: "Falta la obra." };
  const parsed = parse(raw);
  if ("error" in parsed) return { ok: false, error: parsed.error };

  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("materiales")
      .insert({ ...parsed, obra_id: obraId });
    if (error) throw error;
    revalidate(obraId);
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo crear el material." };
  }
}

export async function updateMaterial(
  obraId: string,
  materialId: string,
  raw: unknown,
): Promise<MaterialMutationResult> {
  await requireUser();
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase no configurado." };
  if (!obraId || !materialId) return { ok: false, error: "Falta identificador." };
  const parsed = parse(raw);
  if ("error" in parsed) return { ok: false, error: parsed.error };

  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("materiales")
      .update(parsed)
      .eq("id", materialId)
      .eq("obra_id", obraId);
    if (error) throw error;
    revalidate(obraId);
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo guardar el material." };
  }
}

export async function deleteMaterial(
  obraId: string,
  materialId: string,
): Promise<MaterialMutationResult> {
  await requireUser();
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase no configurado." };
  if (!obraId || !materialId) return { ok: false, error: "Falta identificador." };

  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("materiales")
      .delete()
      .eq("id", materialId)
      .eq("obra_id", obraId);
    if (error) throw error;
    revalidate(obraId);
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo eliminar el material." };
  }
}

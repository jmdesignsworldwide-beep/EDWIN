"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import {
  createAdminClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";
import type { CompraInput } from "@/lib/proyectos/types";

export type CompraMutationResult = { ok: true } | { ok: false; error: string };

function parse(raw: unknown): CompraInput | { error: string } {
  const d = (raw ?? {}) as Record<string, unknown>;

  const fecha = String(d.fecha ?? "").trim();
  if (!fecha) return { error: "La fecha de la compra es obligatoria." };

  let monto: number | null = null;
  if (d.monto !== "" && d.monto != null) {
    const n = Number(d.monto);
    if (!Number.isFinite(n) || n < 0) return { error: "El monto es inválido." };
    monto = n;
  }

  const str = (v: unknown) => {
    const s = String(v ?? "").trim();
    return s === "" ? null : s;
  };

  return {
    fecha,
    obra_id: str(d.obra_id),
    descripcion: str(d.descripcion),
    monto,
    notas: str(d.notas),
  };
}

export async function createCompra(
  proveedorId: string,
  raw: unknown,
): Promise<CompraMutationResult> {
  await requireUser();
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase no configurado." };
  if (!proveedorId) return { ok: false, error: "Falta el proveedor." };
  const parsed = parse(raw);
  if ("error" in parsed) return { ok: false, error: parsed.error };

  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("compras")
      .insert({ ...parsed, proveedor_id: proveedorId });
    if (error) throw error;
    revalidatePath("/proveedores");
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo registrar la compra." };
  }
}

export async function updateCompra(
  proveedorId: string,
  compraId: string,
  raw: unknown,
): Promise<CompraMutationResult> {
  await requireUser();
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase no configurado." };
  if (!proveedorId || !compraId) return { ok: false, error: "Falta identificador." };
  const parsed = parse(raw);
  if ("error" in parsed) return { ok: false, error: parsed.error };

  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("compras")
      .update(parsed)
      .eq("id", compraId)
      .eq("proveedor_id", proveedorId);
    if (error) throw error;
    revalidatePath("/proveedores");
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo guardar la compra." };
  }
}

export async function deleteCompra(
  proveedorId: string,
  compraId: string,
): Promise<CompraMutationResult> {
  await requireUser();
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase no configurado." };
  if (!proveedorId || !compraId) return { ok: false, error: "Falta identificador." };

  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("compras")
      .delete()
      .eq("id", compraId)
      .eq("proveedor_id", proveedorId);
    if (error) throw error;
    revalidatePath("/proveedores");
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo eliminar la compra." };
  }
}

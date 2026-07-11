"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import {
  createAdminClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";
import {
  normalizarCedulaRnc,
  type Proveedor,
  type ProveedorInput,
} from "@/lib/proyectos/types";

const SELECT =
  "*, compras(id,proveedor_id,obra_id,fecha,descripcion,monto,notas,created_at,updated_at)";

export type ProveedoresListResult = {
  configured: boolean;
  proveedores: Proveedor[];
  error?: string;
};

export type ProveedorMutationResult =
  | { ok: true; proveedor: Proveedor }
  | { ok: false; error: string };

function parse(raw: unknown): ProveedorInput | { error: string } {
  const d = (raw ?? {}) as Record<string, unknown>;
  const nombre = String(d.nombre ?? "").trim();
  if (!nombre) return { error: "El nombre / razón social es obligatorio." };
  if (nombre.length > 180) return { error: "El nombre es demasiado largo." };

  const ced = normalizarCedulaRnc(String(d.rnc_cedula ?? ""));
  if (!ced.ok) return { error: ced.error };

  const str = (v: unknown) => {
    const s = String(v ?? "").trim();
    return s === "" ? null : s;
  };

  return {
    nombre,
    telefono: str(d.telefono),
    rnc_cedula: ced.value,
    categoria: str(d.categoria),
    contacto: str(d.contacto),
    notas: str(d.notas),
  };
}

export async function listProveedores(): Promise<ProveedoresListResult> {
  await requireUser();
  if (!isSupabaseConfigured()) return { configured: false, proveedores: [] };

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("proveedores")
      .select(SELECT)
      .order("nombre", { ascending: true })
      .order("fecha", { referencedTable: "compras", ascending: false });
    if (error) throw error;
    const proveedores = (data ?? []).map((p: any) => ({
      ...p,
      compras: p.compras ?? [],
    })) as Proveedor[];
    return { configured: true, proveedores };
  } catch {
    return {
      configured: true,
      proveedores: [],
      error: "No se pudieron cargar los proveedores.",
    };
  }
}

export async function createProveedor(raw: unknown): Promise<ProveedorMutationResult> {
  await requireUser();
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase no configurado." };
  const parsed = parse(raw);
  if ("error" in parsed) return { ok: false, error: parsed.error };

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("proveedores")
      .insert(parsed)
      .select("*")
      .single();
    if (error) throw error;
    revalidatePath("/proveedores");
    revalidatePath("/obras");
    return { ok: true, proveedor: { ...(data as Proveedor), compras: [] } };
  } catch {
    return { ok: false, error: "No se pudo registrar el proveedor." };
  }
}

export async function updateProveedor(
  id: string,
  raw: unknown,
): Promise<ProveedorMutationResult> {
  await requireUser();
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase no configurado." };
  if (!id) return { ok: false, error: "Falta el identificador." };
  const parsed = parse(raw);
  if ("error" in parsed) return { ok: false, error: parsed.error };

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("proveedores")
      .update(parsed)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    revalidatePath("/proveedores");
    return { ok: true, proveedor: { ...(data as Proveedor), compras: [] } };
  } catch {
    return { ok: false, error: "No se pudo guardar el proveedor." };
  }
}

export async function deleteProveedor(id: string): Promise<{ ok: boolean; error?: string }> {
  await requireUser();
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase no configurado." };
  if (!id) return { ok: false, error: "Falta el identificador." };

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("proveedores").delete().eq("id", id);
    if (error) throw error;
    revalidatePath("/proveedores");
    revalidatePath("/obras");
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo eliminar el proveedor." };
  }
}

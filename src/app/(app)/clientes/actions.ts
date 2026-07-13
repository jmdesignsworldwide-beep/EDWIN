"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/server";
import {
  clienteCompleto,
  normalizarDocumento,
  type Cliente,
  type ClienteInput,
  type ClienteTipo,
  type EstadoObra,
} from "@/lib/proyectos/types";

const TIPOS: ClienteTipo[] = ["persona", "empresa"];

/** Cliente con sus obras embebidas (para el directorio y el detalle). */
export type ClienteConObras = Cliente & {
  obras: { id: string; nombre: string; estado: EstadoObra }[];
};

export type ClientesListResult = {
  configured: boolean;
  clientes: ClienteConObras[];
  incompletos: number;
  error?: string;
};

export type ClienteMutationResult =
  | { ok: true; cliente: Cliente }
  | { ok: false; error: string };

const SELECT = "*, obras:proyectos(id,nombre,estado)";

function parse(raw: unknown): (ClienteInput & { datos_completos: boolean }) | { error: string } {
  const d = (raw ?? {}) as Record<string, unknown>;

  const tipo = String(d.tipo ?? "persona") as ClienteTipo;
  if (!TIPOS.includes(tipo)) return { error: "Tipo de cliente inválido." };

  const nombre = String(d.nombre ?? "").trim();
  if (!nombre) {
    return { error: tipo === "empresa" ? "La razón social es obligatoria." : "El nombre es obligatorio." };
  }
  if (nombre.length > 180) return { error: "El nombre es demasiado largo." };

  const doc = normalizarDocumento(String(d.cedula_rnc ?? ""), tipo);
  if (!doc.ok) return { error: doc.error };

  const str = (v: unknown) => {
    const s = String(v ?? "").trim();
    return s === "" ? null : s;
  };

  const input: ClienteInput = {
    nombre,
    tipo,
    telefono: str(d.telefono),
    cedula_rnc: doc.value,
    email: str(d.email),
    direccion: str(d.direccion),
    contacto_nombre: tipo === "empresa" ? str(d.contacto_nombre) : null,
    contacto_telefono: tipo === "empresa" ? str(d.contacto_telefono) : null,
  };

  return { ...input, datos_completos: clienteCompleto(input) };
}

export async function listClientes(): Promise<ClientesListResult> {
  await requireUser();
  if (!isSupabaseConfigured()) return { configured: false, clientes: [], incompletos: 0 };
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("clientes")
      .select(SELECT)
      .order("nombre", { ascending: true });
    if (error) throw error;
    const clientes = (data ?? []).map((c: any) => ({ ...c, obras: c.obras ?? [] })) as ClienteConObras[];
    const incompletos = clientes.filter((c) => !c.datos_completos).length;
    return { configured: true, clientes, incompletos };
  } catch {
    return { configured: true, clientes: [], incompletos: 0, error: "No se pudieron cargar los clientes." };
  }
}

export async function createCliente(raw: unknown): Promise<ClienteMutationResult> {
  await requireUser();
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase no configurado." };
  const parsed = parse(raw);
  if ("error" in parsed) return { ok: false, error: parsed.error };
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.from("clientes").insert(parsed).select("*").single();
    if (error) throw error;
    revalidatePath("/clientes");
    revalidatePath("/obras");
    return { ok: true, cliente: data as Cliente };
  } catch {
    return { ok: false, error: "No se pudo registrar el cliente." };
  }
}

export async function updateCliente(id: string, raw: unknown): Promise<ClienteMutationResult> {
  await requireUser();
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase no configurado." };
  if (!id) return { ok: false, error: "Falta el identificador." };
  const parsed = parse(raw);
  if ("error" in parsed) return { ok: false, error: parsed.error };
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.from("clientes").update(parsed).eq("id", id).select("*").single();
    if (error) throw error;
    revalidatePath("/clientes");
    revalidatePath("/obras");
    return { ok: true, cliente: data as Cliente };
  } catch {
    return { ok: false, error: "No se pudieron guardar los cambios." };
  }
}

export async function deleteCliente(id: string): Promise<{ ok: boolean; error?: string }> {
  await requireUser();
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase no configurado." };
  if (!id) return { ok: false, error: "Falta el identificador." };
  try {
    const supabase = createAdminClient();
    // No borrar un cliente que tiene obras: es un registro con historial.
    const { count } = await supabase
      .from("proyectos")
      .select("id", { count: "exact", head: true })
      .eq("cliente_id", id);
    if ((count ?? 0) > 0) {
      return { ok: false, error: "Este cliente tiene obras asignadas. Reasígnalas antes de eliminarlo." };
    }
    const { error } = await supabase.from("clientes").delete().eq("id", id);
    if (error) throw error;
    revalidatePath("/clientes");
    revalidatePath("/obras");
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo eliminar el cliente." };
  }
}

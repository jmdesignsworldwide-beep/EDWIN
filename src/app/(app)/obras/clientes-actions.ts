"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import {
  createAdminClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";
import {
  clienteCompleto,
  normalizarDocumento,
  type Cliente,
  type ClienteInput,
  type ClienteTipo,
} from "@/lib/proyectos/types";

export type ClientesListResult = {
  configured: boolean;
  clientes: Cliente[];
  error?: string;
};

export type ClienteMutationResult =
  | { ok: true; cliente: Cliente }
  | { ok: false; error: string };

/** Lista los clientes registrados (para el selector del formulario de obra). */
export async function listClientes(): Promise<ClientesListResult> {
  await requireUser();
  if (!isSupabaseConfigured()) return { configured: false, clientes: [] };

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("clientes")
      .select("*")
      .order("nombre", { ascending: true });
    if (error) throw error;
    return { configured: true, clientes: (data ?? []) as Cliente[] };
  } catch {
    return {
      configured: true,
      clientes: [],
      error: "No se pudieron cargar los clientes.",
    };
  }
}

/**
 * Registra un cliente nuevo (quick-add desde el formulario de obra). Pide lo
 * mínimo (nombre + tipo + teléfono) y lo marca como `datos_completos = false`
 * para empujar a Edwin a completar su perfil después. Valida el documento
 * si se proporciona.
 */
export async function createCliente(
  raw: Partial<ClienteInput>,
): Promise<ClienteMutationResult> {
  await requireUser();
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase aún no está configurado." };
  }

  const tipo: ClienteTipo = raw?.tipo === "empresa" ? "empresa" : "persona";

  const nombre = String(raw?.nombre ?? "").trim();
  if (!nombre) {
    return { ok: false, error: tipo === "empresa" ? "La razón social es obligatoria." : "El nombre es obligatorio." };
  }
  if (nombre.length > 180) return { ok: false, error: "El nombre es demasiado largo." };

  const telefono = String(raw?.telefono ?? "").trim() || null;

  const doc = normalizarDocumento(String(raw?.cedula_rnc ?? ""), tipo);
  if (!doc.ok) return { ok: false, error: doc.error };

  const payload = {
    nombre,
    tipo,
    telefono,
    cedula_rnc: doc.value,
  };
  const datos_completos = clienteCompleto({ ...payload, contacto_nombre: null });

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("clientes")
      .insert({ ...payload, datos_completos })
      .select("*")
      .single();
    if (error) throw error;
    revalidatePath("/obras");
    revalidatePath("/clientes");
    return { ok: true, cliente: data as Cliente };
  } catch {
    return { ok: false, error: "No se pudo registrar el cliente." };
  }
}

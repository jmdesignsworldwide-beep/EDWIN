"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import {
  createAdminClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";
import {
  normalizarCedulaRnc,
  type Cliente,
  type ClienteInput,
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
  requireSession();
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

/** Registra un cliente nuevo (quick-add). Valida cédula/RNC dominicano. */
export async function createCliente(
  raw: ClienteInput,
): Promise<ClienteMutationResult> {
  requireSession();
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase aún no está configurado." };
  }

  const nombre = String(raw?.nombre ?? "").trim();
  if (!nombre) return { ok: false, error: "El nombre del cliente es obligatorio." };
  if (nombre.length > 160) return { ok: false, error: "El nombre es demasiado largo." };

  const telefono = String(raw?.telefono ?? "").trim() || null;

  const ced = normalizarCedulaRnc(String(raw?.cedula_rnc ?? ""));
  if (!ced.ok) return { ok: false, error: ced.error };

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("clientes")
      .insert({ nombre, telefono, cedula_rnc: ced.value })
      .select("*")
      .single();
    if (error) throw error;
    revalidatePath("/obras");
    return { ok: true, cliente: data as Cliente };
  } catch {
    return { ok: false, error: "No se pudo registrar el cliente." };
  }
}

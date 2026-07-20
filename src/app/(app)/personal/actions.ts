"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { registrarAuditoria } from "@/lib/auditoria";
import {
  normalizarCedulaRnc,
  type JornalTipo,
  type Persona,
  type PersonaInput,
} from "@/lib/proyectos/types";

const TIPOS: JornalTipo[] = ["dia", "semana", "hora"];

const SELECT =
  "*, obras:personal_obra(id,obra_id,rol_en_obra,obra:proyectos(id,nombre,estado))";

export type PersonalListResult = {
  configured: boolean;
  personal: Persona[];
  error?: string;
};

export type PersonaMutationResult =
  | { ok: true; persona: Persona }
  | { ok: false; error: string };

function parse(raw: unknown): PersonaInput | { error: string } {
  const d = (raw ?? {}) as Record<string, unknown>;
  const nombre = String(d.nombre ?? "").trim();
  if (!nombre) return { error: "El nombre es obligatorio." };
  if (nombre.length > 180) return { error: "El nombre es demasiado largo." };

  const jornal_tipo = String(d.jornal_tipo ?? "dia") as JornalTipo;
  if (!TIPOS.includes(jornal_tipo)) return { error: "Tipo de jornal inválido." };

  let jornal: number | null = null;
  if (d.jornal !== "" && d.jornal != null) {
    const n = Number(d.jornal);
    if (!Number.isFinite(n) || n < 0) return { error: "El jornal es inválido." };
    jornal = n;
  }

  let cedula: string | null = null;
  if (String(d.cedula ?? "").trim() !== "") {
    const c = normalizarCedulaRnc(String(d.cedula));
    if (!c.ok) return { error: c.error };
    cedula = c.value;
  }

  const str = (v: unknown) => {
    const s = String(v ?? "").trim();
    return s === "" ? null : s;
  };

  return {
    nombre,
    oficio: str(d.oficio),
    telefono: str(d.telefono),
    cedula,
    jornal,
    jornal_tipo,
    activo: d.activo === false ? false : true,
    notas: str(d.notas),
  };
}

export async function listPersonal(): Promise<PersonalListResult> {
  await requireUser();
  if (!isSupabaseConfigured()) return { configured: false, personal: [] };
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("personal")
      .select(SELECT)
      .order("nombre", { ascending: true });
    if (error) throw error;
    const personal = (data ?? []).map((p: any) => ({ ...p, obras: p.obras ?? [] })) as Persona[];
    return { configured: true, personal };
  } catch {
    return { configured: true, personal: [], error: "No se pudo cargar el personal." };
  }
}

/** Una persona por id (con sus asignaciones a obras) para su expediente. */
export async function getPersona(id: string): Promise<Persona | null> {
  await requireUser();
  if (!isSupabaseConfigured() || !id) return null;
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("personal")
      .select(SELECT)
      .eq("id", id)
      .single();
    if (error || !data) return null;
    return { ...(data as any), obras: (data as any).obras ?? [] } as Persona;
  } catch {
    return null;
  }
}

export async function createPersona(raw: unknown): Promise<PersonaMutationResult> {
  await requireUser();
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase no configurado." };
  const parsed = parse(raw);
  if ("error" in parsed) return { ok: false, error: parsed.error };
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.from("personal").insert(parsed).select("*").single();
    if (error) throw error;
    await registrarAuditoria("crear", "personal", (data as Persona)?.id ?? null, `Personal: ${parsed.nombre}`);
    revalidatePath("/personal");
    return { ok: true, persona: { ...(data as Persona), obras: [] } };
  } catch {
    return { ok: false, error: "No se pudo registrar a la persona." };
  }
}

export async function updatePersona(id: string, raw: unknown): Promise<PersonaMutationResult> {
  await requireUser();
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase no configurado." };
  if (!id) return { ok: false, error: "Falta el identificador." };
  const parsed = parse(raw);
  if ("error" in parsed) return { ok: false, error: parsed.error };
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.from("personal").update(parsed).eq("id", id).select("*").single();
    if (error) throw error;
    await registrarAuditoria("editar", "personal", id, `Personal: ${parsed.nombre}`);
    revalidatePath("/personal");
    revalidatePath("/obras");
    return { ok: true, persona: { ...(data as Persona), obras: [] } };
  } catch {
    return { ok: false, error: "No se pudieron guardar los cambios." };
  }
}

export async function deletePersona(id: string): Promise<{ ok: boolean; error?: string }> {
  await requireUser();
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase no configurado." };
  if (!id) return { ok: false, error: "Falta el identificador." };
  try {
    const supabase = createAdminClient();
    const { data: prev } = await supabase.from("personal").select("nombre").eq("id", id).single();
    const { error } = await supabase.from("personal").delete().eq("id", id);
    if (error) throw error;
    await registrarAuditoria("eliminar", "personal", id, `Personal: ${(prev as any)?.nombre ?? id}`);
    revalidatePath("/personal");
    revalidatePath("/obras");
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo eliminar a la persona." };
  }
}

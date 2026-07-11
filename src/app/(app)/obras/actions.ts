"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import {
  createAdminClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";
import type {
  EstadoObra,
  Proyecto,
  ProyectoInput,
} from "@/lib/proyectos/types";

const ESTADOS_VALIDOS: EstadoObra[] = [
  "planificacion",
  "en_curso",
  "pausada",
  "terminada",
];

export type ListResult = {
  configured: boolean;
  proyectos: Proyecto[];
  error?: string;
};

export type MutationResult =
  | { ok: true; proyecto?: Proyecto }
  | { ok: false; error: string };

/** Normaliza y valida la entrada del formulario (validación de servidor). */
function parseInput(raw: unknown): ProyectoInput | { error: string } {
  const d = (raw ?? {}) as Record<string, unknown>;

  const nombre = String(d.nombre ?? "").trim();
  if (!nombre) return { error: "El nombre de la obra es obligatorio." };
  if (nombre.length > 160) return { error: "El nombre es demasiado largo." };

  const estado = String(d.estado ?? "planificacion") as EstadoObra;
  if (!ESTADOS_VALIDOS.includes(estado)) {
    return { error: "Estado inválido." };
  }

  let avance = Number(d.avance ?? 0);
  if (!Number.isFinite(avance)) avance = 0;
  avance = Math.max(0, Math.min(100, Math.round(avance)));

  let presupuesto: number | null = null;
  if (d.presupuesto !== "" && d.presupuesto != null) {
    const p = Number(d.presupuesto);
    if (!Number.isFinite(p) || p < 0) {
      return { error: "El presupuesto debe ser un número válido." };
    }
    presupuesto = p;
  }

  const str = (v: unknown) => {
    const s = String(v ?? "").trim();
    return s === "" ? null : s;
  };

  return {
    nombre,
    ubicacion: str(d.ubicacion),
    cliente: str(d.cliente),
    estado,
    fecha_inicio: str(d.fecha_inicio),
    fecha_fin_estimada: str(d.fecha_fin_estimada),
    avance,
    presupuesto,
    notas: str(d.notas),
  };
}

/** Lista las obras. Degrada con elegancia si falta configurar Supabase. */
export async function listProyectos(): Promise<ListResult> {
  requireSession();

  if (!isSupabaseConfigured()) {
    return { configured: false, proyectos: [] };
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("proyectos")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { configured: true, proyectos: (data ?? []) as Proyecto[] };
  } catch (err) {
    return {
      configured: true,
      proyectos: [],
      error:
        "No se pudieron cargar las obras. Verifica la conexión con Supabase.",
    };
  }
}

export async function createProyecto(raw: unknown): Promise<MutationResult> {
  requireSession();
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase aún no está configurado." };
  }

  const parsed = parseInput(raw);
  if ("error" in parsed) return { ok: false, error: parsed.error };

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("proyectos")
      .insert(parsed)
      .select("*")
      .single();

    if (error) throw error;
    revalidatePath("/obras");
    revalidatePath("/dashboard");
    return { ok: true, proyecto: data as Proyecto };
  } catch {
    return { ok: false, error: "No se pudo crear la obra." };
  }
}

export async function updateProyecto(
  id: string,
  raw: unknown,
): Promise<MutationResult> {
  requireSession();
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase aún no está configurado." };
  }
  if (!id) return { ok: false, error: "Falta el identificador de la obra." };

  const parsed = parseInput(raw);
  if ("error" in parsed) return { ok: false, error: parsed.error };

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("proyectos")
      .update(parsed)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;
    revalidatePath("/obras");
    revalidatePath("/dashboard");
    return { ok: true, proyecto: data as Proyecto };
  } catch {
    return { ok: false, error: "No se pudo guardar los cambios." };
  }
}

export async function deleteProyecto(id: string): Promise<MutationResult> {
  requireSession();
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase aún no está configurado." };
  }
  if (!id) return { ok: false, error: "Falta el identificador de la obra." };

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("proyectos").delete().eq("id", id);
    if (error) throw error;
    revalidatePath("/obras");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo eliminar la obra." };
  }
}

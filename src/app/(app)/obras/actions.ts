"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import {
  createAdminClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";
import {
  calcularAvance,
  type EstadoObra,
  type EtapaDraft,
  type Proyecto,
  type ProyectoInput,
} from "@/lib/proyectos/types";

const ESTADOS_VALIDOS: EstadoObra[] = [
  "planificacion",
  "en_curso",
  "pausada",
  "terminada",
];

// Select con cliente y etapas embebidos; etapas ordenadas por `orden`.
const SELECT =
  "*, cliente_rel:clientes(id,nombre,telefono,cedula_rnc), etapas(id,obra_id,nombre,completada,orden,fecha_inicio,fecha_fin,porcentaje)";

export type ListResult = {
  configured: boolean;
  proyectos: Proyecto[];
  error?: string;
};

export type MutationResult =
  | { ok: true; proyecto?: Proyecto }
  | { ok: false; error: string };

function parseInput(raw: unknown): ProyectoInput | { error: string } {
  const d = (raw ?? {}) as Record<string, unknown>;

  const nombre = String(d.nombre ?? "").trim();
  if (!nombre) return { error: "El nombre de la obra es obligatorio." };
  if (nombre.length > 160) return { error: "El nombre es demasiado largo." };

  const estado = String(d.estado ?? "planificacion") as EstadoObra;
  if (!ESTADOS_VALIDOS.includes(estado)) return { error: "Estado inválido." };

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
    cliente_id: str(d.cliente_id),
    estado,
    fecha_inicio: str(d.fecha_inicio),
    fecha_fin_estimada: str(d.fecha_fin_estimada),
    presupuesto,
    notas: str(d.notas),
  };
}

/** Normaliza las etapas del formulario (descarta nombres vacíos, fija orden). */
function parseEtapas(raw: unknown): EtapaDraft[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((e, i) => {
      const d = (e ?? {}) as Record<string, unknown>;
      const nombre = String(d.nombre ?? "").trim();
      return {
        id: typeof d.id === "string" ? d.id : undefined,
        nombre,
        completada: Boolean(d.completada),
        orden: Number.isFinite(Number(d.orden)) ? Number(d.orden) : i,
      };
    })
    .filter((e) => e.nombre !== "")
    .map((e, i) => ({ ...e, orden: i }));
}

export async function listProyectos(): Promise<ListResult> {
  requireSession();
  if (!isSupabaseConfigured()) return { configured: false, proyectos: [] };

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("proyectos")
      .select(SELECT)
      .order("created_at", { ascending: false })
      .order("orden", { referencedTable: "etapas", ascending: true });
    if (error) throw error;

    // Avance derivado de las etapas (siempre consistente).
    const proyectos = (data ?? []).map((p: any) => ({
      ...p,
      etapas: p.etapas ?? [],
      avance: calcularAvance(p.etapas ?? []),
    })) as Proyecto[];

    return { configured: true, proyectos };
  } catch {
    return {
      configured: true,
      proyectos: [],
      error:
        "No se pudieron cargar las obras. Verifica la conexión con Supabase.",
    };
  }
}

export async function createProyecto(
  raw: unknown,
  etapasRaw: unknown,
): Promise<MutationResult> {
  requireSession();
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase aún no está configurado." };
  }

  const parsed = parseInput(raw);
  if ("error" in parsed) return { ok: false, error: parsed.error };
  const etapas = parseEtapas(etapasRaw);

  try {
    const supabase = createAdminClient();
    const { data: obra, error } = await supabase
      .from("proyectos")
      .insert({ ...parsed, avance: calcularAvance(etapas) })
      .select("id")
      .single();
    if (error) throw error;

    if (etapas.length) {
      const rows = etapas.map((e, i) => ({
        obra_id: obra.id,
        nombre: e.nombre,
        completada: e.completada,
        orden: i,
      }));
      const { error: e2 } = await supabase.from("etapas").insert(rows);
      if (e2) throw e2;
    }

    revalidatePath("/obras");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo crear la obra." };
  }
}

export async function updateProyecto(
  id: string,
  raw: unknown,
  etapasRaw: unknown,
): Promise<MutationResult> {
  requireSession();
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase aún no está configurado." };
  }
  if (!id) return { ok: false, error: "Falta el identificador de la obra." };

  const parsed = parseInput(raw);
  if ("error" in parsed) return { ok: false, error: parsed.error };
  const etapas = parseEtapas(etapasRaw);

  try {
    const supabase = createAdminClient();

    const { error } = await supabase
      .from("proyectos")
      .update({ ...parsed, avance: calcularAvance(etapas) })
      .eq("id", id);
    if (error) throw error;

    // Reconciliar etapas preservando ids (base para el Gantt futuro).
    const { data: existing } = await supabase
      .from("etapas")
      .select("id")
      .eq("obra_id", id);
    const existingIds = new Set((existing ?? []).map((e: any) => e.id));
    const incomingIds = new Set(
      etapas.filter((e) => e.id).map((e) => e.id as string),
    );

    const toDelete = [...existingIds].filter((x) => !incomingIds.has(x));
    if (toDelete.length) {
      await supabase.from("etapas").delete().in("id", toDelete);
    }

    const toInsert = etapas
      .filter((e) => !e.id)
      .map((e, i) => ({
        obra_id: id,
        nombre: e.nombre,
        completada: e.completada,
        orden: e.orden,
      }));
    if (toInsert.length) await supabase.from("etapas").insert(toInsert);

    for (const e of etapas.filter((e) => e.id)) {
      await supabase
        .from("etapas")
        .update({ nombre: e.nombre, completada: e.completada, orden: e.orden })
        .eq("id", e.id!);
    }

    revalidatePath("/obras");
    revalidatePath("/dashboard");
    return { ok: true };
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

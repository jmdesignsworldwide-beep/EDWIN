"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import {
  createAdminClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";
import {
  calcularAvance,
  type EstadoObra,
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
  "*, cliente_rel:clientes(id,nombre,telefono,cedula_rnc), etapas(id,obra_id,nombre,estado,completada,orden,fecha_inicio,fecha_fin,porcentaje,notas), materiales(id,obra_id,etapa_id,proveedor_id,proveedor_rel:proveedores(id,nombre),nombre,unidad,cantidad_comprada,cantidad_usada,costo_unitario,notas,created_at,updated_at), equipo:personal_obra(id,rol_en_obra,persona:personal(id,nombre,oficio,telefono,activo))";

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

  // El estado ya no se elige en el alta; una obra nueva nace activa (en curso).
  const estado = String(d.estado ?? "en_curso") as EstadoObra;
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

  // Hora esperada de entrada (HH:MM). Null si vacía o inválida.
  let horaEsperada: string | null = null;
  const rawHora = str(d.hora_entrada_esperada);
  if (rawHora && /^\d{1,2}:\d{2}$/.test(rawHora)) {
    const [h, m] = rawHora.split(":").map(Number);
    if (h >= 0 && h < 24 && m >= 0 && m < 60) {
      horaEsperada = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    }
  }

  return {
    nombre,
    ubicacion: str(d.ubicacion),
    cliente_id: str(d.cliente_id),
    estado,
    fecha_inicio: str(d.fecha_inicio),
    fecha_fin_estimada: str(d.fecha_fin_estimada),
    presupuesto,
    hora_entrada_esperada: horaEsperada,
    notas: str(d.notas),
  };
}

export async function listProyectos(): Promise<ListResult> {
  await requireUser();
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

/** Obtiene una obra por id (con cliente y etapas) para la página de cronograma. */
export async function getProyecto(id: string): Promise<Proyecto | null> {
  await requireUser();
  if (!isSupabaseConfigured() || !id) return null;
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("proyectos")
      .select(SELECT)
      .eq("id", id)
      .order("orden", { referencedTable: "etapas", ascending: true })
      .single();
    if (error || !data) return null;
    const p = data as any;
    return { ...p, etapas: p.etapas ?? [], avance: calcularAvance(p.etapas ?? []) } as Proyecto;
  } catch {
    return null;
  }
}

/** Resumen liviano de obras (id + nombre) para selectores. */
export async function listObrasResumen(): Promise<{ id: string; nombre: string }[]> {
  await requireUser();
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("proyectos")
      .select("id,nombre")
      .order("nombre", { ascending: true });
    if (error) throw error;
    return (data ?? []) as { id: string; nombre: string }[];
  } catch {
    return [];
  }
}

export async function createProyecto(raw: unknown): Promise<MutationResult> {
  await requireUser();
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase aún no está configurado." };
  }
  const parsed = parseInput(raw);
  if ("error" in parsed) return { ok: false, error: parsed.error };

  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("proyectos")
      .insert({ ...parsed, avance: 0 });
    if (error) throw error;
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
): Promise<MutationResult> {
  await requireUser();
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase aún no está configurado." };
  }
  if (!id) return { ok: false, error: "Falta el identificador de la obra." };

  const parsed = parseInput(raw);
  if ("error" in parsed) return { ok: false, error: parsed.error };

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("proyectos").update(parsed).eq("id", id);
    if (error) throw error;
    revalidatePath("/obras");
    revalidatePath(`/obras/${id}`);
    revalidatePath("/dashboard");
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo guardar los cambios." };
  }
}

/**
 * Cambia el estado de una obra (seguimiento). Se usa para marcar Terminada o
 * reactivarla — acción clara y reversible, sin pasar por el formulario.
 */
export async function setEstadoObra(
  id: string,
  estado: EstadoObra,
): Promise<MutationResult> {
  await requireUser();
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase aún no está configurado." };
  if (!id) return { ok: false, error: "Falta el identificador de la obra." };
  if (!ESTADOS_VALIDOS.includes(estado)) return { ok: false, error: "Estado inválido." };
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("proyectos").update({ estado }).eq("id", id);
    if (error) throw error;
    revalidatePath("/obras");
    revalidatePath(`/obras/${id}`);
    revalidatePath("/dashboard");
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo actualizar el estado." };
  }
}

export async function deleteProyecto(id: string): Promise<MutationResult> {
  await requireUser();
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

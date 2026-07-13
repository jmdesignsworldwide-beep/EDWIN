"use server";

import { revalidatePath } from "next/cache";
import { requireUser, requireAdmin } from "@/lib/auth";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/server";
import {
  jornalDiario,
  round2,
  type ConceptoLinea,
  type EstadoAsistencia,
  type JornalTipo,
  type MetodoPago,
  type Nomina,
  type NominaLinea,
  type PreviewLinea,
} from "@/lib/proyectos/types";
import { formatMoney } from "@/lib/utils";

/**
 * ⚠️ SEGURIDAD (es dinero): TODO el cálculo de montos ocurre AQUÍ, en el
 * servidor. El cliente puede proponer extras y descuentos, pero NUNCA fija los
 * días, el jornal ni la base — eso se recalcula leyendo asistencia y personal.
 */

const METODOS: MetodoPago[] = ["efectivo", "transferencia", "otro"];

/** Peso de cada estado en días trabajados. */
function pesoDia(estado: EstadoAsistencia): number {
  return estado === "presente" ? 1 : estado === "medio" ? 0.5 : 0;
}

function validRange(desde: string, hasta: string): boolean {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(desde) &&
    /^\d{4}-\d{2}-\d{2}$/.test(hasta) &&
    hasta >= desde
  );
}

type BaseCalc = {
  persona_id: string;
  persona_nombre: string;
  oficio: string | null;
  dias: number;
  jornal: number;
  jornal_tipo: JornalTipo;
  jornal_diario: number;
  base: number;
};

/**
 * Núcleo compartido: lee asistencia + personal en el rango y calcula la BASE de
 * cada persona con días trabajados > 0. Fuente única de verdad para preview y
 * para el guardado (el guardado no confía en nada que venga del cliente).
 */
async function calcularBases(
  desde: string,
  hasta: string,
): Promise<Map<string, BaseCalc>> {
  const supabase = createAdminClient();

  const { data: asis, error: e1 } = await supabase
    .from("asistencia")
    .select("persona_id, estado")
    .gte("fecha", desde)
    .lte("fecha", hasta);
  if (e1) throw e1;

  // Días trabajados por persona (presente=1, medio=0.5).
  const diasPorPersona = new Map<string, number>();
  for (const a of (asis ?? []) as { persona_id: string; estado: EstadoAsistencia }[]) {
    diasPorPersona.set(
      a.persona_id,
      round2((diasPorPersona.get(a.persona_id) ?? 0) + pesoDia(a.estado)),
    );
  }

  const ids = [...diasPorPersona.keys()].filter((id) => (diasPorPersona.get(id) ?? 0) > 0);
  if (ids.length === 0) return new Map();

  const { data: personal, error: e2 } = await supabase
    .from("personal")
    .select("id, nombre, oficio, jornal, jornal_tipo")
    .in("id", ids);
  if (e2) throw e2;

  const bases = new Map<string, BaseCalc>();
  for (const p of (personal ?? []) as {
    id: string;
    nombre: string;
    oficio: string | null;
    jornal: number | null;
    jornal_tipo: JornalTipo;
  }[]) {
    const dias = round2(diasPorPersona.get(p.id) ?? 0);
    const jornal = p.jornal ?? 0;
    const jd = jornalDiario(jornal, p.jornal_tipo);
    bases.set(p.id, {
      persona_id: p.id,
      persona_nombre: p.nombre,
      oficio: p.oficio,
      dias,
      jornal,
      jornal_tipo: p.jornal_tipo,
      jornal_diario: jd,
      base: round2(dias * jd),
    });
  }
  return bases;
}

/**
 * Vista previa del cálculo para un rango: una línea por persona con asistencia,
 * con la base ya calculada y el supuesto explícito. Edwin ajusta encima.
 */
export async function calcularPreview(
  desde: string,
  hasta: string,
): Promise<{ ok: true; lineas: PreviewLinea[] } | { ok: false; error: string }> {
  await requireUser();
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase no configurado." };
  if (!validRange(desde, hasta)) return { ok: false, error: "Rango de fechas inválido." };
  try {
    const bases = await calcularBases(desde, hasta);
    const lineas: PreviewLinea[] = [...bases.values()]
      .map((b) => ({
        persona_id: b.persona_id,
        persona_nombre: b.persona_nombre,
        oficio: b.oficio,
        dias: b.dias,
        jornal: b.jornal,
        jornal_tipo: b.jornal_tipo,
        jornal_diario: b.jornal_diario,
        base: b.base,
        supuesto: `${b.dias.toLocaleString("es-DO", { maximumFractionDigits: 2 })} días × ${formatMoney(
          b.jornal_diario,
        )}/día = ${formatMoney(b.base)}`,
      }))
      .sort((a, b) => a.persona_nombre.localeCompare(b.persona_nombre));
    return { ok: true, lineas };
  } catch {
    return { ok: false, error: "No se pudo calcular la nómina." };
  }
}

/** Extras/descuentos que propone el cliente para una persona. */
type AjustePayload = {
  persona_id: string;
  extras?: { concepto: string; monto: number | string }[];
  descuentos?: { concepto: string; monto: number | string }[];
};

type GuardarPayload = {
  desde: string;
  hasta: string;
  notas?: string | null;
  ajustes?: AjustePayload[];
};

/** Sanea una lista de conceptos: monto finito ≥ 0, concepto no vacío. */
function limpiarConceptos(
  lista: { concepto: string; monto: number | string }[] | undefined,
  tipo: "extra" | "descuento",
): { ok: true; conceptos: ConceptoLinea[]; total: number } | { ok: false; error: string } {
  const conceptos: ConceptoLinea[] = [];
  let total = 0;
  for (const c of lista ?? []) {
    const monto = Number(c.monto);
    if (!Number.isFinite(monto) || monto < 0) {
      return { ok: false, error: "Hay un monto inválido en extras o descuentos." };
    }
    if (monto === 0) continue; // se ignoran filas en cero
    const concepto = String(c.concepto ?? "").trim() || (tipo === "extra" ? "Extra" : "Descuento");
    if (concepto.length > 120) return { ok: false, error: "Un concepto es demasiado largo." };
    const m = round2(monto);
    conceptos.push({ tipo, concepto, monto: m });
    total = round2(total + m);
  }
  return { ok: true, conceptos, total };
}

/**
 * Cierra (guarda) una nómina. RE-CALCULA la base en el servidor a partir de la
 * asistencia — no confía en la base del cliente. Aplica los extras/descuentos
 * validados y persiste el desglose congelado por persona.
 */
export async function guardarNomina(
  payload: GuardarPayload,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  await requireUser();
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase no configurado." };

  const { desde, hasta } = payload ?? {};
  if (!validRange(desde, hasta)) return { ok: false, error: "Rango de fechas inválido." };

  const notas = String(payload.notas ?? "").trim() || null;
  const ajustesPorPersona = new Map<string, AjustePayload>();
  for (const a of payload.ajustes ?? []) {
    if (a?.persona_id) ajustesPorPersona.set(a.persona_id, a);
  }

  try {
    const bases = await calcularBases(desde, hasta);
    if (bases.size === 0) {
      return { ok: false, error: "No hay asistencia en ese rango para calcular." };
    }

    const lineas: Omit<NominaLinea, "id" | "nomina_id" | "created_at">[] = [];
    let total = 0;
    for (const b of bases.values()) {
      const aj = ajustesPorPersona.get(b.persona_id);
      const ext = limpiarConceptos(aj?.extras, "extra");
      if (!ext.ok) return ext;
      const des = limpiarConceptos(aj?.descuentos, "descuento");
      if (!des.ok) return des;

      const neto = round2(b.base + ext.total - des.total);
      total = round2(total + neto);
      lineas.push({
        persona_id: b.persona_id,
        persona_nombre: b.persona_nombre,
        dias: b.dias,
        jornal: b.jornal,
        jornal_tipo: b.jornal_tipo,
        jornal_diario: b.jornal_diario,
        base: b.base,
        extras: ext.total,
        descuentos: des.total,
        neto,
        conceptos: [...ext.conceptos, ...des.conceptos],
      });
    }

    if (total < 0) {
      return { ok: false, error: "El total no puede ser negativo. Revisa los descuentos." };
    }

    const supabase = createAdminClient();
    const { data: nomina, error: eNom } = await supabase
      .from("nominas")
      .insert({ desde, hasta, total, notas, estado: "pendiente" })
      .select("id")
      .single();
    if (eNom) throw eNom;

    const nominaId = (nomina as { id: string }).id;
    const { error: eLin } = await supabase.from("nomina_lineas").insert(
      lineas.map((l) => ({ ...l, nomina_id: nominaId })),
    );
    if (eLin) {
      // Limpieza best-effort si fallan las líneas: la nómina no debe quedar vacía.
      await supabase.from("nominas").delete().eq("id", nominaId);
      throw eLin;
    }

    revalidatePath("/nomina");
    return { ok: true, id: nominaId };
  } catch {
    return { ok: false, error: "No se pudo guardar la nómina." };
  }
}

/** Historial de nóminas (más recientes primero). */
export async function listNominas(): Promise<Nomina[]> {
  await requireUser();
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("nominas")
      .select("*, nomina_lineas(id)")
      .order("fecha_cierre", { ascending: false });
    if (error) throw error;
    return ((data ?? []) as (Nomina & { nomina_lineas: { id: string }[] })[]).map((n) => ({
      ...n,
      personas: n.nomina_lineas?.length ?? 0,
    }));
  } catch {
    return [];
  }
}

/** Detalle de una nómina con su desglose por persona. */
export async function getNomina(id: string): Promise<Nomina | null> {
  await requireUser();
  if (!isSupabaseConfigured() || !id) return null;
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("nominas")
      .select("*, lineas:nomina_lineas(*)")
      .eq("id", id)
      .single();
    if (error) throw error;
    const n = data as Nomina & { lineas: NominaLinea[] };
    n.lineas = (n.lineas ?? []).sort((a, b) =>
      a.persona_nombre.localeCompare(b.persona_nombre),
    );
    return n;
  } catch {
    return null;
  }
}

/** Marca una nómina como pagada (solo etiqueta contable: fecha + método). */
export async function marcarPagada(
  id: string,
  fecha: string,
  metodo: MetodoPago,
): Promise<{ ok: boolean; error?: string }> {
  await requireUser();
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase no configurado." };
  if (!id) return { ok: false, error: "Falta el identificador." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return { ok: false, error: "Fecha de pago inválida." };
  if (!METODOS.includes(metodo)) return { ok: false, error: "Método de pago inválido." };
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("nominas")
      .update({ estado: "pagada", fecha_pago: fecha, metodo_pago: metodo })
      .eq("id", id)
      .eq("estado", "pendiente");
    if (error) throw error;
    revalidatePath("/nomina");
    revalidatePath(`/nomina/${id}`);
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo marcar como pagada." };
  }
}

/** Anula una nómina (registro contable: se anula, no se borra). */
export async function anularNomina(id: string): Promise<{ ok: boolean; error?: string }> {
  await requireUser();
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase no configurado." };
  if (!id) return { ok: false, error: "Falta el identificador." };
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("nominas")
      .update({ estado: "anulada", fecha_pago: null, metodo_pago: null })
      .eq("id", id);
    if (error) throw error;
    revalidatePath("/nomina");
    revalidatePath(`/nomina/${id}`);
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo anular la nómina." };
  }
}

/** Elimina una nómina definitivamente (solo admin, con confirmación en la UI). */
export async function deleteNomina(id: string): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase no configurado." };
  if (!id) return { ok: false, error: "Falta el identificador." };
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("nominas").delete().eq("id", id);
    if (error) throw error;
    revalidatePath("/nomina");
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo eliminar la nómina." };
  }
}

"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { listVencimientos } from "../prestamos/actions";
import { nivelExistencia, type Notificacion } from "@/lib/proyectos/types";

/**
 * ⚠️ Las notificaciones se DERIVAN de las fuentes existentes (préstamos,
 * materiales, clientes, pendientes). No se recalcula dinero ni se duplican
 * datos. Solo se persiste el estado "leída". Fuentes livianas para que la
 * campanita sea rápida en cualquier pantalla; las obras pasadas de presupuesto
 * (cálculo pesado) viven en la Sala de Mando.
 */

async function getAlertas(): Promise<Omit<Notificacion, "leida">[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createAdminClient();
  const alertas: Omit<Notificacion, "leida">[] = [];

  // 1) Préstamos: cuotas por vencer o vencidas.
  const venc = await listVencimientos(7);
  for (const v of venc) {
    const vencida = v.diasRestantes < 0;
    alertas.push({
      clave: `venc-${v.cuota.id}`,
      tipo: "prestamo",
      severidad: vencida ? "danger" : "warn",
      titulo: `${v.prestamo.tipo === "por_pagar" ? "Pago" : "Cobro"} a ${v.prestamo.contraparte}`,
      detalle: vencida ? `Cuota ${v.cuota.numero} vencida hace ${Math.abs(v.diasRestantes)}d` : `Cuota ${v.cuota.numero} vence ${v.diasRestantes === 0 ? "hoy" : `en ${v.diasRestantes}d`}`,
      href: `/prestamos/${v.prestamo.id}`,
      ts: v.cuota.vence,
    });
  }

  // 2) Materiales bajos / agotados por obra.
  const { data: mats } = await supabase
    .from("materiales")
    .select("obra_id, cantidad_comprada, cantidad_usada, obra:proyectos(id,nombre)");
  const porObra = new Map<string, { nombre: string; bajos: number; agotados: number }>();
  for (const m of (mats ?? []) as any[]) {
    const nivel = nivelExistencia(m);
    if (nivel !== "bajo" && nivel !== "agotado") continue;
    const obra = Array.isArray(m.obra) ? m.obra[0] : m.obra;
    if (!obra) continue;
    const cur = porObra.get(obra.id) ?? { nombre: obra.nombre, bajos: 0, agotados: 0 };
    if (nivel === "agotado") cur.agotados++; else cur.bajos++;
    porObra.set(obra.id, cur);
  }
  for (const [obraId, info] of porObra) {
    const total = info.bajos + info.agotados;
    alertas.push({
      clave: `mat-${obraId}`,
      tipo: "material",
      severidad: info.agotados > 0 ? "danger" : "warn",
      titulo: `${info.nombre}: ${total} material${total === 1 ? "" : "es"} por reponer`,
      detalle: info.agotados > 0 ? `${info.agotados} agotado${info.agotados === 1 ? "" : "s"}` : "Existencias bajas",
      href: `/obras/${obraId}?vista=materiales`,
      ts: null,
    });
  }

  // 3) Clientes con datos incompletos.
  const { count: incompletos } = await supabase
    .from("clientes")
    .select("id", { count: "exact", head: true })
    .eq("datos_completos", false);
  if ((incompletos ?? 0) > 0) {
    alertas.push({
      clave: "cli-incompletos",
      tipo: "cliente",
      severidad: "info",
      titulo: `${incompletos} cliente${incompletos === 1 ? "" : "s"} por completar`,
      detalle: "Datos incompletos del registro rápido",
      href: "/clientes",
      ts: null,
    });
  }

  // 4) Pendientes con fecha próxima (o vencida) y no hechos.
  const hoy = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  const limite = new Date(hoy);
  limite.setDate(limite.getDate() + 3);
  const limiteISO = `${limite.getFullYear()}-${p(limite.getMonth() + 1)}-${p(limite.getDate())}`;
  const { data: pend } = await supabase
    .from("pendientes")
    .select("id, texto, fecha, prioridad")
    .eq("hecho", false)
    .not("fecha", "is", null)
    .lte("fecha", limiteISO)
    .order("fecha", { ascending: true });
  const hoyISO = `${hoy.getFullYear()}-${p(hoy.getMonth() + 1)}-${p(hoy.getDate())}`;
  for (const t of (pend ?? []) as any[]) {
    const vencido = t.fecha < hoyISO;
    alertas.push({
      clave: `pend-${t.id}`,
      tipo: "cobro",
      severidad: vencido ? "danger" : t.prioridad === "alta" ? "warn" : "info",
      titulo: t.texto.slice(0, 80),
      detalle: vencido ? "Pendiente vencido" : t.fecha === hoyISO ? "Vence hoy" : "Pendiente próximo",
      href: "/pendientes",
      ts: t.fecha,
    });
  }

  return alertas;
}

function ordenar(a: Notificacion, b: Notificacion): number {
  if (a.leida !== b.leida) return a.leida ? 1 : -1;
  const rank = { danger: 0, warn: 1, info: 2 } as const;
  if (rank[a.severidad] !== rank[b.severidad]) return rank[a.severidad] - rank[b.severidad];
  return (b.ts ?? "").localeCompare(a.ts ?? "");
}

export async function getNotificaciones(): Promise<{ items: Notificacion[]; noLeidas: number }> {
  await requireUser();
  if (!isSupabaseConfigured()) return { items: [], noLeidas: 0 };
  try {
    const supabase = createAdminClient();
    const [alertas, { data: leidasRows }] = await Promise.all([
      getAlertas(),
      supabase.from("notificaciones_leidas").select("clave"),
    ]);
    const leidas = new Set((leidasRows ?? []).map((r: { clave: string }) => r.clave));
    const items = alertas.map((a) => ({ ...a, leida: leidas.has(a.clave) })).sort(ordenar);
    return { items, noLeidas: items.filter((i) => !i.leida).length };
  } catch {
    return { items: [], noLeidas: 0 };
  }
}

export async function getUnreadCount(): Promise<number> {
  await requireUser();
  if (!isSupabaseConfigured()) return 0;
  try {
    const supabase = createAdminClient();
    const [alertas, { data: leidasRows }] = await Promise.all([
      getAlertas(),
      supabase.from("notificaciones_leidas").select("clave"),
    ]);
    const leidas = new Set((leidasRows ?? []).map((r: { clave: string }) => r.clave));
    return alertas.filter((a) => !leidas.has(a.clave)).length;
  } catch {
    return 0;
  }
}

export async function marcarLeida(clave: string): Promise<{ ok: boolean }> {
  await requireUser();
  if (!isSupabaseConfigured() || !clave) return { ok: false };
  try {
    const supabase = createAdminClient();
    await supabase.from("notificaciones_leidas").upsert({ clave }, { onConflict: "clave", ignoreDuplicates: true });
    revalidatePath("/notificaciones");
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export async function marcarTodasLeidas(claves: string[]): Promise<{ ok: boolean }> {
  await requireUser();
  if (!isSupabaseConfigured()) return { ok: false };
  const limpio = [...new Set((claves ?? []).filter(Boolean))].slice(0, 500);
  if (limpio.length === 0) return { ok: true };
  try {
    const supabase = createAdminClient();
    await supabase.from("notificaciones_leidas").upsert(limpio.map((clave) => ({ clave })), { onConflict: "clave", ignoreDuplicates: true });
    revalidatePath("/notificaciones");
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

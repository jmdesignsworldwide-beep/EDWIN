"use server";

import { requireAdmin } from "@/lib/auth";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { AccionAuditoria, RegistroAuditoria } from "@/lib/proyectos/types";

const PAGE = 30;

export type AuditoriaFiltros = {
  accion?: AccionAuditoria | "";
  entidad_tipo?: string;
  usuario_id?: string;
  desde?: string;
  hasta?: string;
  q?: string;
  page?: number;
};

export type AuditoriaResult = {
  configured: boolean;
  items: RegistroAuditoria[];
  total: number;
  page: number;
  pageSize: number;
  usuarios: { id: string; nombre: string }[];
  tipos: string[];
};

/** Historial de actividad (solo admin). Paginado + filtros. */
export async function listAuditoria(filtros: AuditoriaFiltros = {}): Promise<AuditoriaResult> {
  await requireAdmin();
  const page = Math.max(0, Math.floor(filtros.page ?? 0));
  const base: AuditoriaResult = { configured: false, items: [], total: 0, page, pageSize: PAGE, usuarios: [], tipos: [] };
  if (!isSupabaseConfigured()) return base;
  try {
    const supabase = createAdminClient();

    let query = supabase.from("auditoria").select("*", { count: "exact" });
    if (filtros.accion) query = query.eq("accion", filtros.accion);
    if (filtros.entidad_tipo) query = query.eq("entidad_tipo", filtros.entidad_tipo);
    if (filtros.usuario_id) query = query.eq("usuario_id", filtros.usuario_id);
    if (filtros.desde && /^\d{4}-\d{2}-\d{2}$/.test(filtros.desde)) query = query.gte("created_at", `${filtros.desde}T00:00:00`);
    if (filtros.hasta && /^\d{4}-\d{2}-\d{2}$/.test(filtros.hasta)) query = query.lte("created_at", `${filtros.hasta}T23:59:59`);
    if (filtros.q && filtros.q.trim()) query = query.ilike("entidad_label", `%${filtros.q.trim()}%`);

    const from = page * PAGE;
    query = query.order("created_at", { ascending: false }).range(from, from + PAGE - 1);
    const { data, count, error } = await query;
    if (error) throw error;

    const [{ data: usuarios }, { data: tiposRows }] = await Promise.all([
      supabase.from("usuarios").select("id, nombre").order("nombre"),
      supabase.from("auditoria").select("entidad_tipo"),
    ]);
    const tipos = [...new Set(((tiposRows ?? []) as { entidad_tipo: string }[]).map((r) => r.entidad_tipo))].sort();

    return {
      configured: true,
      items: (data ?? []) as RegistroAuditoria[],
      total: count ?? 0,
      page,
      pageSize: PAGE,
      usuarios: (usuarios ?? []) as { id: string; nombre: string }[],
      tipos,
    };
  } catch {
    return { ...base, configured: true };
  }
}

/** Actividad de una entidad específica (para el patrón "ver actividad de este registro"). */
export async function listAuditoriaEntidad(tipo: string, id: string): Promise<RegistroAuditoria[]> {
  await requireAdmin();
  if (!isSupabaseConfigured() || !tipo || !id) return [];
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("auditoria")
      .select("*")
      .eq("entidad_tipo", tipo)
      .eq("entidad_id", id)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    return (data ?? []) as RegistroAuditoria[];
  } catch {
    return [];
  }
}

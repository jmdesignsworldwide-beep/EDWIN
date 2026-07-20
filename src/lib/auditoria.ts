import "server-only";

import { getSessionUser } from "@/lib/auth";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { AccionAuditoria } from "@/lib/proyectos/types";

/**
 * Registra una acción en el historial de auditoría. NUNCA lanza: si algo falla,
 * la operación original sigue su curso (la auditoría no debe romper ni frenar
 * nada). Captura el usuario de la sesión actual.
 */
export async function registrarAuditoria(
  accion: AccionAuditoria,
  entidadTipo: string,
  entidadId: string | null,
  entidadLabel: string,
  detalle?: { campo?: string; antes?: unknown; despues?: unknown; nota?: string } | null,
): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    const user = await getSessionUser();
    const supabase = createAdminClient();
    await supabase.from("auditoria").insert({
      usuario_id: user?.id ?? null,
      usuario_nombre: user?.nombre ?? "Sistema",
      accion,
      entidad_tipo: entidadTipo,
      entidad_id: entidadId,
      entidad_label: entidadLabel.slice(0, 200),
      detalle: detalle ?? null,
    });
  } catch {
    /* la auditoría nunca rompe la operación */
  }
}

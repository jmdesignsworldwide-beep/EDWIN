import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * ============================================================
 *  SUPABASE — ACCESO SERVIDOR (service_role)
 * ============================================================
 * `import "server-only"` garantiza que este módulo JAMÁS llegue al bundle del
 * navegador: si un componente cliente lo importa, el build falla.
 *
 * La `SUPABASE_SERVICE_ROLE_KEY` bypassa RLS: se usa SOLO aquí, en el servidor,
 * a través de server actions. El navegador (anon key) queda bloqueado por RLS.
 */

let cached: SupabaseClient | null = null;

/** ¿Están configuradas las variables del servidor? (sin lanzar). */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

/**
 * Cliente admin (service_role). No persiste sesión (uso servidor puro).
 * Lanza si faltan variables — captúralo en las server actions para degradar
 * con elegancia (estado "conecta Supabase") en vez de un 500.
 */
export function createAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Supabase (servidor) no configurado: define NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  if (cached) return cached;

  cached = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { "x-application-name": "constructora-edwin" } },
  });

  return cached;
}

import "server-only";

/**
 * ============================================================
 *  SUPABASE — ACCESO SERVIDOR (service_role)
 * ============================================================
 * `import "server-only"` garantiza que este módulo JAMÁS se incluya en el
 * bundle del navegador: si algún componente cliente lo importa, el build falla.
 *
 * La `SUPABASE_SERVICE_ROLE_KEY` otorga acceso total (bypassa RLS). Solo debe
 * usarse aquí, en el servidor.
 *
 * TANDA 1: sin conexión real. Dejamos la estructura y la validación listas;
 * la creación del cliente se activa en una ola posterior (cuando se instale
 * `@supabase/supabase-js` y existan credenciales).
 */

type ServerEnv = {
  url: string;
  serviceRoleKey: string;
};

/** Lee y valida las variables secretas del servidor. */
export function getServerSupabaseEnv(): ServerEnv {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Supabase (servidor) no está configurado. Define NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local.",
    );
  }

  return { url, serviceRoleKey };
}

/**
 * Placeholder del cliente admin. Se implementará cuando se conecte la base
 * de datos real:
 *
 *   import { createClient } from "@supabase/supabase-js";
 *   export function createAdminClient() {
 *     const { url, serviceRoleKey } = getServerSupabaseEnv();
 *     return createClient(url, serviceRoleKey, {
 *       auth: { persistSession: false, autoRefreshToken: false },
 *     });
 *   }
 */
export function createAdminClient(): never {
  throw new Error(
    "Cliente admin de Supabase aún no habilitado (Tanda 1: sin base de datos real).",
  );
}

/**
 * ============================================================
 *  SUPABASE — ACCESO NAVEGADOR (anon key, seguro para el cliente)
 * ============================================================
 * Solo usa las variables `NEXT_PUBLIC_*`. Nunca la service_role key.
 *
 * TANDA 1: sin conexión real. Estructura lista para activar en una ola
 * posterior con `@supabase/supabase-js` y RLS.
 */

type PublicEnv = {
  url: string;
  anonKey: string;
};

/** Lee las variables públicas de Supabase (seguras para el navegador). */
export function getPublicSupabaseEnv(): PublicEnv {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Supabase (público) no está configurado. Define NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  return { url, anonKey };
}

/**
 * Placeholder del cliente de navegador. Se implementará al conectar la base:
 *
 *   import { createBrowserClient } from "@supabase/ssr";
 *   export function createClient() {
 *     const { url, anonKey } = getPublicSupabaseEnv();
 *     return createBrowserClient(url, anonKey);
 *   }
 */
export function createBrowserSupabaseClient(): never {
  throw new Error(
    "Cliente de navegador de Supabase aún no habilitado (Tanda 1: sin base de datos real).",
  );
}

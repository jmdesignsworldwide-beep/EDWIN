import "server-only";

import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";
import { createAdminClient, isSupabaseConfigured } from "./supabase/server";
import { SESSION_COOKIE } from "./session-config";

export { SESSION_COOKIE };

/**
 * ============================================================
 *  SESIÓN Y ROLES (autenticación real)
 * ============================================================
 * La cookie de sesión es un token FIRMADO: `${userId}.${hmac}`. La firma usa
 * el `service_role` (server-only) como llave HMAC, así que el cliente no puede
 * fabricar ni alterar un token válido. En cada acceso se re-verifica la firma
 * Y se recarga el usuario desde la base (rol + activo) — el rol JAMÁS viaja en
 * la cookie ni se confía desde el cliente; no es escalable.
 */

export type Rol = "admin" | "usuario";

export type SessionUser = {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
  must_change_password: boolean;
};

const MAX_AGE = 60 * 60 * 8; // 8 horas

function hmacKey(): string {
  // service_role es server-only y estable; sirve de llave de firma.
  return process.env.SUPABASE_SERVICE_ROLE_KEY ?? "edwin-insecure-dev-key";
}

function sign(userId: string): string {
  return createHmac("sha256", hmacKey()).update(userId).digest("base64url");
}

function makeToken(userId: string): string {
  return `${userId}.${sign(userId)}`;
}

function verifyToken(token: string): string | null {
  const i = token.lastIndexOf(".");
  if (i <= 0) return null;
  const userId = token.slice(0, i);
  const sig = token.slice(i + 1);
  const expected = sign(userId);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return null;
  return timingSafeEqual(a, b) ? userId : null;
}

/** Crea la cookie de sesión firmada para un usuario. */
export function createSession(userId: string): void {
  cookies().set(SESSION_COOKIE, makeToken(userId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export function destroySession(): void {
  cookies().delete(SESSION_COOKIE);
}

/** Devuelve el usuario de la sesión (verificado + activo) o null. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token || !isSupabaseConfigured()) return null;
  const userId = verifyToken(token);
  if (!userId) return null;

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("usuarios")
      .select("id,nombre,email,rol,activo,must_change_password")
      .eq("id", userId)
      .single();
    if (error || !data || !data.activo) return null;
    return {
      id: data.id,
      nombre: data.nombre,
      email: data.email,
      rol: data.rol as Rol,
      must_change_password: data.must_change_password,
    };
  } catch {
    return null;
  }
}

/** Exige sesión válida; lanza si no hay. */
export async function requireUser(): Promise<SessionUser> {
  const u = await getSessionUser();
  if (!u) throw new Error("No autenticado. Inicia sesión para continuar.");
  return u;
}

/** Exige rol admin; lanza si no lo es. */
export async function requireAdmin(): Promise<SessionUser> {
  const u = await requireUser();
  if (u.rol !== "admin") {
    throw new Error("Acción reservada al administrador.");
  }
  return u;
}

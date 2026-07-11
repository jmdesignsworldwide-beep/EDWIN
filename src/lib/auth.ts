import "server-only";

import { cookies } from "next/headers";
import { SESSION_COOKIE } from "./session-config";

export { SESSION_COOKIE };

/**
 * ============================================================
 *  SESIÓN (gate de acceso)
 * ============================================================
 * Cookie httpOnly de sesión: sin ella, las server actions rechazan y el
 * middleware redirige al login. Cumple "nadie sin login toca datos".
 *
 * NOTA HONESTA: en esta tanda el login aún no valida credenciales contra un
 * backend (eso llega con Supabase Auth). Este gate hace cumplir "hay que
 * ingresar para llegar a los datos"; la validación real de usuario/contraseña
 * se conecta en la tanda de autenticación. La protección DE DATOS ya es real:
 * RLS + FORCE en la tabla y acceso solo por service_role del lado servidor.
 */

const MAX_AGE = 60 * 60 * 8; // 8 horas

/** Crea la sesión (llamar desde una server action / route handler). */
export function createSession(): void {
  cookies().set(SESSION_COOKIE, crypto.randomUUID(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

/** Cierra la sesión. */
export function destroySession(): void {
  cookies().delete(SESSION_COOKIE);
}

/** ¿Hay sesión activa? */
export function hasSession(): boolean {
  return Boolean(cookies().get(SESSION_COOKIE)?.value);
}

/** Exige sesión; lanza si no hay (para blindar server actions). */
export function requireSession(): void {
  if (!hasSession()) {
    throw new Error("No autenticado. Inicia sesión para continuar.");
  }
}

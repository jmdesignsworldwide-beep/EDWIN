"use server";

import { redirect } from "next/navigation";
import { createSession, destroySession } from "@/lib/auth";

/**
 * Ingreso. Tanda 3A: aún sin validación real de credenciales (llega con
 * Supabase Auth). Crea la cookie de sesión que habilita el acceso a los datos.
 */
export async function login(_prevState: unknown, formData: FormData) {
  const usuario = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!usuario || !password) {
    return { error: "Ingresa usuario y contraseña." };
  }

  createSession();
  redirect("/dashboard");
}

export async function logout() {
  destroySession();
  redirect("/login");
}

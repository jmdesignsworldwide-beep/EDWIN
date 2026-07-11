"use server";

import { redirect } from "next/navigation";
import {
  createSession,
  destroySession,
  requireUser,
} from "@/lib/auth";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { hashPassword, verifyPassword } from "@/lib/password";

type LoginState = { error?: string } | null;

/** Ingreso con validación real de credenciales contra la tabla usuarios. */
export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("username") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Ingresa usuario y contraseña." };
  }
  if (!isSupabaseConfigured()) {
    return { error: "El sistema aún no está configurado. Contacta al administrador." };
  }

  let mustChange = false;
  try {
    const supabase = createAdminClient();
    const { data: user } = await supabase
      .from("usuarios")
      .select("id,password_hash,activo,must_change_password")
      .eq("email", email)
      .maybeSingle();

    // Mensaje genérico (no revela si el usuario existe).
    if (!user || !user.activo || !verifyPassword(password, user.password_hash)) {
      return { error: "Usuario o contraseña incorrectos." };
    }
    createSession(user.id);
    mustChange = user.must_change_password;
  } catch {
    return { error: "No se pudo validar el ingreso. Intenta de nuevo." };
  }

  redirect(mustChange ? "/cambiar-clave" : "/dashboard");
}

export async function logout() {
  destroySession();
  redirect("/login");
}

type ChangeState = { error?: string } | null;

/** Cambio de contraseña del propio usuario. */
export async function changePassword(
  _prev: ChangeState,
  formData: FormData,
): Promise<ChangeState> {
  const user = await requireUser();
  const actual = String(formData.get("actual") ?? "");
  const nueva = String(formData.get("nueva") ?? "");
  const confirmar = String(formData.get("confirmar") ?? "");

  if (nueva.length < 8) {
    return { error: "La nueva contraseña debe tener al menos 8 caracteres." };
  }
  if (nueva !== confirmar) {
    return { error: "Las contraseñas no coinciden." };
  }

  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("usuarios")
      .select("password_hash")
      .eq("id", user.id)
      .single();
    if (!data || !verifyPassword(actual, data.password_hash)) {
      return { error: "La contraseña actual no es correcta." };
    }
    await supabase
      .from("usuarios")
      .update({ password_hash: hashPassword(nueva), must_change_password: false })
      .eq("id", user.id);
  } catch {
    return { error: "No se pudo cambiar la contraseña." };
  }

  redirect("/dashboard");
}

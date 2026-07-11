"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { hashPassword, generateTempPassword } from "@/lib/password";
import type { Usuario } from "@/lib/proyectos/types";

export type UsuariosListResult = {
  configured: boolean;
  usuarios: Usuario[];
  isAdmin: boolean;
  error?: string;
};

/** Lista usuarios (solo admin). Nunca devuelve el hash de contraseña. */
export async function listUsuarios(): Promise<UsuariosListResult> {
  const admin = await requireAdmin();
  if (!isSupabaseConfigured()) {
    return { configured: false, usuarios: [], isAdmin: admin.rol === "admin" };
  }
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("usuarios")
      .select("id,nombre,email,rol,activo,must_change_password,created_at")
      .order("created_at", { ascending: true });
    if (error) throw error;
    return {
      configured: true,
      usuarios: (data ?? []) as Usuario[],
      isAdmin: true,
    };
  } catch {
    return { configured: true, usuarios: [], isAdmin: true, error: "No se pudieron cargar los usuarios." };
  }
}

export async function createUsuario(raw: unknown): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase no configurado." };

  const d = (raw ?? {}) as Record<string, unknown>;
  const nombre = String(d.nombre ?? "").trim();
  const email = String(d.email ?? "").trim().toLowerCase();
  const password = String(d.password ?? "");
  const rol = String(d.rol ?? "usuario");

  if (!nombre) return { ok: false, error: "El nombre es obligatorio." };
  if (!email || !/^\S+@\S+\.\S+$|^\S{3,}$/.test(email)) {
    return { ok: false, error: "Ingresa un correo o usuario válido." };
  }
  if (password.length < 8) {
    return { ok: false, error: "La contraseña inicial debe tener al menos 8 caracteres." };
  }
  if (rol !== "admin" && rol !== "usuario") {
    return { ok: false, error: "Rol inválido." };
  }

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("usuarios").insert({
      nombre,
      email,
      password_hash: hashPassword(password),
      rol,
      activo: true,
      must_change_password: true,
    });
    if (error) {
      if ((error as { code?: string }).code === "23505") {
        return { ok: false, error: "Ya existe un usuario con ese correo." };
      }
      throw error;
    }
    revalidatePath("/usuarios");
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo crear el usuario." };
  }
}

/** Activa/desactiva un usuario. No permite desactivarse a sí mismo. */
export async function setUsuarioActivo(
  id: string,
  activo: boolean,
): Promise<{ ok: boolean; error?: string }> {
  const admin = await requireAdmin();
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase no configurado." };
  if (!id) return { ok: false, error: "Falta el identificador." };
  if (id === admin.id && !activo) {
    return { ok: false, error: "No puedes desactivar tu propia cuenta." };
  }
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("usuarios").update({ activo }).eq("id", id);
    if (error) throw error;
    revalidatePath("/usuarios");
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo actualizar el usuario." };
  }
}

/** Resetea la contraseña de un usuario a una temporal (mostrada una vez). */
export async function resetPassword(
  id: string,
): Promise<{ ok: true; tempPassword: string } | { ok: false; error: string }> {
  await requireAdmin();
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase no configurado." };
  if (!id) return { ok: false, error: "Falta el identificador." };
  try {
    const temp = generateTempPassword();
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("usuarios")
      .update({ password_hash: hashPassword(temp), must_change_password: true })
      .eq("id", id);
    if (error) throw error;
    revalidatePath("/usuarios");
    return { ok: true, tempPassword: temp };
  } catch {
    return { ok: false, error: "No se pudo resetear la contraseña." };
  }
}

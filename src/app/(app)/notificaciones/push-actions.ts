"use server";

import { requireUser } from "@/lib/auth";
import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { isPushConfigured, sendPushToAll } from "@/lib/push";

/** ¿Está configurado el push en el servidor? + la clave pública para suscribir. */
export async function getPushEstado(): Promise<{ configurado: boolean; publicKey: string | null }> {
  await requireUser();
  return {
    configurado: isPushConfigured(),
    publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null,
  };
}

type SubInput = { endpoint: string; keys: { p256dh: string; auth: string } };

export async function savePushSubscription(sub: SubInput): Promise<{ ok: boolean; error?: string }> {
  await requireUser();
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase no configurado." };
  const endpoint = String(sub?.endpoint ?? "");
  const p256dh = String(sub?.keys?.p256dh ?? "");
  const auth = String(sub?.keys?.auth ?? "");
  if (!endpoint || !p256dh || !auth) return { ok: false, error: "Suscripción inválida." };
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("push_subscriptions")
      .upsert({ endpoint, p256dh, auth }, { onConflict: "endpoint" });
    if (error) throw error;
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo guardar la suscripción." };
  }
}

export async function deletePushSubscription(endpoint: string): Promise<{ ok: boolean }> {
  await requireUser();
  if (!isSupabaseConfigured() || !endpoint) return { ok: false };
  try {
    const supabase = createAdminClient();
    await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

/** Envía una notificación de prueba a los dispositivos suscritos. */
export async function enviarPushPrueba(): Promise<{ ok: boolean; enviados: number; error?: string }> {
  await requireUser();
  if (!isPushConfigured()) return { ok: false, enviados: 0, error: "Push no configurado en el servidor." };
  try {
    const { enviados } = await sendPushToAll({
      title: "Constructora Edwin",
      body: "Notificaciones activadas ✅ Te avisaremos de lo importante.",
      url: "/notificaciones",
    });
    return { ok: true, enviados };
  } catch {
    return { ok: false, enviados: 0, error: "No se pudo enviar la prueba." };
  }
}

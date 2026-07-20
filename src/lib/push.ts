import "server-only";

import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * Web Push (VAPID). Las claves viven en variables de entorno del SERVIDOR:
 *   - NEXT_PUBLIC_VAPID_PUBLIC_KEY (segura de exponer al cliente)
 *   - VAPID_PRIVATE_KEY (privada, solo servidor)
 *   - VAPID_SUBJECT (mailto:... opcional)
 * Si no están configuradas, el push queda deshabilitado con elegancia y la
 * campanita interna sigue funcionando igual.
 */

const PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const PRIVATE = process.env.VAPID_PRIVATE_KEY;
const SUBJECT = process.env.VAPID_SUBJECT || "mailto:jm.designs.worldwide@gmail.com";

let configured = false;
export function isPushConfigured(): boolean {
  return Boolean(PUBLIC && PRIVATE);
}

function ensureConfigured(): boolean {
  if (!isPushConfigured()) return false;
  if (!configured) {
    webpush.setVapidDetails(SUBJECT, PUBLIC!, PRIVATE!);
    configured = true;
  }
  return true;
}

export type PushPayload = { title: string; body: string; url?: string };

/** Envía un push a todas las suscripciones guardadas. Limpia las muertas. */
export async function sendPushToAll(payload: PushPayload): Promise<{ enviados: number }> {
  if (!ensureConfigured()) return { enviados: 0 };
  const supabase = createAdminClient();
  const { data } = await supabase.from("push_subscriptions").select("*");
  const subs = (data ?? []) as { id: string; endpoint: string; p256dh: string; auth: string }[];
  let enviados = 0;
  const muertas: string[] = [];
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify(payload),
        );
        enviados++;
      } catch (e: any) {
        const code = e?.statusCode;
        if (code === 404 || code === 410) muertas.push(s.id);
      }
    }),
  );
  if (muertas.length > 0) await supabase.from("push_subscriptions").delete().in("id", muertas);
  return { enviados };
}

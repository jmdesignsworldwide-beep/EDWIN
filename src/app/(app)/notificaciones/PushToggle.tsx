"use client";

import { useEffect, useState } from "react";
import { BellRing, BellOff, Loader2, Check, Send, Smartphone } from "lucide-react";
import { getPushEstado, savePushSubscription, deletePushSubscription, enviarPushPrueba } from "./push-actions";
import { cn } from "@/lib/utils";

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

type Estado = "cargando" | "no_soportado" | "no_configurado" | "denegado" | "inactivo" | "activo";

export function PushToggle() {
  const [estado, setEstado] = useState<Estado>("cargando");
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const soportado = typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
      if (!soportado) return setEstado("no_soportado");
      const { configurado, publicKey } = await getPushEstado();
      if (!configurado || !publicKey) return setEstado("no_configurado");
      setPublicKey(publicKey);
      if (Notification.permission === "denied") return setEstado("denegado");
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        const sub = reg ? await reg.pushManager.getSubscription() : null;
        setEstado(sub ? "activo" : "inactivo");
      } catch {
        setEstado("inactivo");
      }
    })();
  }, []);

  async function activar() {
    if (!publicKey) return;
    setBusy(true); setMsg(null);
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const permiso = await Notification.requestPermission();
      if (permiso !== "granted") { setEstado(permiso === "denied" ? "denegado" : "inactivo"); setBusy(false); return; }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      const json = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };
      const res = await savePushSubscription({ endpoint: json.endpoint, keys: json.keys });
      if (res.ok) { setEstado("activo"); setMsg("Notificaciones activadas en este dispositivo."); }
      else setMsg(res.error ?? "No se pudo activar.");
    } catch {
      setMsg("No se pudo activar el push en este dispositivo.");
    }
    setBusy(false);
  }

  async function desactivar() {
    setBusy(true); setMsg(null);
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = reg ? await reg.pushManager.getSubscription() : null;
      if (sub) { await deletePushSubscription(sub.endpoint); await sub.unsubscribe(); }
      setEstado("inactivo");
      setMsg("Push desactivado en este dispositivo.");
    } catch { /* noop */ }
    setBusy(false);
  }

  async function probar() {
    setBusy(true); setMsg(null);
    const res = await enviarPushPrueba();
    setMsg(res.ok ? `Prueba enviada a ${res.enviados} dispositivo${res.enviados === 1 ? "" : "s"}.` : (res.error ?? "Error"));
    setBusy(false);
  }

  return (
    <div className="rounded-2xl border border-line bg-surface/50 p-4 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl ring-1 ring-inset", estado === "activo" ? "bg-emerald-500/12 text-emerald-600 ring-emerald-500/25 dark:text-emerald-400" : "bg-brand/12 text-brand ring-brand/25")}>
            {estado === "activo" ? <BellRing className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
          </span>
          <div>
            <p className="text-sm font-semibold text-content">Notificaciones al teléfono</p>
            <p className="max-w-md text-xs text-content-muted">
              {estado === "activo"
                ? "Recibirás avisos de lo importante aunque no tengas la app abierta."
                : "Recíbelas aunque no tengas la app abierta. La campanita interna funciona siempre, con o sin esto."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {estado === "cargando" && <Loader2 className="h-5 w-5 animate-spin text-content-subtle" />}
          {estado === "inactivo" && (
            <button type="button" onClick={activar} disabled={busy} className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand-gradient px-4 text-sm font-semibold text-brand-ink shadow-glow transition-transform hover:scale-[1.02] disabled:opacity-70">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <BellRing className="h-4 w-4" />}Activar
            </button>
          )}
          {estado === "activo" && (
            <>
              <button type="button" onClick={probar} disabled={busy} className="inline-flex h-10 items-center gap-2 rounded-xl border border-line px-3.5 text-sm font-semibold text-content transition-colors hover:bg-surface-2 disabled:opacity-70">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}Probar
              </button>
              <button type="button" onClick={desactivar} disabled={busy} className="inline-flex h-10 items-center gap-2 rounded-xl border border-line px-3.5 text-sm font-semibold text-content-muted transition-colors hover:bg-surface-2 disabled:opacity-70">
                Desactivar
              </button>
            </>
          )}
        </div>
      </div>

      {estado === "activo" && (
        <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300"><Check className="h-3.5 w-3.5" />Activadas en este dispositivo</p>
      )}
      {estado === "denegado" && (
        <p className="mt-3 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">Bloqueaste las notificaciones en este navegador. Actívalas desde los ajustes del navegador si las quieres.</p>
      )}
      {estado === "no_configurado" && (
        <p className="mt-3 rounded-lg bg-surface-2/60 px-3 py-2 text-xs text-content-muted">El push aún no está configurado en el servidor (faltan las claves VAPID). La campanita interna funciona igual.</p>
      )}
      {estado === "no_soportado" && (
        <p className="mt-3 rounded-lg bg-surface-2/60 px-3 py-2 text-xs text-content-muted">Este navegador no soporta push. La campanita interna funciona igual.</p>
      )}
      {msg && <p className="mt-2 text-xs text-content-muted">{msg}</p>}

      <p className="mt-3 flex items-start gap-1.5 text-[11px] text-content-subtle">
        <Smartphone className="mt-0.5 h-3 w-3 shrink-0" />
        En iPhone, el push requiere agregar la app a la pantalla de inicio y aun así iOS lo limita. La campanita dentro del sistema siempre es confiable.
      </p>
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  UserCog,
  Plus,
  KeyRound,
  Power,
  ShieldCheck,
  Copy,
  Check,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Reveal, Stagger, Button, EmptyState } from "@/components/primitives";
import { Modal } from "@/components/ui/Modal";
import { UsuarioForm } from "@/components/usuarios/UsuarioForm";
import { setUsuarioActivo, resetPassword } from "./actions";
import type { Usuario } from "@/lib/proyectos/types";
import { cn } from "@/lib/utils";

export function UsuariosView({
  usuarios,
  currentUserId,
  loadError,
}: {
  usuarios: Usuario[];
  currentUserId: string;
  loadError?: string;
}) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [reset, setReset] = useState<{ nombre: string; temp: string } | null>(null);
  const [busy, start] = useTransition();

  function toggleActivo(u: Usuario) {
    start(async () => {
      const res = await setUsuarioActivo(u.id, !u.activo);
      if (res.ok) router.refresh();
    });
  }

  function doReset(u: Usuario) {
    start(async () => {
      const res = await resetPassword(u.id);
      if (res.ok) setReset({ nombre: u.nombre, temp: res.tempPassword });
    });
  }

  return (
    <>
      <PageHeader
        title="Usuarios"
        subtitle="Gestión de cuentas del sistema (solo administrador)"
        action={
          <Button icon={Plus} onClick={() => setCreating(true)}>
            Agregar usuario
          </Button>
        }
      />

      {loadError && (
        <div className="mb-5 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
          {loadError}
        </div>
      )}

      {usuarios.length === 0 ? (
        <Reveal standalone>
          <div className="rounded-2xl border border-line bg-surface/50 shadow-card">
            <EmptyState
              icon={UserCog}
              title="Aún no hay usuarios"
              description="Crea la primera cuenta. Solo el administrador puede crear usuarios; no hay registro abierto."
              actionLabel="Agregar usuario"
              actionIcon={Plus}
              onAction={() => setCreating(true)}
            />
          </div>
        </Reveal>
      ) : (
        <Stagger className="space-y-2.5">
          {usuarios.map((u) => (
            <Reveal key={u.id}>
              <div className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-surface/50 p-4 shadow-card">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-gradient text-sm font-bold text-brand-ink">
                  {initials(u.nombre)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-sm font-semibold text-content">{u.nombre}</span>
                    {u.rol === "admin" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-brand/12 px-2 py-0.5 text-[11px] font-semibold text-brand ring-1 ring-inset ring-brand/25">
                        <ShieldCheck className="h-3 w-3" />
                        Admin
                      </span>
                    )}
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset",
                        u.activo
                          ? "bg-emerald-500/12 text-emerald-700 ring-emerald-500/25 dark:text-emerald-300"
                          : "bg-slate-500/12 text-slate-600 ring-slate-500/25 dark:text-slate-300",
                      )}
                    >
                      {u.activo ? "Activo" : "Inactivo"}
                    </span>
                    {u.id === currentUserId && (
                      <span className="text-[11px] text-content-subtle">(tú)</span>
                    )}
                  </div>
                  <p className="truncate text-xs text-content-subtle">{u.email}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => doReset(u)}
                    disabled={busy}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line px-3 text-xs font-semibold text-content-muted transition-colors hover:border-brand/40 hover:text-brand disabled:opacity-50"
                  >
                    <KeyRound className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Resetear clave</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleActivo(u)}
                    disabled={busy || u.id === currentUserId}
                    title={u.id === currentUserId ? "No puedes desactivar tu propia cuenta" : undefined}
                    className={cn(
                      "inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition-colors disabled:opacity-40",
                      u.activo
                        ? "border-line text-content-muted hover:border-danger/40 hover:text-danger"
                        : "border-line text-content-muted hover:border-emerald-500/40 hover:text-emerald-600 dark:hover:text-emerald-400",
                    )}
                  >
                    <Power className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{u.activo ? "Desactivar" : "Reactivar"}</span>
                  </button>
                </div>
              </div>
            </Reveal>
          ))}
        </Stagger>
      )}

      {/* Crear usuario */}
      <Modal open={creating} onClose={() => setCreating(false)} title="Nuevo usuario" subtitle="Solo el admin crea cuentas">
        <UsuarioForm onSaved={() => { setCreating(false); router.refresh(); }} onCancel={() => setCreating(false)} />
      </Modal>

      {/* Resultado de reseteo de contraseña */}
      <Modal open={Boolean(reset)} onClose={() => setReset(null)} title="Contraseña temporal" subtitle={reset?.nombre}>
        <div className="px-5 py-5">
          <p className="text-sm text-content-muted">
            Nueva contraseña temporal. Cópiala y compártela de forma segura — el usuario deberá cambiarla al ingresar. No se volverá a mostrar.
          </p>
          <CopyRow value={reset?.temp ?? ""} />
          <div className="mt-5 flex justify-end">
            <Button variant="primary" size="md" onClick={() => setReset(null)}>
              Entendido
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

function CopyRow({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }}
      className="mt-3 flex w-full items-center justify-between gap-3 rounded-xl border border-line bg-surface-2/50 px-4 py-3 text-left transition-colors hover:border-brand/40"
    >
      <span className="font-mono text-base font-semibold tracking-wide text-content">{value}</span>
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-content-muted">
        {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
        {copied ? "Copiado" : "Copiar"}
      </span>
    </button>
  );
}

function initials(nombre: string): string {
  const parts = nombre.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

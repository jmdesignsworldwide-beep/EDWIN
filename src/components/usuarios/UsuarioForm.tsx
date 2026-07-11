"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Loader2, Wand2 } from "lucide-react";
import { Button } from "@/components/primitives";
import { createUsuario } from "@/app/(app)/usuarios/actions";
import { cn } from "@/lib/utils";

/** UsuarioForm — alta de usuario (solo admin). Contraseña inicial obligatoria;
 *  el usuario deberá cambiarla en su primer ingreso. */
export function UsuarioForm({
  onSaved,
  onCancel,
}: {
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState<"usuario" | "admin">("usuario");

  function generar() {
    const chars = "abcdefghijkmnpqrstuvwxyz23456789";
    let out = "";
    for (let i = 0; i < 10; i++) out += chars[Math.floor(Math.random() * chars.length)];
    setPassword(`${out.slice(0, 5)}-${out.slice(5)}`);
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const res = await createUsuario({ nombre, email, password, rol });
      if (res.ok) onSaved();
      else setError(res.error ?? "No se pudo crear el usuario.");
    });
  }

  return (
    <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
        <Field label="Nombre" required>
          <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required placeholder="Ej. Edwin Espaillat" className={inp} />
        </Field>
        <Field label="Usuario / correo" required>
          <input type="text" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="off" placeholder="edwin@correo.com" className={inp} />
        </Field>
        <Field label="Contraseña inicial" required>
          <div className="flex gap-2">
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder="mínimo 8 caracteres"
              className={inp}
            />
            <button
              type="button"
              onClick={generar}
              className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl border border-line bg-surface px-3 text-sm font-semibold text-content transition-colors hover:border-brand/50 hover:text-brand"
            >
              <Wand2 className="h-4 w-4" />
              Generar
            </button>
          </div>
          <p className="mt-1 text-[11px] text-content-subtle">
            El usuario deberá cambiarla en su primer ingreso. Compártela de forma segura.
          </p>
        </Field>
        <Field label="Rol">
          <select value={rol} onChange={(e) => setRol(e.target.value as "usuario" | "admin")} className={cn(inp, "appearance-none")}>
            <option value="usuario">Usuario</option>
            <option value="admin">Administrador</option>
          </select>
        </Field>

        {error && <p className="rounded-lg bg-danger/10 px-3 py-2 text-xs font-medium text-danger">{error}</p>}
      </div>

      <div className="flex shrink-0 items-center justify-end gap-2.5 border-t border-line px-5 py-4">
        <Button type="button" variant="secondary" size="md" onClick={onCancel} disabled={pending}>
          Cancelar
        </Button>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-gradient px-5 text-sm font-semibold text-brand-ink shadow-glow transition-transform hover:scale-[1.02] active:scale-[0.99] disabled:opacity-70"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Crear usuario"}
        </button>
      </div>
    </form>
  );
}

const inp =
  "h-11 w-full rounded-xl border border-line bg-surface/60 px-3.5 text-sm text-content placeholder:text-content-subtle transition-colors focus:border-brand/50 focus:bg-surface focus:outline-none";

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-content-muted">
        {label}
        {required && <span className="text-brand"> *</span>}
      </label>
      {children}
    </div>
  );
}

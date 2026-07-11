"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { motion, useReducedMotion } from "framer-motion";
import { Eye, EyeOff, Lock, User, Loader2, ArrowRight } from "lucide-react";
import { login } from "@/app/login/actions";
import { cn } from "@/lib/utils";

/**
 * LoginForm — usuario + contraseña. Sin registro abierto: las cuentas las crea
 * el administrador. Al ingresar se crea la sesión (server action) y el
 * middleware habilita el acceso a los datos. La validación real de credenciales
 * llega con Supabase Auth.
 */
export function LoginForm() {
  const reduced = useReducedMotion();
  const [showPassword, setShowPassword] = useState(false);
  const [state, formAction] = useFormState(login, null as { error?: string } | null);

  return (
    <motion.form
      action={formAction}
      initial={reduced ? false : { opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="glass-strong w-full max-w-sm rounded-2xl p-7 shadow-elevated"
    >
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight text-content">
          Bienvenido de nuevo
        </h1>
        <p className="mt-1 text-sm text-content-muted">
          Ingresa a la gestión de obras
        </p>
      </div>

      <div className="space-y-4">
        <Field id="username" label="Usuario" icon={<User className="h-4 w-4" />}>
          <input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            required
            placeholder="tu.usuario"
            className="h-11 w-full rounded-xl border border-line bg-surface/60 pl-10 pr-3 text-sm text-content placeholder:text-content-subtle transition-colors focus:border-brand/50 focus:bg-surface focus:outline-none"
          />
        </Field>

        <Field id="password" label="Contraseña" icon={<Lock className="h-4 w-4" />}>
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            placeholder="••••••••"
            className="h-11 w-full rounded-xl border border-line bg-surface/60 pl-10 pr-10 text-sm text-content placeholder:text-content-subtle transition-colors focus:border-brand/50 focus:bg-surface focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-content-subtle transition-colors hover:text-content"
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </Field>
      </div>

      {state?.error && (
        <p className="mt-4 rounded-lg bg-danger/10 px-3 py-2 text-xs font-medium text-danger">
          {state.error}
        </p>
      )}

      <SubmitButton />

      <p className="mt-5 text-center text-xs text-content-subtle">
        Las cuentas las crea el administrador. Si no puedes ingresar, contáctalo.
      </p>
    </motion.form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        "group mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-gradient text-sm font-semibold text-brand-ink shadow-glow transition-transform active:scale-[0.99] disabled:opacity-70",
      )}
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          Ingresar
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </>
      )}
    </button>
  );
}

function Field({
  id,
  label,
  icon,
  children,
}: {
  id: string;
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-content-muted">
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-content-subtle">
          {icon}
        </span>
        {children}
      </div>
    </div>
  );
}

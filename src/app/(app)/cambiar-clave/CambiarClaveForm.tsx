"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Loader2, KeyRound } from "lucide-react";
import { changePassword } from "@/app/login/actions";

const inp =
  "h-11 w-full rounded-xl border border-line bg-surface/60 px-3.5 text-sm text-content placeholder:text-content-subtle transition-colors focus:border-brand/50 focus:bg-surface focus:outline-none";

export function CambiarClaveForm() {
  const [state, action] = useFormState(changePassword, null as { error?: string } | null);

  return (
    <form action={action} className="glass-strong w-full max-w-md rounded-2xl p-6 shadow-elevated">
      <div className="mb-5 flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand/12 text-brand ring-1 ring-brand/25">
          <KeyRound className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-base font-semibold text-content">Cambiar contraseña</h1>
          <p className="text-xs text-content-muted">Elige una nueva contraseña para tu cuenta.</p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-content-muted">Contraseña actual</label>
          <input type="password" name="actual" required autoComplete="current-password" className={inp} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-content-muted">Nueva contraseña</label>
          <input type="password" name="nueva" required minLength={8} autoComplete="new-password" placeholder="mínimo 8 caracteres" className={inp} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-content-muted">Confirmar nueva contraseña</label>
          <input type="password" name="confirmar" required minLength={8} autoComplete="new-password" className={inp} />
        </div>
      </div>

      {state?.error && (
        <p className="mt-4 rounded-lg bg-danger/10 px-3 py-2 text-xs font-medium text-danger">{state.error}</p>
      )}

      <SubmitBtn />
    </form>
  );
}

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-gradient text-sm font-semibold text-brand-ink shadow-glow transition-transform active:scale-[0.99] disabled:opacity-70"
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar contraseña"}
    </button>
  );
}

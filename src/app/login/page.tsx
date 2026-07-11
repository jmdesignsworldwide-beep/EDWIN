import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { LoginForm } from "@/components/login/LoginForm";
import { Logo } from "@/components/layout/Logo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { LiveBackupIndicator } from "@/components/layout/LiveBackupIndicator";

export const metadata: Metadata = {
  title: "Ingresar",
};

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  // Solo con sesión VÁLIDA se salta al panel (evita bucles con cookies inválidas).
  const user = await getSessionUser();
  if (user) redirect("/dashboard");

  return (
    <div className="relative flex min-h-screen flex-col">
      <header className="flex items-center justify-between px-5 py-5 sm:px-8">
        <Logo />
        <ThemeToggle />
      </header>

      <main className="flex flex-1 items-center justify-center px-5 pb-16">
        <div className="w-full max-w-sm">
          <div className="mb-6 text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/50 px-3 py-1 text-xs font-medium text-content-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" />
              Santiago, República Dominicana
            </span>
          </div>
          <LoginForm />
        </div>
      </main>

      <footer className="flex items-center justify-center gap-3 px-5 pb-8 text-xs text-content-subtle">
        <LiveBackupIndicator />
      </footer>
    </div>
  );
}

import type { LucideIcon } from "lucide-react";
import { Hammer } from "lucide-react";
import { PageHeader } from "./PageHeader";
import { Reveal, Stagger } from "@/components/primitives";

/**
 * PlaceholderPage — navigable stand-in for modules that arrive in later waves.
 * Keeps the shell fully explorable in Tanda 1 while signaling "en construcción".
 */
export function PlaceholderPage({
  title,
  subtitle,
  icon: Icon,
}: {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
}) {
  return (
    <>
      <PageHeader title={title} subtitle={subtitle} />
      <Stagger className="grid gap-4">
        <Reveal>
          <div className="glass flex flex-col items-center justify-center rounded-2xl px-6 py-16 text-center shadow-card">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand/12 text-brand ring-1 ring-brand/25">
              <Icon className="h-7 w-7" strokeWidth={1.8} />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-content">
              Módulo en construcción
            </h2>
            <p className="mt-1.5 max-w-md text-sm text-content-muted">
              Los cimientos ya están listos. Este módulo se activa en una próxima
              ola con datos reales y flujos completos.
            </p>
            <span className="mt-5 inline-flex items-center gap-2 rounded-full border border-line bg-surface/60 px-3 py-1.5 text-xs font-medium text-content-subtle">
              <Hammer className="h-3.5 w-3.5" />
              Próximamente
            </span>
          </div>
        </Reveal>
      </Stagger>
    </>
  );
}

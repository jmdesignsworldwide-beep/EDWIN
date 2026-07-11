import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Panel — contenedor de sección de la Sala de Mando: cabecera (ícono + título
 * + acción opcional) y cuerpo. Superficie estable (no magnética); las tarjetas
 * interiores son las que reaccionan al hover.
 */
export function Panel({
  title,
  icon: Icon,
  action,
  count,
  children,
  bodyClassName,
  className,
}: {
  title: string;
  icon?: LucideIcon;
  action?: ReactNode;
  count?: ReactNode;
  children: ReactNode;
  bodyClassName?: string;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "flex flex-col rounded-2xl border border-line bg-surface/50 shadow-card backdrop-blur-sm",
        className,
      )}
    >
      <header className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
        <div className="flex items-center gap-2.5">
          {Icon && (
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand/12 text-brand ring-1 ring-brand/20">
              <Icon className="h-4 w-4" strokeWidth={2} />
            </span>
          )}
          <h2 className="text-sm font-semibold text-content">{title}</h2>
          {count != null && (
            <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-content-muted">
              {count}
            </span>
          )}
        </div>
        {action}
      </header>
      <div className={cn("flex flex-1 flex-col p-5", bodyClassName)}>
        {children}
      </div>
    </section>
  );
}

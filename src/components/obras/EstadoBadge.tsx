import { ESTADO_BADGE, ESTADO_LABEL, type EstadoObra } from "@/lib/proyectos/types";
import { cn } from "@/lib/utils";

/**
 * EstadoBadge — badge de estado de obra. Contraste verificado en ambos temas
 * (texto -700 en claro / -300 en oscuro).
 */
export function EstadoBadge({
  estado,
  className,
}: {
  estado: EstadoObra;
  className?: string;
}) {
  const { badge, dot } = ESTADO_BADGE[estado];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        badge,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", dot)} />
      {ESTADO_LABEL[estado]}
    </span>
  );
}

import {
  ESTADO_ETAPA_BADGE,
  ESTADO_ETAPA_LABEL,
  type EstadoEtapa,
} from "@/lib/proyectos/types";
import { cn } from "@/lib/utils";

/**
 * EtapaBadge — badge de estado de fase. Contraste verificado en ambos temas
 * (texto -700 claro / -300 oscuro).
 */
export function EtapaBadge({
  estado,
  className,
}: {
  estado: EstadoEtapa;
  className?: string;
}) {
  const { badge, dot } = ESTADO_ETAPA_BADGE[estado];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        badge,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", dot)} />
      {ESTADO_ETAPA_LABEL[estado]}
    </span>
  );
}

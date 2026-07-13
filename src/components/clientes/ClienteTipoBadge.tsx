import { Building2, User } from "lucide-react";
import { CLIENTE_TIPO_BADGE, type ClienteTipo } from "@/lib/proyectos/types";
import { cn } from "@/lib/utils";

/** Badge de tipo de cliente (Persona / Empresa). Contraste en ambos temas. */
export function ClienteTipoBadge({ tipo, className }: { tipo: ClienteTipo; className?: string }) {
  const { badge, label } = CLIENTE_TIPO_BADGE[tipo];
  const Icon = tipo === "empresa" ? Building2 : User;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
        badge,
        className,
      )}
    >
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

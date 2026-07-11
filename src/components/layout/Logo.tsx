import { HardHat } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Brand mark — hard-hat glyph in gold + wordmark. `compact` shows glyph only
 * (collapsed sidebar / mobile).
 */
export function Logo({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="relative grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-gradient shadow-glow">
        <HardHat className="h-5 w-5 text-brand-ink" strokeWidth={2.2} />
      </div>
      {!compact && (
        <div className="leading-tight">
          <p className="text-sm font-bold tracking-tight text-content">
            Constructora Edwin
          </p>
          <p className="text-[11px] font-medium text-content-subtle">
            Gestión de obras
          </p>
        </div>
      )}
    </div>
  );
}

"use client";

import { cn } from "@/lib/utils";

/**
 * "Respaldo vivo" — a pulsing dot signaling live backup is active. The pulse
 * ring is CSS-driven (paused under reduced-motion). Label hides on small
 * screens; the dot always shows.
 */
export function LiveBackupIndicator({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-line bg-surface/60 py-1 pl-2.5 pr-3",
        className,
      )}
      title="Respaldo vivo activo"
    >
      <span className="relative grid h-2.5 w-2.5 place-items-center">
        <span className="absolute inline-flex h-2.5 w-2.5 animate-pulse-ring rounded-full bg-success" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-success shadow-[0_0_8px_1px] shadow-success/60" />
      </span>
      <span className="hidden text-xs font-medium text-content-muted sm:inline">
        Respaldo vivo
      </span>
    </div>
  );
}

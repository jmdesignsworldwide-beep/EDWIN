"use client";

import { cn } from "@/lib/utils";

/**
 * Skeleton — placeholder con sheen animado (shimmer). Cableado para mostrarse
 * mientras llegan datos reales en tandas futuras. El shimmer se detiene bajo
 * prefers-reduced-motion (media query global en globals.css).
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg bg-surface-2/70",
        className,
      )}
    >
      <span className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-content/10 to-transparent" />
    </div>
  );
}

/** Skeleton con forma de tarjeta KPI. */
export function KPISkeleton() {
  return (
    <div className="rounded-2xl bg-surface p-5 shadow-card">
      <div className="flex items-start justify-between">
        <Skeleton className="h-11 w-11 rounded-xl" />
        <Skeleton className="h-6 w-14 rounded-full" />
      </div>
      <Skeleton className="mt-5 h-8 w-24" />
      <Skeleton className="mt-2 h-4 w-20" />
    </div>
  );
}

/** Skeleton con forma de tarjeta de obra. */
export function ObraCardSkeleton() {
  return (
    <div className="rounded-2xl bg-surface p-5 shadow-card">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="mt-5 h-2.5 w-full rounded-full" />
      <div className="mt-3 flex justify-between">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-10" />
      </div>
    </div>
  );
}

/** Skeleton con forma de fila de lista (actividad / alertas). */
export function RowSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-surface-2/40 p-3">
      <Skeleton className="h-9 w-9 rounded-lg" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  );
}

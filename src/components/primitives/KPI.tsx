"use client";

import Link from "next/link";
import { TrendingUp, TrendingDown, type LucideIcon } from "lucide-react";
import { MagneticCard } from "./MagneticCard";
import { CountUp } from "./CountUp";
import { ProgressBar } from "./ProgressBar";
import { cn } from "@/lib/utils";

/**
 * KPI — tarjeta base de métrica. Compone MagneticCard + CountUp (+ ProgressBar
 * opcional). El valor anima al entrar; el hover eleva.
 *
 * Estado vacío (`empty`): muestra un guion elegante "—" en vez de 0 para que
 * no se vea roto, ocultando tendencia y progreso. El CountUp queda cableado
 * para cuando lleguen datos reales.
 *
 * Clickable (`href`): patrón monster — la tarjeta entera responde y navega.
 */

type KPIProps = {
  label: string;
  value: number;
  icon: LucideIcon;
  format?: (n: number) => string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  /** Delta porcentual vs. período anterior. */
  trend?: number;
  /** Barra de progreso (0–100) bajo el valor. */
  progress?: number;
  tone?: "brand" | "accent";
  /** Sin datos aún: muestra "—" en lugar de un número. */
  empty?: boolean;
  /** Micro-texto bajo la etiqueta (ej. "Sin registrar"). */
  hint?: string;
  /** Hace la tarjeta clickable (navega). */
  href?: string;
  className?: string;
};

export function KPI({
  label,
  value,
  icon: Icon,
  format,
  prefix,
  suffix,
  decimals,
  trend,
  progress,
  tone = "brand",
  empty = false,
  hint,
  href,
  className,
}: KPIProps) {
  const trendUp = (trend ?? 0) >= 0;
  const showTrend = !empty && typeof trend === "number";
  const showProgress = !empty && typeof progress === "number";

  const card = (
    <MagneticCard className={cn("h-full p-5", className)} glow={!empty}>
      <div className="flex items-start justify-between gap-3">
        <div
          className={cn(
            "grid h-11 w-11 place-items-center rounded-xl",
            tone === "brand"
              ? "bg-brand/12 text-brand ring-1 ring-brand/25"
              : "bg-accent/12 text-accent ring-1 ring-accent/25",
          )}
        >
          <Icon className="h-5 w-5" strokeWidth={2} />
        </div>

        {showTrend ? (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold tabular-nums",
              trendUp ? "bg-success/12 text-success" : "bg-danger/12 text-danger",
            )}
          >
            {trendUp ? (
              <TrendingUp className="h-3.5 w-3.5" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5" />
            )}
            {Math.abs(trend!)}%
          </span>
        ) : (
          empty && (
            <span className="rounded-full border border-line px-2 py-1 text-[11px] font-medium text-content-subtle">
              Sin datos
            </span>
          )
        )}
      </div>

      <div className="mt-4">
        <div className="text-2xl font-bold tracking-tight sm:text-3xl">
          {empty ? (
            <span className="text-content-subtle" aria-label="Sin datos aún">
              —
            </span>
          ) : (
            <span className="text-content">
              <CountUp
                value={value}
                format={format}
                prefix={prefix}
                suffix={suffix}
                decimals={decimals}
              />
            </span>
          )}
        </div>
        <p className="mt-1 text-sm font-medium text-content-muted">{label}</p>
        {hint && (
          <p className="mt-0.5 text-xs text-content-subtle">{hint}</p>
        )}
      </div>

      {showProgress && (
        <ProgressBar value={progress!} tone={tone} className="mt-4" size="sm" />
      )}
      {empty && (
        <div className="mt-4 h-1.5 w-full rounded-full bg-surface-2" aria-hidden />
      )}
    </MagneticCard>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block h-full rounded-2xl focus-visible:outline-none"
        aria-label={label}
      >
        {card}
      </Link>
    );
  }

  return card;
}

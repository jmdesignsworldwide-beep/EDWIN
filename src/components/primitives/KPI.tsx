"use client";

import { TrendingUp, TrendingDown, type LucideIcon } from "lucide-react";
import { MagneticCard } from "./MagneticCard";
import { CountUp } from "./CountUp";
import { ProgressBar } from "./ProgressBar";
import { cn } from "@/lib/utils";

/**
 * KPI — base metric card used across dashboards. Composes MagneticCard +
 * CountUp (+ optional ProgressBar). Value animates in; hover elevates.
 */

type KPIProps = {
  label: string;
  value: number;
  icon: LucideIcon;
  /** Custom value formatter (e.g. currency). */
  format?: (n: number) => string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  /** Percentage delta vs previous period. */
  trend?: number;
  /** Show a progress bar (0–100) under the value. */
  progress?: number;
  tone?: "brand" | "accent";
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
  className,
}: KPIProps) {
  const trendUp = (trend ?? 0) >= 0;

  return (
    <MagneticCard className={cn("p-5", className)}>
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

        {typeof trend === "number" && (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold tabular-nums",
              trendUp
                ? "bg-success/12 text-success"
                : "bg-danger/12 text-danger",
            )}
          >
            {trendUp ? (
              <TrendingUp className="h-3.5 w-3.5" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5" />
            )}
            {Math.abs(trend)}%
          </span>
        )}
      </div>

      <div className="mt-4">
        <div className="text-2xl font-bold tracking-tight text-content sm:text-3xl">
          <CountUp
            value={value}
            format={format}
            prefix={prefix}
            suffix={suffix}
            decimals={decimals}
          />
        </div>
        <p className="mt-1 text-sm font-medium text-content-muted">{label}</p>
      </div>

      {typeof progress === "number" && (
        <ProgressBar
          value={progress}
          tone={tone}
          className="mt-4"
          size="sm"
        />
      )}
    </MagneticCard>
  );
}

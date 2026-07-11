"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * ProgressBar — fills from 0 → value with a spring. Supports brand / accent /
 * success tones and an optional shimmer sheen. Honors reduced-motion.
 */

type ProgressBarProps = {
  /** 0–100 */
  value: number;
  className?: string;
  tone?: "brand" | "accent" | "success" | "danger";
  showLabel?: boolean;
  size?: "sm" | "md";
};

const toneClass: Record<NonNullable<ProgressBarProps["tone"]>, string> = {
  brand: "bg-brand-gradient",
  accent: "bg-accent",
  success: "bg-success",
  danger: "bg-danger",
};

export function ProgressBar({
  value,
  className,
  tone = "brand",
  showLabel = false,
  size = "md",
}: ProgressBarProps) {
  const reduced = useReducedMotion();
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-content-muted">
          <span>Avance</span>
          <span className="tabular-nums text-content">{clamped}%</span>
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        className={cn(
          "relative overflow-hidden rounded-full bg-surface-2",
          size === "md" ? "h-2.5" : "h-1.5",
        )}
      >
        <motion.div
          className={cn(
            "relative h-full rounded-full",
            toneClass[tone],
          )}
          initial={reduced ? false : { width: 0 }}
          animate={{ width: `${clamped}%` }}
          transition={
            reduced
              ? { duration: 0 }
              : { type: "spring", stiffness: 90, damping: 20, delay: 0.1 }
          }
        >
          {!reduced && (
            <span className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/25 to-transparent" />
          )}
        </motion.div>
      </div>
    </div>
  );
}

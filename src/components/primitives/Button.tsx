"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Button — botón premium con hover magnético (scale + elevación). Sirve como
 * <button> o como <Link> (pasando `href`). Variantes coherentes con ambos
 * temas. Respeta prefers-reduced-motion.
 *
 * Regla monster: cero botones muertos — todo botón responde al hover.
 */

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

type BaseProps = {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  icon?: LucideIcon;
  iconRight?: LucideIcon;
  className?: string;
  fullWidth?: boolean;
};

type ButtonProps = BaseProps & {
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  "aria-label"?: string;
};

const variantClass: Record<Variant, string> = {
  primary:
    "bg-brand-gradient text-brand-ink shadow-glow hover:shadow-[0_0_0_1px_rgb(var(--brand)/0.5),0_0_32px_-4px_rgb(var(--brand)/0.6)]",
  secondary:
    "border border-line bg-surface/70 text-content hover:border-brand/45 hover:bg-surface",
  ghost:
    "text-content-muted hover:bg-surface-2 hover:text-content",
};

const sizeClass: Record<Size, string> = {
  sm: "h-9 px-3.5 text-xs gap-1.5 rounded-lg",
  md: "h-11 px-5 text-sm gap-2 rounded-xl",
  lg: "h-12 px-6 text-sm gap-2 rounded-xl",
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  icon: Icon,
  iconRight: IconRight,
  className,
  fullWidth,
  href,
  onClick,
  type = "button",
  disabled,
  ...rest
}: ButtonProps) {
  const reduced = useReducedMotion();

  const classes = cn(
    "group relative inline-flex items-center justify-center font-semibold transition-colors will-change-transform focus-visible:outline-none disabled:pointer-events-none disabled:opacity-60",
    variantClass[variant],
    sizeClass[size],
    fullWidth && "w-full",
    className,
  );

  const hover = reduced ? undefined : { scale: 1.03, y: -2 };
  const tap = reduced ? undefined : { scale: 0.98 };
  const transition = { type: "spring", stiffness: 400, damping: 24 } as const;

  const inner = (
    <>
      {Icon && <Icon className="h-4 w-4 shrink-0" strokeWidth={2.2} />}
      <span>{children}</span>
      {IconRight && (
        <IconRight
          className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5"
          strokeWidth={2.2}
        />
      )}
    </>
  );

  if (href) {
    return (
      <motion.div
        className={cn("inline-flex", fullWidth && "w-full")}
        whileHover={hover}
        whileTap={tap}
        transition={transition}
      >
        <Link href={href} className={classes} aria-label={rest["aria-label"]}>
          {inner}
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={classes}
      whileHover={hover}
      whileTap={tap}
      transition={transition}
      aria-label={rest["aria-label"]}
    >
      {inner}
    </motion.button>
  );
}

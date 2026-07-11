"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { Button } from "./Button";
import { cn } from "@/lib/utils";

/**
 * EmptyState — estado vacío premium. Ícono con halo (glow/aurora coherente con
 * el tema), mensaje cálido en español y botón de acción opcional. Entrada
 * suave. Impecable en ambos temas (el texto usa tokens de contenido, nunca
 * dorado pálido sobre crema).
 */

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  actionIcon?: LucideIcon;
  /** Tamaño del bloque: `sm` para paneles laterales, `md` para zonas grandes. */
  size?: "sm" | "md";
  tone?: "brand" | "accent";
  className?: string;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  actionIcon,
  size = "md",
  tone = "brand",
  className,
}: EmptyStateProps) {
  const reduced = useReducedMotion();

  const haloColor = tone === "brand" ? "var(--brand)" : "var(--accent)";

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        size === "md" ? "px-6 py-14" : "px-5 py-10",
        className,
      )}
    >
      {/* Ícono con halo que respira */}
      <motion.div
        initial={reduced ? false : { opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="relative mb-5"
      >
        <span
          aria-hidden
          className="absolute inset-0 -z-10 animate-breathe rounded-full blur-2xl"
          style={{
            background: `radial-gradient(circle, rgb(${haloColor} / 0.55) 0%, transparent 70%)`,
          }}
        />
        <div
          className={cn(
            "grid place-items-center rounded-2xl ring-1",
            size === "md" ? "h-16 w-16" : "h-14 w-14",
            tone === "brand"
              ? "bg-brand/12 text-brand ring-brand/25"
              : "bg-accent/12 text-accent ring-accent/25",
          )}
        >
          <Icon
            className={cn(size === "md" ? "h-8 w-8" : "h-7 w-7")}
            strokeWidth={1.6}
          />
        </div>
      </motion.div>

      <motion.h3
        initial={reduced ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "font-semibold text-content",
          size === "md" ? "text-base" : "text-sm",
        )}
      >
        {title}
      </motion.h3>

      <motion.p
        initial={reduced ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.14, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "mt-1.5 max-w-sm text-content-muted",
          size === "md" ? "text-sm" : "text-xs leading-relaxed",
        )}
      >
        {description}
      </motion.p>

      {actionLabel && (
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="mt-5"
        >
          <Button
            href={actionHref}
            onClick={onAction}
            size={size === "md" ? "md" : "sm"}
            icon={actionIcon}
            variant="primary"
          >
            {actionLabel}
          </Button>
        </motion.div>
      )}
    </div>
  );
}

"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Modal — cuadro flotante centrado con overlay. Entrada fade + scale/spring
 * (0.96 → 1), salida inversa. Cierra con X, overlay y Escape. Scroll interno
 * (la página de atrás no scrollea). Coherente en ambos temas, con márgenes en
 * móvil. Respeta prefers-reduced-motion.
 *
 * El cuerpo es un contenedor flex con altura acotada; el hijo maneja su propio
 * scroll/footer (ver ObraForm), de modo que los botones queden siempre a la
 * vista.
 */
export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  widthClass = "max-w-[560px]",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  widthClass?: string;
}) {
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4 sm:p-6">
          <motion.div
            className="absolute inset-0 bg-black/55 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
          />
          <motion.div
            className={cn(
              "glass-strong relative flex max-h-[88vh] w-full flex-col overflow-hidden rounded-2xl shadow-elevated",
              widthClass,
            )}
            initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            role="dialog"
            aria-modal="true"
            aria-label={title}
          >
            <header className="flex shrink-0 items-start justify-between gap-3 border-b border-line px-5 py-4">
              <div className="min-w-0">
                <h2 className="truncate text-base font-semibold text-content">
                  {title}
                </h2>
                {subtitle && (
                  <p className="mt-0.5 truncate text-xs text-content-muted">
                    {subtitle}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-content-muted transition-colors hover:bg-surface-2 hover:text-content"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            {/* Cuerpo: contenedor flex acotado; el hijo scrollea internamente. */}
            <div className="flex min-h-0 flex-1 flex-col">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

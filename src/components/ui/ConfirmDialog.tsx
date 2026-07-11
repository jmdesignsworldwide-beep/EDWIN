"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/primitives";

/**
 * ConfirmDialog — confirmación centrada y elegante para acciones destructivas.
 * Ambos temas, respeta reduced-motion.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Eliminar",
  cancelLabel = "Cancelar",
  loading = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const reduced = useReducedMotion();

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] grid place-items-center p-4">
          <motion.div
            className="absolute inset-0 bg-black/55 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={loading ? undefined : onCancel}
          />
          <motion.div
            className="glass-strong relative w-full max-w-sm rounded-2xl p-6 shadow-elevated"
            initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            role="alertdialog"
            aria-modal="true"
            aria-label={title}
          >
            <div className="mb-3 grid h-11 w-11 place-items-center rounded-xl bg-danger/12 text-danger ring-1 ring-danger/25">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-content">{title}</h3>
            <p className="mt-1.5 text-sm text-content-muted">{description}</p>

            <div className="mt-6 flex justify-end gap-2.5">
              <Button variant="secondary" size="sm" onClick={onCancel} disabled={loading}>
                {cancelLabel}
              </Button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={loading}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-danger px-3.5 text-xs font-semibold text-white transition-transform hover:scale-[1.03] active:scale-95 disabled:opacity-70"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

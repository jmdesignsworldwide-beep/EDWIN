"use client";

import {
  motion,
  useMotionValue,
  useSpring,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import { useRef, type ReactNode, type MouseEvent } from "react";
import { cn } from "@/lib/utils";

/**
 * MagneticCard — hover elevation + subtle magnetic tilt toward the cursor.
 * Falls back to a static container under reduced-motion.
 */

type MagneticCardProps = {
  children: ReactNode;
  className?: string;
  /** Max tilt in degrees. */
  intensity?: number;
  glow?: boolean;
};

export function MagneticCard({
  children,
  className,
  intensity = 6,
  glow = false,
}: MagneticCardProps) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);

  const rx = useSpring(useTransform(my, [-0.5, 0.5], [intensity, -intensity]), {
    stiffness: 220,
    damping: 18,
  });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-intensity, intensity]), {
    stiffness: 220,
    damping: 18,
  });

  function handleMove(e: MouseEvent<HTMLDivElement>) {
    if (reduced || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    mx.set((e.clientX - rect.left) / rect.width - 0.5);
    my.set((e.clientY - rect.top) / rect.height - 0.5);
  }

  function reset() {
    mx.set(0);
    my.set(0);
  }

  if (reduced) {
    return (
      <div
        className={cn(
          "rounded-2xl bg-surface shadow-card transition-shadow hover:shadow-elevated",
          glow && "hover:shadow-glow",
          className,
        )}
      >
        {children}
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 900 }}
      whileHover={{ scale: 1.02, y: -4 }}
      transition={{ type: "spring", stiffness: 320, damping: 24 }}
      className={cn(
        "rounded-2xl bg-surface shadow-card will-change-transform hover:shadow-elevated",
        glow && "hover:shadow-glow",
        className,
      )}
    >
      {children}
    </motion.div>
  );
}

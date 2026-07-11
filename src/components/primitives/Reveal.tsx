"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { ReactNode } from "react";
import { STAGGER, EASE } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/**
 * Reveal — cascade entrance. Wrap a list in <Stagger> and each <Reveal> child
 * animates in sequence (60–80ms) with a soft spring. Honors reduced-motion.
 */

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 26, mass: 0.8 },
  },
};

type StaggerProps = {
  children: ReactNode;
  className?: string;
  /** Delay before the cascade begins. */
  delayChildren?: number;
  /** Gap between children (defaults to ~70ms). */
  stagger?: number;
  /** Animate on mount (default) or when scrolled into view. */
  inView?: boolean;
};

export function Stagger({
  children,
  className,
  delayChildren = 0.05,
  stagger = STAGGER.base,
  inView = false,
}: StaggerProps) {
  const reduced = useReducedMotion();

  const container: Variants = {
    hidden: {},
    show: {
      transition: reduced
        ? undefined
        : { staggerChildren: stagger, delayChildren },
    },
  };

  return (
    <motion.div
      className={className}
      variants={container}
      initial="hidden"
      {...(inView
        ? { whileInView: "show", viewport: { once: true, margin: "-10%" } }
        : { animate: "show" })}
    >
      {children}
    </motion.div>
  );
}

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Extra delay for standalone use (outside a <Stagger>). */
  delay?: number;
  /** Standalone reveal on mount without a parent Stagger. */
  standalone?: boolean;
  y?: number;
};

export function Reveal({
  children,
  className,
  delay = 0,
  standalone = false,
  y = 16,
}: RevealProps) {
  const reduced = useReducedMotion();

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  if (standalone) {
    return (
      <motion.div
        className={className}
        initial={{ opacity: 0, y }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.5,
          delay,
          ease: EASE.out,
        }}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div className={cn(className)} variants={itemVariants}>
      {children}
    </motion.div>
  );
}

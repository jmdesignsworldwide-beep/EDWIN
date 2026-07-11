/**
 * Centralized design tokens (source of truth mirrored by CSS variables in
 * globals.css and Tailwind). Import these when you need token values inside
 * TypeScript — e.g. animation configs or inline styles — instead of hardcoding.
 */

export const BRAND = {
  /** Hard-hat gold */
  gold: "#f0b429",
  goldSoft: "#facd60",
  emerald: "#10b981",
  emeraldSoft: "#34d399",
} as const;

/** Framer Motion spring presets used across the system. */
export const SPRING = {
  soft: { type: "spring", stiffness: 260, damping: 26, mass: 0.9 },
  snappy: { type: "spring", stiffness: 420, damping: 30 },
  gentle: { type: "spring", stiffness: 180, damping: 24 },
} as const;

/** Cascade timing for staggered reveals (60–80ms feel). */
export const STAGGER = {
  fast: 0.06,
  base: 0.07,
  slow: 0.08,
} as const;

export const EASE = {
  out: [0.16, 1, 0.3, 1] as const,
  inOut: [0.65, 0, 0.35, 1] as const,
};

"use client";

import { motion } from "framer-motion";

/**
 * template.tsx remounts on every navigation, so this gives each section a
 * smooth enter transition. Combined with AnimatePresence used inside the
 * header/drawer, section changes feel fluid. Reduced-motion users get an
 * instant swap (the transform is tiny and the global media query neutralizes
 * animation durations).
 */
export default function AppTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

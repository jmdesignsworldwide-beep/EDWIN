"use client";

import { ThemeProvider as NextThemeProvider } from "next-themes";
import type { ReactNode } from "react";

/**
 * Wraps next-themes with our defaults: class strategy (matches
 * tailwind darkMode: "class"), preference remembered in localStorage,
 * dark as the premium default.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      storageKey="edwin-theme"
      disableTransitionOnChange
    >
      {children}
    </NextThemeProvider>
  );
}

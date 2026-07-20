"use client";

import { Menu, Search } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { LiveBackupIndicator } from "./LiveBackupIndicator";
import { NotificationBell } from "./NotificationBell";
import type { ShellUser } from "./Shell";

function initials(nombre: string): string {
  const parts = nombre.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

/**
 * Header — search, live-backup indicator, notifications, theme toggle, cuenta.
 * Sticky, glassy. Mobile shows a menu button to open the sidebar drawer.
 */
export function Header({ onMenu, user }: { onMenu: () => void; user: ShellUser }) {
  return (
    <header className="glass sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line px-4 sm:px-6">
      <button
        type="button"
        onClick={onMenu}
        className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-content-muted hover:bg-surface-2 lg:hidden"
        aria-label="Abrir menú"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-subtle" />
        <input
          type="search"
          placeholder="Buscar obras, materiales, personal…"
          aria-label="Buscar"
          className="h-10 w-full rounded-xl border border-line bg-surface/60 pl-9 pr-3 text-sm text-content placeholder:text-content-subtle transition-colors focus:border-brand/50 focus:bg-surface focus:outline-none"
        />
      </div>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <LiveBackupIndicator className="hidden xs:inline-flex" />

        {/* Notifications */}
        <NotificationBell />

        <ThemeToggle />

        {/* Cuenta */}
        <Link
          href="/cambiar-clave"
          className="grid h-9 w-9 place-items-center rounded-full bg-brand-gradient text-sm font-bold text-brand-ink shadow-glow"
          aria-label="Mi cuenta"
          title={`${user.nombre} · cambiar contraseña`}
        >
          {initials(user.nombre)}
        </Link>
      </div>
    </header>
  );
}

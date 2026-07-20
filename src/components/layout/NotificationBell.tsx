"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Bell } from "lucide-react";
import { getUnreadCount } from "@/app/(app)/notificaciones/actions";

/**
 * Campanita del header con contador de no leídas en vivo. Capa confiable: no
 * depende de permisos del navegador ni de push. Lee del centro de notificaciones.
 */
export function NotificationBell() {
  const reduced = useReducedMotion();
  const [count, setCount] = useState(0);

  useEffect(() => {
    let alive = true;
    getUnreadCount().then((n) => alive && setCount(n)).catch(() => {});
    return () => { alive = false; };
  }, []);

  return (
    <Link
      href="/notificaciones"
      className="relative grid h-9 w-9 place-items-center rounded-full border border-line bg-surface/70 text-content-muted transition-colors hover:border-brand/40 hover:text-brand"
      aria-label={count > 0 ? `Notificaciones (${count} sin leer)` : "Notificaciones"}
    >
      <motion.span
        animate={count > 0 && !reduced ? { rotate: [0, -12, 10, -6, 4, 0] } : {}}
        transition={{ duration: 0.9, repeat: Infinity, repeatDelay: 4 }}
        style={{ transformOrigin: "top center" }}
      >
        <Bell className="h-[18px] w-[18px]" />
      </motion.span>
      {count > 0 && (
        <span className="absolute -right-1 -top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-danger px-1 text-[10px] font-bold text-white ring-2 ring-bg">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}

import "server-only";

import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

/**
 * Hash de contraseñas con scrypt (node:crypto). Formato:
 *   scrypt$<salt_hex>$<hash_hex>
 * Nunca se guarda ni se registra la contraseña en texto plano.
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

/** Verifica una contraseña contra el hash almacenado (comparación segura). */
export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  try {
    const salt = Buffer.from(parts[1], "hex");
    const expected = Buffer.from(parts[2], "hex");
    const actual = scryptSync(password, salt, expected.length);
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

/** Genera una contraseña temporal legible (para altas / resets). */
export function generateTempPassword(): string {
  // Sin caracteres ambiguos; suficiente entropía para uso temporal.
  const chars = "abcdefghijkmnpqrstuvwxyz23456789";
  const bytes = randomBytes(10);
  let out = "";
  for (let i = 0; i < bytes.length; i++) out += chars[bytes[i] % chars.length];
  return `${out.slice(0, 5)}-${out.slice(5)}`;
}

/**
 * Constante de sesión compartida. Módulo neutro (sin server-only ni
 * next/headers) para que lo pueda importar el middleware (edge) además del
 * gate de servidor.
 */
export const SESSION_COOKIE = "edwin_session";

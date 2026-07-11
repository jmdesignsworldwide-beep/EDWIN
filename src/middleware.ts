import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/session-config";

/**
 * Middleware de acceso: sin cookie de sesión no se entra a la app. Redirige a
 * /login. Si ya hay sesión y visita /login, lo manda al panel.
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasSession = Boolean(req.cookies.get(SESSION_COOKIE)?.value);
  const isLogin = pathname === "/login";

  // Sin cookie no se entra a la app (fast path). La validación real de la
  // firma + usuario activo la hace el layout server-side (getSessionUser);
  // si la cookie es inválida, el layout redirige a /login. Por eso NO
  // redirigimos /login → /dashboard aquí (evita bucles con cookies inválidas):
  // eso lo decide /login server-side solo cuando la sesión es válida.
  if (!hasSession && !isLogin) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Corre en todo excepto assets estáticos y el endpoint interno de Next.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};

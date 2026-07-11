import { redirect } from "next/navigation";

/**
 * Raíz: el middleware ya redirige a /login si no hay sesión. Con sesión,
 * llevamos al panel.
 */
export default function Home() {
  redirect("/dashboard");
}

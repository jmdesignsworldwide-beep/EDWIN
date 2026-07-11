import { redirect } from "next/navigation";

/**
 * Tanda 1: sin auth real todavía. La raíz lleva al login. Cuando se conecte
 * Supabase Auth, aquí se validará la sesión y se redirigirá al panel.
 */
export default function Home() {
  redirect("/login");
}

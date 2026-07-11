import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { listUsuarios } from "./actions";
import { UsuariosView } from "./UsuariosView";

export const metadata: Metadata = { title: "Usuarios" };

export const dynamic = "force-dynamic";

export default async function UsuariosPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.rol !== "admin") redirect("/dashboard");

  const { usuarios, error } = await listUsuarios();
  return <UsuariosView usuarios={usuarios} currentUserId={user.id} loadError={error} />;
}

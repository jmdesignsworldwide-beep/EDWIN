import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { Shell } from "@/components/layout/Shell";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <Shell
      user={{
        nombre: user.nombre,
        email: user.email,
        isAdmin: user.rol === "admin",
      }}
    >
      {children}
    </Shell>
  );
}

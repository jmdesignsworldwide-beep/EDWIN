import type { Metadata } from "next";
import { CambiarClaveForm } from "./CambiarClaveForm";

export const metadata: Metadata = { title: "Cambiar contraseña" };

export const dynamic = "force-dynamic";

export default function CambiarClavePage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <CambiarClaveForm />
    </div>
  );
}

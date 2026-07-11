import type { Metadata } from "next";
import { listProveedores } from "./actions";
import { listObrasResumen } from "../obras/actions";
import { ProveedoresView } from "./ProveedoresView";

export const metadata: Metadata = { title: "Proveedores" };

export const dynamic = "force-dynamic";

export default async function ProveedoresPage() {
  const [{ proveedores, configured, error }, obras] = await Promise.all([
    listProveedores(),
    listObrasResumen(),
  ]);
  return (
    <ProveedoresView
      proveedores={proveedores}
      obras={obras}
      configured={configured}
      loadError={error}
    />
  );
}

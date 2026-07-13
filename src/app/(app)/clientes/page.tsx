import type { Metadata } from "next";
import { listClientes } from "./actions";
import { ClientesView } from "./ClientesView";

export const metadata: Metadata = { title: "Clientes" };

export const dynamic = "force-dynamic";

export default async function ClientesPage() {
  const { clientes, incompletos, configured, error } = await listClientes();
  return (
    <ClientesView
      clientes={clientes}
      incompletos={incompletos}
      configured={configured}
      loadError={error}
    />
  );
}

import type { Metadata } from "next";
import { listPrestamos, listVencimientos } from "./actions";
import { listObrasResumen } from "../obras/actions";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { PrestamosView } from "./PrestamosView";

export const metadata: Metadata = { title: "Préstamos" };

export const dynamic = "force-dynamic";

export default async function PrestamosPage() {
  const [prestamos, vencimientos, obras] = await Promise.all([
    listPrestamos(),
    listVencimientos(7),
    listObrasResumen(),
  ]);
  return <PrestamosView prestamos={prestamos} vencimientos={vencimientos} obras={obras} configured={isSupabaseConfigured()} />;
}

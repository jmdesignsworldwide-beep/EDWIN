import type { Metadata } from "next";
import { listObrasResumen } from "../obras/actions";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { AsistenciaPicker } from "./AsistenciaPicker";

export const metadata: Metadata = { title: "Asistencia" };

export const dynamic = "force-dynamic";

export default async function AsistenciaPage() {
  const obras = await listObrasResumen();
  return <AsistenciaPicker obras={obras} configured={isSupabaseConfigured()} />;
}

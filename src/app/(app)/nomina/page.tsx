import type { Metadata } from "next";
import { listNominas } from "./actions";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { NominaView } from "./NominaView";

export const metadata: Metadata = { title: "Nómina" };

export const dynamic = "force-dynamic";

export default async function NominaPage() {
  const nominas = await listNominas();
  return <NominaView nominas={nominas} configured={isSupabaseConfigured()} />;
}

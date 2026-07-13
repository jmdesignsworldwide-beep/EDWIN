import type { Metadata } from "next";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { NuevaNominaView } from "./NuevaNominaView";

export const metadata: Metadata = { title: "Nueva nómina" };

export const dynamic = "force-dynamic";

export default function NuevaNominaPage() {
  return <NuevaNominaView configured={isSupabaseConfigured()} />;
}

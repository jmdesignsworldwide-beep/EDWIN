import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getNomina } from "../actions";
import { getSessionUser } from "@/lib/auth";
import { NominaDetalle } from "./NominaDetalle";

export const metadata: Metadata = { title: "Nómina" };

export const dynamic = "force-dynamic";

export default async function NominaDetallePage({
  params,
}: {
  params: { id: string };
}) {
  const [nomina, user] = await Promise.all([getNomina(params.id), getSessionUser()]);
  if (!nomina) notFound();
  return <NominaDetalle nomina={nomina} isAdmin={user?.rol === "admin"} />;
}

import type { Metadata } from "next";
import { getDashboard } from "./actions";
import { DashboardView } from "./DashboardView";

export const metadata: Metadata = { title: "Sala de Mando" };

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const data = await getDashboard();
  return <DashboardView data={data} />;
}

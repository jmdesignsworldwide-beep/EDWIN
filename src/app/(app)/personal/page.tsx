import type { Metadata } from "next";
import { listPersonal } from "./actions";
import { PersonalView } from "./PersonalView";

export const metadata: Metadata = { title: "Personal" };

export const dynamic = "force-dynamic";

export default async function PersonalPage() {
  const { personal, configured, error } = await listPersonal();
  return <PersonalView personal={personal} configured={configured} loadError={error} />;
}

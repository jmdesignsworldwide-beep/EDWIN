import type { Metadata } from "next";
import { listPersonal } from "./actions";
import { listObrasResumen } from "../obras/actions";
import { PersonalView } from "./PersonalView";

export const metadata: Metadata = { title: "Personal" };

export const dynamic = "force-dynamic";

export default async function PersonalPage({
  searchParams,
}: {
  searchParams?: { persona?: string };
}) {
  const [{ personal, configured, error }, obras] = await Promise.all([
    listPersonal(),
    listObrasResumen(),
  ]);
  return (
    <PersonalView
      personal={personal}
      obras={obras}
      configured={configured}
      loadError={error}
      initialPersonaId={searchParams?.persona}
    />
  );
}

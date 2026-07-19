import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPrestamo } from "../actions";
import { PrestamoDetalle } from "./PrestamoDetalle";

export const metadata: Metadata = { title: "Préstamo" };

export const dynamic = "force-dynamic";

export default async function PrestamoDetallePage({ params }: { params: { id: string } }) {
  const prestamo = await getPrestamo(params.id);
  if (!prestamo) notFound();
  return <PrestamoDetalle prestamo={prestamo} />;
}

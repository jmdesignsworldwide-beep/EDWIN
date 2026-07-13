"use client";

import Link from "next/link";
import { CalendarCheck, HardHat, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Reveal, Stagger, EmptyState, MagneticCard } from "@/components/primitives";

export function AsistenciaPicker({
  obras,
  configured,
}: {
  obras: { id: string; nombre: string }[];
  configured: boolean;
}) {
  return (
    <>
      <PageHeader title="Asistencia" subtitle="Elige una obra para pasar lista del día" />

      {!configured || obras.length === 0 ? (
        <Reveal standalone>
          <div className="rounded-2xl border border-line bg-surface/50 shadow-card">
            <EmptyState
              icon={CalendarCheck}
              title={configured ? "Aún no hay obras" : "Falta conectar Supabase"}
              description={
                configured
                  ? "Registra una obra y asígnale personal para poder pasar lista."
                  : "En cuanto se configuren las llaves podrás pasar lista."
              }
              actionLabel={configured ? "Ir a Obras" : undefined}
              actionHref={configured ? "/obras" : undefined}
              actionIcon={HardHat}
            />
          </div>
        </Reveal>
      ) : (
        <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {obras.map((o) => (
            <Reveal key={o.id}>
              <Link href={`/obras/${o.id}?vista=asistencia`}>
                <MagneticCard className="p-5" intensity={4}>
                  <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand/12 text-brand ring-1 ring-brand/25">
                      <HardHat className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-base font-semibold text-content">{o.nombre}</span>
                      <span className="text-xs text-content-subtle">Pasar lista</span>
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-content-subtle" />
                  </div>
                </MagneticCard>
              </Link>
            </Reveal>
          ))}
        </Stagger>
      )}
    </>
  );
}

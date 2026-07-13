"use client";

import Link from "next/link";
import { Wallet, Plus, Database, Users, ArrowRight, CalendarRange } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Reveal, Stagger, Button, EmptyState, MagneticCard } from "@/components/primitives";
import {
  NOMINA_ESTADO_BADGE,
  type Nomina,
} from "@/lib/proyectos/types";
import { formatMoney, cn } from "@/lib/utils";

function fmtFecha(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("es-DO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function NominaView({
  nominas,
  configured,
}: {
  nominas: Nomina[];
  configured: boolean;
}) {
  return (
    <>
      <PageHeader
        title="Nómina"
        subtitle="El sistema calcula y registra la nómina a partir de la asistencia. No ejecuta pagos."
        action={
          configured ? (
            <Link href="/nomina/nueva">
              <Button icon={Plus}>Nueva nómina</Button>
            </Link>
          ) : undefined
        }
      />

      {!configured ? (
        <Reveal standalone>
          <div className="rounded-2xl border border-line bg-surface/50 shadow-card">
            <EmptyState
              icon={Database}
              title="Falta conectar Supabase"
              description="En cuanto se configuren las llaves, aquí podrás calcular y registrar la nómina."
              tone="accent"
            />
          </div>
        </Reveal>
      ) : nominas.length === 0 ? (
        <Reveal standalone>
          <div className="rounded-2xl border border-line bg-surface/50 shadow-card">
            <EmptyState
              icon={Wallet}
              title="Aún no hay nóminas"
              description="Calcula tu primera nómina eligiendo un rango de fechas. Se toma de la asistencia y el jornal de cada persona."
              actionLabel="Nueva nómina"
              actionIcon={Plus}
              onAction={() => {
                window.location.href = "/nomina/nueva";
              }}
            />
          </div>
        </Reveal>
      ) : (
        <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {nominas.map((n) => {
            const est = NOMINA_ESTADO_BADGE[n.estado];
            return (
              <Reveal key={n.id}>
                <Link href={`/nomina/${n.id}`} className="block">
                  <MagneticCard className="cursor-pointer p-5" intensity={4}>
                    <div className="flex items-start justify-between gap-3">
                      <p className="flex min-w-0 flex-1 items-center gap-1.5 text-sm font-semibold text-content">
                        <CalendarRange className="h-4 w-4 shrink-0 text-content-subtle" />
                        <span className="truncate">
                          {fmtFecha(n.desde)} — {fmtFecha(n.hasta)}
                        </span>
                      </p>
                      <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold", est.badge)}>
                        {est.label}
                      </span>
                    </div>

                    <p className="mt-4 text-2xl font-bold tabular-nums text-content">
                      {formatMoney(n.total)}
                    </p>

                    <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
                      <span className="flex items-center gap-1.5 text-xs text-content-subtle">
                        <Users className="h-3.5 w-3.5" />
                        {n.personas ?? 0} {n.personas === 1 ? "persona" : "personas"}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand">
                        Ver <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </MagneticCard>
                </Link>
              </Reveal>
            );
          })}
        </Stagger>
      )}
    </>
  );
}

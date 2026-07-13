-- ============================================================
--  Módulo Asistencia · Esquema
--  Constructora Edwin Espaillat
-- ============================================================
--  Fort Knox: RLS ENABLE + FORCE + deny-all. Solo service_role (server-only).
--  Un registro = una persona, una obra, una fecha (UNIQUE) → al re-marcar se
--  actualiza (upsert), sin duplicar. FKs en cascada:
--   - persona_id → personal(id)  ON DELETE CASCADE
--   - obra_id    → proyectos(id) ON DELETE CASCADE
--  Base para NÓMINA (días × jornal): estado 'presente'=1, 'medio'=0.5,
--  'ausente'=0. El cálculo de pago NO se construye aquí.
-- ============================================================

create table if not exists public.asistencia (
  id             uuid primary key default gen_random_uuid(),
  persona_id     uuid not null references public.personal(id) on delete cascade,
  obra_id        uuid not null references public.proyectos(id) on delete cascade,
  fecha          date not null,
  estado         text not null default 'presente'
                   check (estado in ('presente', 'ausente', 'medio')),
  horas          numeric(5, 2) check (horas is null or (horas >= 0 and horas <= 24)),
  hora_entrada   time,
  hora_salida    time,
  notas          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (persona_id, obra_id, fecha)
);
comment on table public.asistencia is
  'Asistencia diaria por persona y obra. Base para nómina (días × jornal). Solo service_role.';

create index if not exists asistencia_obra_fecha_idx on public.asistencia (obra_id, fecha);
create index if not exists asistencia_persona_fecha_idx on public.asistencia (persona_id, fecha);

-- ── RLS: blindaje (deny-all para roles del navegador) ──────
alter table public.asistencia enable row level security;
alter table public.asistencia force  row level security;
drop policy if exists asistencia_deny_client_roles on public.asistencia;
create policy asistencia_deny_client_roles
  on public.asistencia for all to anon, authenticated
  using (false) with check (false);

-- ── updated_at ──────────────────────────────────────────────
drop trigger if exists trg_asistencia_updated_at on public.asistencia;
create trigger trg_asistencia_updated_at
  before update on public.asistencia
  for each row execute function public.set_updated_at();

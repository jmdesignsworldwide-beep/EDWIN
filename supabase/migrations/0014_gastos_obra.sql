-- ============================================================
--  ULTRA PRO · Tanda 1 — Panel Financiero de Obra
--  Constructora Edwin Espaillat
-- ============================================================
--  gastos_obra: gastos manuales sueltos de una obra (combustible, transporte,
--  imprevistos) que NO vienen de materiales, nómina ni compras. El gasto real
--  total se calcula en el SERVIDOR combinando:
--    materiales comprados + mano de obra (asistencia × jornal) + compras de la
--    obra + estos gastos manuales.
--
--  Fort Knox: RLS + FORCE + deny-all. Los montos son dinero: solo service_role
--  server-only. FK a la obra ON DELETE CASCADE (no deja gastos huérfanos).
-- ============================================================

create table if not exists public.gastos_obra (
  id          uuid primary key default gen_random_uuid(),
  obra_id     uuid not null references public.proyectos(id) on delete cascade,
  categoria   text not null default 'otros',
  concepto    text,
  monto       numeric(14, 2) not null default 0 check (monto >= 0),
  fecha       date not null default current_date,
  notas       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
comment on table public.gastos_obra is
  'Gastos manuales de una obra (fuera de materiales/nómina/compras). Suman al gasto real.';
create index if not exists gastos_obra_obra_idx on public.gastos_obra (obra_id, fecha desc);

-- ── RLS: blindaje total (es dinero) ────────────────────────
alter table public.gastos_obra enable row level security;
alter table public.gastos_obra force  row level security;
drop policy if exists gastos_obra_deny_client_roles on public.gastos_obra;
create policy gastos_obra_deny_client_roles
  on public.gastos_obra for all to anon, authenticated
  using (false) with check (false);

-- ── updated_at ─────────────────────────────────────────────
drop trigger if exists trg_gastos_obra_updated_at on public.gastos_obra;
create trigger trg_gastos_obra_updated_at
  before update on public.gastos_obra
  for each row execute function public.set_updated_at();

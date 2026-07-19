-- ============================================================
--  ULTRA PRO · Tanda 2 — Cobros y Pagos + Rentabilidad
--  Constructora Edwin Espaillat
-- ============================================================
--  Fuentes de verdad (sin doble conteo):
--   - Gasto real / salidas → se LEE del Panel Financiero (Tanda 1). No se
--     recalcula ni se duplica aquí.
--   - Cobros (dinero que ENTRA del cliente) → NUEVO, tabla cobros_obra.
--   - Precio de venta / costo estimado → NUEVO, columnas en proyectos.
--
--  Fort Knox: RLS + FORCE + deny-all. Los montos son dinero: solo service_role
--  server-only. Todo el cálculo ocurre en el servidor.
-- ============================================================

create table if not exists public.cobros_obra (
  id          uuid primary key default gen_random_uuid(),
  obra_id     uuid not null references public.proyectos(id) on delete cascade,
  monto       numeric(14, 2) not null default 0 check (monto >= 0),
  concepto    text,
  fecha       date not null default current_date,
  metodo      text check (metodo is null or metodo in ('efectivo', 'transferencia', 'cheque', 'otro')),
  notas       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
comment on table public.cobros_obra is
  'Cobros: dinero que el cliente le paga a Edwin por la obra (entradas de caja).';
create index if not exists cobros_obra_obra_idx on public.cobros_obra (obra_id, fecha desc);

-- Rentabilidad: lo que Edwin le cobra al cliente y lo que estima gastar.
alter table public.proyectos
  add column if not exists costo_estimado numeric(14, 2) check (costo_estimado is null or costo_estimado >= 0),
  add column if not exists precio_venta   numeric(14, 2) check (precio_venta is null or precio_venta >= 0);
comment on column public.proyectos.precio_venta is
  'Precio de venta/contrato: lo que Edwin le cobra a SU cliente por la obra.';

-- ── RLS: blindaje total (es dinero) ────────────────────────
alter table public.cobros_obra enable row level security;
alter table public.cobros_obra force  row level security;
drop policy if exists cobros_obra_deny_client_roles on public.cobros_obra;
create policy cobros_obra_deny_client_roles
  on public.cobros_obra for all to anon, authenticated
  using (false) with check (false);

-- proyectos ya tiene RLS+FORCE+deny-all; se reafirma por idempotencia.
alter table public.proyectos enable row level security;
alter table public.proyectos force  row level security;
drop policy if exists proyectos_deny_client_roles on public.proyectos;
create policy proyectos_deny_client_roles
  on public.proyectos for all to anon, authenticated
  using (false) with check (false);

-- ── updated_at (cobros) ────────────────────────────────────
drop trigger if exists trg_cobros_obra_updated_at on public.cobros_obra;
create trigger trg_cobros_obra_updated_at
  before update on public.cobros_obra
  for each row execute function public.set_updated_at();

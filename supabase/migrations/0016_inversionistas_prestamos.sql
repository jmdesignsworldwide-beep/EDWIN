-- ============================================================
--  ULTRA PRO · Tanda 3 — Inversionistas + Préstamos
--  Constructora Edwin Espaillat
-- ============================================================
--  Fuentes de verdad (sin doble conteo):
--   - Ganancia de la obra → se LEE del módulo Rentabilidad (Tanda 2). El reparto
--     a inversionistas usa esa ganancia; no la recalcula.
--   - Adelantos a empleados (pagos_empleado, Bloque 2) son distintos: aquí van
--     préstamos FORMALES con tasa/plazo/cuotas. No se duplican.
--
--  Fort Knox: RLS + FORCE + deny-all en las tres. Los montos son dinero: solo
--  service_role server-only. Todo el cálculo ocurre en el servidor.
-- ============================================================

-- ── 1) Inversionistas por obra ─────────────────────────────
create table if not exists public.inversionistas (
  id          uuid primary key default gen_random_uuid(),
  obra_id     uuid not null references public.proyectos(id) on delete cascade,
  nombre      text not null,
  cliente_id  uuid references public.clientes(id) on delete set null,
  monto       numeric(14, 2) not null default 0 check (monto >= 0),
  fecha       date not null default current_date,
  -- % de participación forzado a mano (si Edwin lo acordó distinto). Null = auto.
  pct_manual  numeric(6, 2) check (pct_manual is null or (pct_manual >= 0 and pct_manual <= 100)),
  notas       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
comment on table public.inversionistas is
  'Inversionistas de una obra. El % se calcula por monto o se fuerza a mano; el reparto lee la ganancia de Rentabilidad.';
create index if not exists inversionistas_obra_idx on public.inversionistas (obra_id);

-- ── 2) Préstamos (por pagar / por cobrar) ──────────────────
create table if not exists public.prestamos (
  id            uuid primary key default gen_random_uuid(),
  tipo          text not null default 'por_pagar'
                  check (tipo in ('por_pagar', 'por_cobrar')),
  contraparte   text not null,                 -- prestamista (por pagar) o deudor (por cobrar)
  obra_id       uuid references public.proyectos(id) on delete set null,
  capital       numeric(14, 2) not null default 0 check (capital >= 0),
  tasa          numeric(6, 2) not null default 0 check (tasa >= 0),  -- % interés simple sobre el capital
  fecha_inicio  date not null default current_date,
  estado        text not null default 'activo'
                  check (estado in ('activo', 'saldado', 'anulado')),
  notas         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
comment on table public.prestamos is
  'Préstamos formales: por_pagar (Edwin pidió) o por_cobrar (Edwin dio). Interés simple sobre el capital.';
create index if not exists prestamos_tipo_idx on public.prestamos (tipo, estado);
create index if not exists prestamos_obra_idx on public.prestamos (obra_id);

-- ── 3) Cuotas de un préstamo ───────────────────────────────
create table if not exists public.prestamo_cuotas (
  id          uuid primary key default gen_random_uuid(),
  prestamo_id uuid not null references public.prestamos(id) on delete cascade,
  numero      int not null default 1,
  monto       numeric(14, 2) not null default 0 check (monto >= 0),
  vence       date not null,
  pagada      boolean not null default false,
  fecha_pago  date,
  created_at  timestamptz not null default now()
);
comment on table public.prestamo_cuotas is
  'Cuotas de un préstamo. Los vencimientos no pagados alimentan alertas (Dashboard/Notificaciones).';
create index if not exists prestamo_cuotas_prestamo_idx on public.prestamo_cuotas (prestamo_id, numero);
create index if not exists prestamo_cuotas_vence_idx on public.prestamo_cuotas (vence) where pagada = false;

-- ── RLS: blindaje total (es dinero) ────────────────────────
do $$
declare t text;
begin
  foreach t in array array['inversionistas', 'prestamos', 'prestamo_cuotas']
  loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('alter table public.%I force row level security;', t);
    execute format('drop policy if exists %I on public.%I;', t || '_deny_client_roles', t);
    execute format(
      'create policy %I on public.%I for all to anon, authenticated using (false) with check (false);',
      t || '_deny_client_roles', t);
  end loop;
end $$;

-- ── updated_at (inversionistas, prestamos) ─────────────────
drop trigger if exists trg_inversionistas_updated_at on public.inversionistas;
create trigger trg_inversionistas_updated_at
  before update on public.inversionistas
  for each row execute function public.set_updated_at();

drop trigger if exists trg_prestamos_updated_at on public.prestamos;
create trigger trg_prestamos_updated_at
  before update on public.prestamos
  for each row execute function public.set_updated_at();

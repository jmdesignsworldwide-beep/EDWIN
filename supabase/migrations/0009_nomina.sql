-- ============================================================
--  Módulo Nómina · Esquema
--  Constructora Edwin Espaillat
-- ============================================================
--  El sistema CALCULA y REGISTRA la nómina. NO ejecuta pagos (sin bancos ni
--  pasarelas). Marcar "pagada" es solo una etiqueta contable.
--
--  Fort Knox (máximo — es dinero): RLS ENABLE + FORCE + deny-all. Todo el
--  cálculo de montos ocurre en el servidor (service_role). El cliente no puede
--  alterar montos. Una nómina guardada es un registro contable: se anula, no
--  se borra a la ligera.
--
--  Cada línea GUARDA una foto (snapshot) del cálculo al cierre: días, jornal,
--  base, extras, descuentos, neto y el desglose de conceptos. Así el registro
--  no cambia aunque después cambie el jornal o la asistencia.
-- ============================================================

create table if not exists public.nominas (
  id            uuid primary key default gen_random_uuid(),
  desde         date not null,
  hasta         date not null,
  estado        text not null default 'pendiente'
                  check (estado in ('pendiente', 'pagada', 'anulada')),
  total         numeric(14, 2) not null default 0 check (total >= 0),
  fecha_cierre  timestamptz not null default now(),
  fecha_pago    date,
  metodo_pago   text check (metodo_pago is null or metodo_pago in ('efectivo', 'transferencia', 'otro')),
  notas         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  check (hasta >= desde)
);
comment on table public.nominas is
  'Nóminas cerradas (registro contable). El sistema calcula y registra, NO paga.';
create index if not exists nominas_fecha_idx on public.nominas (fecha_cierre desc);

create table if not exists public.nomina_lineas (
  id              uuid primary key default gen_random_uuid(),
  nomina_id       uuid not null references public.nominas(id) on delete cascade,
  persona_id      uuid references public.personal(id) on delete set null,
  persona_nombre  text not null,           -- snapshot (sobrevive si se borra la persona)
  dias            numeric(6, 2) not null default 0,
  jornal          numeric(14, 2) not null default 0,
  jornal_tipo     text not null default 'dia',
  jornal_diario   numeric(14, 2) not null default 0,  -- jornal convertido a /día (transparencia)
  base            numeric(14, 2) not null default 0,
  extras          numeric(14, 2) not null default 0,
  descuentos      numeric(14, 2) not null default 0,
  neto            numeric(14, 2) not null default 0,
  conceptos       jsonb not null default '[]'::jsonb,  -- [{tipo:'extra'|'descuento', concepto, monto}]
  created_at      timestamptz not null default now()
);
comment on table public.nomina_lineas is
  'Línea de nómina por persona con el desglose congelado al cierre.';
create index if not exists nomina_lineas_nomina_idx on public.nomina_lineas (nomina_id);
create index if not exists nomina_lineas_persona_idx on public.nomina_lineas (persona_id);

-- ── RLS: blindaje total (montos = dinero) ──────────────────
alter table public.nominas enable row level security;
alter table public.nominas force  row level security;
drop policy if exists nominas_deny_client_roles on public.nominas;
create policy nominas_deny_client_roles
  on public.nominas for all to anon, authenticated
  using (false) with check (false);

alter table public.nomina_lineas enable row level security;
alter table public.nomina_lineas force  row level security;
drop policy if exists nomina_lineas_deny_client_roles on public.nomina_lineas;
create policy nomina_lineas_deny_client_roles
  on public.nomina_lineas for all to anon, authenticated
  using (false) with check (false);

-- ── updated_at (nóminas) ───────────────────────────────────
drop trigger if exists trg_nominas_updated_at on public.nominas;
create trigger trg_nominas_updated_at
  before update on public.nominas
  for each row execute function public.set_updated_at();

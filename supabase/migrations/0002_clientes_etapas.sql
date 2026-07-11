-- ============================================================
--  Ajuste · Esquema: CLIENTES + ETAPAS (avance por etapas)
--  Constructora Edwin Espaillat
-- ============================================================
--  Fort Knox: RLS ENABLE + FORCE + deny-all en las tablas nuevas.
--  Solo el service_role (server-only) accede. FK coherentes:
--   - proyectos.cliente_id → clientes(id)  ON DELETE SET NULL
--   - etapas.obra_id       → proyectos(id) ON DELETE CASCADE
-- ============================================================

-- ── CLIENTES ────────────────────────────────────────────────
create table if not exists public.clientes (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null,
  telefono    text,
  cedula_rnc  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
comment on table public.clientes is
  'Clientes/propietarios de las obras de Edwin. Acceso solo vía service_role.';
create index if not exists clientes_nombre_idx on public.clientes (nombre);

-- ── ETAPAS (base del futuro módulo Etapas + Gantt) ─────────
create table if not exists public.etapas (
  id            uuid primary key default gen_random_uuid(),
  obra_id       uuid not null references public.proyectos(id) on delete cascade,
  nombre        text not null,
  completada    boolean not null default false,
  orden         integer not null default 0,
  -- Espacio reservado para el Gantt (se usará después, no rehacer):
  fecha_inicio  date,
  fecha_fin     date,
  porcentaje    integer check (porcentaje is null or (porcentaje between 0 and 100)),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
comment on table public.etapas is
  'Etapas de una obra. El avance de la obra se calcula de aquí. Acceso solo vía service_role.';
create index if not exists etapas_obra_orden_idx on public.etapas (obra_id, orden);

-- ── OBRA → CLIENTE ─────────────────────────────────────────
alter table public.proyectos
  add column if not exists cliente_id uuid
    references public.clientes(id) on delete set null;
create index if not exists proyectos_cliente_id_idx on public.proyectos (cliente_id);

-- ── RLS: blindaje (deny-all para roles del navegador) ──────
alter table public.clientes enable row level security;
alter table public.clientes force  row level security;
drop policy if exists clientes_deny_client_roles on public.clientes;
create policy clientes_deny_client_roles
  on public.clientes for all to anon, authenticated
  using (false) with check (false);

alter table public.etapas enable row level security;
alter table public.etapas force  row level security;
drop policy if exists etapas_deny_client_roles on public.etapas;
create policy etapas_deny_client_roles
  on public.etapas for all to anon, authenticated
  using (false) with check (false);

-- ── updated_at (reusa public.set_updated_at de la migración 0001) ──
drop trigger if exists trg_clientes_updated_at on public.clientes;
create trigger trg_clientes_updated_at
  before update on public.clientes
  for each row execute function public.set_updated_at();

drop trigger if exists trg_etapas_updated_at on public.etapas;
create trigger trg_etapas_updated_at
  before update on public.etapas
  for each row execute function public.set_updated_at();

-- ── Hardening: search_path fijo en la función (Security Advisor limpio) ──
alter function public.set_updated_at() set search_path = pg_catalog;

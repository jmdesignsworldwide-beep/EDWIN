-- ============================================================
--  Tanda 6 · Esquema: PROVEEDORES + COMPRAS
--  Constructora Edwin Espaillat
-- ============================================================
--  Fort Knox: RLS ENABLE + FORCE + deny-all en las tablas nuevas.
--  Relaciones:
--   - compras.proveedor_id  → proveedores(id) ON DELETE CASCADE   (obligatorio)
--   - compras.obra_id       → proyectos(id)   ON DELETE SET NULL  (opcional)
--   - materiales.proveedor_id → proveedores(id) ON DELETE SET NULL (opcional)
--  Montos = gasto de material de la OBRA de Edwin (no cobros ni contratos).
--  Modelo abierto para, más adelante, enlazar líneas de materiales u órdenes
--  formales a una compra (no se construye ahora).
-- ============================================================

-- ── PROVEEDORES ─────────────────────────────────────────────
create table if not exists public.proveedores (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null,
  telefono    text,
  rnc_cedula  text,
  categoria   text,
  contacto    text,
  notas       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
comment on table public.proveedores is
  'Proveedores de Edwin. Acceso solo vía service_role.';
create index if not exists proveedores_nombre_idx on public.proveedores (nombre);

-- ── COMPRAS ─────────────────────────────────────────────────
create table if not exists public.compras (
  id            uuid primary key default gen_random_uuid(),
  proveedor_id  uuid not null references public.proveedores(id) on delete cascade,
  obra_id       uuid references public.proyectos(id) on delete set null,
  fecha         date not null default now(),
  descripcion   text,
  monto         numeric(14, 2) check (monto is null or monto >= 0),
  notas         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
comment on table public.compras is
  'Compras a un proveedor (registro simple, no órdenes formales). Solo service_role.';
create index if not exists compras_proveedor_idx on public.compras (proveedor_id, fecha desc);
create index if not exists compras_obra_idx on public.compras (obra_id);

-- ── MATERIAL → PROVEEDOR (opcional) ─────────────────────────
alter table public.materiales
  add column if not exists proveedor_id uuid
    references public.proveedores(id) on delete set null;
create index if not exists materiales_proveedor_idx on public.materiales (proveedor_id);

-- ── RLS: blindaje (deny-all para roles del navegador) ──────
alter table public.proveedores enable row level security;
alter table public.proveedores force  row level security;
drop policy if exists proveedores_deny_client_roles on public.proveedores;
create policy proveedores_deny_client_roles
  on public.proveedores for all to anon, authenticated
  using (false) with check (false);

alter table public.compras enable row level security;
alter table public.compras force  row level security;
drop policy if exists compras_deny_client_roles on public.compras;
create policy compras_deny_client_roles
  on public.compras for all to anon, authenticated
  using (false) with check (false);

-- ── updated_at (reusa public.set_updated_at) ───────────────
drop trigger if exists trg_proveedores_updated_at on public.proveedores;
create trigger trg_proveedores_updated_at
  before update on public.proveedores
  for each row execute function public.set_updated_at();

drop trigger if exists trg_compras_updated_at on public.compras;
create trigger trg_compras_updated_at
  before update on public.compras
  for each row execute function public.set_updated_at();

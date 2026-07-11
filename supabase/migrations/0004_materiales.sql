-- ============================================================
--  Tanda 5 · Esquema: MATERIALES
--  Constructora Edwin Espaillat
-- ============================================================
--  Fort Knox: RLS ENABLE + FORCE + deny-all. Solo service_role accede.
--  Relaciones:
--   - obra_id  → proyectos(id) ON DELETE CASCADE  (obligatorio)
--   - etapa_id → etapas(id)    ON DELETE SET NULL (opcional: si se borra la
--        etapa, el material queda a nivel obra, no se elimina)
--  Costo = gasto de material de la OBRA de Edwin (no cobros ni contratos).
--  Modelo abierto para un futuro historial de movimientos (no se construye
--  ahora): una tabla movimientos_materiales podría referenciar material_id.
-- ============================================================

create table if not exists public.materiales (
  id                 uuid primary key default gen_random_uuid(),
  obra_id            uuid not null references public.proyectos(id) on delete cascade,
  etapa_id           uuid references public.etapas(id) on delete set null,
  nombre             text not null,
  unidad             text,
  cantidad_comprada  numeric(14, 2) check (cantidad_comprada is null or cantidad_comprada >= 0),
  cantidad_usada     numeric(14, 2) check (cantidad_usada is null or cantidad_usada >= 0),
  costo_unitario     numeric(14, 2) check (costo_unitario is null or costo_unitario >= 0),
  notas              text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
comment on table public.materiales is
  'Materiales de una obra (opcionalmente ligados a una etapa). Acceso solo vía service_role.';

create index if not exists materiales_obra_idx  on public.materiales (obra_id);
create index if not exists materiales_etapa_idx on public.materiales (etapa_id);

-- ── RLS: blindaje (deny-all para roles del navegador) ──────
alter table public.materiales enable row level security;
alter table public.materiales force  row level security;
drop policy if exists materiales_deny_client_roles on public.materiales;
create policy materiales_deny_client_roles
  on public.materiales for all to anon, authenticated
  using (false) with check (false);

-- ── updated_at (reusa public.set_updated_at, ya con search_path fijo) ──
drop trigger if exists trg_materiales_updated_at on public.materiales;
create trigger trg_materiales_updated_at
  before update on public.materiales
  for each row execute function public.set_updated_at();

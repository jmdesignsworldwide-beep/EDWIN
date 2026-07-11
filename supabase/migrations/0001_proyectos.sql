-- ============================================================
--  Tanda 3A · Esquema: PROYECTOS (obras de Edwin)
--  Constructora Edwin Espaillat
-- ============================================================
--  Seguridad Fort Knox:
--   - RLS ACTIVADO + FORCE desde la creación.
--   - SIN políticas para anon/authenticated → el anon key NO lee ni
--     escribe. Solo el service_role (server-only) accede, y bypassa RLS.
--   - Deja el Security Advisor limpio para esta tabla (RLS habilitado).
--
--  Alcance: gestiona las OBRAS de Edwin. El campo `presupuesto` es el
--  presupuesto de la OBRA, no precios de contrato de JM Design ni cobros.
-- ============================================================

create extension if not exists pgcrypto;

create table if not exists public.proyectos (
  id                  uuid primary key default gen_random_uuid(),
  nombre              text not null,
  ubicacion           text,
  cliente             text,
  estado              text not null default 'planificacion'
                        check (estado in ('planificacion', 'en_curso', 'pausada', 'terminada')),
  fecha_inicio        date,
  fecha_fin_estimada  date,
  avance              integer not null default 0
                        check (avance >= 0 and avance <= 100),
  presupuesto         numeric(14, 2)
                        check (presupuesto is null or presupuesto >= 0),
  notas               text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

comment on table public.proyectos is
  'Obras de la Constructora Edwin. Acceso solo vía service_role (server-only).';

-- Orden por creación reciente (listado del módulo Obras).
create index if not exists proyectos_created_at_idx
  on public.proyectos (created_at desc);

-- ── RLS: blindaje ──────────────────────────────────────────
alter table public.proyectos enable row level security;
alter table public.proyectos force  row level security;

-- Deny-all explícito para los roles del navegador (anon/authenticated):
-- defensa en profundidad y deja el Security Advisor sin notas. El
-- service_role (server-only) bypassa RLS, así que las server actions siguen
-- funcionando; nadie con la anon key puede leer ni escribir.
drop policy if exists proyectos_deny_client_roles on public.proyectos;
create policy proyectos_deny_client_roles
  on public.proyectos
  for all
  to anon, authenticated
  using (false)
  with check (false);

-- ── Mantener updated_at al día ─────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_proyectos_updated_at on public.proyectos;
create trigger trg_proyectos_updated_at
  before update on public.proyectos
  for each row
  execute function public.set_updated_at();

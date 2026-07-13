-- ============================================================
--  Rediseño Bloque 1 · Cliente/Empresa (tipo dinámico)
--  Constructora Edwin Espaillat
-- ============================================================
--  Expande la tabla `clientes` existente (NO la recrea). Un cliente ahora es
--  Persona o Empresa, con datos que se adaptan al tipo. El campo `nombre` sigue
--  siendo el nombre visible (persona: nombre completo; empresa: razón social) y
--  `cedula_rnc` guarda la cédula (persona) o el RNC (empresa) según el tipo.
--
--  `datos_completos` marca los clientes creados por quick-add (mínimo) para
--  empujar a Edwin a completar su perfil después.
-- ============================================================

alter table public.clientes
  add column if not exists tipo text not null default 'persona'
    check (tipo in ('persona', 'empresa')),
  add column if not exists contacto_nombre    text,
  add column if not exists contacto_telefono  text,
  add column if not exists email              text,
  add column if not exists direccion          text,
  add column if not exists datos_completos    boolean not null default false;

comment on column public.clientes.tipo is
  'persona | empresa — define qué campos y validaciones aplican.';
comment on column public.clientes.datos_completos is
  'false = creado por quick-add (faltan datos por completar).';

-- Los clientes que ya existían se consideran completos (no molestar con alertas).
update public.clientes set datos_completos = true where datos_completos = false;

-- ── RLS: reafirmar blindaje (idempotente) ──────────────────
alter table public.clientes enable row level security;
alter table public.clientes force  row level security;
drop policy if exists clientes_deny_client_roles on public.clientes;
create policy clientes_deny_client_roles
  on public.clientes for all to anon, authenticated
  using (false) with check (false);

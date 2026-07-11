-- ============================================================
--  Módulo Personal / Cuadrillas · Esquema
--  Constructora Edwin Espaillat
-- ============================================================
--  Fort Knox: RLS ENABLE + FORCE + deny-all. Solo service_role (server-only).
--  El jornal/tarifa es dato SENSIBLE: solo accesible autenticado y del lado
--  servidor; nunca se expone al navegador (RLS lo bloquea de por sí).
--  Relaciones:
--   - personal_obra.personal_id → personal(id)  ON DELETE CASCADE
--   - personal_obra.obra_id     → proyectos(id) ON DELETE CASCADE
--  Borrar una obra o una persona limpia la asignación, pero NO borra a la
--  otra parte. Único por (personal_id, obra_id) para no duplicar asignaciones.
--  Modelo preparado para una futura nómina (Asistencia × jornal); NO se
--  construye ahora.
-- ============================================================

create table if not exists public.personal (
  id            uuid primary key default gen_random_uuid(),
  nombre        text not null,
  oficio        text,
  telefono      text,
  cedula        text,
  jornal        numeric(14, 2) check (jornal is null or jornal >= 0),
  jornal_tipo   text not null default 'dia'
                  check (jornal_tipo in ('dia', 'semana', 'hora')),
  activo        boolean not null default true,
  notas         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
comment on table public.personal is
  'Personal de las obras de Edwin. Jornal = pago al trabajador (sensible). Solo service_role.';
create index if not exists personal_nombre_idx on public.personal (nombre);

create table if not exists public.personal_obra (
  id            uuid primary key default gen_random_uuid(),
  personal_id   uuid not null references public.personal(id) on delete cascade,
  obra_id       uuid not null references public.proyectos(id) on delete cascade,
  rol_en_obra   text,
  created_at    timestamptz not null default now(),
  unique (personal_id, obra_id)
);
comment on table public.personal_obra is
  'Asignación de personal a obras (muchos a muchos). Solo service_role.';
create index if not exists personal_obra_persona_idx on public.personal_obra (personal_id);
create index if not exists personal_obra_obra_idx on public.personal_obra (obra_id);

-- ── RLS: blindaje (deny-all para roles del navegador) ──────
alter table public.personal enable row level security;
alter table public.personal force  row level security;
drop policy if exists personal_deny_client_roles on public.personal;
create policy personal_deny_client_roles
  on public.personal for all to anon, authenticated
  using (false) with check (false);

alter table public.personal_obra enable row level security;
alter table public.personal_obra force  row level security;
drop policy if exists personal_obra_deny_client_roles on public.personal_obra;
create policy personal_obra_deny_client_roles
  on public.personal_obra for all to anon, authenticated
  using (false) with check (false);

-- ── updated_at (personal; la relación no lo necesita) ──────
drop trigger if exists trg_personal_updated_at on public.personal;
create trigger trg_personal_updated_at
  before update on public.personal
  for each row execute function public.set_updated_at();

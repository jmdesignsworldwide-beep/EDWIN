-- ============================================================
--  ULTRA PRO · Tanda 4 — Galería + Documentos + Bitácora + Comunicación
--  Constructora Edwin Espaillat
-- ============================================================
--  Completa el expediente de obra. Los archivos van al bucket PRIVADO 'obras'
--  (ya existente) y se sirven SOLO por URL firmada temporal desde el servidor
--  (service_role). storage.objects tiene RLS y sin políticas para anon/auth →
--  nadie sin login accede a un archivo por URL directa.
--
--  Foto compartida galería↔bitácora: una entrada de bitácora puede tener fotos
--  que son filas de fotos_obra con bitacora_id; así la MISMA foto se ve en la
--  galería y en la bitácora sin duplicar el archivo.
--
--  Fort Knox: RLS + FORCE + deny-all en las cuatro tablas.
-- ============================================================

-- ── Bitácora (se crea primero: fotos_obra la referencia) ───
create table if not exists public.bitacora_obra (
  id          uuid primary key default gen_random_uuid(),
  obra_id     uuid not null references public.proyectos(id) on delete cascade,
  texto       text not null,
  fecha       date not null default current_date,
  autor       text,                          -- snapshot del usuario que anotó
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists bitacora_obra_obra_idx on public.bitacora_obra (obra_id, fecha desc);

-- ── Fotos de la obra (galería; bitacora_id opcional) ───────
create table if not exists public.fotos_obra (
  id           uuid primary key default gen_random_uuid(),
  obra_id      uuid not null references public.proyectos(id) on delete cascade,
  path         text not null,                -- ruta en el bucket privado 'obras'
  caption      text,
  etapa_id     uuid references public.etapas(id) on delete set null,
  bitacora_id  uuid references public.bitacora_obra(id) on delete cascade,
  fecha        date not null default current_date,
  created_at   timestamptz not null default now()
);
create index if not exists fotos_obra_obra_idx on public.fotos_obra (obra_id, fecha desc);
create index if not exists fotos_obra_bitacora_idx on public.fotos_obra (bitacora_id);

-- ── Documentos (planos, contratos, permisos…) ─────────────
create table if not exists public.documentos_obra (
  id          uuid primary key default gen_random_uuid(),
  obra_id     uuid not null references public.proyectos(id) on delete cascade,
  path        text not null,
  nombre      text not null,
  tipo        text not null default 'Otro',
  notas       text,
  fecha       date not null default current_date,
  created_at  timestamptz not null default now()
);
create index if not exists documentos_obra_obra_idx on public.documentos_obra (obra_id, fecha desc);

-- ── Comunicación con el cliente ────────────────────────────
create table if not exists public.comunicaciones_obra (
  id          uuid primary key default gen_random_uuid(),
  obra_id     uuid not null references public.proyectos(id) on delete cascade,
  tipo        text not null default 'llamada'
                check (tipo in ('llamada', 'whatsapp', 'reunion', 'correo', 'otro')),
  resumen     text not null,
  notas       text,
  fecha       date not null default current_date,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists comunicaciones_obra_obra_idx on public.comunicaciones_obra (obra_id, fecha desc);

-- ── RLS: blindaje total en las cuatro ──────────────────────
do $$
declare t text;
begin
  foreach t in array array['bitacora_obra', 'fotos_obra', 'documentos_obra', 'comunicaciones_obra']
  loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('alter table public.%I force row level security;', t);
    execute format('drop policy if exists %I on public.%I;', t || '_deny_client_roles', t);
    execute format(
      'create policy %I on public.%I for all to anon, authenticated using (false) with check (false);',
      t || '_deny_client_roles', t);
  end loop;
end $$;

-- ── updated_at (bitacora, comunicaciones) ──────────────────
drop trigger if exists trg_bitacora_obra_updated_at on public.bitacora_obra;
create trigger trg_bitacora_obra_updated_at
  before update on public.bitacora_obra
  for each row execute function public.set_updated_at();

drop trigger if exists trg_comunicaciones_obra_updated_at on public.comunicaciones_obra;
create trigger trg_comunicaciones_obra_updated_at
  before update on public.comunicaciones_obra
  for each row execute function public.set_updated_at();

-- El bucket privado 'obras' ya existe (mig. 0013). Idempotente por si acaso.
insert into storage.buckets (id, name, public)
values ('obras', 'obras', false)
on conflict (id) do nothing;

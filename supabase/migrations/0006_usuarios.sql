-- ============================================================
--  Prep de entrega · Esquema: USUARIOS (autenticación real)
--  Constructora Edwin Espaillat
-- ============================================================
--  Fort Knox: RLS ENABLE + FORCE + deny-all. La tabla se toca SOLO desde el
--  servidor con service_role, y solo tras verificar rol admin. El navegador
--  (anon/authenticated) no puede leer ni escribir usuarios.
--  Sin registro abierto: no hay política que permita insertar desde el cliente.
--  Las contraseñas se guardan hasheadas (scrypt) — nunca en texto plano.
-- ============================================================

create table if not exists public.usuarios (
  id                    uuid primary key default gen_random_uuid(),
  nombre                text not null,
  email                 text not null,
  password_hash         text not null,
  rol                   text not null default 'usuario'
                          check (rol in ('admin', 'usuario')),
  activo                boolean not null default true,
  must_change_password  boolean not null default false,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
comment on table public.usuarios is
  'Cuentas del sistema. Solo el admin las crea (server-only + service_role). Contraseñas hasheadas.';

-- Email único sin distinguir mayúsculas.
create unique index if not exists usuarios_email_key
  on public.usuarios (lower(email));

-- ── RLS: blindaje total ─────────────────────────────────────
alter table public.usuarios enable row level security;
alter table public.usuarios force  row level security;
drop policy if exists usuarios_deny_client_roles on public.usuarios;
create policy usuarios_deny_client_roles
  on public.usuarios for all to anon, authenticated
  using (false) with check (false);

-- ── updated_at ──────────────────────────────────────────────
drop trigger if exists trg_usuarios_updated_at on public.usuarios;
create trigger trg_usuarios_updated_at
  before update on public.usuarios
  for each row execute function public.set_updated_at();

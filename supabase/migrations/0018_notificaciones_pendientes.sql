-- ============================================================
--  ULTRA PRO · Tanda 6 — Centro de Notificaciones + Pendientes
--  Constructora Edwin Espaillat
-- ============================================================
--  Las notificaciones se DERIVAN de las fuentes existentes (préstamos,
--  presupuestos, materiales, clientes). Aquí solo se persiste el ESTADO y los
--  to-dos:
--   - notificaciones_leidas: qué alertas (por clave estable) ya vio Edwin.
--   - pendientes: to-dos que crea Edwin.
--   - push_subscriptions: suscripciones Web Push (VAPID) del/los dispositivos.
--
--  Fort Knox: RLS + FORCE + deny-all. Las claves privadas (VAPID) viven en env
--  del servidor, nunca en estas tablas ni en el cliente.
-- ============================================================

create table if not exists public.pendientes (
  id          uuid primary key default gen_random_uuid(),
  texto       text not null,
  obra_id     uuid references public.proyectos(id) on delete set null,
  prioridad   text not null default 'normal' check (prioridad in ('alta', 'normal')),
  fecha       date,                            -- recordatorio opcional
  hecho       boolean not null default false,
  hecho_at    timestamptz,
  autor       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists pendientes_estado_idx on public.pendientes (hecho, fecha);

create table if not exists public.notificaciones_leidas (
  id         uuid primary key default gen_random_uuid(),
  clave      text not null unique,             -- clave estable de la alerta derivada
  leida_at   timestamptz not null default now()
);

create table if not exists public.push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  endpoint   text not null unique,
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz not null default now()
);

-- ── RLS: blindaje total ────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array['pendientes', 'notificaciones_leidas', 'push_subscriptions']
  loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('alter table public.%I force row level security;', t);
    execute format('drop policy if exists %I on public.%I;', t || '_deny_client_roles', t);
    execute format(
      'create policy %I on public.%I for all to anon, authenticated using (false) with check (false);',
      t || '_deny_client_roles', t);
  end loop;
end $$;

-- ── updated_at (pendientes) ────────────────────────────────
drop trigger if exists trg_pendientes_updated_at on public.pendientes;
create trigger trg_pendientes_updated_at
  before update on public.pendientes
  for each row execute function public.set_updated_at();

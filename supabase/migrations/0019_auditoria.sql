-- ============================================================
--  ULTRA PRO · Tanda 7 — Auditoría / Historial de actividad
--  Constructora Edwin Espaillat
-- ============================================================
--  Registro INVIOLABLE de cada acción importante (crear/editar/eliminar/anular).
--  Solo se puede INSERT y SELECT: un trigger bloquea UPDATE y DELETE para TODOS
--  los roles (incluido service_role), así el log no se puede alterar nunca.
--  Lectura reservada al admin (validación server-side en las actions).
--
--  Fort Knox: RLS + FORCE + deny-all para anon/authenticated. El acceso pasa por
--  server actions con service_role; el trigger garantiza la inmutabilidad aunque
--  el acceso sea con service_role.
-- ============================================================

create table if not exists public.auditoria (
  id            uuid primary key default gen_random_uuid(),
  usuario_id    uuid references public.usuarios(id) on delete set null,
  usuario_nombre text not null default 'Sistema',   -- snapshot (sobrevive si se borra el usuario)
  accion        text not null check (accion in ('crear', 'editar', 'eliminar', 'anular')),
  entidad_tipo  text not null,                       -- 'obra','cliente','cobro','gasto','nomina','prestamo','inversionista','pago_empleado',...
  entidad_id    uuid,
  entidad_label text not null,                        -- etiqueta legible ("Obra: Residencial Los Cerros")
  detalle       jsonb,                               -- p.ej. {campo:'monto', antes:5000, despues:5500}
  created_at    timestamptz not null default now()
);
comment on table public.auditoria is
  'Historial inviolable de acciones. Solo INSERT/SELECT: UPDATE/DELETE bloqueados por trigger.';
create index if not exists auditoria_fecha_idx on public.auditoria (created_at desc);
create index if not exists auditoria_entidad_idx on public.auditoria (entidad_tipo, entidad_id);
create index if not exists auditoria_usuario_idx on public.auditoria (usuario_id);
create index if not exists auditoria_accion_idx on public.auditoria (accion);

-- ── Inmutabilidad: bloquear UPDATE y DELETE para TODOS los roles ──
create or replace function public.auditoria_inmutable()
returns trigger language plpgsql as $$
begin
  raise exception 'La auditoría es inviolable: no se puede % un registro.', tg_op;
end;
$$;

drop trigger if exists trg_auditoria_no_update on public.auditoria;
create trigger trg_auditoria_no_update
  before update on public.auditoria
  for each row execute function public.auditoria_inmutable();

drop trigger if exists trg_auditoria_no_delete on public.auditoria;
create trigger trg_auditoria_no_delete
  before delete on public.auditoria
  for each row execute function public.auditoria_inmutable();

-- ── RLS: deny-all para roles cliente ───────────────────────
alter table public.auditoria enable row level security;
alter table public.auditoria force  row level security;
drop policy if exists auditoria_deny_client_roles on public.auditoria;
create policy auditoria_deny_client_roles
  on public.auditoria for all to anon, authenticated
  using (false) with check (false);

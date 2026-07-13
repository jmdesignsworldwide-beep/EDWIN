-- ============================================================
--  Rediseño · Formulario de Obra detallado y profesional
--  Constructora Edwin Espaillat
-- ============================================================
--  Expande la tabla `proyectos` (obras) con datos profesionales. Todo lo nuevo
--  es OPCIONAL — solo Nombre y Cliente siguen siendo obligatorios. No cambia el
--  CRUD ni el expediente existentes.
--
--  El anticipo es INFORMATIVO por ahora (monto + método); no se conecta al
--  cálculo financiero todavía (eso llega con el panel financiero de la obra).
--
--  El archivo inicial (plano/contrato/foto) va a un bucket PRIVADO de Storage
--  ('obras'); se sirve solo por URL firmada desde el servidor (service_role).
-- ============================================================

alter table public.proyectos
  add column if not exists tipo_obra       text,
  add column if not exists metros          numeric(12, 2) check (metros is null or metros >= 0),
  add column if not exists direccion       text,
  add column if not exists telefono_obra   text,
  add column if not exists encargado_id    uuid references public.personal(id) on delete set null,
  add column if not exists anticipo_monto  numeric(14, 2) check (anticipo_monto is null or anticipo_monto >= 0),
  add column if not exists anticipo_metodo text
    check (anticipo_metodo is null or anticipo_metodo in ('efectivo', 'transferencia', 'cheque', 'otro')),
  add column if not exists archivo_inicial text;

comment on column public.proyectos.anticipo_monto is
  'Anticipo del cliente (informativo). No se conecta al cálculo financiero aún.';
comment on column public.proyectos.archivo_inicial is
  'Ruta del archivo inicial en el bucket privado de Storage "obras".';

create index if not exists proyectos_encargado_idx on public.proyectos (encargado_id);

-- ── RLS: reafirmar blindaje de proyectos (idempotente) ─────
alter table public.proyectos enable row level security;
alter table public.proyectos force  row level security;
drop policy if exists proyectos_deny_client_roles on public.proyectos;
create policy proyectos_deny_client_roles
  on public.proyectos for all to anon, authenticated
  using (false) with check (false);

-- ── Storage: bucket privado para archivos de obra ──────────
--  Privado (public = false). storage.objects tiene RLS habilitado por Supabase
--  y SIN políticas para anon/authenticated → acceso denegado por defecto. El
--  service_role (solo servidor) lo bypassa y sirve URLs firmadas temporales.
insert into storage.buckets (id, name, public)
values ('obras', 'obras', false)
on conflict (id) do nothing;

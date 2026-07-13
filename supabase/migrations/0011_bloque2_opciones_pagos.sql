-- ============================================================
--  Rediseño Bloque 2 · Selector inteligente + Historial de empleado
--  Constructora Edwin Espaillat
-- ============================================================
--  1) opciones_selector — catálogo que "aprende" lo que Edwin escribe en los
--     selectores inteligentes (categoría de proveedor, oficio, unidad, etc.).
--  2) pagos_empleado — registro de lo que Edwin le entrega a su personal
--     (adelantos, pagos, entregas sueltas). Modelo preparado para que la
--     Nómina detallada (Bloque 4) descuente los adelantos pendientes.
--  3) notas_empleado — bitácora fechada del empleado (lo bueno y lo malo).
--
--  Fort Knox: RLS + FORCE + deny-all en las tres. Los montos son datos
--  sensibles: solo se acceden por service_role server-only.
-- ============================================================

-- ── 1) Opciones de selector (catálogo aprendido) ───────────
create table if not exists public.opciones_selector (
  id          uuid primary key default gen_random_uuid(),
  categoria   text not null,                 -- p.ej. 'proveedor_categoria', 'oficio', 'unidad_material'
  valor       text not null,
  created_at  timestamptz not null default now(),
  unique (categoria, valor)
);
comment on table public.opciones_selector is
  'Opciones que Edwin agrega en los selectores inteligentes; persisten entre sesiones.';
create index if not exists opciones_selector_cat_idx on public.opciones_selector (categoria);

-- ── 2) Pagos / entregas al empleado ────────────────────────
create table if not exists public.pagos_empleado (
  id          uuid primary key default gen_random_uuid(),
  persona_id  uuid not null references public.personal(id) on delete cascade,
  tipo        text not null default 'adelanto'
                check (tipo in ('adelanto', 'pago', 'entrega', 'otro')),
  monto       numeric(14, 2) not null default 0 check (monto >= 0),
  concepto    text,
  fecha       date not null default current_date,
  -- 'manual' = lo registró Edwin aquí; 'nomina' = vino del módulo Nómina.
  origen      text not null default 'manual' check (origen in ('manual', 'nomina')),
  -- Para adelantos: false = aún no descontado en nómina (Bloque 4 lo usará).
  saldado     boolean not null default false,
  nomina_id   uuid references public.nominas(id) on delete set null,
  notas       text,
  created_at  timestamptz not null default now()
);
comment on table public.pagos_empleado is
  'Entregas de dinero al personal (adelantos/pagos/entregas). Base para descuentos de nómina (Bloque 4).';
create index if not exists pagos_empleado_persona_idx on public.pagos_empleado (persona_id, fecha desc);
create index if not exists pagos_empleado_pendientes_idx
  on public.pagos_empleado (persona_id) where tipo = 'adelanto' and saldado = false;

-- ── 3) Notas / bitácora del empleado ───────────────────────
create table if not exists public.notas_empleado (
  id          uuid primary key default gen_random_uuid(),
  persona_id  uuid not null references public.personal(id) on delete cascade,
  nota        text not null,
  tipo        text not null default 'neutral'
                check (tipo in ('positiva', 'negativa', 'neutral')),
  fecha       date not null default current_date,
  created_at  timestamptz not null default now()
);
comment on table public.notas_empleado is
  'Observaciones fechadas del empleado (lo bueno y lo malo), estilo bitácora.';
create index if not exists notas_empleado_persona_idx on public.notas_empleado (persona_id, fecha desc);

-- ── RLS: blindaje total en las tres ────────────────────────
do $$
declare t text;
begin
  foreach t in array array['opciones_selector', 'pagos_empleado', 'notas_empleado']
  loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('alter table public.%I force row level security;', t);
    execute format('drop policy if exists %I on public.%I;', t || '_deny_client_roles', t);
    execute format(
      'create policy %I on public.%I for all to anon, authenticated using (false) with check (false);',
      t || '_deny_client_roles', t);
  end loop;
end $$;

-- ============================================================
--  Tanda 4 · Esquema: ETAPAS — estado + notas (cronograma/Gantt)
--  Constructora Edwin Espaillat
-- ============================================================
--  La tabla `etapas` ya existe (migración 0002) con obra_id (FK cascade),
--  nombre, completada, orden, fecha_inicio, fecha_fin, porcentaje, timestamps,
--  y RLS ENABLE + FORCE + deny-all. Aquí solo la enriquecemos para el
--  cronograma: estado de la fase y notas.
-- ============================================================

alter table public.etapas
  add column if not exists estado text not null default 'pendiente'
    check (estado in ('pendiente', 'en_curso', 'completada', 'retrasada'));

alter table public.etapas
  add column if not exists notas text;

-- (RLS + FORCE + política deny-all ya vigentes desde 0002; sin cambios.)

-- ============================================================
--  Rediseño Bloque 3 · Asistencia detallada
--  Constructora Edwin Espaillat
-- ============================================================
--  Enriquece la asistencia SIN tocar el conteo de días para nómina: el `estado`
--  (presente/medio/ausente) y su peso (1 / 0.5 / 0) NO cambian. Solo se AGREGA
--  detalle opcional.
--
--  hora_entrada / hora_salida / notas YA existen. Aquí se añade:
--   - asistencia.excusa            → motivo de falta o tardanza (texto libre)
--   - proyectos.hora_entrada_esperada → hora esperada por obra para calcular
--     tarde/temprano (null = usa el default del sistema, 08:00, en el código).
--
--  La unicidad (persona_id, obra_id, fecha) y el RLS existentes se mantienen.
-- ============================================================

alter table public.asistencia
  add column if not exists excusa text;
comment on column public.asistencia.excusa is
  'Motivo de falta o tardanza (ej. "avisó que estaba enfermo", "sin avisar").';

alter table public.proyectos
  add column if not exists hora_entrada_esperada time;
comment on column public.proyectos.hora_entrada_esperada is
  'Hora esperada de entrada para marcar tarde/temprano. Null = default del sistema (08:00).';

-- ── RLS: reafirmar blindaje de asistencia (idempotente) ────
alter table public.asistencia enable row level security;
alter table public.asistencia force  row level security;
drop policy if exists asistencia_deny_client_roles on public.asistencia;
create policy asistencia_deny_client_roles
  on public.asistencia for all to anon, authenticated
  using (false) with check (false);

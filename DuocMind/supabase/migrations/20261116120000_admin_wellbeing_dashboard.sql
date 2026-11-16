-- Dashboard de bienestar ampliado (spec 023).
-- Base común para todas las pestañas: qué check-ins y qué tests cuentan. Las reglas de
-- consentimiento (spec 016) y de borrado programado (spec 022) se aplican solo aquí.
-- Los controles de privacidad (k = 5, grupos con resto, supresión complementaria) se aplican
-- en las funciones de cada pestaña, siempre en el servidor.
begin;

-- Lectura mínima explícita para service_role: no se depende de privilegios por defecto.
grant select on public.registro_emocional, public.registro_emocional_motivo, public.motivo,
  public.emocion_general, public.aplicacion_test, public.test_bienestar,
  public.test_resultado_nivel, public.estudiante_carrera, public.carrera, public.consentimiento,
  public.estudiante_consentimiento_actual, public.solicitud_eliminacion to service_role;

-- Una fila por check-in que cuenta entre p_from y p_to (días de Santiago, ambos incluidos).
-- `sid` solo se usa dentro de SQL para contar estudiantes distintos; nunca sale en una respuesta.
create or replace function private.wellbeing_checkins(p_from date, p_to date, p_career bigint default null)
returns table (sid bigint, dy date, val int, cid bigint, cname text, reasons text[])
language sql stable security invoker set search_path = '' as $fn$
  select re.estudiante_id_estudiante,
         (re.fecha_hora at time zone 'America/Santiago')::date,
         eg.valor_escala,
         c.id_carrera,
         c.nombre_carrera,
         coalesce((
           select array_agg(m.nombre_motivo order by m.orden, m.id_motivo)
           from public.registro_emocional_motivo rm
           join public.motivo m on m.id_motivo = rm.motivo_id_motivo
           where rm.registro_emocional_id_registro = re.id_registro
         ), '{}')
  from public.registro_emocional re
  -- Spec 016 (RF-009/010): analitica_anonima vigente y otorgado, y solo lo posterior a otorgarlo.
  join public.estudiante_consentimiento_actual eca
    on eca.estudiante_id_estudiante = re.estudiante_id_estudiante
   and eca.otorgado
   and re.fecha_hora >= eca.registrado_en
  join public.consentimiento co
    on co.id_consentimiento = eca.consentimiento_id_consentimiento
   and co.codigo = 'analitica_anonima'
  join public.emocion_general eg on eg.id_emocion = re.emocion_general_id_emocion
  left join public.estudiante_carrera ec
    on ec.estudiante_id_estudiante = re.estudiante_id_estudiante and ec.fecha_fin is null
  left join public.carrera c on c.id_carrera = ec.carrera_id_carrera
  where (re.fecha_hora at time zone 'America/Santiago')::date between p_from and p_to
    and (p_career is null or c.id_carrera = p_career)
    -- Spec 022: lo pedido para borrar deja de contarse desde la solicitud.
    and not exists (
      select 1 from public.solicitud_eliminacion s
      where s.estudiante_id_estudiante = re.estudiante_id_estudiante
        and (s.tipo = 'cuenta' or re.fecha_hora <= s.solicitada_en)
    )
$fn$;

-- Última aplicación del PSS-10 activo de cada estudiante entre p_from y p_to, con las mismas
-- reglas. «Alto» es el nivel con el mayor puntaje mínimo de esa versión.
create or replace function private.wellbeing_tests(p_from date, p_to date, p_career bigint default null)
returns table (sid bigint, dy date, score int, level text, label text, is_high boolean, cid bigint, cname text)
language sql stable security invoker set search_path = '' as $fn$
  select distinct on (ap.estudiante_id_estudiante)
         ap.estudiante_id_estudiante,
         (ap.fecha_hora at time zone 'America/Santiago')::date,
         ap.puntaje_total,
         n.nivel_resultado,
         n.label,
         n.puntaje_minimo = (
           select max(x.puntaje_minimo) from public.test_resultado_nivel x
           where x.test_id = t.id_test and x.test_version = t.version
         ),
         c.id_carrera,
         c.nombre_carrera
  from public.aplicacion_test ap
  join public.test_bienestar t
    on t.id_test = ap.test_id and t.version = ap.test_version
   and t.nombre_test = 'Escala de Estrés Percibido (PSS-10)' and t.is_active
  join public.test_resultado_nivel n
    on n.test_id = ap.test_id and n.test_version = ap.test_version
   and n.nivel_resultado = ap.nivel_resultado
  join public.estudiante_consentimiento_actual eca
    on eca.estudiante_id_estudiante = ap.estudiante_id_estudiante
   and eca.otorgado
   and ap.fecha_hora >= eca.registrado_en
  join public.consentimiento co
    on co.id_consentimiento = eca.consentimiento_id_consentimiento
   and co.codigo = 'analitica_anonima'
  left join public.estudiante_carrera ec
    on ec.estudiante_id_estudiante = ap.estudiante_id_estudiante and ec.fecha_fin is null
  left join public.carrera c on c.id_carrera = ec.carrera_id_carrera
  where (ap.fecha_hora at time zone 'America/Santiago')::date between p_from and p_to
    and (p_career is null or c.id_carrera = p_career)
    and not exists (
      select 1 from public.solicitud_eliminacion s
      where s.estudiante_id_estudiante = ap.estudiante_id_estudiante
        and (s.tipo = 'cuenta' or ap.fecha_hora <= s.solicitada_en)
    )
  order by ap.estudiante_id_estudiante, ap.fecha_hora desc, ap.id_aplicacion desc
$fn$;

-- Supresión de una fila de una distribución que suma 100 %. Recibe las celdas en orden como
-- [{"n": estudiantes distintos, "value": valor publicable}] y devuelve los valores en el mismo
-- orden. Una celda con 1 a 4 estudiantes se oculta (null); 0 estudiantes no identifica a nadie
-- y se muestra. Si queda exactamente una celda oculta, también se oculta la visible con menos
-- estudiantes (mayor que 0; ante empate, la primera), para que no se deduzca por resta.
create or replace function private.suppress_row(p_cells jsonb)
returns jsonb
language sql immutable security invoker set search_path = '' as $fn$
  with cells as (
    select ord, (cell->>'n')::int n, cell->'value' value
    from jsonb_array_elements(coalesce(p_cells, '[]'::jsonb)) with ordinality as e(cell, ord)
  ),
  hidden as (select count(*) k from cells where n between 1 and 4),
  extra as (
    select ord from cells, hidden
    where hidden.k = 1 and n >= 5
    order by n, ord limit 1
  )
  select coalesce(jsonb_agg(
    case when n between 1 and 4 or ord in (select ord from extra) then 'null'::jsonb
         else coalesce(value, 'null'::jsonb) end
    order by ord), '[]'::jsonb)
  from cells
$fn$;

revoke all on function private.wellbeing_checkins(date, date, bigint) from public, anon, authenticated;
revoke all on function private.wellbeing_tests(date, date, bigint) from public, anon, authenticated;
revoke all on function private.suppress_row(jsonb) from public, anon, authenticated;
grant execute on function private.wellbeing_checkins(date, date, bigint) to service_role;
grant execute on function private.wellbeing_tests(date, date, bigint) to service_role;
grant execute on function private.suppress_row(jsonb) to service_role;

commit;

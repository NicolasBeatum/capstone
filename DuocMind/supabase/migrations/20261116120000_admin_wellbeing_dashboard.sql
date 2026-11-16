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
-- `rid` y `sid` solo se usan dentro de SQL para contar registros y estudiantes distintos; nunca sale en una respuesta.
create or replace function private.wellbeing_checkins(p_from date, p_to date, p_career bigint default null)
returns table (rid bigint, sid bigint, dy date, val int, cid bigint, cname text, reasons text[])
language sql stable security invoker set search_path = '' as $fn$
  select re.id_registro,
         re.estudiante_id_estudiante,
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

-- Periodo de p_days días que termina hoy (Santiago) y el periodo anterior de igual duración.
create or replace function private.wellbeing_period(p_days int,
  out first_day date, out last_day date, out prev_first date, out prev_last date)
language plpgsql stable security invoker set search_path = '' as $fn$
begin
  if p_days is null or p_days not in (7, 30, 90) then
    raise exception using errcode = 'P0422', message = 'Periodo inválido';
  end if;
  last_day := (now() at time zone 'America/Santiago')::date;
  first_day := last_day - (p_days - 1);
  prev_last := first_day - 1;
  prev_first := prev_last - (p_days - 1);
end;
$fn$;

-- Campos comunes de todas las respuestas.
create or replace function private.wellbeing_header(p_days int, p_career bigint, p_sufficient boolean)
returns jsonb
language sql stable security invoker set search_path = '' as $fn$
  select jsonb_build_object(
    'days', p_days,
    'from', to_char(p.first_day, 'YYYY-MM-DD'),
    'to', to_char(p.last_day, 'YYYY-MM-DD'),
    'minGroupSize', 5,
    'careerId', p_career::text,
    'sufficient', p_sufficient)
  from private.wellbeing_period(p_days) p
$fn$;

-- Métrica con variación: el valor anterior solo se publica si también hay valor actual.
-- Quien llama pasa null cuando un periodo no cumple k = 5.
create or replace function private.wellbeing_kpi(p_value numeric, p_previous numeric)
returns jsonb
language sql immutable security invoker set search_path = '' as $fn$
  select jsonb_build_object('value', p_value, 'previous', case when p_value is not null then p_previous end)
$fn$;

-- Porcentaje (0–100, un decimal) de p_part sobre p_total. Se oculta si los estudiantes dentro
-- (p_in) o fuera (p_out) de la parte son entre 1 y 4: cualquiera de los dos los identificaría.
create or replace function private.wellbeing_share(p_in int, p_out int, p_part int, p_total int)
returns numeric
language sql immutable security invoker set search_path = '' as $fn$
  select case when p_total > 0 and not (p_in between 1 and 4) and not (p_out between 1 and 4)
              then round(100.0 * p_part / p_total, 1) end
$fn$;

-- Semanas (lunes) que tocan el periodo.
create or replace function private.wellbeing_weeks(p_from date, p_to date)
returns table (ws date)
language sql immutable security invoker set search_path = '' as $fn$
  select g::date from generate_series(date_trunc('week', p_from::timestamp),
                                      date_trunc('week', p_to::timestamp), interval '1 week') g
$fn$;

-- Agrupación de carreras (regla anti-diferencia de la spec 016): cada carrera con 5 o más
-- participantes se muestra; el resto, y quien no tiene carrera, va a «Otras carreras». Si ese
-- grupo queda entre 1 y 4, absorbe la carrera visible más pequeña. Devuelve a qué grupo va cada
-- carrera (0 = sin carrera); lo que no aparece no se muestra.
create or replace function private.wellbeing_career_groups(p_from date, p_to date, p_career bigint default null)
returns table (cid bigint, name text, ord int)
language sql stable security invoker set search_path = '' as $fn$
  with grp as (
    select coalesce(b.cid, 0) cid, max(b.cname) cname, count(distinct b.sid)::int n
    from private.wellbeing_checkins(p_from, p_to, p_career) b
    group by coalesce(b.cid, 0)
  ),
  vis as (select * from grp where cid <> 0 and n >= 5),
  small as (select v.cid from vis v order by v.n, v.cname, v.cid limit 1),
  rest0 as (select coalesce(sum(n), 0)::int n from grp where cid = 0 or n < 5),
  merged as (select (rest0.n between 1 and 4 and exists (select 1 from small)) m from rest0),
  rest as (
    select rest0.n + coalesce((select v.n from vis v join small sm on sm.cid = v.cid where merged.m), 0) n
    from rest0, merged
  ),
  shown as (
    select v.cid, v.cname name, 0 ord
    from vis v, merged
    where not (merged.m and v.cid = (select cid from small))
    union all
    select g.cid, 'Otras carreras', 1
    from grp g, rest, merged
    where rest.n >= 5
      and (g.cid = 0 or g.n < 5 or (merged.m and g.cid = (select cid from small)))
  )
  select * from shown where exists (select 1 from shown where ord = 0)
$fn$;

-- Pestaña «Resumen».
create or replace function private.wellbeing_summary(p_days int, p_career bigint default null)
returns jsonb
language plpgsql stable security invoker set search_path = '' as $fn$
declare
  p record;
  result jsonb;
begin
  select * into p from private.wellbeing_period(p_days);
  with b as materialized (select * from private.wellbeing_checkins(p.first_day, p.last_day, p_career)),
  bp as materialized (select * from private.wellbeing_checkins(p.prev_first, p.prev_last, p_career)),
  t as materialized (select * from private.wellbeing_tests(p.first_day, p.last_day, p_career)),
  tp as materialized (select * from private.wellbeing_tests(p.prev_first, p.prev_last, p_career)),
  cur as (
    select count(distinct sid)::int n, count(*)::int k, avg(val) a,
           count(distinct sid) filter (where val <= 2)::int nd,
           count(distinct sid) filter (where val > 2)::int nnd,
           count(*) filter (where val <= 2)::int kd
    from b
  ),
  prv as (
    select count(distinct sid)::int n, count(*)::int k, avg(val) a,
           count(distinct sid) filter (where val <= 2)::int nd,
           count(distinct sid) filter (where val > 2)::int nnd,
           count(*) filter (where val <= 2)::int kd
    from bp
  ),
  tc as (select count(*)::int n, count(*) filter (where is_high)::int h from t),
  tpv as (select count(*)::int n, count(*) filter (where is_high)::int h from tp),
  ok as (select cur.n >= 5 c, prv.n >= 5 pv, tc.n >= 5 tc, tpv.n >= 5 tpv from cur, prv, tc, tpv),
  wk as (
    select date_trunc('week', dy::timestamp)::date ws, count(distinct sid)::int n, count(*)::int k, avg(val) a
    from b group by 1
  ),
  wkv as (
    select date_trunc('week', dy::timestamp)::date ws, val, count(distinct sid)::int n, count(*)::int k
    from b group by 1, 2
  ),
  weekly as (
    select w.ws, wk.n, wk.a,
           case when wk.n >= 5 then private.suppress_row((
             select jsonb_agg(jsonb_build_object(
                      'n', coalesce(x.n, 0),
                      'value', round(100.0 * coalesce(x.k, 0) / wk.k, 1)) order by v)
             from generate_series(1, 5) g(v)
             left join wkv x on x.ws = w.ws and x.val = g.v))
           else '[null,null,null,null,null]'::jsonb end dist
    from private.wellbeing_weeks(p.first_day, p.last_day) w
    left join wk on wk.ws = w.ws
  ),
  wd as (
    select extract(isodow from dy)::int d, count(distinct sid)::int n, avg(val) a from b group by 1
  ),
  rs as (
    select r name, count(distinct b.sid)::int n, count(*)::int k
    from b, unnest(b.reasons) r group by r
  )
  select private.wellbeing_header(p_days, p_career, ok.c) || jsonb_build_object(
    'participants', private.wellbeing_kpi(case when ok.c then cur.n end, case when ok.pv then prv.n end),
    'checkins', private.wellbeing_kpi(case when ok.c then cur.k end, case when ok.pv then prv.k end),
    'average', private.wellbeing_kpi(case when ok.c then round(cur.a, 1) end, case when ok.pv then round(prv.a, 1) end),
    'difficultShare', private.wellbeing_kpi(
      case when ok.c then private.wellbeing_share(cur.nd, cur.nnd, cur.kd, cur.k) end,
      case when ok.pv then private.wellbeing_share(prv.nd, prv.nnd, prv.kd, prv.k) end),
    'testTaken', private.wellbeing_kpi(case when ok.c and ok.tc then tc.n end, case when ok.tpv then tpv.n end),
    'highStressShare', private.wellbeing_kpi(
      case when ok.c and ok.tc then private.wellbeing_share(tc.h, tc.n - tc.h, tc.h, tc.n) end,
      case when ok.tpv then private.wellbeing_share(tpv.h, tpv.n - tpv.h, tpv.h, tpv.n) end),
    'weekly', case when ok.c then (
      select jsonb_agg(jsonb_build_object(
               'weekStart', to_char(w.ws, 'YYYY-MM-DD'),
               'average', case when w.n >= 5 then round(w.a, 1) end,
               'distribution', w.dist) order by w.ws)
      from weekly w) else '[]'::jsonb end,
    'weekdays', case when ok.c then (
      select jsonb_agg(jsonb_build_object(
               'day', g.day, 'average', case when wd.n >= 5 then round(wd.a, 1) end) order by g.day)
      from generate_series(1, 7) g(day) left join wd on wd.d = g.day) else '[]'::jsonb end,
    'topReasons', case when ok.c then coalesce((
      select jsonb_agg(jsonb_build_object('name', x.name, 'share', round(100.0 * x.k / cur.k, 1)) order by x.k desc, x.name)
      from (select * from rs where rs.n >= 5 order by rs.k desc, rs.name limit 3) x), '[]'::jsonb)
      else '[]'::jsonb end
  ) into result
  from cur, prv, tc, tpv, ok;
  return result;
end;
$fn$;

-- Selector de carrera: solo carreras con 5 o más participantes en el periodo.
create or replace function private.wellbeing_careers_available(p_days int)
returns jsonb
language plpgsql stable security invoker set search_path = '' as $fn$
declare
  p record;
begin
  select * into p from private.wellbeing_period(p_days);
  return private.wellbeing_header(p_days, null, true) || jsonb_build_object('careers', coalesce((
    select jsonb_agg(jsonb_build_object('id', x.cid::text, 'name', x.cname) order by x.cname, x.cid)
    from (
      select b.cid, max(b.cname) cname
      from private.wellbeing_checkins(p.first_day, p.last_day, null) b
      where b.cid is not null
      group by b.cid
      having count(distinct b.sid) >= 5
    ) x), '[]'::jsonb));
end;
$fn$;

do $grants$
declare fn text;
begin
  foreach fn in array array[
    'private.wellbeing_checkins(date, date, bigint)', 'private.wellbeing_tests(date, date, bigint)',
    'private.suppress_row(jsonb)', 'private.wellbeing_period(int)',
    'private.wellbeing_header(int, bigint, boolean)', 'private.wellbeing_kpi(numeric, numeric)',
    'private.wellbeing_share(int, int, int, int)', 'private.wellbeing_weeks(date, date)',
    'private.wellbeing_career_groups(date, date, bigint)', 'private.wellbeing_summary(int, bigint)',
    'private.wellbeing_careers_available(int)'
  ] loop
    execute format('revoke all on function %s from public, anon, authenticated', fn);
    execute format('grant execute on function %s to service_role', fn);
  end loop;
end;
$grants$;

commit;

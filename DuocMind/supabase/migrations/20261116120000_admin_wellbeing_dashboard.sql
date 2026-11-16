-- Dashboard de bienestar ampliado (spec 023).
-- Base común para todas las pestañas: qué check-ins y qué tests cuentan. Las reglas de
-- consentimiento (spec 016) y de borrado programado (spec 022) se aplican solo aquí.
-- Los controles de privacidad (k = 5, grupos con resto, supresión de filas) se aplican
-- en las funciones de cada pestaña, siempre en el servidor.
begin;

-- Lectura mínima explícita para service_role: no se depende de privilegios por defecto.
grant select on public.registro_emocional, public.registro_emocional_motivo, public.motivo,
  public.emocion_general, public.aplicacion_test, public.test_bienestar,
  public.test_resultado_nivel, public.estudiante_carrera, public.carrera, public.consentimiento,
  public.estudiante_consentimiento_actual, public.solicitud_eliminacion, public.estudiante
  to service_role;

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
-- orden. 0 estudiantes no identifica a nadie. Si alguna celda tiene entre 1 y 4 estudiantes, se
-- oculta la fila completa: junto a cada distribución se publica un promedio o un porcentaje
-- (ánimo de la semana, ánimo del motivo, % de estrés alto), y con él dos celdas ocultas se
-- podrían despejar; ocultar solo la menor visible no basta.
create or replace function private.suppress_row(p_cells jsonb)
returns jsonb
language sql immutable security invoker set search_path = '' as $fn$
  with cells as (
    select ord, (cell->>'n')::int n, cell->'value' value
    from jsonb_array_elements(coalesce(p_cells, '[]'::jsonb)) with ordinality as e(cell, ord)
  ),
  hidden as (select exists (select 1 from cells where n between 1 and 4) h)
  select coalesce(jsonb_agg(
    case when hidden.h then 'null'::jsonb else coalesce(value, 'null'::jsonb) end
    order by ord), '[]'::jsonb)
  from cells, hidden
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

-- Pestaña «Motivos». Un check-in puede mencionar varios motivos, así que las proporciones son
-- sobre el total de check-ins y no suman 100 %. Los motivos con menos de 5 estudiantes se juntan
-- en «Otros motivos» con la misma regla anti-diferencia que las carreras.
create or replace function private.wellbeing_reasons(p_days int, p_career bigint default null)
returns jsonb
language plpgsql stable security invoker set search_path = '' as $fn$
declare
  p record;
  result jsonb;
begin
  select * into p from private.wellbeing_period(p_days);
  with b as materialized (select * from private.wellbeing_checkins(p.first_day, p.last_day, p_career)),
  tot as (select count(distinct sid)::int n, count(*)::int k from b),
  mr as materialized (select b.rid, b.sid, b.val, b.dy, r name from b, unnest(b.reasons) r),
  grp as (select name, count(distinct sid)::int n, count(distinct rid)::int k from mr group by name),
  vis as (select * from grp where n >= 5),
  small as (select name from vis order by n, k, name limit 1),
  rest0 as (select count(distinct sid)::int n from mr where name in (select name from grp where n < 5)),
  merged as (select (rest0.n between 1 and 4 and exists (select 1 from small)) m from rest0),
  mapping as (
    select g.name src,
           case when g.n >= 5 and not (merged.m and g.name = (select name from small)) then g.name
                else 'Otros motivos' end grp
    from grp g, merged
  ),
  -- Un check-in cuenta una vez por grupo aunque mencione dos motivos de «Otros motivos».
  mg as materialized (
    select distinct mr.rid, mr.sid, mr.val, mr.dy, mp.grp
    from mr join mapping mp on mp.src = mr.name
  ),
  gg as (
    select grp, count(distinct sid)::int n, count(*)::int k, avg(val) a
    from mg group by grp having count(distinct sid) >= 5
  ),
  top3 as (select grp from gg where grp <> 'Otros motivos' order by k desc, grp limit 3),
  cell as (select grp, val, count(distinct sid)::int n, count(*)::int k from mg group by grp, val),
  wk as (
    select date_trunc('week', dy::timestamp)::date ws, count(distinct sid)::int n, count(*)::int k
    from b group by 1
  ),
  wkg as (
    select date_trunc('week', dy::timestamp)::date ws, grp, count(distinct sid)::int n, count(*)::int k
    from mg group by 1, 2
  ),
  ok as (select tot.n >= 5 c from tot)
  select private.wellbeing_header(p_days, p_career, ok.c) || jsonb_build_object(
    'ranking', case when ok.c then coalesce((
      select jsonb_agg(jsonb_build_object(
               'name', g.grp, 'share', round(100.0 * g.k / tot.k, 1), 'average', round(g.a, 1))
             order by (g.grp = 'Otros motivos'), g.k desc, g.grp)
      from gg g), '[]'::jsonb) else '[]'::jsonb end,
    'matrix', case when ok.c then coalesce((
      select jsonb_agg(jsonb_build_object(
               'name', g.grp,
               'cells', private.suppress_row((
                 select jsonb_agg(jsonb_build_object(
                          'n', coalesce(c.n, 0), 'value', round(100.0 * coalesce(c.k, 0) / g.k, 1)) order by s.v)
                 from generate_series(1, 5) s(v)
                 left join cell c on c.grp = g.grp and c.val = s.v)))
             order by (g.grp = 'Otros motivos'), g.k desc, g.grp)
      from gg g), '[]'::jsonb) else '[]'::jsonb end,
    'trend', case when ok.c then coalesce((
      select jsonb_agg(jsonb_build_object(
               'name', t.grp,
               'weeks', (
                 select jsonb_agg(jsonb_build_object(
                          'weekStart', to_char(w.ws, 'YYYY-MM-DD'),
                          'share', case when wk.n >= 5 then
                            private.wellbeing_share(coalesce(x.n, 0), 0, coalesce(x.k, 0), wk.k) end)
                        order by w.ws)
                 from private.wellbeing_weeks(p.first_day, p.last_day) w
                 left join wk on wk.ws = w.ws
                 left join wkg x on x.ws = w.ws and x.grp = t.grp))
             order by gg.k desc, t.grp)
      from top3 t join gg on gg.grp = t.grp), '[]'::jsonb) else '[]'::jsonb end
  ) into result
  from tot, ok;
  return result;
end;
$fn$;

-- Pestaña «Estrés» (PSS-10 activo): última aplicación de cada estudiante en el periodo; en la
-- tendencia, la última de cada estudiante en cada semana.
create or replace function private.wellbeing_stress(p_days int, p_career bigint default null)
returns jsonb
language plpgsql stable security invoker set search_path = '' as $fn$
declare
  p record;
  result jsonb;
begin
  select * into p from private.wellbeing_period(p_days);
  with b as (
    select count(distinct sid)::int n from private.wellbeing_checkins(p.first_day, p.last_day, p_career)
  ),
  t as materialized (select * from private.wellbeing_tests(p.first_day, p.last_day, p_career)),
  tp as materialized (select * from private.wellbeing_tests(p.prev_first, p.prev_last, p_career)),
  cur as (select count(*)::int n, count(*) filter (where is_high)::int h, avg(score) a from t),
  prv as (select count(*)::int n, count(*) filter (where is_high)::int h, avg(score) a from tp),
  ok as (select b.n >= 5 c, cur.n >= 5 t, prv.n >= 5 pv from b, cur, prv),
  lv as (
    select n.nivel_resultado level, n.label, n.puntaje_minimo, count(t.sid)::int k
    from public.test_resultado_nivel n
    join public.test_bienestar tb
      on tb.id_test = n.test_id and tb.version = n.test_version
     and tb.nombre_test = 'Escala de Estrés Percibido (PSS-10)' and tb.is_active
    left join t on t.level = n.nivel_resultado
    group by n.nivel_resultado, n.label, n.puntaje_minimo
  ),
  lvs as (
    select private.suppress_row(jsonb_agg(jsonb_build_object('n', k, 'value', k) order by puntaje_minimo, level)) v
    from lv
  ),
  wk as (
    select w.ws, x.n, x.h, x.a
    from private.wellbeing_weeks(p.first_day, p.last_day) w
    cross join lateral (
      select count(*)::int n, count(*) filter (where y.is_high)::int h, avg(y.score) a
      from private.wellbeing_tests(greatest(w.ws, p.first_day), least(w.ws + 6, p.last_day), p_career) y
    ) x
  ),
  cg as (select * from private.wellbeing_career_groups(p.first_day, p.last_day, p_career)),
  cs as (
    select cg.name, min(cg.ord) ord, count(t.sid)::int n, count(t.sid) filter (where t.is_high)::int h, avg(t.score) a
    from cg left join t on coalesce(t.cid, 0) = cg.cid
    group by cg.name
  )
  select private.wellbeing_header(p_days, p_career, ok.c) || jsonb_build_object(
    'participants', private.wellbeing_kpi(case when ok.c and ok.t then cur.n end, case when ok.pv then prv.n end),
    'average', private.wellbeing_kpi(case when ok.c and ok.t then round(cur.a, 1) end, case when ok.pv then round(prv.a, 1) end),
    'highShare', private.wellbeing_kpi(
      case when ok.c and ok.t then private.wellbeing_share(cur.h, cur.n - cur.h, cur.h, cur.n) end,
      case when ok.pv then private.wellbeing_share(prv.h, prv.n - prv.h, prv.h, prv.n) end),
    'levels', case when ok.c then coalesce((
      select jsonb_agg(jsonb_build_object(
               'level', l.level, 'label', l.label,
               'students', case when ok.t then lvs.v -> (l.rn - 1)::int end) order by l.rn)
      from (select lv.*, row_number() over (order by puntaje_minimo, level) rn from lv) l, lvs), '[]'::jsonb)
      else '[]'::jsonb end,
    'weekly', case when ok.c then (
      select jsonb_agg(jsonb_build_object(
               'weekStart', to_char(w.ws, 'YYYY-MM-DD'),
               'average', case when w.n >= 5 then round(w.a, 1) end,
               'highShare', case when w.n >= 5 then private.wellbeing_share(w.h, w.n - w.h, w.h, w.n) end)
             order by w.ws)
      from wk w) else '[]'::jsonb end,
    'careers', case when ok.c then coalesce((
      select jsonb_agg(jsonb_build_object(
               'name', c.name,
               'average', case when c.n >= 5 then round(c.a, 1) end,
               'highShare', case when c.n >= 5 then private.wellbeing_share(c.h, c.n - c.h, c.h, c.n) end)
             order by c.ord, c.name)
      from cs c), '[]'::jsonb) else '[]'::jsonb end
  ) into result
  from cur, prv, ok;
  return result;
end;
$fn$;

-- Pestaña «Carreras»: tabla comparativa en orden alfabético (no es un ranking), con
-- «Otras carreras» al final según la regla anti-diferencia.
create or replace function private.wellbeing_careers(p_days int, p_career bigint default null)
returns jsonb
language plpgsql stable security invoker set search_path = '' as $fn$
declare
  p record;
  result jsonb;
begin
  select * into p from private.wellbeing_period(p_days);
  with b as materialized (select * from private.wellbeing_checkins(p.first_day, p.last_day, p_career)),
  t as materialized (select * from private.wellbeing_tests(p.first_day, p.last_day, p_career)),
  ok as (select count(distinct sid) >= 5 c from b),
  cg as (select * from private.wellbeing_career_groups(p.first_day, p.last_day, p_career)),
  bc as materialized (select b.*, cg.name grp, cg.ord from b join cg on cg.cid = coalesce(b.cid, 0)),
  rows as (
    select grp, min(ord) ord, count(distinct sid)::int n, count(*)::int k, avg(val) a,
           count(distinct sid) filter (where val <= 2)::int nd,
           count(distinct sid) filter (where val > 2)::int nnd,
           count(*) filter (where val <= 2)::int kd
    from bc group by grp
  ),
  tc as (
    select cg.name grp, count(*)::int n, count(*) filter (where t.is_high)::int h
    from t join cg on cg.cid = coalesce(t.cid, 0) group by cg.name
  ),
  rs as (
    select bc.grp, r name, count(distinct bc.sid)::int n, count(*)::int k
    from bc, unnest(bc.reasons) r group by bc.grp, r
  ),
  top as (
    select distinct on (grp) grp, name from rs where n >= 5 order by grp, k desc, name
  )
  select private.wellbeing_header(p_days, p_career, ok.c) || jsonb_build_object(
    'rows', case when ok.c then coalesce((
      select jsonb_agg(jsonb_build_object(
               'name', r.grp,
               'participants', r.n,
               'average', round(r.a, 1),
               'difficultShare', private.wellbeing_share(r.nd, r.nnd, r.kd, r.k),
               'highStressShare', case when tc.n >= 5 then private.wellbeing_share(tc.h, tc.n - tc.h, tc.h, tc.n) end,
               'topReason', top.name)
             order by r.ord, r.grp)
      from rows r
      left join tc on tc.grp = r.grp
      left join top on top.grp = r.grp), '[]'::jsonb) else '[]'::jsonb end
  ) into result
  from ok;
  return result;
end;
$fn$;

-- Pestaña «Participación»: solo totales. Registrados y % que comparte se cuentan sin filtro de
-- consentimiento (nunca se lista quién comparte); quien pidió borrar su cuenta no cuenta.
create or replace function private.wellbeing_participation(p_days int, p_career bigint default null)
returns jsonb
language plpgsql stable security invoker set search_path = '' as $fn$
declare
  p record;
  result jsonb;
begin
  select * into p from private.wellbeing_period(p_days);
  with b as materialized (select * from private.wellbeing_checkins(p.first_day, p.last_day, p_career)),
  bp as materialized (select * from private.wellbeing_checkins(p.prev_first, p.prev_last, p_career)),
  reg as (
    select count(*)::int n,
           count(*) filter (where exists (
             select 1 from public.estudiante_consentimiento_actual eca
             join public.consentimiento co on co.id_consentimiento = eca.consentimiento_id_consentimiento
             where eca.estudiante_id_estudiante = e.id_estudiante and eca.otorgado
               and co.codigo = 'analitica_anonima'))::int s
    from public.estudiante e
    left join public.estudiante_carrera ec
      on ec.estudiante_id_estudiante = e.id_estudiante and ec.fecha_fin is null
    where (p_career is null or ec.carrera_id_carrera = p_career)
      and not exists (
        select 1 from public.solicitud_eliminacion s
        where s.estudiante_id_estudiante = e.id_estudiante and s.tipo = 'cuenta')
  ),
  cur as (select count(distinct sid)::int n, count(*)::int k from b),
  prv as (select count(distinct sid)::int n, count(*)::int k from bp),
  -- Con carrera, solo se responde si la carrera cumple k en el periodo (como el selector).
  ok as (
    select case when p_career is null then reg.n >= 5 else cur.n >= 5 end c,
           cur.n >= 5 a, prv.n >= 5 pv
    from reg, cur, prv
  ),
  wk as (
    select date_trunc('week', dy::timestamp)::date ws, count(distinct sid)::int n from b group by 1
  )
  select private.wellbeing_header(p_days, p_career, ok.c) || jsonb_build_object(
    'registered', case when ok.c then reg.n end,
    'sharingShare', case when ok.c then private.wellbeing_share(reg.s, reg.n - reg.s, reg.s, reg.n) end,
    'active', private.wellbeing_kpi(case when ok.c and ok.a then cur.n end, case when ok.pv then prv.n end),
    'checkinsPerParticipant', private.wellbeing_kpi(
      case when ok.c and ok.a then round(cur.k::numeric / cur.n, 1) end,
      case when ok.pv then round(prv.k::numeric / prv.n, 1) end),
    'weekly', case when ok.c then (
      select jsonb_agg(jsonb_build_object(
               'weekStart', to_char(w.ws, 'YYYY-MM-DD'),
               'active', case when wk.n >= 5 then wk.n end) order by w.ws)
      from private.wellbeing_weeks(p.first_day, p.last_day) w left join wk on wk.ws = w.ws)
      else '[]'::jsonb end
  ) into result
  from reg, cur, prv, ok;
  return result;
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
    'private.wellbeing_careers_available(int)', 'private.wellbeing_reasons(int, bigint)',
    'private.wellbeing_stress(int, bigint)', 'private.wellbeing_careers(int, bigint)',
    'private.wellbeing_participation(int, bigint)'
  ] loop
    execute format('revoke all on function %s from public, anon, authenticated', fn);
    execute format('grant execute on function %s to service_role', fn);
  end loop;
end;
$grants$;

-- Rutas del panel. Misma definición vigente (20261115140000) con las rutas `/wellbeing/*`,
-- que solo aceptan `days` (7, 30 o 90) y `careerId` (entero positivo). Se retira `/emotions`
-- (spec 016): el dashboard de bienestar cubre todo lo que mostraba.
CREATE OR REPLACE FUNCTION public.admin_read(p_actor uuid, p_session uuid, p_path text, p_query jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare result jsonb;page_number int;page_size int;search_term text;career bigint;days int;
begin
 perform private.assert_admin(p_actor,p_session);
 if p_path='/students' then
  perform private.check_fields(p_query,array['search','careerId','page','pageSize']);
  page_number:=coalesce((p_query->>'page')::int,1);page_size:=coalesce((p_query->>'pageSize')::int,25);search_term:=lower(coalesce(p_query->>'search',''));career:=nullif(p_query->>'careerId','')::bigint;
  if page_number not between 1 and 100000 or page_size not between 1 and 100 or length(search_term)>100 then raise exception using errcode='P0422',message='Filtros inválidos';end if;
  with filtered as(
   select e.id_estudiante::text id,concat_ws(' ',e.primer_nombre,e.segundo_nombre,e.primer_apellido,e.segundo_apellido) name,nullif(trim(u.email),'') email,c.nombre_carrera "career"
   from public.estudiante e left join auth.users u on u.id=e.auth_user_id left join public.estudiante_carrera ec on ec.estudiante_id_estudiante=e.id_estudiante and ec.fecha_fin is null left join public.carrera c on c.id_carrera=ec.carrera_id_carrera
   where not exists(select 1 from public.solicitud_eliminacion s where s.estudiante_id_estudiante=e.id_estudiante and s.tipo='cuenta') and (career is null or c.id_carrera=career) and(search_term='' or position(search_term in lower(concat_ws(' ',e.primer_nombre,e.segundo_nombre,e.primer_apellido,e.segundo_apellido)))>0 or position(search_term in lower(coalesce(u.email,'')))>0)
  ) select jsonb_build_object('items',coalesce((select jsonb_agg(to_jsonb(rows) order by name,id) from(select * from filtered order by name,id limit page_size offset(page_number-1)*page_size) rows),'[]'::jsonb),'total',(select count(*) from filtered),'page',page_number,'pageSize',page_size) into result;
 elsif p_path='/tests' then
  perform private.check_fields(p_query,array[]::text[]);select coalesce(jsonb_agg(private.catalog_json(catalog_id) order by code),'[]'::jsonb) into result from public.test_catalogo;
 elsif p_path~'^/tests/catalogs/[0-9a-f-]{36}$' then
  perform private.check_fields(p_query,array[]::text[]);result:=private.catalog_json(split_part(p_path,'/',4)::uuid);
 elsif p_path~'^/tests/versions/[1-9][0-9]*$' then
  perform private.check_fields(p_query,array[]::text[]);result:=private.test_version_json(split_part(p_path,'/',4)::bigint);
 elsif p_path='/event-types' then
  perform private.check_fields(p_query,array[]::text[]);
  select coalesce(jsonb_agg(jsonb_build_object('id',id::text,'code',code,'name',nombre,'order',orden,'revision',revision) order by orden,nombre,id),'[]'::jsonb)
  into result from public.tipo_evento_institucional;
 elsif p_path='/events' then
  perform private.check_fields(p_query,array[]::text[]);select coalesce(jsonb_agg(jsonb_build_object('id',id,'title',title,'description',description,'location',location,'startsAt',starts_at,'endsAt',ends_at,'status',status,'publishedAt',published_at,'revision',revision,'requiresRegistration',requires_registration,'registrationUrl',registration_url,'registrationDeadline',registration_deadline,'registrationClosed',registration_closed,'typeId',tipo_id::text) order by starts_at,id),'[]'::jsonb) into result from public.evento_institucional;
 elsif p_path='/catalogs' then
  perform private.check_fields(p_query,array[]::text[]);
  select jsonb_build_object(
   'careers',coalesce((select jsonb_agg(jsonb_build_object('id',id_carrera::text,'name',nombre_carrera) order by nombre_carrera,id_carrera) from public.carrera),'[]'::jsonb),
   'moods',coalesce((select jsonb_agg(nombre_emocion order by valor_escala) from public.emocion_general),'[]'::jsonb),
   'resultLevels',coalesce((select jsonb_agg(jsonb_build_object('catalogId',t.catalog_id,'versionId',t.id_test::text,'version',t.version,'title',t.nombre_test,'level',n.nivel_resultado,'label',n.label,'active',t.is_active) order by t.nombre_test,t.version,n.puntaje_minimo) from public.test_resultado_nivel n join public.test_bienestar t on t.id_test=n.test_id where t.publication_status='published'),'[]'::jsonb)) into result;
 elsif p_path='/wellbeing/careers-available' then
  perform private.check_fields(p_query,array['days']);
  if p_query ? 'days' and (p_query->>'days')!~'^(7|30|90)$' then raise exception using errcode='P0422',message='Periodo inválido';end if;
  result:=private.wellbeing_careers_available(coalesce((p_query->>'days')::int,30));
 elsif p_path~'^/wellbeing/(summary|reasons|stress|careers|participation)$' then
  perform private.check_fields(p_query,array['days','careerId']);
  if p_query ? 'days' and (p_query->>'days')!~'^(7|30|90)$' then raise exception using errcode='P0422',message='Periodo inválido';end if;
  if p_query ? 'careerId' and (p_query->>'careerId')!~'^[1-9][0-9]{0,17}$' then raise exception using errcode='P0422',message='Carrera inválida';end if;
  days:=coalesce((p_query->>'days')::int,30);career:=(p_query->>'careerId')::bigint;
  result:=case split_part(p_path,'/',3)
   when 'summary' then private.wellbeing_summary(days,career)
   when 'reasons' then private.wellbeing_reasons(days,career)
   when 'stress' then private.wellbeing_stress(days,career)
   when 'careers' then private.wellbeing_careers(days,career)
   else private.wellbeing_participation(days,career) end;
 else raise exception using errcode='P0404',message='Consulta no disponible';end if;
 if result is null then raise exception using errcode='P0404',message='Recurso no disponible';end if;
 return result;
end;$function$;
revoke all on function public.admin_read(uuid, uuid, text, jsonb) from public, anon, authenticated;
grant execute on function public.admin_read(uuid, uuid, text, jsonb) to service_role;

-- Capacidades del panel: `wellbeing` reemplaza a `emotions`.
create or replace function public.admin_access(p_actor uuid, p_session uuid) returns jsonb
language plpgsql security invoker set search_path = '' as $$
begin
  perform private.assert_admin(p_actor, p_session);
  return jsonb_build_object('allowed', true, 'capabilities', array['students', 'tests', 'events', 'wellbeing']);
end;$$;
revoke all on function public.admin_access(uuid, uuid) from public, anon, authenticated;
grant execute on function public.admin_access(uuid, uuid) to service_role;

drop function if exists private.emotion_dashboard(int);

commit;

-- Dashboard emocional agregado (spec 016).
-- Solo cuentan estudiantes con `analitica_anonima` vigente y otorgada (por código, nunca por id),
-- y únicamente los registros posteriores al `registrado_en` del consentimiento vigente.
-- Los controles de privacidad (mínimo de 5 estudiantes distintos) se aplican aquí, en el servidor.
begin;

-- Lectura mínima explícita para service_role: no se depende de privilegios por defecto.
grant select on public.registro_emocional, public.emocion_general, public.estudiante_carrera,
  public.carrera, public.estudiante_consentimiento_actual to service_role;

create or replace function private.emotion_dashboard(p_days int) returns jsonb
language plpgsql security invoker set search_path = '' as $fn$
declare
  min_group constant int := 5;
  today date := (now() at time zone 'America/Santiago')::date;
  first_day date;
  result jsonb;
begin
  if p_days is null or p_days not in (7, 30, 90) then
    raise exception using errcode = 'P0422', message = 'Periodo inválido';
  end if;
  first_day := today - (p_days - 1);

  with base as materialized (
    select re.estudiante_id_estudiante sid,
           (re.fecha_hora at time zone 'America/Santiago')::date as dy,
           eg.valor_escala val, c.id_carrera cid, c.nombre_carrera cname
    from public.registro_emocional re
    join public.estudiante_consentimiento_actual eca
      on eca.estudiante_id_estudiante = re.estudiante_id_estudiante
     and eca.codigo = 'analitica_anonima'
     and eca.otorgado
     and re.fecha_hora >= eca.registrado_en
    join public.emocion_general eg on eg.id_emocion = re.emocion_general_id_emocion
    left join public.estudiante_carrera ec
      on ec.estudiante_id_estudiante = re.estudiante_id_estudiante and ec.fecha_fin is null
    left join public.carrera c on c.id_carrera = ec.carrera_id_carrera
    where (re.fecha_hora at time zone 'America/Santiago')::date between first_day and today
  ),
  total as (
    select count(distinct sid) n, count(*) k, coalesce(sum(val), 0) s from base
  ),
  dist as (
    select eg.valor_escala v, eg.nombre_emocion label, count(b.sid) k
    from public.emocion_general eg
    left join base b on b.val = eg.valor_escala
    group by eg.valor_escala, eg.nombre_emocion
  ),
  weeks as (
    select (g)::date week_start
    from generate_series(date_trunc('week', first_day::timestamp),
                         date_trunc('week', today::timestamp), interval '1 week') g
  ),
  wk as (
    select date_trunc('week', dy::timestamp)::date ws,
           count(distinct sid) n, count(*) k, sum(val) s
    from base group by 1
  ),
  -- Cada estudiante tiene como máximo una carrera vigente: los grupos son disjuntos.
  grp as (
    select cid, max(cname) cname, count(distinct sid) n, count(*) k, sum(val) s
    from base group by cid
  ),
  vis as (select * from grp where cid is not null and n >= min_group),
  small as (select cid from vis order by n, cname limit 1),
  rest0 as (
    select coalesce(sum(n), 0) n, coalesce(sum(k), 0) k, coalesce(sum(s), 0) s
    from grp where cid is null or n < min_group
  ),
  -- Si «Otras carreras» queda entre 1 y 4, absorbe la carrera visible más pequeña
  -- para que no pueda deducirse por diferencia con el total.
  merged as (select (rest0.n between 1 and min_group - 1 and exists (select 1 from small)) m from rest0),
  rest as (
    select rest0.n + coalesce((select v.n from vis v join small sm on sm.cid = v.cid where merged.m), 0) n,
           rest0.k + coalesce((select v.k from vis v join small sm on sm.cid = v.cid where merged.m), 0) k,
           rest0.s + coalesce((select v.s from vis v join small sm on sm.cid = v.cid where merged.m), 0) s
    from rest0, merged
  ),
  shown as (
    select v.cname name, v.n, v.k, v.s, 0 ord
    from vis v, merged
    where not (merged.m and v.cid = (select cid from small))
    union all
    select 'Otras carreras', n, k, s, 1 from rest where n >= min_group
  ),
  -- Con una sola «carrera» que repite el total no hay desglose útil: se omite.
  careers as (
    select * from shown where exists (select 1 from shown where ord = 0)
  )
  select jsonb_build_object(
    'days', p_days,
    'from', to_char(first_day, 'YYYY-MM-DD'),
    'to', to_char(today, 'YYYY-MM-DD'),
    'minGroupSize', min_group,
    'sufficient', total.n >= min_group,
    'participants', case when total.n >= min_group then total.n end,
    'checkins', case when total.n >= min_group then total.k end,
    'average', case when total.n >= min_group then round(total.s::numeric / total.k, 1) end,
    'distribution', case when total.n >= min_group then
      (select jsonb_agg(jsonb_build_object('value', d.v, 'label', d.label, 'checkins', d.k) order by d.v) from dist d)
      else '[]'::jsonb end,
    'weekly', case when total.n >= min_group then
      (select jsonb_agg(jsonb_build_object(
          'weekStart', to_char(w.week_start, 'YYYY-MM-DD'),
          'participants', case when x.n >= min_group then x.n end,
          'average', case when x.n >= min_group then round(x.s::numeric / x.k, 1) end)
        order by w.week_start)
       from weeks w left join wk x on x.ws = w.week_start)
      else '[]'::jsonb end,
    'careers', case when total.n >= min_group then
      coalesce((select jsonb_agg(jsonb_build_object(
          'name', c.name, 'participants', c.n, 'average', round(c.s::numeric / c.k, 1))
        order by c.ord, c.name) from careers c), '[]'::jsonb)
      else '[]'::jsonb end
  ) into result from total;
  return result;
end;
$fn$;

revoke all on function private.emotion_dashboard(int) from public, anon, authenticated;
grant execute on function private.emotion_dashboard(int) to service_role;

create or replace function public.admin_read(p_actor uuid,p_session uuid,p_path text,p_query jsonb default '{}') returns jsonb language plpgsql security invoker set search_path='' as $$
declare result jsonb;page_number int;page_size int;search_term text;career bigint;
begin
 perform private.assert_admin(p_actor,p_session);
 if p_path='/students' then
  perform private.check_fields(p_query,array['search','careerId','page','pageSize']);
  page_number:=coalesce((p_query->>'page')::int,1);page_size:=coalesce((p_query->>'pageSize')::int,25);search_term:=lower(coalesce(p_query->>'search',''));career:=nullif(p_query->>'careerId','')::bigint;
  if page_number not between 1 and 100000 or page_size not between 1 and 100 or length(search_term)>100 then raise exception using errcode='P0422',message='Filtros inválidos';end if;
  with filtered as(
   select e.id_estudiante::text id,concat_ws(' ',e.primer_nombre,e.segundo_nombre,e.primer_apellido,e.segundo_apellido) name,nullif(trim(u.email),'') email,c.nombre_carrera "career"
   from public.estudiante e left join auth.users u on u.id=e.auth_user_id left join public.estudiante_carrera ec on ec.estudiante_id_estudiante=e.id_estudiante and ec.fecha_fin is null left join public.carrera c on c.id_carrera=ec.carrera_id_carrera
   where (career is null or c.id_carrera=career) and(search_term='' or position(search_term in lower(concat_ws(' ',e.primer_nombre,e.segundo_nombre,e.primer_apellido,e.segundo_apellido)))>0 or position(search_term in lower(coalesce(u.email,'')))>0)
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
 elsif p_path='/emotions' then
  perform private.check_fields(p_query,array['days']);
  if p_query ? 'days' and (p_query->>'days')!~'^(7|30|90)$' then raise exception using errcode='P0422',message='Periodo inválido';end if;
  result:=private.emotion_dashboard(coalesce((p_query->>'days')::int,30));
 else raise exception using errcode='P0404',message='Consulta no disponible';end if;
 if result is null then raise exception using errcode='P0404',message='Recurso no disponible';end if;
 return result;
end;$$;

revoke all on function public.admin_read(uuid, uuid, text, jsonb) from public, anon, authenticated;
grant execute on function public.admin_read(uuid, uuid, text, jsonb) to service_role;

-- Capacidades del panel: se retira `tips` y se anuncia `emotions`.
create or replace function public.admin_access(p_actor uuid, p_session uuid) returns jsonb
language plpgsql security invoker set search_path = '' as $$
begin
  perform private.assert_admin(p_actor, p_session);
  return jsonb_build_object('allowed', true, 'capabilities', array['students', 'tests', 'events', 'emotions']);
end;$$;
revoke all on function public.admin_access(uuid, uuid) from public, anon, authenticated;
grant execute on function public.admin_access(uuid, uuid) to service_role;

commit;

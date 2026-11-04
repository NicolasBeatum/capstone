-- Sincroniza el repositorio con los cambios aplicados a mano en Supabase remoto.
-- Es idempotente: crea el estado nuevo en una base local desde cero y no falla en la
-- base remota, que ya tiene estos cambios.
--
-- Cambios:
--   1. Se eliminan los consejos (material_apoyo, material_emocion, material_test) y su
--      lÃ³gica en el panel admin; los reemplazan las herramientas.
--   2. Se elimina la sede: carrera.nombre_carrera pasa a ser Ãºnico.
--   3. tipo_evento pasa a llamarse tipo_evento_academico.
--   4. evento_academico admite eventos sin ramo; borrar un ramo borra sus eventos.
--   5. El estudiante puede editar y borrar sus eventos y anular su inscripciÃ³n a ramos.
--   6. Herramientas de bienestar (tipo_herramienta, herramienta, herramienta_tipo),
--      herramientas_home() y bucket de imÃ¡genes.
--   7. cambiar_carrera(): cambia la carrera vigente del estudiante.
--   8. admin_mutate y admin_read sin consejos ni sede.

begin;

-- ---------------------------------------------------------------------
-- 1) Consejos: fuera tablas y funciones auxiliares
-- ---------------------------------------------------------------------
drop table if exists public.material_test;
drop table if exists public.material_emocion;
drop table if exists public.material_apoyo;
drop function if exists private.check_tip_rule();
drop function if exists private.save_tip_rules(bigint, jsonb);
drop function if exists private.tip_json(bigint);

-- ---------------------------------------------------------------------
-- 2) Sede
-- ---------------------------------------------------------------------
-- Al quitar la columna desaparece tambiÃ©n unique (sede_id_sede, nombre_carrera).
alter table public.carrera drop column if exists sede_id_sede;
do $$
begin
  if not exists (select 1 from pg_constraint
                 where conrelid = 'public.carrera'::regclass and contype = 'u'
                   and conkey = array[(select attnum from pg_attribute
                                       where attrelid = 'public.carrera'::regclass
                                         and attname = 'nombre_carrera')]) then
    alter table public.carrera add constraint carrera_nombre_carrera_key unique (nombre_carrera);
  end if;
end $$;
drop table if exists public.sede;

-- ---------------------------------------------------------------------
-- 3) tipo_evento -> tipo_evento_academico
-- ---------------------------------------------------------------------
do $$
begin
  if to_regclass('public.tipo_evento') is not null and to_regclass('public.tipo_evento_academico') is null then
    alter table public.tipo_evento rename to tipo_evento_academico;
    alter table public.tipo_evento_academico rename constraint tipo_evento_pkey to tipo_evento_academico_pkey;
    alter table public.tipo_evento_academico
      rename constraint tipo_evento_nombre_evento_key to tipo_evento_academico_nombre_evento_key;
    alter sequence public.tipo_evento_id_tipo_evento_seq rename to tipo_evento_academico_id_tipo_evento_seq;
  end if;
end $$;

-- ---------------------------------------------------------------------
-- 4) Eventos acadÃ©micos sin ramo y borrado en cascada desde el ramo
-- ---------------------------------------------------------------------
alter table public.evento_academico alter column estudiante_asignatura_id drop not null;
alter table public.evento_academico drop constraint if exists evento_inscripcion_fk;
alter table public.evento_academico
  add constraint evento_inscripcion_fk
  foreign key (estudiante_asignatura_id, estudiante_id_estudiante)
  references public.estudiante_asignatura (id_estudiante_asignatura, estudiante_id_estudiante)
  on delete cascade;
create index if not exists evento_academico_agenda_idx
  on public.evento_academico (estudiante_id_estudiante, fecha_hora);

-- ---------------------------------------------------------------------
-- 5) Permisos del estudiante sobre su agenda y sus ramos
-- ---------------------------------------------------------------------
grant update (titulo, descripcion, fecha_hora, tipo_evento_id, estado_id, estudiante_asignatura_id)
  on public.evento_academico to authenticated;
grant delete on public.evento_academico, public.estudiante_asignatura to authenticated;

drop policy if exists "student updates own academic events" on public.evento_academico;
create policy "student updates own academic events" on public.evento_academico
  for update to authenticated
  using (exists (select 1 from public.estudiante e
                 where e.id_estudiante = evento_academico.estudiante_id_estudiante
                   and e.auth_user_id = (select auth.uid())))
  with check (exists (select 1 from public.estudiante e
                      where e.id_estudiante = evento_academico.estudiante_id_estudiante
                        and e.auth_user_id = (select auth.uid())));

drop policy if exists "student deletes own academic events" on public.evento_academico;
create policy "student deletes own academic events" on public.evento_academico
  for delete to authenticated
  using (exists (select 1 from public.estudiante e
                 where e.id_estudiante = evento_academico.estudiante_id_estudiante
                   and e.auth_user_id = (select auth.uid())));

-- Igual a la polÃ­tica remota; ea_carrera_fk ya garantiza que estudiante y carrera calcen.
drop policy if exists "student enrolls in own current career course" on public.estudiante_asignatura;
create policy "student enrolls in own current career course" on public.estudiante_asignatura
  for insert to authenticated
  with check (
    exists (select 1 from public.estudiante e
            where e.id_estudiante = estudiante_asignatura.estudiante_id_estudiante
              and e.auth_user_id = (select auth.uid()))
    and exists (select 1 from public.estudiante_carrera ec
                where ec.id_estudiante_carrera = estudiante_asignatura.estudiante_carrera_id
                  and ec.fecha_fin is null));

drop policy if exists "student unenrolls own courses" on public.estudiante_asignatura;
create policy "student unenrolls own courses" on public.estudiante_asignatura
  for delete to authenticated
  using (exists (select 1 from public.estudiante e
                 where e.id_estudiante = estudiante_asignatura.estudiante_id_estudiante
                   and e.auth_user_id = (select auth.uid())));

-- ---------------------------------------------------------------------
-- 6) Herramientas de bienestar
-- ---------------------------------------------------------------------
create table if not exists public.tipo_herramienta (
  id     smallint generated always as identity primary key,
  nombre text not null unique check (length(btrim(nombre)) between 1 and 40),
  orden  smallint not null default 0
);

create table if not exists public.herramienta (
  id          bigint generated always as identity primary key,
  titulo      text not null check (length(btrim(titulo)) between 1 and 160),
  descripcion text,
  contenido   text,
  imagen_path text not null,
  video_url   text check (video_url is null or video_url ~* '^https://'),
  activo      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists herramienta_nuevas_idx on public.herramienta (created_at desc) where activo;

create table if not exists public.herramienta_tipo (
  herramienta_id bigint   not null references public.herramienta(id) on delete cascade,
  tipo_id        smallint not null references public.tipo_herramienta(id),
  primary key (herramienta_id, tipo_id)
);
create index if not exists herramienta_tipo_tipo_idx on public.herramienta_tipo (tipo_id);

create or replace function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists herramienta_updated_at on public.herramienta;
create trigger herramienta_updated_at before update on public.herramienta
  for each row execute function public.set_updated_at();

-- La herramienta mÃ¡s nueva y otra "del dÃ­a", estable durante el dÃ­a de Santiago.
create or replace function public.herramientas_home()
returns table (motivo text, id bigint, titulo text, descripcion text, imagen_path text)
language sql stable set search_path = '' as $$
  with ultima as (
    select * from public.herramienta where activo order by created_at desc, id desc limit 1
  ),
  cand as (
    select h.*, row_number() over (order by h.id) - 1 as rn
    from public.herramienta h
    where h.activo and h.id not in (select id from ultima)
  )
  select 'ultima', u.id, u.titulo, u.descripcion, u.imagen_path from ultima u
  union all
  select 'del_dia', c.id, c.titulo, c.descripcion, c.imagen_path
  from cand c
  where c.rn = abs(hashtext((now() at time zone 'America/Santiago')::date::text)::bigint)
               % (select count(*) from cand)
$$;

alter table public.tipo_herramienta enable row level security;
alter table public.herramienta enable row level security;
alter table public.herramienta_tipo enable row level security;

-- Lectura pÃºblica de lo activo; la escritura queda para service_role.
revoke all on public.tipo_herramienta, public.herramienta, public.herramienta_tipo from anon, authenticated;
grant select on public.tipo_herramienta, public.herramienta, public.herramienta_tipo to anon, authenticated;
revoke all on function public.set_updated_at() from public, anon, authenticated;
grant execute on function public.herramientas_home() to anon, authenticated;

drop policy if exists "tipos are readable" on public.tipo_herramienta;
create policy "tipos are readable" on public.tipo_herramienta
  for select to anon, authenticated using (true);
drop policy if exists "active tools are readable" on public.herramienta;
create policy "active tools are readable" on public.herramienta
  for select to anon, authenticated using (activo);
drop policy if exists "active tool types are readable" on public.herramienta_tipo;
create policy "active tool types are readable" on public.herramienta_tipo
  for select to anon, authenticated
  using (exists (select 1 from public.herramienta h
                 where h.id = herramienta_tipo.herramienta_id and h.activo));

-- Bucket pÃºblico de imÃ¡genes de herramientas (mÃ¡ximo 500 KB).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('herramientas', 'herramientas', true, 524288, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- 7) Cambio de carrera vigente
-- ---------------------------------------------------------------------
-- Cierra la carrera abierta, borra sus ramos (y por cascada sus eventos) y abre la nueva.
create or replace function public.cambiar_carrera(p_carrera_id bigint)
returns bigint language plpgsql security definer set search_path = '' as $$
declare v_est bigint; v_nueva bigint;
begin
  select id_estudiante into v_est from public.estudiante
   where auth_user_id = (select auth.uid());
  if v_est is null then raise exception 'estudiante no encontrado'; end if;

  select id_estudiante_carrera into v_nueva from public.estudiante_carrera
   where estudiante_id_estudiante = v_est and fecha_fin is null and carrera_id_carrera = p_carrera_id;
  if v_nueva is not null then return v_nueva; end if;

  delete from public.estudiante_asignatura ea
   using public.estudiante_carrera ec
   where ea.estudiante_carrera_id = ec.id_estudiante_carrera
     and ec.estudiante_id_estudiante = v_est and ec.fecha_fin is null;

  update public.estudiante_carrera set fecha_fin = current_date
   where estudiante_id_estudiante = v_est and fecha_fin is null;

  insert into public.estudiante_carrera (estudiante_id_estudiante, carrera_id_carrera)
  values (v_est, p_carrera_id) returning id_estudiante_carrera into v_nueva;
  return v_nueva;
end $$;
revoke all on function public.cambiar_carrera(bigint) from public, anon;
grant execute on function public.cambiar_carrera(bigint) to authenticated;

-- ---------------------------------------------------------------------
-- 8) Panel admin sin consejos ni sede (misma lÃ³gica que 20261016015100)
-- ---------------------------------------------------------------------
create or replace function public.admin_mutate(p_actor uuid,p_session uuid,p_method text,p_path text,p_payload jsonb) returns jsonb language plpgsql security invoker set search_path='' as $$
declare request uuid;hash text;cached private.admin_requests;result jsonb;tid bigint;cat uuid;current_test public.test_bienestar;newid bigint;rev integer;op text;idtext text;eid uuid;eventrow public.evento_institucional;q record;o record;l record;qid bigint;type_row public.tipo_evento_institucional;type_id smallint;type_name text;
begin
 perform private.assert_admin(p_actor,p_session);
 request:=(p_payload->>'requestId')::uuid;
 if request is null then raise exception using errcode='P0422',message='requestId requerido';end if;
 hash:=encode(extensions.digest(convert_to(p_payload::text,'UTF8'),'sha256'),'hex');
 perform pg_advisory_xact_lock(hashtextextended(request::text,0));
 select * into cached from private.admin_requests where request_id=request and expires_at>now();
 if found then
  if cached.actor<>p_actor or cached.action<>p_method or cached.resource<>p_path or cached.payload_hash<>hash then raise exception using errcode='P0409',message='Petición en conflicto';end if;return cached.result;
 end if;
 delete from private.admin_requests where request_id=request and expires_at<=now();
 if p_path='/event-types' or p_path~'^/event-types/[1-9][0-9]{0,4}$' then
  if not ((p_path='/event-types' and p_method='POST') or (p_path<>'/event-types' and p_method='PUT')) then
   raise exception using errcode='P0404',message='Operación no disponible';
  end if;
  if p_path='/event-types' then
   perform private.check_fields(p_payload,array['requestId','code','name','order']);
   if jsonb_typeof(p_payload->'code') is distinct from 'string' or (p_payload->>'code')!~'^[a-z][a-z0-9_]{1,31}$' then
    raise exception using errcode='P0422',message='Código inválido';
   end if;
  else
   perform private.check_fields(p_payload,array['requestId','expectedRevision','name','order']);
   if split_part(p_path,'/',3)::integer>32767 then raise exception using errcode='P0422',message='Tipo inválido';end if;
   type_id:=split_part(p_path,'/',3)::smallint;
   select * into type_row from public.tipo_evento_institucional where id=type_id for update;
   if not found then raise exception using errcode='P0404',message='Tipo no disponible';end if;
   if jsonb_typeof(p_payload->'expectedRevision') is distinct from 'number' or (p_payload->>'expectedRevision')!~'^[1-9][0-9]*$' then
    raise exception using errcode='P0422',message='Revisión inválida';
   end if;
   if (p_payload->>'expectedRevision')::numeric is distinct from type_row.revision::numeric then
    raise exception using errcode='P0409',message='Revisión en conflicto';
   end if;
  end if;
  if jsonb_typeof(p_payload->'name') is distinct from 'string' or jsonb_typeof(p_payload->'order') is distinct from 'number' then
   raise exception using errcode='P0422',message='Tipo inválido';
  end if;
  type_name:=btrim(p_payload->>'name');
  perform private.check_text(type_name,40);
  if (p_payload->>'order')!~'^[0-9]+$' or (p_payload->>'order')::numeric not between 0 and 32767 then
   raise exception using errcode='P0422',message='Orden inválido';
  end if;
  if p_path='/event-types' then
   insert into public.tipo_evento_institucional(code,nombre,orden) values(p_payload->>'code',type_name,(p_payload->>'order')::smallint) returning id,revision into type_id,rev;
  else
   update public.tipo_evento_institucional set nombre=type_name,orden=(p_payload->>'order')::smallint,revision=revision+1 where id=type_id returning revision into rev;
  end if;
  result:=jsonb_build_object('id',type_id::text,'revision',rev);
 elsif p_path='/tests' and p_method='POST' then
  perform private.check_fields(p_payload,array['requestId','title','description','questions','levels']);
  insert into public.test_catalogo(code,kind) values('custom_'||gen_random_uuid()::text,'custom') returning catalog_id into cat;
  insert into public.test_bienestar(nombre_test,tipo_test,version,puntaje_maximo,catalog_id) values(p_payload->>'title','custom',1,0,cat) returning id_test into tid;
  perform private.save_test_content(tid,p_payload);result:=jsonb_build_object('catalogId',cat,'versionId',tid::text,'revision',1);
 elsif p_path~'^/tests/versions/[1-9][0-9]*/(draft|clone|publish|activation)$' then
  tid:=split_part(p_path,'/',4)::bigint;op:=split_part(p_path,'/',5);
  select catalog_id into cat from public.test_bienestar where id_test=tid;
  if cat is null then raise exception using errcode='P0404',message='Versión no disponible';end if;
  perform 1 from public.test_catalogo where catalog_id=cat for update;
  select * into current_test from public.test_bienestar where id_test=tid for update;
  if (p_payload->>'expectedRevision')::int is distinct from current_test.revision then raise exception using errcode='P0409',message='Revisión en conflicto';end if;
  if op<>'activation' and exists(select 1 from public.test_catalogo where catalog_id=cat and kind='protected') then raise exception using errcode='P0403',message='Instrumento protegido';end if;
  if op='draft' and p_method='PUT' then
   perform private.check_fields(p_payload,array['requestId','expectedRevision','title','description','questions','levels']);
   if current_test.publication_status<>'draft' then raise exception using errcode='P0422',message='Contenido publicado inmutable';end if;
   perform private.save_test_content(tid,p_payload);update public.test_bienestar set revision=revision+1 where id_test=tid returning revision into rev;
  elsif op='publish' and p_method='POST' then
   perform private.check_fields(p_payload,array['requestId','expectedRevision']);
   if current_test.publication_status<>'draft' then raise exception using errcode='P0422',message='Ya publicado';end if;
   perform private.validate_test_publication(tid);
   update public.test_bienestar set publication_status='published',published_at=now(),revision=revision+1 where id_test=tid returning revision into rev;
  elsif op='activation' and p_method='POST' then
   perform private.check_fields(p_payload,array['requestId','expectedRevision','active']);
   if current_test.publication_status<>'published' or jsonb_typeof(p_payload->'active')<>'boolean' then raise exception using errcode='P0422',message='Activación inválida';end if;
   if(p_payload->>'active')::boolean then update public.test_bienestar set is_active=false,revision=revision+1 where catalog_id=cat and is_active and id_test<>tid;end if;
   update public.test_bienestar set is_active=(p_payload->>'active')::boolean,revision=revision+1 where id_test=tid returning revision into rev;
   update public.test_catalogo set active_version_id=case when(p_payload->>'active')::boolean then tid else null end where catalog_id=cat and((p_payload->>'active')::boolean or active_version_id=tid);
  elsif op='clone' and p_method='POST' then
   perform private.check_fields(p_payload,array['requestId','expectedRevision']);
   insert into public.test_bienestar(nombre_test,tipo_test,version,descripcion,puntaje_minimo,puntaje_maximo,catalog_id,scoring_kind) select nombre_test,tipo_test,(select max(version)+1 from public.test_bienestar where catalog_id=cat),descripcion,puntaje_minimo,puntaje_maximo,catalog_id,scoring_kind from public.test_bienestar where id_test=tid returning id_test into newid;
   for q in select * from public.pregunta_test where test_id=tid order by orden loop
    insert into public.pregunta_test(test_id,test_version,orden,texto_pregunta,helper,is_critica) select newid,version,q.orden,q.texto_pregunta,q.helper,q.is_critica from public.test_bienestar where id_test=newid returning id_pregunta into qid;
    insert into public.opcion_respuesta(pregunta_test_id_pregunta,texto_opcion,puntaje) select qid,texto_opcion,puntaje from public.opcion_respuesta where pregunta_test_id_pregunta=q.id_pregunta order by id_opcion;
   end loop;
   insert into public.test_resultado_nivel(test_id,test_version,nivel_resultado,puntaje_minimo,puntaje_maximo,label,interpretation) select newid,(select version from public.test_bienestar where id_test=newid),nivel_resultado,puntaje_minimo,puntaje_maximo,label,interpretation from public.test_resultado_nivel where test_id=tid;
   tid:=newid;rev:=1;
  else raise exception using errcode='P0404',message='Operación no disponible';end if;
  result:=jsonb_build_object('catalogId',cat,'versionId',tid::text,'revision',rev);
 elsif p_path='/events' and p_method='POST' or p_path~'^/events/[0-9a-f-]{36}(/(publish|cancel))?$' then
  if p_path='/events' then op:='create';else eid:=split_part(p_path,'/',3)::uuid;op:=coalesce(nullif(split_part(p_path,'/',4),''),'edit');select * into eventrow from public.evento_institucional where id=eid for update;
   if not found then raise exception using errcode='P0404',message='Evento no disponible';end if;
   if(p_payload->>'expectedRevision')::int is distinct from eventrow.revision then raise exception using errcode='P0409',message='Revisión en conflicto';end if;
  end if;
  if(op='create' and p_method='POST') or(op='edit' and p_method='PUT') then
   perform private.check_fields(p_payload,array['requestId','expectedRevision','title','description','location','startsAt','endsAt','requiresRegistration','registrationUrl','registrationDeadline','registrationClosed','typeId']);perform private.check_text(p_payload->>'title',160);perform private.check_text(coalesce(p_payload->>'description',''),5000,true);perform private.check_text(p_payload->>'location',160);
   if p_payload->>'startsAt'!~'(Z|[+-][0-9]{2}:[0-9]{2})$' or p_payload->>'endsAt'!~'(Z|[+-][0-9]{2}:[0-9]{2})$' then raise exception using errcode='P0422',message='Instante UTC requerido';end if;
   type_id:=case when p_payload ? 'typeId' then private.parse_event_type_id(p_payload->'typeId') when op='edit' then eventrow.tipo_id else null end;
   if op='create' then insert into public.evento_institucional(title,description,location,starts_at,ends_at,requires_registration,registration_url,registration_deadline,registration_closed,tipo_id) values(p_payload->>'title',coalesce(p_payload->>'description',''),p_payload->>'location',(p_payload->>'startsAt')::timestamptz,(p_payload->>'endsAt')::timestamptz,coalesce((p_payload->>'requiresRegistration')::boolean,false),p_payload->>'registrationUrl',(p_payload->>'registrationDeadline')::timestamptz,coalesce((p_payload->>'registrationClosed')::boolean,false),type_id) returning id,revision into eid,rev;
   else update public.evento_institucional set tipo_id=type_id,title=p_payload->>'title',description=coalesce(p_payload->>'description',''),location=p_payload->>'location',starts_at=(p_payload->>'startsAt')::timestamptz,ends_at=(p_payload->>'endsAt')::timestamptz,requires_registration=case when p_payload ? 'requiresRegistration' then (p_payload->>'requiresRegistration')::boolean else eventrow.requires_registration end,registration_url=case when p_payload ? 'registrationUrl' then p_payload->>'registrationUrl' else eventrow.registration_url end,registration_deadline=case when p_payload ? 'registrationDeadline' then (p_payload->>'registrationDeadline')::timestamptz else eventrow.registration_deadline end,registration_closed=case when p_payload ? 'registrationClosed' then (p_payload->>'registrationClosed')::boolean else eventrow.registration_closed end,revision=revision+1 where id=eid returning revision into rev;end if;
  elsif op='publish' and p_method='POST' and eventrow.status='draft' then
   perform private.check_fields(p_payload,array['requestId','expectedRevision']);update public.evento_institucional set status='published',published_at=now(),revision=revision+1 where id=eid returning revision into rev;
  elsif op='cancel' and p_method='POST' and eventrow.status='published' then
   perform private.check_fields(p_payload,array['requestId','expectedRevision']);update public.evento_institucional set status='cancelled',revision=revision+1 where id=eid returning revision into rev;
  else raise exception using errcode='P0422',message='Transición inválida';end if;
  result:=jsonb_build_object('id',eid,'revision',rev);
 else raise exception using errcode='P0404',message='Operación no disponible';end if;
 insert into private.admin_requests(request_id,actor,action,resource,payload_hash,status,result) values(request,p_actor,p_method,p_path,hash,'completed',result);
 return result;
end;$$;
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
 else raise exception using errcode='P0404',message='Consulta no disponible';end if;
 if result is null then raise exception using errcode='P0404',message='Recurso no disponible';end if;
 return result;
end;$$;
commit;

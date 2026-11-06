-- Alinea producción con cambios del repo que nunca llegaron allá. Producción es la referencia:
-- no se tocan tablas, columnas ni datos, y todo es repetible.
--   admin_mutate: declaraba una variable de tipo public.material_apoyo, tabla ya eliminada, y por
--     eso fallaba cualquier escritura del panel. Se quita además la rama de Tips.
--   erase_student_personal_data: borra los consentimientos; sin esto la FK impide borrar la cuenta.
--   registro_emocional en Realtime: lo usa el gráfico de la app (20261009120000).
--   UPDATE de agenda y DELETE de agenda y ramos: las policies ya existían, faltaban los permisos
--     (20261104120000).
begin;

CREATE OR REPLACE FUNCTION public.admin_mutate(p_actor uuid, p_session uuid, p_method text, p_path text, p_payload jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
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
end;$function$

;

CREATE OR REPLACE FUNCTION public.erase_student_personal_data(p_auth_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_student_id bigint;
begin
  if p_auth_user_id is null then
    raise exception 'El usuario de Auth es obligatorio';
  end if;

  select e.id_estudiante
    into v_student_id
  from public.estudiante e
  where e.auth_user_id = p_auth_user_id
  for update;

  if not found then
    return;
  end if;

  delete from public.alerta_bienestar
  where estudiante_id_estudiante = v_student_id;

  delete from public.aplicacion_test
  where estudiante_id_estudiante = v_student_id;

  delete from public.registro_emocional
  where estudiante_id_estudiante = v_student_id;

  delete from public.estudiante_consentimiento
  where estudiante_id_estudiante = v_student_id;

  update public.estudiante
  set auth_user_id = null,
      rut = 'ELIMINADO-' || v_student_id::text,
      primer_nombre = 'Eliminado',
      segundo_nombre = null,
      primer_apellido = 'Eliminado',
      segundo_apellido = null,
      numero_telefonico = null,
      correo = null
  where id_estudiante = v_student_id;
end;
$function$

;

grant update (titulo, descripcion, fecha_hora, tipo_evento_id, estado_id, estudiante_asignatura_id)
  on public.evento_academico to authenticated;
grant delete on public.evento_academico, public.estudiante_asignatura to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'registro_emocional'
  ) then
    alter publication supabase_realtime add table public.registro_emocional;
  end if;
end $$;

commit;

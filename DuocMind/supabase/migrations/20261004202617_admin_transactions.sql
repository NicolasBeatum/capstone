begin;
create function private.assert_admin(actor uuid,session uuid) returns void language plpgsql security invoker set search_path='' as $$
begin
 perform 1 from auth.sessions s where s.id=session and s.user_id=actor and(s.not_after is null or s.not_after>now());
 if not found then raise exception using errcode='P0401',message='Sesión inválida';end if;
 perform 1 from private.admin_staff a where a.auth_user_id=actor and a.enabled;
 if not found then raise exception using errcode='P0403',message='Sin autorización';end if;
end;$$;
create function private.check_fields(payload jsonb,allowed text[]) returns void language plpgsql security invoker set search_path='' as $$
begin
 if jsonb_typeof(payload)<>'object' or exists(select 1 from jsonb_object_keys(payload) k where not(k=any(allowed))) then raise exception using errcode='P0422',message='Campos no permitidos';end if;
end;$$;
create function private.check_text(value text,maximum integer,optional boolean default false) returns void language plpgsql security invoker set search_path='' as $$
begin
 if value is null or length(value)>maximum or(not optional and length(trim(value))=0) then raise exception using errcode='P0422',message='Texto inválido';end if;
end;$$;
create function private.save_test_content(tid bigint,payload jsonb) returns void language plpgsql security invoker set search_path='' as $$
declare q jsonb;o jsonb;l jsonb;ordinal integer:=0;qid bigint;tv integer;min_score integer:=0;max_score integer:=0;lo integer;hi integer;
begin
 perform private.check_text(payload->>'title',160);perform private.check_text(coalesce(payload->>'description',''),5000,true);
 if jsonb_typeof(payload->'questions') is distinct from 'array' or jsonb_array_length(payload->'questions')>100 or jsonb_typeof(payload->'levels') is distinct from 'array' or jsonb_array_length(payload->'levels')>100 then raise exception using errcode='P0422',message='Preguntas o niveles inválidos';end if;
 select version into strict tv from public.test_bienestar where id_test=tid;
 delete from public.opcion_respuesta where pregunta_test_id_pregunta in(select id_pregunta from public.pregunta_test where test_id=tid);
 delete from public.pregunta_test where test_id=tid;delete from public.test_resultado_nivel where test_id=tid;
 for q in select value from jsonb_array_elements(payload->'questions') loop
  perform private.check_fields(q,array['text','helper','options']);perform private.check_text(q->>'text',5000);perform private.check_text(coalesce(q->>'helper',''),5000,true);
  if jsonb_typeof(q->'options') is distinct from 'array' or jsonb_array_length(q->'options') not between 2 and 20 then raise exception using errcode='P0422',message='Opciones insuficientes';end if;
  ordinal:=ordinal+1;insert into public.pregunta_test(test_id,test_version,orden,texto_pregunta,helper) values(tid,tv,ordinal,q->>'text',coalesce(q->>'helper','')) returning id_pregunta into qid;
  lo:=null;hi:=null;
  for o in select value from jsonb_array_elements(q->'options') loop
   perform private.check_fields(o,array['text','score']);perform private.check_text(o->>'text',160);
   if jsonb_typeof(o->'score')<>'number' or (o->>'score')!~'^[0-9]+$' or (o->>'score')::numeric>1000 then raise exception using errcode='P0422',message='Puntaje inválido';end if;
   insert into public.opcion_respuesta(pregunta_test_id_pregunta,texto_opcion,puntaje) values(qid,o->>'text',(o->>'score')::int);
   lo:=least(lo,(o->>'score')::int);hi:=greatest(hi,(o->>'score')::int);
  end loop;min_score:=min_score+lo;max_score:=max_score+hi;
 end loop;
 for l in select value from jsonb_array_elements(payload->'levels') loop
  perform private.check_fields(l,array['key','label','content','min','max']);perform private.check_text(l->>'key',80);perform private.check_text(l->>'label',160);perform private.check_text(l->>'content',5000);
  if l->>'key'!~'^[a-z][a-z0-9_]*$' or (l->>'min')!~'^[0-9]+$' or(l->>'max')!~'^[0-9]+$' or(l->>'min')::numeric>100000 or(l->>'max')::numeric>100000 then raise exception using errcode='P0422',message='Nivel inválido';end if;
  insert into public.test_resultado_nivel(test_id,test_version,nivel_resultado,puntaje_minimo,puntaje_maximo,label,interpretation) values(tid,tv,l->>'key',(l->>'min')::int,(l->>'max')::int,l->>'label',l->>'content');
 end loop;
 update public.test_bienestar set nombre_test=payload->>'title',descripcion=coalesce(payload->>'description',''),puntaje_minimo=min_score,puntaje_maximo=max_score where id_test=tid;
end;$$;
create function private.validate_test_publication(tid bigint) returns void language plpgsql security invoker set search_path='' as $$
declare expected integer;maximum integer;l record;
begin
 select puntaje_minimo,puntaje_maximo into expected,maximum from public.test_bienestar where id_test=tid;
 if not exists(select 1 from public.pregunta_test where test_id=tid) or exists(select 1 from public.pregunta_test p where p.test_id=tid and(select count(*) from public.opcion_respuesta where pregunta_test_id_pregunta=p.id_pregunta)<2) then raise exception using errcode='P0422',message='Cuestionario incompleto';end if;
 if not exists(select 1 from public.test_resultado_nivel where test_id=tid) then raise exception using errcode='P0422',message='Niveles incompletos';end if;
 for l in select * from public.test_resultado_nivel where test_id=tid order by puntaje_minimo loop
  if l.puntaje_minimo<>expected then raise exception using errcode='P0422',message='Rangos con huecos o solapamientos';end if;expected:=l.puntaje_maximo+1;
 end loop;
 if expected<>maximum+1 then raise exception using errcode='P0422',message='Rangos no cubren los puntajes';end if;
end;$$;
create function private.save_tip_rules(tid bigint,rules jsonb) returns void language plpgsql security invoker set search_path='' as $$
declare r jsonb;mid bigint;testrow public.test_bienestar;
begin
 if jsonb_typeof(rules) is distinct from 'array' or jsonb_array_length(rules)>100 then raise exception using errcode='P0422',message='Reglas inválidas';end if;
 delete from public.material_emocion where material_apoyo_id_material=tid;delete from public.material_test where material_apoyo_id_material=tid;
 for r in select value from jsonb_array_elements(rules) loop
  if r->>'kind'='mood' then
   perform private.check_fields(r,array['kind','mood']);select id_emocion into mid from public.emocion_general where nombre_emocion=r->>'mood';if mid is null then raise exception using errcode='P0422',message='Ánimo inválido';end if;
   insert into public.material_emocion(material_apoyo_id_material,emocion_general_id_emocion) values(tid,mid);
  elsif r->>'kind'='result' then
   perform private.check_fields(r,array['kind','catalogId','versionId','version','level']);
   if r->>'versionId'!~'^[1-9][0-9]*$' or r->>'version'!~'^[1-9][0-9]*$' then raise exception using errcode='P0422',message='Versión inválida';end if;
   select * into testrow from public.test_bienestar where id_test=(r->>'versionId')::bigint and catalog_id=(r->>'catalogId')::uuid and version=(r->>'version')::int and publication_status='published';
   if not found then raise exception using errcode='P0422',message='Regla requiere versión publicada';end if;
   insert into public.material_test(material_apoyo_id_material,test_id,test_version,nivel_resultado) values(tid,testrow.id_test,testrow.version,r->>'level');
  else raise exception using errcode='P0422',message='Tipo de regla inválido';end if;
 end loop;
end;$$;
create function public.admin_mutate(p_actor uuid,p_session uuid,p_method text,p_path text,p_payload jsonb) returns jsonb language plpgsql security invoker set search_path='' as $$
declare request uuid;hash text;cached private.admin_requests;result jsonb;tid bigint;cat uuid;current_test public.test_bienestar;newid bigint;rev integer;op text;idtext text;eid uuid;eventrow public.evento_institucional;tiprow public.material_apoyo;q record;o record;l record;qid bigint;
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
 if p_path='/tests' and p_method='POST' then
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
   perform private.check_fields(p_payload,array['requestId','expectedRevision','title','description','location','startsAt','endsAt']);perform private.check_text(p_payload->>'title',160);perform private.check_text(coalesce(p_payload->>'description',''),5000,true);perform private.check_text(p_payload->>'location',160);
   if p_payload->>'startsAt'!~'(Z|[+-][0-9]{2}:[0-9]{2})$' or p_payload->>'endsAt'!~'(Z|[+-][0-9]{2}:[0-9]{2})$' then raise exception using errcode='P0422',message='Instante UTC requerido';end if;
   if op='create' then insert into public.evento_institucional(title,description,location,starts_at,ends_at) values(p_payload->>'title',coalesce(p_payload->>'description',''),p_payload->>'location',(p_payload->>'startsAt')::timestamptz,(p_payload->>'endsAt')::timestamptz) returning id,revision into eid,rev;
   else update public.evento_institucional set title=p_payload->>'title',description=coalesce(p_payload->>'description',''),location=p_payload->>'location',starts_at=(p_payload->>'startsAt')::timestamptz,ends_at=(p_payload->>'endsAt')::timestamptz,revision=revision+1 where id=eid returning revision into rev;end if;
  elsif op='publish' and p_method='POST' and eventrow.status='draft' then
   perform private.check_fields(p_payload,array['requestId','expectedRevision']);update public.evento_institucional set status='published',published_at=now(),revision=revision+1 where id=eid returning revision into rev;
  elsif op='cancel' and p_method='POST' and eventrow.status='published' then
   perform private.check_fields(p_payload,array['requestId','expectedRevision']);update public.evento_institucional set status='cancelled',revision=revision+1 where id=eid returning revision into rev;
  else raise exception using errcode='P0422',message='Transición inválida';end if;
  result:=jsonb_build_object('id',eid,'revision',rev);
 elsif p_path='/tips' and p_method='POST' or p_path~'^/tips/[1-9][0-9]*(/(publish|activation))?$' then
  if p_path='/tips' then op:='create';else tid:=split_part(p_path,'/',3)::bigint;op:=coalesce(nullif(split_part(p_path,'/',4),''),'edit');select * into tiprow from public.material_apoyo where id_material=tid for update;
   if not found then raise exception using errcode='P0404',message='Tip no disponible';end if;
   if(p_payload->>'expectedRevision')::int is distinct from tiprow.revision then raise exception using errcode='P0409',message='Revisión en conflicto';end if;
  end if;
  if(op='create' and p_method='POST') or(op='edit' and p_method='PUT') then
   perform private.check_fields(p_payload,array['requestId','expectedRevision','title','content','rules']);perform private.check_text(p_payload->>'title',160);perform private.check_text(p_payload->>'content',5000);
   if op='create' then insert into public.material_apoyo(titulo,descripcion) values(p_payload->>'title',p_payload->>'content') returning id_material,revision into tid,rev;
   else update public.material_apoyo set titulo=p_payload->>'title',descripcion=p_payload->>'content',revision=revision+1 where id_material=tid returning revision into rev;end if;
   perform private.save_tip_rules(tid,p_payload->'rules');
  elsif op='publish' and p_method='POST' and tiprow.publication_status='draft' then
   perform private.check_fields(p_payload,array['requestId','expectedRevision']);update public.material_apoyo set publication_status='published',published_at=now(),is_active=true,revision=revision+1 where id_material=tid returning revision into rev;
  elsif op='activation' and p_method='POST' and tiprow.publication_status='published' then
   perform private.check_fields(p_payload,array['requestId','expectedRevision','active']);if jsonb_typeof(p_payload->'active')<>'boolean' then raise exception using errcode='P0422',message='Activación inválida';end if;
   update public.material_apoyo set is_active=(p_payload->>'active')::boolean,revision=revision+1 where id_material=tid returning revision into rev;
  else raise exception using errcode='P0422',message='Transición inválida';end if;
  result:=jsonb_build_object('id',tid::text,'revision',rev);
 else raise exception using errcode='P0404',message='Operación no disponible';end if;
 insert into private.admin_requests(request_id,actor,action,resource,payload_hash,status,result) values(request,p_actor,p_method,p_path,hash,'completed',result);
 return result;
end;$$;
revoke all on function private.assert_admin(uuid,uuid),private.check_fields(jsonb,text[]),private.check_text(text,integer,boolean),private.save_test_content(bigint,jsonb),private.validate_test_publication(bigint),private.save_tip_rules(bigint,jsonb),public.admin_mutate(uuid,uuid,text,text,jsonb) from public,anon,authenticated;
grant execute on function private.assert_admin(uuid,uuid),private.check_fields(jsonb,text[]),private.check_text(text,integer,boolean),private.save_test_content(bigint,jsonb),private.validate_test_publication(bigint),private.save_tip_rules(bigint,jsonb),public.admin_mutate(uuid,uuid,text,text,jsonb) to service_role;
commit;

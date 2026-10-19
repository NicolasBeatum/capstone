begin;
create function private.test_version_json(tid bigint) returns jsonb language sql stable security invoker set search_path='' as $$
 select jsonb_build_object('versionId',t.id_test::text,'catalogId',t.catalog_id,'version',t.version,'title',t.nombre_test,'description',coalesce(t.descripcion,''),'publicationStatus',t.publication_status,'publishedAt',t.published_at,'active',t.is_active,'revision',t.revision,'kind',c.kind,'code',c.code,'scoringKind',t.scoring_kind,
 'questions',coalesce((select jsonb_agg(jsonb_build_object('id',p.id_pregunta::text,'order',p.orden,'text',p.texto_pregunta,'helper',p.helper,'critical',p.is_critica,'options',coalesce((select jsonb_agg(jsonb_build_object('id',o.id_opcion::text,'text',o.texto_opcion,'score',o.puntaje) order by o.id_opcion) from public.opcion_respuesta o where o.pregunta_test_id_pregunta=p.id_pregunta),'[]'::jsonb)) order by p.orden) from public.pregunta_test p where p.test_id=t.id_test),'[]'::jsonb),
 'levels',coalesce((select jsonb_agg(jsonb_build_object('key',n.nivel_resultado,'label',n.label,'content',n.interpretation,'min',n.puntaje_minimo,'max',n.puntaje_maximo) order by n.puntaje_minimo) from public.test_resultado_nivel n where n.test_id=t.id_test),'[]'::jsonb))
 from public.test_bienestar t join public.test_catalogo c using(catalog_id) where t.id_test=tid;
$$;
create function private.catalog_json(cid uuid) returns jsonb language sql stable security invoker set search_path='' as $$
 select jsonb_build_object('catalogId',c.catalog_id,'code',c.code,'kind',c.kind,'activeVersionId',c.active_version_id::text,'versions',coalesce((select jsonb_agg(jsonb_build_object('versionId',t.id_test::text,'version',t.version,'title',t.nombre_test,'publicationStatus',t.publication_status,'active',t.is_active,'revision',t.revision) order by t.version desc) from public.test_bienestar t where t.catalog_id=c.catalog_id),'[]'::jsonb)) from public.test_catalogo c where catalog_id=cid;
$$;
create function private.tip_json(tid bigint) returns jsonb language sql stable security invoker set search_path='' as $$
 select jsonb_build_object('id',m.id_material::text,'title',m.titulo,'content',coalesce(m.descripcion,''),'publicationStatus',m.publication_status,'publishedAt',m.published_at,'active',m.is_active,'revision',m.revision,'rules',coalesce((select jsonb_agg(rule order by rule::text) from(
  select jsonb_build_object('kind','mood','mood',e.nombre_emocion) rule from public.material_emocion me join public.emocion_general e on e.id_emocion=me.emocion_general_id_emocion where me.material_apoyo_id_material=m.id_material
  union all select jsonb_build_object('kind','result','catalogId',t.catalog_id,'versionId',t.id_test::text,'version',t.version,'level',mt.nivel_resultado) from public.material_test mt join public.test_bienestar t on t.id_test=mt.test_id where mt.material_apoyo_id_material=m.id_material
 ) rules),'[]'::jsonb)) from public.material_apoyo m where id_material=tid;
$$;
create function public.admin_read(p_actor uuid,p_session uuid,p_path text,p_query jsonb default '{}') returns jsonb language plpgsql security invoker set search_path='' as $$
declare result jsonb;page_number int;page_size int;search_term text;career bigint;campus bigint;
begin
 perform private.assert_admin(p_actor,p_session);
 if p_path='/students' then
  perform private.check_fields(p_query,array['search','careerId','campusId','page','pageSize']);
  page_number:=coalesce((p_query->>'page')::int,1);page_size:=coalesce((p_query->>'pageSize')::int,25);search_term:=lower(coalesce(p_query->>'search',''));career:=nullif(p_query->>'careerId','')::bigint;campus:=nullif(p_query->>'campusId','')::bigint;
  if page_number not between 1 and 100000 or page_size not between 1 and 100 or length(search_term)>100 then raise exception using errcode='P0422',message='Filtros inválidos';end if;
  with filtered as(
   select e.id_estudiante::text id,concat_ws(' ',e.primer_nombre,e.segundo_nombre,e.primer_apellido,e.segundo_apellido) name,nullif(trim(u.email),'') email,c.nombre_carrera "career",s.nombre_sede "campus"
   from public.estudiante e left join auth.users u on u.id=e.auth_user_id left join public.estudiante_carrera ec on ec.estudiante_id_estudiante=e.id_estudiante and ec.fecha_fin is null left join public.carrera c on c.id_carrera=ec.carrera_id_carrera left join public.sede s on s.id_sede=c.sede_id_sede
   where (career is null or c.id_carrera=career) and(campus is null or s.id_sede=campus) and(search_term='' or position(search_term in lower(concat_ws(' ',e.primer_nombre,e.segundo_nombre,e.primer_apellido,e.segundo_apellido)))>0 or position(search_term in lower(coalesce(u.email,'')))>0)
  ) select jsonb_build_object('items',coalesce((select jsonb_agg(to_jsonb(rows) order by name,id) from(select * from filtered order by name,id limit page_size offset(page_number-1)*page_size) rows),'[]'::jsonb),'total',(select count(*) from filtered),'page',page_number,'pageSize',page_size) into result;
 elsif p_path='/tests' then
  perform private.check_fields(p_query,array[]::text[]);select coalesce(jsonb_agg(private.catalog_json(catalog_id) order by code),'[]'::jsonb) into result from public.test_catalogo;
 elsif p_path~'^/tests/catalogs/[0-9a-f-]{36}$' then
  perform private.check_fields(p_query,array[]::text[]);result:=private.catalog_json(split_part(p_path,'/',4)::uuid);
 elsif p_path~'^/tests/versions/[1-9][0-9]*$' then
  perform private.check_fields(p_query,array[]::text[]);result:=private.test_version_json(split_part(p_path,'/',4)::bigint);
 elsif p_path='/events' then
  perform private.check_fields(p_query,array[]::text[]);select coalesce(jsonb_agg(jsonb_build_object('id',id,'title',title,'description',description,'location',location,'startsAt',starts_at,'endsAt',ends_at,'status',status,'publishedAt',published_at,'revision',revision) order by starts_at,id),'[]'::jsonb) into result from public.evento_institucional;
 elsif p_path='/tips' then
  perform private.check_fields(p_query,array[]::text[]);select coalesce(jsonb_agg(private.tip_json(id_material) order by titulo,id_material),'[]'::jsonb) into result from public.material_apoyo;
 elsif p_path='/catalogs' then
  perform private.check_fields(p_query,array[]::text[]);
  select jsonb_build_object(
   'careers',coalesce((select jsonb_agg(jsonb_build_object('id',id_carrera::text,'name',nombre_carrera,'campusId',sede_id_sede::text) order by nombre_carrera,id_carrera) from public.carrera),'[]'::jsonb),
   'campuses',coalesce((select jsonb_agg(jsonb_build_object('id',id_sede::text,'name',nombre_sede) order by nombre_sede,id_sede) from public.sede),'[]'::jsonb),
   'moods',coalesce((select jsonb_agg(nombre_emocion order by valor_escala) from public.emocion_general),'[]'::jsonb),
   'resultLevels',coalesce((select jsonb_agg(jsonb_build_object('catalogId',t.catalog_id,'versionId',t.id_test::text,'version',t.version,'title',t.nombre_test,'level',n.nivel_resultado,'label',n.label,'active',t.is_active) order by t.nombre_test,t.version,n.puntaje_minimo) from public.test_resultado_nivel n join public.test_bienestar t on t.id_test=n.test_id where t.publication_status='published'),'[]'::jsonb)) into result;
 else raise exception using errcode='P0404',message='Consulta no disponible';end if;
 if result is null then raise exception using errcode='P0404',message='Recurso no disponible';end if;
 return result;
end;$$;
revoke all on function private.test_version_json(bigint),private.catalog_json(uuid),private.tip_json(bigint),public.admin_read(uuid,uuid,text,jsonb) from public,anon,authenticated;
grant execute on function private.test_version_json(bigint),private.catalog_json(uuid),private.tip_json(bigint),public.admin_read(uuid,uuid,text,jsonb) to service_role;
commit;

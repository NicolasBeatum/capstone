begin;

create schema if not exists schedule_private;
revoke all on schema schedule_private from public, anon, authenticated;
grant usage on schema schedule_private to authenticated;

create table public.personal_schedule (
  user_id uuid primary key references auth.users(id) on delete cascade,
  revision integer not null default 0 check (revision >= 0),
  active_semester_id uuid,
  updated_at timestamptz not null default now()
);
create table public.schedule_semester (
  id uuid not null,
  user_id uuid not null references public.personal_schedule(user_id) on delete cascade,
  name text not null check (length(name) between 1 and 80 and name = btrim(name) and name !~ '[[:cntrl:]]'),
  starts_on date,
  ends_on date,
  primary key (id, user_id),
  check (starts_on is null or ends_on is null or starts_on <= ends_on)
);
alter table public.personal_schedule add constraint personal_schedule_active_fk
  foreign key (active_semester_id, user_id) references public.schedule_semester(id, user_id)
  deferrable initially deferred;
create table public.schedule_subject (
  id uuid not null,
  user_id uuid not null,
  semester_id uuid not null,
  name text not null check (length(name) between 1 and 120 and name = btrim(name) and name !~ '[[:cntrl:]]'),
  code text check (code is null or (length(code) between 1 and 40 and code = btrim(code) and code !~ '[[:cntrl:]]')),
  section text check (section is null or (length(section) between 1 and 40 and section = btrim(section) and section !~ '[[:cntrl:]]')),
  primary key (id, user_id),
  foreign key (semester_id, user_id) references public.schedule_semester(id, user_id) on delete cascade
);
create table public.schedule_block (
  id uuid not null,
  user_id uuid not null,
  subject_id uuid not null,
  weekday smallint not null check (weekday between 1 and 7),
  starts_at time not null,
  ends_at time not null,
  room text check (room is null or (length(room) between 1 and 120 and room = btrim(room) and room !~ '[[:cntrl:]]')),
  teacher text check (teacher is null or (length(teacher) between 1 and 160 and teacher = btrim(teacher) and teacher !~ '[[:cntrl:]]')),
  primary key (id, user_id),
  foreign key (subject_id, user_id) references public.schedule_subject(id, user_id) on delete cascade,
  unique (user_id, subject_id, weekday, starts_at, ends_at),
  check (starts_at < ends_at and ends_at < time '24:00' and extract(second from starts_at) = 0 and extract(second from ends_at) = 0)
);
create index schedule_semester_owner on public.schedule_semester(user_id);
create index schedule_subject_parent on public.schedule_subject(user_id, semester_id);
create index schedule_block_parent on public.schedule_block(user_id, subject_id);
create table schedule_private.schedule_request (
  user_id uuid not null references public.personal_schedule(user_id) on delete cascade,
  request_id uuid not null,
  payload_hash text not null,
  revision integer not null check (revision > 0),
  primary key(user_id, request_id)
);

alter table public.personal_schedule enable row level security;
alter table public.schedule_semester enable row level security;
alter table public.schedule_subject enable row level security;
alter table public.schedule_block enable row level security;
alter table schedule_private.schedule_request enable row level security;
revoke all on public.personal_schedule, public.schedule_semester, public.schedule_subject, public.schedule_block from public, anon, authenticated;
revoke all on schedule_private.schedule_request from public, anon, authenticated;
grant select on public.personal_schedule, public.schedule_semester, public.schedule_subject, public.schedule_block to authenticated;
create policy "owner reads schedule" on public.personal_schedule for select to authenticated using (user_id = (select auth.uid()));
create policy "owner reads semesters" on public.schedule_semester for select to authenticated using (user_id = (select auth.uid()));
create policy "owner reads personal subjects" on public.schedule_subject for select to authenticated using (user_id = (select auth.uid()));
create policy "owner reads weekly blocks" on public.schedule_block for select to authenticated using (user_id = (select auth.uid()));

create function schedule_private.fields(v jsonb, keys text[]) returns void
language plpgsql immutable set search_path = '' as $$
begin
  if jsonb_typeof(v) is distinct from 'object'
    or exists(select 1 from jsonb_object_keys(v) k where not k = any(keys))
    or not v ?& keys then
    raise exception using errcode = 'P0422', message = 'La información del horario no es válida.';
  end if;
end; $$;
create function schedule_private.valid_text(v jsonb, max_length integer, optional boolean default false) returns boolean
language sql immutable set search_path = '' as $$
  select case when v = 'null'::jsonb then optional else
    jsonb_typeof(v) = 'string' and length(v #>> '{}') between 1 and max_length
    and (v #>> '{}') = btrim(v #>> '{}') and (v #>> '{}') !~ '[[:cntrl:]]' end;
$$;
create function schedule_private.valid_uuid(v jsonb) returns boolean
language sql immutable set search_path = '' as $$
  select jsonb_typeof(v) = 'string' and (v #>> '{}') ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$';
$$;
create function schedule_private.validate_document(doc jsonb) returns void
language plpgsql immutable set search_path = '' as $$
declare s jsonb; r jsonb; b jsonb; field text;
begin
  perform schedule_private.fields(doc,array['schema','activeSemesterId','semesters','subjects','blocks']);
  if doc->'schema' <> '1'::jsonb or octet_length(doc::text) > 2097152
    or jsonb_typeof(doc->'semesters') <> 'array' or jsonb_typeof(doc->'subjects') <> 'array' or jsonb_typeof(doc->'blocks') <> 'array' then
    raise exception using errcode='P0422',message='El horario no es válido o supera el límite permitido.';
  end if;
  if jsonb_array_length(doc->'semesters') > 50 or jsonb_array_length(doc->'subjects') > 1000 or jsonb_array_length(doc->'blocks') > 10000 then
    raise exception using errcode='P0422',message='El horario supera el límite permitido.';
  end if;
  for s in select value from jsonb_array_elements(doc->'semesters') loop
    perform schedule_private.fields(s,array['id','name','startsOn','endsOn']);
    if not schedule_private.valid_uuid(s->'id') or not schedule_private.valid_text(s->'name',80) then
      raise exception using errcode='P0422',message='Revisa el nombre e identificador del semestre.';
    end if;
    foreach field in array array['startsOn','endsOn'] loop
      if s->field <> 'null'::jsonb and (jsonb_typeof(s->field) <> 'string' or (s->>field) !~ '^\d{4}-\d{2}-\d{2}$' or to_char((s->>field)::date,'YYYY-MM-DD') <> s->>field) then
        raise exception using errcode='P0422',message='Revisa las fechas del semestre.';
      end if;
    end loop;
    if (s->>'startsOn')::date > (s->>'endsOn')::date then
      raise exception using errcode='P0422',message='El término es anterior al inicio.';
    end if;
  end loop;
  for r in select value from jsonb_array_elements(doc->'subjects') loop
    perform schedule_private.fields(r,array['id','semesterId','name','code','section']);
    if not schedule_private.valid_uuid(r->'id') or not schedule_private.valid_uuid(r->'semesterId')
      or not schedule_private.valid_text(r->'name',120) or not schedule_private.valid_text(r->'code',40,true) or not schedule_private.valid_text(r->'section',40,true)
      or not exists(select 1 from jsonb_array_elements(doc->'semesters') as sem(value) where (sem.value->>'id')::uuid=(r->>'semesterId')::uuid) then
      raise exception using errcode='P0422',message='El ramo o semestre no es válido.';
    end if;
  end loop;
  for b in select value from jsonb_array_elements(doc->'blocks') loop
    perform schedule_private.fields(b,array['id','subjectId','weekday','startsAt','endsAt','room','teacher']);
    if not schedule_private.valid_uuid(b->'id') or not schedule_private.valid_uuid(b->'subjectId')
      or jsonb_typeof(b->'weekday') <> 'number' or (b->>'weekday') !~ '^[1-7]$'
      or jsonb_typeof(b->'startsAt') <> 'string' or (b->>'startsAt') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
      or jsonb_typeof(b->'endsAt') <> 'string' or (b->>'endsAt') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
      or (b->>'startsAt') >= (b->>'endsAt')
      or not schedule_private.valid_text(b->'room',120,true) or not schedule_private.valid_text(b->'teacher',160,true)
      or not exists(select 1 from jsonb_array_elements(doc->'subjects') as subj(value) where (subj.value->>'id')::uuid=(b->>'subjectId')::uuid) then
      raise exception using errcode='P0422',message='Revisa el día, intervalo y datos del bloque.';
    end if;
  end loop;
  foreach field in array array['semesters','subjects','blocks'] loop
    if exists(select (x->>'id')::uuid from jsonb_array_elements(doc->field) x group by (x->>'id')::uuid having count(*)>1) then
      raise exception using errcode='P0422',message='Hay identificadores repetidos.';
    end if;
  end loop;
  if exists(select 1 from jsonb_array_elements(doc->'blocks') as blk(value) group by (blk.value->>'subjectId')::uuid,blk.value->>'weekday',blk.value->>'startsAt',blk.value->>'endsAt' having count(*)>1) then
    raise exception using errcode='P0422',message='Ese bloque ya existe en el ramo.';
  end if;
  if jsonb_array_length(doc->'semesters') = 0 then
    if doc->'activeSemesterId' <> 'null'::jsonb then raise exception using errcode='P0422',message='No existe el semestre activo.'; end if;
  elsif not schedule_private.valid_uuid(doc->'activeSemesterId') or not exists(select 1 from jsonb_array_elements(doc->'semesters') as sem(value) where (sem.value->>'id')::uuid=(doc->>'activeSemesterId')::uuid) then
    raise exception using errcode='P0422',message='Selecciona un semestre activo.';
  end if;
exception when invalid_text_representation or datetime_field_overflow or invalid_datetime_format then
  raise exception using errcode='P0422',message='La información del horario no es válida.';
end; $$;

create function public.load_personal_schedule() returns jsonb
language sql stable security invoker set search_path = '' as $$
select jsonb_build_object('revision',coalesce(p.revision,0),'document',jsonb_build_object(
  'schema',1,'activeSemesterId',p.active_semester_id,
  'semesters',coalesce((select jsonb_agg(jsonb_build_object('id',s.id,'name',s.name,'startsOn',s.starts_on,'endsOn',s.ends_on) order by s.id) from public.schedule_semester s where s.user_id=auth.uid()),'[]'::jsonb),
  'subjects',coalesce((select jsonb_agg(jsonb_build_object('id',s.id,'semesterId',s.semester_id,'name',s.name,'code',s.code,'section',s.section) order by s.id) from public.schedule_subject s where s.user_id=auth.uid()),'[]'::jsonb),
  'blocks',coalesce((select jsonb_agg(jsonb_build_object('id',b.id,'subjectId',b.subject_id,'weekday',b.weekday,'startsAt',to_char(b.starts_at,'HH24:MI'),'endsAt',to_char(b.ends_at,'HH24:MI'),'room',b.room,'teacher',b.teacher) order by b.id) from public.schedule_block b where b.user_id=auth.uid()),'[]'::jsonb)
)) from (select 1) seed left join public.personal_schedule p on p.user_id=auth.uid();
$$;

create function schedule_private.save_schedule(p_expected_revision integer,p_request_id uuid,p_document jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare owner_id uuid:=auth.uid(); current_revision integer; receipt schedule_private.schedule_request; hash text; s jsonb; r jsonb; b jsonb;
begin
  if owner_id is null or not exists(select 1 from auth.users u join public.estudiante e on e.auth_user_id=u.id where u.id=owner_id) then
    raise exception using errcode='P0401',message='Inicia sesión con tu cuenta de estudiante.';
  end if;
  if p_request_id is null or p_expected_revision is null or p_expected_revision < 0 then
    raise exception using errcode='P0422',message='La operación no es válida.';
  end if;
  perform schedule_private.validate_document(p_document);
  hash:=encode(extensions.digest(convert_to(jsonb_build_object('revision',p_expected_revision,'document',p_document)::text,'UTF8'),'sha256'),'hex');
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(owner_id::text,13013));
  select * into receipt from schedule_private.schedule_request where user_id=owner_id and request_id=p_request_id;
  if found then
    if receipt.payload_hash <> hash then raise exception using errcode='P0409',message='La operación ya fue usada con otros datos.'; end if;
    return jsonb_build_object('status','applied','revision',receipt.revision,'requestId',p_request_id);
  end if;
  select revision into current_revision from public.personal_schedule where user_id=owner_id for update;
  current_revision:=coalesce(current_revision,0);
  if current_revision <> p_expected_revision then
    return jsonb_build_object('status','conflict','remote',public.load_personal_schedule());
  end if;
  if exists(select 1 from public.schedule_semester old where old.user_id=owner_id and not exists(select 1 from jsonb_array_elements(p_document->'semesters') as sem(value) where (sem.value->>'id')::uuid=old.id)) then
    raise exception using errcode='P0422',message='Los semestres anteriores deben conservarse.';
  end if;
  insert into public.personal_schedule(user_id) values(owner_id) on conflict do nothing;
  for s in select value from jsonb_array_elements(p_document->'semesters') loop
    insert into public.schedule_semester(id,user_id,name,starts_on,ends_on) values((s->>'id')::uuid,owner_id,s->>'name',(s->>'startsOn')::date,(s->>'endsOn')::date)
    on conflict(id,user_id) do update set name=excluded.name,starts_on=excluded.starts_on,ends_on=excluded.ends_on;
  end loop;
  delete from public.schedule_block where user_id=owner_id;
  delete from public.schedule_subject old where old.user_id=owner_id and not exists(select 1 from jsonb_array_elements(p_document->'subjects') as subj(value) where (subj.value->>'id')::uuid=old.id);
  for r in select value from jsonb_array_elements(p_document->'subjects') loop
    insert into public.schedule_subject(id,user_id,semester_id,name,code,section) values((r->>'id')::uuid,owner_id,(r->>'semesterId')::uuid,r->>'name',r->>'code',r->>'section')
    on conflict(id,user_id) do update set semester_id=excluded.semester_id,name=excluded.name,code=excluded.code,section=excluded.section;
  end loop;
  for b in select value from jsonb_array_elements(p_document->'blocks') loop
    insert into public.schedule_block(id,user_id,subject_id,weekday,starts_at,ends_at,room,teacher)
    values((b->>'id')::uuid,owner_id,(b->>'subjectId')::uuid,(b->>'weekday')::smallint,(b->>'startsAt')::time,(b->>'endsAt')::time,b->>'room',b->>'teacher');
  end loop;
  update public.personal_schedule set active_semester_id=(p_document->>'activeSemesterId')::uuid,revision=current_revision+1,updated_at=now() where user_id=owner_id;
  insert into schedule_private.schedule_request(user_id,request_id,payload_hash,revision) values(owner_id,p_request_id,hash,current_revision+1);
  return jsonb_build_object('status','applied','revision',current_revision+1,'requestId',p_request_id);
end; $$;
create function public.save_personal_schedule(p_expected_revision integer,p_request_id uuid,p_document jsonb) returns jsonb
language sql security invoker set search_path = '' as $$
  select schedule_private.save_schedule(p_expected_revision,p_request_id,p_document);
$$;
revoke all on all functions in schema schedule_private from public,anon,authenticated;
revoke all on function public.load_personal_schedule(), public.save_personal_schedule(integer,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.load_personal_schedule(), public.save_personal_schedule(integer,uuid,jsonb), schedule_private.save_schedule(integer,uuid,jsonb) to authenticated;

commit;

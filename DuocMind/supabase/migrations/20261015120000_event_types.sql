begin;

-- Catálogo de tipos de evento institucional (charla, taller, actividad...).
create table public.tipo_evento_institucional (
 id smallint generated always as identity primary key,
 code text not null unique check(code ~ '^[a-z][a-z0-9_]{1,31}$'),
 nombre text not null check(length(trim(nombre)) between 1 and 40),
 orden smallint not null default 0
);

insert into public.tipo_evento_institucional(code,nombre,orden) values
 ('charla','Charla',1),
 ('taller','Taller',2),
 ('actividad','Actividad',3);

-- Nullable: los eventos existentes siguen siendo válidos hasta que se les asigne tipo.
alter table public.evento_institucional
 add column tipo_id smallint references public.tipo_evento_institucional(id);
create index institutional_events_type_idx on public.evento_institucional(tipo_id);

-- Mismo patrón que evento_institucional: lectura pública del catálogo, escritura solo del backend.
alter table public.tipo_evento_institucional enable row level security;
revoke all on public.tipo_evento_institucional from public,anon,authenticated;
grant select on public.tipo_evento_institucional to anon,authenticated;
create policy event_type_read on public.tipo_evento_institucional for select to anon,authenticated using(true);
grant select,insert,update,delete on public.tipo_evento_institucional to service_role;

-- El catálogo del estudiante ahora incluye el tipo ({code,name} o null si no tiene).
create or replace function public.get_student_events(p_event_id uuid default null)
returns jsonb language sql stable security invoker set search_path = '' as $$
 select jsonb_build_object('serverTime',statement_timestamp(),'events',coalesce(jsonb_agg(
  jsonb_build_object('id',e.id,'title',e.title,'description',e.description,'location',e.location,
   'startsAt',e.starts_at,'endsAt',e.ends_at,'status',e.status,'publishedAt',e.published_at,
   'revision',e.revision,'requiresRegistration',e.requires_registration,'registrationUrl',e.registration_url,
   'registrationDeadline',e.registration_deadline,'registrationClosed',e.registration_closed,
   'type',case when t.id is null then null else jsonb_build_object('code',t.code,'name',t.nombre) end)
  order by e.starts_at,e.id),'[]'::jsonb))
 from public.evento_institucional e
 left join public.tipo_evento_institucional t on t.id=e.tipo_id
 where e.published_at is not null and (p_event_id is null or e.id=p_event_id);
$$;
revoke all on function public.get_student_events(uuid) from public,anon;
grant execute on function public.get_student_events(uuid) to authenticated;

commit;

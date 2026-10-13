begin;
create function public.get_student_events(p_event_id uuid default null)
returns jsonb language sql stable security invoker set search_path = '' as $$
 select jsonb_build_object('serverTime',statement_timestamp(),'events',coalesce(jsonb_agg(
  jsonb_build_object('id',e.id,'title',e.title,'description',e.description,'location',e.location,
   'startsAt',e.starts_at,'endsAt',e.ends_at,'status',e.status,'publishedAt',e.published_at,
   'revision',e.revision,'requiresRegistration',e.requires_registration,'registrationUrl',e.registration_url,
   'registrationDeadline',e.registration_deadline,'registrationClosed',e.registration_closed)
  order by e.starts_at,e.id),'[]'::jsonb))
 from public.evento_institucional e
 where e.published_at is not null and (p_event_id is null or e.id=p_event_id);
$$;
revoke all on function public.get_student_events(uuid) from public,anon;
grant execute on function public.get_student_events(uuid) to authenticated;
commit;

begin;
create function public.admin_access(p_actor uuid,p_session uuid) returns jsonb language plpgsql security invoker set search_path='' as $$
begin perform private.assert_admin(p_actor,p_session);return jsonb_build_object('allowed',true,'capabilities',array['students','tests','events','tips']);end;$$;
revoke all on function public.admin_access(uuid,uuid) from public,anon,authenticated;
grant execute on function public.admin_access(uuid,uuid) to service_role;
commit;

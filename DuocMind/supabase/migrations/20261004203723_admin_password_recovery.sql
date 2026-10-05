begin;
create function public.admin_reset_reserve(p_actor uuid,p_session uuid,p_student bigint,p_request uuid) returns jsonb language plpgsql security invoker set search_path='' as $$
declare cached private.admin_requests;resource text:='/students/'||p_student::text||'/password-reset';fingerprint text:=md5(p_student::text);
begin
 perform private.assert_admin(p_actor,p_session);
 perform pg_advisory_xact_lock(702005012);
 select * into cached from private.admin_requests where request_id=p_request and expires_at>now();
 if found then
  if cached.actor<>p_actor or cached.action<>'POST' or cached.resource<>resource or cached.payload_hash<>fingerprint then raise exception using errcode='P0409',message='Petición en conflicto';end if;
  return jsonb_build_object('send',false,'state',cached.status);
 end if;
 if not exists(select 1 from public.estudiante e join auth.users u on u.id=e.auth_user_id where e.id_estudiante=p_student and nullif(trim(u.email),'') is not null) then raise exception using errcode='P0422',message='Cuenta sin correo recuperable';end if;
 if exists(select 1 from private.password_reset_limits where student_id=p_student and expires_at>now() and created_at>now()-interval '1 minute') or(select count(*) from private.password_reset_limits where actor=p_actor and expires_at>now() and created_at>now()-interval '1 hour')>=10 then raise exception using errcode='P0429',message='Límite de solicitudes';end if;
 delete from private.admin_requests where request_id=p_request and expires_at<=now();
 insert into private.password_reset_limits(actor,student_id) values(p_actor,p_student);
 insert into private.admin_requests(request_id,actor,action,resource,payload_hash,status) values(p_request,p_actor,'POST',resource,fingerprint,'reserved');
 return jsonb_build_object('send',true,'state','reserved');
end;$$;
create function public.admin_reset_recipient(p_actor uuid,p_session uuid,p_student bigint,p_request uuid) returns text language plpgsql security invoker set search_path='' as $$
declare email text;
begin
 perform private.assert_admin(p_actor,p_session);
 if not exists(select 1 from private.admin_requests where request_id=p_request and actor=p_actor and resource='/students/'||p_student::text||'/password-reset' and status='reserved' and expires_at>now()) then raise exception using errcode='P0409',message='Solicitud no reservada';end if;
 select nullif(trim(u.email),'') into email from public.estudiante e join auth.users u on u.id=e.auth_user_id where e.id_estudiante=p_student;
 if email is null then raise exception using errcode='P0422',message='Cuenta sin correo recuperable';end if;return email;
end;$$;
create function public.admin_reset_finish(p_actor uuid,p_session uuid,p_request uuid,p_state text) returns void language plpgsql security invoker set search_path='' as $$
begin
 perform private.assert_admin(p_actor,p_session);
 if p_state not in ('accepted','uncertain') then raise exception using errcode='P0422',message='Estado inválido';end if;
 update private.admin_requests set status=p_state,result=jsonb_build_object('accepted',p_state='accepted') where request_id=p_request and actor=p_actor and status='reserved' and expires_at>now();
 if not found then raise exception using errcode='P0409',message='Solicitud no reservada';end if;
end;$$;
revoke all on function public.admin_reset_reserve(uuid,uuid,bigint,uuid),public.admin_reset_recipient(uuid,uuid,bigint,uuid),public.admin_reset_finish(uuid,uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.admin_reset_reserve(uuid,uuid,bigint,uuid),public.admin_reset_recipient(uuid,uuid,bigint,uuid),public.admin_reset_finish(uuid,uuid,uuid,text) to service_role;
commit;

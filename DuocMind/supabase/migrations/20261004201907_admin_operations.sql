begin;
create extension if not exists pg_cron;
create table private.admin_requests (
 request_id uuid primary key,
 actor uuid not null references auth.users(id) on delete cascade,
 action text not null,
 resource text not null,
 payload_hash text not null,
 status text not null check(status in ('completed','reserved','accepted','uncertain')),
 result jsonb not null default '{}',
 created_at timestamptz not null default now(),
 expires_at timestamptz not null default now()+interval '24 hours',
 check(expires_at=created_at+interval '24 hours')
);
create index admin_requests_expiry_idx on private.admin_requests(expires_at);
create table private.password_reset_limits (
 id bigint generated always as identity primary key,
 actor uuid not null references auth.users(id) on delete cascade,
 student_id bigint not null references public.estudiante(id_estudiante) on delete cascade,
 created_at timestamptz not null default now(),
 expires_at timestamptz not null default now()+interval '24 hours',
 check(expires_at=created_at+interval '24 hours')
);
create index reset_limits_actor_time_idx on private.password_reset_limits(actor,created_at);
create index reset_limits_student_time_idx on private.password_reset_limits(student_id,created_at);
create index reset_limits_expiry_idx on private.password_reset_limits(expires_at);
alter table private.admin_requests enable row level security;
alter table private.password_reset_limits enable row level security;
revoke all on private.admin_requests,private.password_reset_limits from public,anon,authenticated;
grant select,insert,update,delete on private.admin_requests,private.password_reset_limits to service_role;
grant usage on sequence private.password_reset_limits_id_seq to service_role;
create function private.cleanup_admin_operations() returns void language plpgsql security invoker set search_path='' as $$
begin
 delete from private.admin_requests where expires_at<=now();
 delete from private.password_reset_limits where expires_at<=now();
 delete from cron.job_run_details where jobid in(select jobid from cron.job where jobname='duocmind_admin_cleanup') and end_time<now()-interval '7 days';
end;
$$;
revoke all on function private.cleanup_admin_operations() from public,anon,authenticated,service_role;
select cron.schedule('duocmind_admin_cleanup','*/5 * * * *','select private.cleanup_admin_operations()');
commit;

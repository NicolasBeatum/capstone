begin;
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to service_role;
create table private.admin_staff (
 auth_user_id uuid primary key references auth.users(id) on delete cascade,
 enabled boolean not null default false,
 created_at timestamptz not null default now()
);
alter table private.admin_staff enable row level security;
revoke all on private.admin_staff from public, anon, authenticated;
grant select on private.admin_staff to service_role;
grant select(id,user_id,not_after) on auth.sessions to service_role;
commit;

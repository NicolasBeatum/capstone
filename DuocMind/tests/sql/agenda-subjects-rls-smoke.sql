-- Spec 011, CA-002: cada cuenta ve solo sus asignaturas inscritas en su carrera vigente.
-- Esquema mínimo con las mismas tablas, claves y políticas RLS de
-- supabase/migrations/20260927224730_bienestar_schema.sql. Solo datos sintéticos.
\set ON_ERROR_STOP on

create role anon nologin;
create role authenticated nologin;
create schema auth;
create function auth.uid()
returns uuid
language sql
stable
as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant execute on function auth.uid() to anon, authenticated;

create table public.sede (id_sede bigint generated always as identity primary key, nombre_sede text not null unique);
create table public.carrera (
  id_carrera bigint generated always as identity primary key,
  nombre_carrera text not null,
  sede_id_sede bigint not null references public.sede(id_sede),
  unique (sede_id_sede, nombre_carrera)
);
create table public.asignatura (
  id_asignatura bigint generated always as identity primary key,
  nombre_asignatura text not null,
  codigo text not null unique
);
create table public.carrera_asignatura (
  id_carrera_asignatura bigint generated always as identity primary key,
  carrera_id_carrera bigint not null references public.carrera(id_carrera),
  asignatura_id_asignatura bigint not null references public.asignatura(id_asignatura),
  unique (carrera_id_carrera, asignatura_id_asignatura),
  unique (id_carrera_asignatura, carrera_id_carrera)
);
create table public.estudiante (
  id_estudiante bigint generated always as identity primary key,
  auth_user_id uuid unique,
  rut text not null unique,
  primer_nombre text not null,
  primer_apellido text not null
);
create table public.estudiante_carrera (
  id_estudiante_carrera bigint generated always as identity primary key,
  estudiante_id_estudiante bigint not null references public.estudiante(id_estudiante),
  carrera_id_carrera bigint not null references public.carrera(id_carrera),
  fecha_inicio date not null default current_date,
  fecha_fin date,
  unique (id_estudiante_carrera, estudiante_id_estudiante),
  unique (id_estudiante_carrera, estudiante_id_estudiante, carrera_id_carrera)
);
create table public.estudiante_asignatura (
  id_estudiante_asignatura bigint generated always as identity primary key,
  estudiante_id_estudiante bigint not null,
  estudiante_carrera_id bigint not null,
  carrera_id_carrera bigint not null,
  carrera_asignatura_id bigint not null,
  fecha_inscripcion date not null default current_date,
  constraint ea_carrera_fk foreign key (estudiante_carrera_id, estudiante_id_estudiante, carrera_id_carrera)
    references public.estudiante_carrera(id_estudiante_carrera, estudiante_id_estudiante, carrera_id_carrera),
  constraint ea_asignatura_fk foreign key (carrera_asignatura_id, carrera_id_carrera)
    references public.carrera_asignatura(id_carrera_asignatura, carrera_id_carrera),
  unique (estudiante_carrera_id, carrera_asignatura_id)
);

alter table public.sede enable row level security;
alter table public.carrera enable row level security;
alter table public.asignatura enable row level security;
alter table public.carrera_asignatura enable row level security;
alter table public.estudiante enable row level security;
alter table public.estudiante_carrera enable row level security;
alter table public.estudiante_asignatura enable row level security;
grant select on public.sede, public.carrera, public.asignatura, public.carrera_asignatura to anon, authenticated;
grant select on public.estudiante, public.estudiante_carrera, public.estudiante_asignatura to authenticated;
create policy "public catalogs are readable" on public.sede for select to anon, authenticated using (true);
create policy "public catalogs are readable" on public.carrera for select to anon, authenticated using (true);
create policy "public catalogs are readable" on public.asignatura for select to anon, authenticated using (true);
create policy "public catalogs are readable" on public.carrera_asignatura for select to anon, authenticated using (true);
create policy "student reads own profile" on public.estudiante for select to authenticated
  using (auth_user_id = (select auth.uid()));
create policy "student reads own career history" on public.estudiante_carrera for select to authenticated
  using (exists (select 1 from public.estudiante e where e.id_estudiante = estudiante_id_estudiante and e.auth_user_id = (select auth.uid())));
create policy "student reads own course enrollments" on public.estudiante_asignatura for select to authenticated
  using (exists (select 1 from public.estudiante e where e.id_estudiante = estudiante_id_estudiante and e.auth_user_id = (select auth.uid())));

-- Datos sintéticos: dos carreras, cuatro asignaturas.
insert into public.sede (nombre_sede) values ('Sede de prueba');
insert into public.carrera (nombre_carrera, sede_id_sede) values ('Carrera A', 1), ('Carrera B', 1);
insert into public.asignatura (nombre_asignatura, codigo) values
  ('Base de datos', 'BDY2101'), ('Inglés', 'ING101'), ('Ética', 'EPY1101'), ('Cálculo', 'MAT101');
insert into public.carrera_asignatura (carrera_id_carrera, asignatura_id_asignatura) values
  (1, 1), (1, 2), (2, 3), (2, 4);
insert into public.estudiante (auth_user_id, rut, primer_nombre, primer_apellido) values
  ('10000000-0000-0000-0000-000000000001', 'RUT-TEST-1', 'Estudiante', 'Uno'),
  ('20000000-0000-0000-0000-000000000002', 'RUT-TEST-2', 'Estudiante', 'Dos');
-- Estudiante 1: carrera A vigente con 2 asignaturas.
-- Estudiante 2: carrera A cerrada (1 asignatura) y carrera B vigente (1 asignatura).
insert into public.estudiante_carrera (estudiante_id_estudiante, carrera_id_carrera, fecha_inicio, fecha_fin) values
  (1, 1, '2025-01-01', null),
  (2, 1, '2024-01-01', '2024-12-31'),
  (2, 2, '2025-01-01', null);
insert into public.estudiante_asignatura (estudiante_id_estudiante, estudiante_carrera_id, carrera_id_carrera, carrera_asignatura_id) values
  (1, 1, 1, 1), (1, 1, 1, 2),
  (2, 2, 1, 1),
  (2, 3, 2, 4);

-- Consulta equivalente a la del gateway: inscripciones de la carrera vigente con su asignatura.
create view public.subjects_probe with (security_invoker = true) as
select a.nombre_asignatura, a.codigo
from public.estudiante_asignatura ea
join public.estudiante_carrera ec on ec.id_estudiante_carrera = ea.estudiante_carrera_id
join public.carrera_asignatura ca on ca.id_carrera_asignatura = ea.carrera_asignatura_id
join public.asignatura a on a.id_asignatura = ca.asignatura_id_asignatura
where ec.fecha_fin is null;
grant select on public.subjects_probe to authenticated;

set role authenticated;

-- Estudiante 1 ve exactamente sus dos asignaturas.
set request.jwt.claim.sub = '10000000-0000-0000-0000-000000000001';
select 1 / case when count(*) = 2 then 1 else 0 end from public.subjects_probe;
select 1 / case when count(*) = 2 and bool_and(codigo in ('BDY2101', 'ING101')) then 1 else 0 end from public.subjects_probe;

-- Estudiante 2 ve solo la de su carrera vigente; la de la carrera cerrada no aparece.
set request.jwt.claim.sub = '20000000-0000-0000-0000-000000000002';
select 1 / case when count(*) = 1 and bool_and(codigo = 'MAT101') then 1 else 0 end from public.subjects_probe;

-- La RLS por sí sola impide leer inscripciones ajenas, sin depender de la consulta.
select 1 / case when count(*) = 2 and bool_and(estudiante_id_estudiante = 2) then 1 else 0 end
from public.estudiante_asignatura;
set request.jwt.claim.sub = '10000000-0000-0000-0000-000000000001';
select 1 / case when count(*) = 2 and bool_and(estudiante_id_estudiante = 1) then 1 else 0 end
from public.estudiante_asignatura;

-- Sin sesión (auth.uid() nulo) no se ve ninguna inscripción.
reset request.jwt.claim.sub;
select 1 / case when count(*) = 0 then 1 else 0 end from public.estudiante_asignatura;
reset role;

-- anon no puede leer inscripciones.
set role anon;
do $$
begin
  perform 1 from public.estudiante_asignatura;
  raise exception 'anon pudo leer estudiante_asignatura';
exception when insufficient_privilege then
  null;
end $$;
reset role;

select 'agenda-subjects-rls-smoke: OK' as resultado;

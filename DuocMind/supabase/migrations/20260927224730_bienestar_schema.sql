-- DuocMind MVP schema for the supplied ERD, adapted to PostgreSQL/Supabase.
-- Sensitive rows are protected by RLS. Student referrals require recorded consent.

begin;

create table public.sede (
  id_sede bigint generated always as identity primary key,
  nombre_sede text not null unique
);

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
  auth_user_id uuid unique references auth.users(id) on delete set null default auth.uid(),
  rut text not null unique,
  primer_nombre text not null,
  segundo_nombre text,
  primer_apellido text not null,
  segundo_apellido text,
  numero_telefonico text,
  correo text,
  creado_en timestamptz not null default now(),
  constraint estudiante_rut_no_vacio check (length(trim(rut)) > 0)
);

create table public.estudiante_carrera (
  id_estudiante_carrera bigint generated always as identity primary key,
  estudiante_id_estudiante bigint not null references public.estudiante(id_estudiante),
  carrera_id_carrera bigint not null references public.carrera(id_carrera),
  fecha_inicio date not null default current_date,
  fecha_fin date,
  constraint estudiante_carrera_fechas check (fecha_fin is null or fecha_fin >= fecha_inicio),
  unique (id_estudiante_carrera, estudiante_id_estudiante),
  unique (id_estudiante_carrera, estudiante_id_estudiante, carrera_id_carrera)
);

create unique index estudiante_carrera_actual_unica
  on public.estudiante_carrera (estudiante_id_estudiante)
  where fecha_fin is null;

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
  unique (estudiante_carrera_id, carrera_asignatura_id),
  unique (id_estudiante_asignatura, estudiante_id_estudiante)
);

create table public.estado (
  id_estado bigint generated always as identity primary key,
  nombre_estado text not null unique
);

create table public.tipo_evento (
  id_tipo_evento bigint generated always as identity primary key,
  nombre_evento text not null unique
);

create table public.evento_academico (
  id_evento bigint generated always as identity primary key,
  titulo text not null,
  descripcion text,
  fecha_hora timestamptz not null,
  tipo_evento_id bigint not null references public.tipo_evento(id_tipo_evento),
  estado_id bigint not null references public.estado(id_estado),
  estudiante_asignatura_id bigint not null,
  estudiante_id_estudiante bigint not null,
  constraint evento_inscripcion_fk foreign key (estudiante_asignatura_id, estudiante_id_estudiante)
    references public.estudiante_asignatura(id_estudiante_asignatura, estudiante_id_estudiante)
);

create table public.emocion_general (
  id_emocion bigint generated always as identity primary key,
  nombre_emocion text not null unique,
  valor_escala smallint not null unique check (valor_escala between 1 and 5)
);

create table public.emocion_especifica (
  id_emocionesp bigint generated always as identity primary key,
  nombre_emocionesp text not null,
  emocion_general_id_emocion bigint not null references public.emocion_general(id_emocion),
  unique (emocion_general_id_emocion, nombre_emocionesp),
  unique (id_emocionesp, emocion_general_id_emocion)
);

create table public.registro_emocional (
  id_registro bigint generated always as identity primary key,
  fecha_hora timestamptz not null default now(),
  emocion_especifica_id_emocionesp bigint not null references public.emocion_especifica(id_emocionesp),
  estudiante_id_estudiante bigint not null references public.estudiante(id_estudiante),
  estudiante_carrera_id bigint,
  constraint registro_carrera_fk foreign key (estudiante_carrera_id, estudiante_id_estudiante)
    references public.estudiante_carrera(id_estudiante_carrera, estudiante_id_estudiante)
);

create table public.test_bienestar (
  id_test bigint generated always as identity primary key,
  nombre_test text not null,
  tipo_test text not null,
  version integer not null check (version > 0),
  descripcion text,
  puntaje_minimo integer not null default 0,
  puntaje_maximo integer not null,
  is_active boolean not null default true,
  constraint test_rango_puntaje check (puntaje_minimo >= 0 and puntaje_maximo >= puntaje_minimo),
  unique (nombre_test, version),
  unique (id_test, version)
);

create table public.test_resultado_nivel (
  test_id bigint not null,
  test_version integer not null,
  nivel_resultado text not null,
  puntaje_minimo integer not null,
  puntaje_maximo integer not null,
  primary key (test_id, test_version, nivel_resultado),
  constraint resultado_test_fk foreign key (test_id, test_version)
    references public.test_bienestar(id_test, version),
  constraint resultado_rango check (puntaje_minimo >= 0 and puntaje_maximo >= puntaje_minimo)
);

create table public.pregunta_test (
  id_pregunta bigint generated always as identity primary key,
  test_id bigint not null,
  test_version integer not null,
  orden integer not null check (orden > 0),
  texto_pregunta text not null,
  is_critica boolean not null default false,
  constraint pregunta_test_fk foreign key (test_id, test_version)
    references public.test_bienestar(id_test, version),
  unique (test_id, test_version, orden),
  unique (id_pregunta, test_id, test_version)
);

create table public.opcion_respuesta (
  id_opcion bigint generated always as identity primary key,
  pregunta_test_id_pregunta bigint not null references public.pregunta_test(id_pregunta),
  texto_opcion text not null,
  puntaje integer not null check (puntaje >= 0),
  unique (pregunta_test_id_pregunta, texto_opcion),
  unique (pregunta_test_id_pregunta, puntaje)
);

create table public.aplicacion_test (
  id_aplicacion bigint generated always as identity primary key,
  fecha_hora timestamptz not null default now(),
  puntaje_total integer not null check (puntaje_total >= 0),
  test_id bigint not null,
  test_version integer not null,
  nivel_resultado text not null,
  item_critico_detectado boolean not null default false,
  estudiante_id_estudiante bigint not null references public.estudiante(id_estudiante),
  estudiante_carrera_id bigint,
  constraint aplicacion_test_fk foreign key (test_id, test_version)
    references public.test_bienestar(id_test, version),
  constraint aplicacion_nivel_fk foreign key (test_id, test_version, nivel_resultado)
    references public.test_resultado_nivel(test_id, test_version, nivel_resultado),
  constraint aplicacion_carrera_fk foreign key (estudiante_carrera_id, estudiante_id_estudiante)
    references public.estudiante_carrera(id_estudiante_carrera, estudiante_id_estudiante),
  unique (id_aplicacion, estudiante_id_estudiante)
);

create table public.material_apoyo (
  id_material bigint generated always as identity primary key,
  titulo text not null,
  descripcion text,
  is_active boolean not null default true
);

create table public.material_emocion (
  id_materialemocion bigint generated always as identity primary key,
  material_apoyo_id_material bigint not null references public.material_apoyo(id_material),
  emocion_general_id_emocion bigint not null references public.emocion_general(id_emocion),
  unique (material_apoyo_id_material, emocion_general_id_emocion)
);

create table public.material_test (
  id_materialtest bigint generated always as identity primary key,
  material_apoyo_id_material bigint not null references public.material_apoyo(id_material),
  test_id bigint not null,
  test_version integer not null,
  nivel_resultado text not null,
  constraint material_test_nivel_fk foreign key (test_id, test_version, nivel_resultado)
    references public.test_resultado_nivel(test_id, test_version, nivel_resultado),
  unique (material_apoyo_id_material, test_id, test_version, nivel_resultado)
);

create table public.tipo_alerta (
  id_tipoalerta bigint generated always as identity primary key,
  tipo_alerta text not null unique
);

create table public.estado_alerta (
  id_estado bigint generated always as identity primary key,
  estado_alerta text not null unique
);

create table public.alerta_bienestar (
  id_alerta bigint generated always as identity primary key,
  fecha_hora timestamptz not null default now(),
  tipo_alerta_id_tipoalerta bigint not null references public.tipo_alerta(id_tipoalerta),
  estudiante_id_estudiante bigint not null references public.estudiante(id_estudiante),
  estudiante_carrera_id bigint,
  estado_alerta_id_estado bigint not null references public.estado_alerta(id_estado),
  aplicacion_test_id_aplicacion bigint,
  consentimiento_derivacion boolean not null default false,
  consentimiento_fecha timestamptz,
  consentimiento_version text,
  constraint alerta_carrera_fk foreign key (estudiante_carrera_id, estudiante_id_estudiante)
    references public.estudiante_carrera(id_estudiante_carrera, estudiante_id_estudiante),
  constraint alerta_aplicacion_fk foreign key (aplicacion_test_id_aplicacion, estudiante_id_estudiante)
    references public.aplicacion_test(id_aplicacion, estudiante_id_estudiante),
  constraint alerta_consentimiento check (
    (consentimiento_derivacion and consentimiento_fecha is not null and consentimiento_version is not null)
    or (not consentimiento_derivacion and consentimiento_fecha is null and consentimiento_version is null)
  )
);

create function public.validar_puntaje_aplicacion_test()
returns trigger
language plpgsql
as $$
declare
  v_min integer;
  v_max integer;
begin
  select r.puntaje_minimo, r.puntaje_maximo
    into v_min, v_max
  from public.test_resultado_nivel r
  where r.test_id = new.test_id
    and r.test_version = new.test_version
    and r.nivel_resultado = new.nivel_resultado;

  if not found then
    raise exception 'El nivel no está configurado para ese test y versión';
  end if;

  if new.puntaje_total < v_min or new.puntaje_total > v_max then
    raise exception 'El puntaje total no pertenece al rango del nivel informado';
  end if;

  return new;
end;
$$;

create trigger aplicacion_test_validar_puntaje
before insert or update of puntaje_total, test_id, test_version, nivel_resultado
on public.aplicacion_test
for each row execute function public.validar_puntaje_aplicacion_test();

insert into public.emocion_general (nombre_emocion, valor_escala)
values ('Muy mal', 1), ('Mal', 2), ('Neutro', 3), ('Bien', 4), ('Muy bien', 5);

insert into public.emocion_especifica (nombre_emocionesp, emocion_general_id_emocion)
select v.nombre, eg.id_emocion
from (values
  ('Triste', 'Muy mal'), ('Desesperanzado', 'Muy mal'),
  ('Preocupado', 'Mal'), ('Cansado', 'Mal'),
  ('Indiferente', 'Neutro'), ('Tranquilo', 'Neutro'),
  ('Feliz', 'Bien'), ('Contento', 'Bien'), ('Esperanzado', 'Bien'),
  ('Entusiasmado', 'Muy bien'), ('Agradecido', 'Muy bien')
) as v(nombre, emocion_general)
join public.emocion_general eg on eg.nombre_emocion = v.emocion_general;

insert into public.estado (nombre_estado)
values ('Pendiente'), ('Completado'), ('Cancelado');
insert into public.tipo_evento (nombre_evento)
values ('Evaluación'), ('Tarea'), ('Recordatorio');
insert into public.tipo_alerta (tipo_alerta)
values ('Derivación solicitada por estudiante');
insert into public.estado_alerta (estado_alerta)
values ('Pendiente'), ('En revisión'), ('Cerrada');

create index evento_academico_inscripcion_idx on public.evento_academico(estudiante_asignatura_id);
create index registro_emocional_estudiante_fecha_idx on public.registro_emocional(estudiante_id_estudiante, fecha_hora desc);
create index aplicacion_test_estudiante_fecha_idx on public.aplicacion_test(estudiante_id_estudiante, fecha_hora desc);
create index alerta_bienestar_estudiante_fecha_idx on public.alerta_bienestar(estudiante_id_estudiante, fecha_hora desc);

-- All application tables are protected, including read-only catalog tables.
alter table public.sede enable row level security;
alter table public.carrera enable row level security;
alter table public.asignatura enable row level security;
alter table public.carrera_asignatura enable row level security;
alter table public.estudiante enable row level security;
alter table public.estudiante_carrera enable row level security;
alter table public.estudiante_asignatura enable row level security;
alter table public.estado enable row level security;
alter table public.tipo_evento enable row level security;
alter table public.evento_academico enable row level security;
alter table public.emocion_general enable row level security;
alter table public.emocion_especifica enable row level security;
alter table public.registro_emocional enable row level security;
alter table public.test_bienestar enable row level security;
alter table public.test_resultado_nivel enable row level security;
alter table public.pregunta_test enable row level security;
alter table public.opcion_respuesta enable row level security;
alter table public.aplicacion_test enable row level security;
alter table public.material_apoyo enable row level security;
alter table public.material_emocion enable row level security;
alter table public.material_test enable row level security;
alter table public.tipo_alerta enable row level security;
alter table public.estado_alerta enable row level security;
alter table public.alerta_bienestar enable row level security;

revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

grant select on public.sede, public.carrera, public.asignatura, public.carrera_asignatura,
  public.estado, public.tipo_evento, public.emocion_general, public.emocion_especifica,
  public.test_bienestar, public.test_resultado_nivel, public.pregunta_test,
  public.opcion_respuesta, public.material_apoyo, public.material_emocion,
  public.material_test, public.tipo_alerta, public.estado_alerta to anon, authenticated;

grant select on public.estudiante, public.estudiante_carrera, public.estudiante_asignatura,
  public.evento_academico, public.registro_emocional, public.aplicacion_test,
  public.alerta_bienestar to authenticated;
grant insert (auth_user_id, rut, primer_nombre, segundo_nombre, primer_apellido,
  segundo_apellido, numero_telefonico, correo) on public.estudiante to authenticated;
grant insert (estudiante_id_estudiante, estudiante_carrera_id, carrera_id_carrera,
  carrera_asignatura_id, fecha_inscripcion) on public.estudiante_asignatura to authenticated;
grant insert (titulo, descripcion, fecha_hora, tipo_evento_id, estado_id,
  estudiante_asignatura_id, estudiante_id_estudiante) on public.evento_academico to authenticated;
grant insert (emocion_especifica_id_emocionesp, estudiante_id_estudiante,
  estudiante_carrera_id) on public.registro_emocional to authenticated;
grant insert (puntaje_total, test_id, test_version, nivel_resultado,
  item_critico_detectado, estudiante_id_estudiante, estudiante_carrera_id)
  on public.aplicacion_test to authenticated;
grant insert (tipo_alerta_id_tipoalerta, estudiante_id_estudiante, estudiante_carrera_id,
  estado_alerta_id_estado, aplicacion_test_id_aplicacion, consentimiento_derivacion,
  consentimiento_fecha, consentimiento_version) on public.alerta_bienestar to authenticated;

create policy "public catalogs are readable" on public.sede for select to anon, authenticated using (true);
create policy "public catalogs are readable" on public.carrera for select to anon, authenticated using (true);
create policy "public catalogs are readable" on public.asignatura for select to anon, authenticated using (true);
create policy "public catalogs are readable" on public.carrera_asignatura for select to anon, authenticated using (true);
create policy "public catalogs are readable" on public.estado for select to anon, authenticated using (true);
create policy "public catalogs are readable" on public.tipo_evento for select to anon, authenticated using (true);
create policy "public catalogs are readable" on public.emocion_general for select to anon, authenticated using (true);
create policy "public catalogs are readable" on public.emocion_especifica for select to anon, authenticated using (true);
create policy "public catalogs are readable" on public.test_bienestar for select to anon, authenticated using (true);
create policy "public catalogs are readable" on public.test_resultado_nivel for select to anon, authenticated using (true);
create policy "public catalogs are readable" on public.pregunta_test for select to anon, authenticated using (true);
create policy "public catalogs are readable" on public.opcion_respuesta for select to anon, authenticated using (true);
create policy "public catalogs are readable" on public.material_apoyo for select to anon, authenticated using (true);
create policy "public catalogs are readable" on public.material_emocion for select to anon, authenticated using (true);
create policy "public catalogs are readable" on public.material_test for select to anon, authenticated using (true);
create policy "public catalogs are readable" on public.tipo_alerta for select to anon, authenticated using (true);
create policy "public catalogs are readable" on public.estado_alerta for select to anon, authenticated using (true);

create policy "student reads own profile" on public.estudiante for select to authenticated
  using (auth_user_id = (select auth.uid()));
create policy "student registers own profile" on public.estudiante for insert to authenticated
  with check (auth_user_id = (select auth.uid()));

create policy "student reads own career history" on public.estudiante_carrera for select to authenticated
  using (exists (select 1 from public.estudiante e where e.id_estudiante = estudiante_id_estudiante and e.auth_user_id = (select auth.uid())));
create policy "student reads own course enrollments" on public.estudiante_asignatura for select to authenticated
  using (exists (select 1 from public.estudiante e where e.id_estudiante = estudiante_id_estudiante and e.auth_user_id = (select auth.uid())));
create policy "student enrolls in own current career course" on public.estudiante_asignatura for insert to authenticated
  with check (
    exists (select 1 from public.estudiante e where e.id_estudiante = estudiante_id_estudiante and e.auth_user_id = (select auth.uid()))
    and exists (select 1 from public.estudiante_carrera ec where ec.id_estudiante_carrera = estudiante_carrera_id and ec.estudiante_id_estudiante = estudiante_id_estudiante and ec.carrera_id_carrera = carrera_id_carrera and ec.fecha_fin is null)
  );
create policy "student reads own academic events" on public.evento_academico for select to authenticated
  using (exists (select 1 from public.estudiante e where e.id_estudiante = estudiante_id_estudiante and e.auth_user_id = (select auth.uid())));
create policy "student creates own academic events" on public.evento_academico for insert to authenticated
  with check (exists (select 1 from public.estudiante e where e.id_estudiante = estudiante_id_estudiante and e.auth_user_id = (select auth.uid())));

create policy "student reads own emotional records" on public.registro_emocional for select to authenticated
  using (exists (select 1 from public.estudiante e where e.id_estudiante = estudiante_id_estudiante and e.auth_user_id = (select auth.uid())));
create policy "student creates own emotional records" on public.registro_emocional for insert to authenticated
  with check (exists (select 1 from public.estudiante e where e.id_estudiante = estudiante_id_estudiante and e.auth_user_id = (select auth.uid())));
create policy "student reads own test applications" on public.aplicacion_test for select to authenticated
  using (exists (select 1 from public.estudiante e where e.id_estudiante = estudiante_id_estudiante and e.auth_user_id = (select auth.uid())));
create policy "student creates own test applications" on public.aplicacion_test for insert to authenticated
  with check (exists (select 1 from public.estudiante e where e.id_estudiante = estudiante_id_estudiante and e.auth_user_id = (select auth.uid())));
create policy "student reads own referrals" on public.alerta_bienestar for select to authenticated
  using (exists (select 1 from public.estudiante e where e.id_estudiante = estudiante_id_estudiante and e.auth_user_id = (select auth.uid())));
create policy "student requests referral with consent" on public.alerta_bienestar for insert to authenticated
  with check (
    consentimiento_derivacion
    and consentimiento_fecha is not null
    and consentimiento_version is not null
    and exists (select 1 from public.estudiante e where e.id_estudiante = estudiante_id_estudiante and e.auth_user_id = (select auth.uid()))
  );

comment on table public.registro_emocional is 'Sensitive emotional data. One row per student check-in; no free-text comments.';
comment on table public.aplicacion_test is 'Stores aggregate score and instrument version only; individual answers are not persisted.';
comment on table public.alerta_bienestar is 'Referral record. No automatic contact is triggered; consent is required before insertion.';
comment on column public.estudiante.numero_telefonico is 'Text by design to preserve country prefixes and leading zeroes.';

commit;

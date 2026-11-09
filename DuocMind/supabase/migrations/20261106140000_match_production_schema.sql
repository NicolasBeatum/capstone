-- Iguala el esquema del repo con producción, que es la referencia. Allá casi no hace nada:
-- solo retira funciones de Tips sin uso, permisos sobrantes y agrega un índice de FK.
-- Es repetible. Las tablas de datos no cambian salvo los catálogos, que quedan iguales a producción.
begin;

-- Catálogos que producción ya tiene.
alter table public.consentimiento add column if not exists nombre text;
update public.consentimiento c
set nombre = v.nombre, descripcion = v.descripcion
from (values
    ('analitica_anonima', 'Datos anónimos para estadísticas', 'Compartir de forma anónima mis registros emocionales y resultados de tests (ansiedad, depresión, estrés) para estadísticas de bienestar institucional.'),
    ('contacto', 'Contacto de Bienestar', 'Permitir que Bienestar Estudiantil me contacte si la app detecta que podría necesitar apoyo.')
) as v(codigo, nombre, descripcion)
where c.codigo = v.codigo
  and (c.nombre is distinct from v.nombre or c.descripcion is distinct from v.descripcion);
update public.consentimiento set nombre = codigo where nombre is null;
alter table public.consentimiento alter column nombre set not null;

alter table public.motivo add column if not exists orden smallint not null default 0;
alter table public.motivo add column if not exists activo boolean not null default true;
insert into public.motivo (nombre_motivo, orden) values
  ('Familia', 1),
  ('Pareja', 2),
  ('Amistades', 3),
  ('Académico', 4),
  ('Trabajo', 5),
  ('Económico', 6),
  ('Salud', 7)
on conflict (nombre_motivo) do update set orden = excluded.orden
where public.motivo.orden is distinct from excluded.orden;

insert into public.tipo_herramienta (nombre, orden)
select v.nombre, v.orden
from (values
    ('Estrés', 1),
    ('Ansiedad', 2),
    ('Apoyo al estudio', 3),
    ('Salud física', 4)
) as v(nombre, orden)
where not exists (select 1 from public.tipo_herramienta t where t.nombre = v.nombre);

-- Constraints con la definición y el nombre de producción.
alter table public.consentimiento drop constraint if exists consentimiento_descripcion_check;
alter table public.consentimiento drop constraint if exists consentimiento_codigo_check;
alter table public.consentimiento add constraint consentimiento_codigo_check
  check (codigo ~ '^[a-z][a-z0-9_]{1,40}$');
alter table public.estudiante_consentimiento drop constraint if exists estudiante_consentimiento_version_check;
alter table public.estudiante_consentimiento add constraint estudiante_consentimiento_version_check
  check (length(btrim(version)) > 0);
alter table public.motivo drop constraint if exists motivo_nombre_motivo_check;
alter table public.motivo add constraint motivo_nombre_motivo_check
  check (length(btrim(nombre_motivo)) >= 1 and length(btrim(nombre_motivo)) <= 40);

do $$
declare
  item record;
begin
  for item in
    select * from (values
      ('public.carrera'::regclass, 'carrera_nombre_carrera_key', 'carrera_nombre_unique'),
      ('public.tipo_evento_academico'::regclass, 'tipo_evento_academico_nombre_evento_key', 'tipo_evento_nombre_evento_key'),
      ('public.tipo_evento_academico'::regclass, 'tipo_evento_academico_pkey', 'tipo_evento_pkey')
    ) as v(tbl, old_name, new_name)
  loop
    if exists (select 1 from pg_constraint where conrelid = item.tbl and conname = item.old_name) then
      execute format('alter table %s rename constraint %I to %I', item.tbl, item.old_name, item.new_name);
    end if;
  end loop;

  if not exists (select 1 from pg_constraint where conrelid = 'public.carrera_asignatura'::regclass and conname = 'ca_unica') then
    alter table public.carrera_asignatura add constraint ca_unica unique (carrera_id_carrera, asignatura_id_asignatura);
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.estudiante_asignatura'::regclass and conname = 'ea_unico_ramo') then
    alter table public.estudiante_asignatura add constraint ea_unico_ramo unique (estudiante_carrera_id, carrera_asignatura_id);
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.estudiante_carrera'::regclass and conname = 'ec_fechas_ok') then
    alter table public.estudiante_carrera add constraint ec_fechas_ok check (fecha_fin is null or fecha_fin >= fecha_inicio);
  end if;
end $$;

create unique index if not exists estudiante_carrera_una_abierta
  on public.estudiante_carrera (estudiante_id_estudiante) where fecha_fin is null;
create index if not exists estudiante_consentimiento_consentimiento_idx
  on public.estudiante_consentimiento (consentimiento_id_consentimiento);

-- Policies de motivos con los nombres de producción, incluido el borrado propio.
do $$
begin
  if exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'registro_emocional_motivo' and policyname = 'student adds reasons to own records') then
    alter policy "student adds reasons to own records" on public.registro_emocional_motivo rename to "student creates own emotional reasons";
  end if;
  if exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'registro_emocional_motivo' and policyname = 'student reads own emotion reasons') then
    alter policy "student reads own emotion reasons" on public.registro_emocional_motivo rename to "student reads own emotional reasons";
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'registro_emocional_motivo' and policyname = 'student deletes own emotional reasons') then
    create policy "student deletes own emotional reasons" on public.registro_emocional_motivo
      for delete to authenticated
      using (exists (
        select 1
        from public.registro_emocional r
        join public.estudiante e on e.id_estudiante = r.estudiante_id_estudiante
        where r.id_registro = registro_emocional_motivo.registro_emocional_id_registro
          and e.auth_user_id = (select auth.uid())
      ));
  end if;
end $$;

-- La vista de producción no expone codigo; se resuelve con el catálogo.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'estudiante_consentimiento_actual' and column_name = 'codigo'
  ) then
    drop view public.estudiante_consentimiento_actual;
    create view public.estudiante_consentimiento_actual with (security_invoker = true) as
    select distinct on (estudiante_id_estudiante, consentimiento_id_consentimiento)
      estudiante_id_estudiante,
      consentimiento_id_consentimiento,
      otorgado,
      version,
      registrado_en
    from public.estudiante_consentimiento
    order by estudiante_id_estudiante, consentimiento_id_consentimiento, registrado_en desc, id_estudiante_consentimiento desc;
  end if;
end $$;

CREATE OR REPLACE FUNCTION public.cambiar_carrera(p_carrera_id bigint)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_est bigint; v_nueva bigint;
begin
  select id_estudiante into v_est from public.estudiante
   where auth_user_id = (select auth.uid());
  if v_est is null then raise exception 'estudiante no encontrado'; end if;

  select id_estudiante_carrera into v_nueva from public.estudiante_carrera
   where estudiante_id_estudiante = v_est and fecha_fin is null and carrera_id_carrera = p_carrera_id;
  if v_nueva is not null then return v_nueva; end if;   -- ya está en esa carrera

  -- los ramos de la carrera anterior ya no aplican (arrastra sus eventos asociados)
  delete from public.estudiante_asignatura ea
   using public.estudiante_carrera ec
   where ea.estudiante_carrera_id = ec.id_estudiante_carrera
     and ec.estudiante_id_estudiante = v_est and ec.fecha_fin is null;

  update public.estudiante_carrera set fecha_fin = current_date
   where estudiante_id_estudiante = v_est and fecha_fin is null;

  insert into public.estudiante_carrera (estudiante_id_estudiante, carrera_id_carrera)
  values (v_est, p_carrera_id) returning id_estudiante_carrera into v_nueva;
  return v_nueva;
end $function$;

-- Restos de Tips: sus tablas ya no existen.
drop function if exists private.save_tip_rules(bigint, jsonb);
drop function if exists private.tip_json(bigint);
drop function if exists private.check_tip_rule();

-- Permisos: solo lo que los clientes usan. RLS ya bloqueaba el resto, salvo TRUNCATE.
revoke all on public.consentimiento, public.motivo, public.tipo_herramienta, public.herramienta,
  public.herramienta_tipoherramienta from anon, authenticated;
grant select on public.consentimiento, public.motivo, public.tipo_herramienta, public.herramienta,
  public.herramienta_tipoherramienta to anon, authenticated;
revoke all on public.registro_emocional_motivo from anon, authenticated;
grant select, insert, delete on public.registro_emocional_motivo to authenticated;
revoke all on public.estudiante_consentimiento_actual from anon, authenticated;
grant select on public.estudiante_consentimiento_actual to authenticated, service_role;

do $$
declare
  fn regprocedure;
begin
  for fn in
    select p.oid::regprocedure from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname in ('public', 'private') and p.proname = 'set_updated_at'
  loop
    execute format('revoke execute on function %s from anon, authenticated', fn);
  end loop;
end $$;

commit;

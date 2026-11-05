-- Motivos del registro emocional y consentimientos persistentes del estudiante.
-- Es idempotente para no fallar si los objetos ya existen en la base remota.
--
--   motivo                         catálogo de motivos (independiente de la emoción)
--   registro_emocional_motivo      N:M registro <-> motivo; se borra con el registro
--   consentimiento                 catálogo: analitica_anonima, contacto
--   estudiante_consentimiento      historial append-only (solo INSERT)
--   estudiante_consentimiento_actual  vista con el estado vigente; sin filas = no otorgado

begin;

-- ---------------------------------------------------------------------
-- 1) Motivos
-- ---------------------------------------------------------------------
create table if not exists public.motivo (
  id_motivo     bigint generated always as identity primary key,
  nombre_motivo text not null unique check (length(btrim(nombre_motivo)) between 1 and 60)
);

-- Lista inicial; completar con una migración nueva si se agregan motivos.
insert into public.motivo (nombre_motivo)
values ('Familia'), ('Académico'), ('Trabajo')
on conflict (nombre_motivo) do nothing;

create table if not exists public.registro_emocional_motivo (
  registro_emocional_id_registro bigint not null
    references public.registro_emocional(id_registro) on delete cascade,
  motivo_id_motivo bigint not null references public.motivo(id_motivo),
  primary key (registro_emocional_id_registro, motivo_id_motivo)
);
create index if not exists registro_emocional_motivo_motivo_idx
  on public.registro_emocional_motivo (motivo_id_motivo);

alter table public.motivo enable row level security;
alter table public.registro_emocional_motivo enable row level security;

revoke all on public.motivo, public.registro_emocional_motivo from anon, authenticated;
grant select on public.motivo to anon, authenticated;
grant select, insert on public.registro_emocional_motivo to authenticated;
grant select on public.motivo, public.registro_emocional_motivo to service_role;

drop policy if exists "public catalogs are readable" on public.motivo;
create policy "public catalogs are readable" on public.motivo
  for select to anon, authenticated using (true);

drop policy if exists "student reads own emotion reasons" on public.registro_emocional_motivo;
create policy "student reads own emotion reasons" on public.registro_emocional_motivo
  for select to authenticated
  using (exists (select 1 from public.registro_emocional r
                 join public.estudiante e on e.id_estudiante = r.estudiante_id_estudiante
                 where r.id_registro = registro_emocional_motivo.registro_emocional_id_registro
                   and e.auth_user_id = (select auth.uid())));

drop policy if exists "student adds reasons to own records" on public.registro_emocional_motivo;
create policy "student adds reasons to own records" on public.registro_emocional_motivo
  for insert to authenticated
  with check (exists (select 1 from public.registro_emocional r
                      join public.estudiante e on e.id_estudiante = r.estudiante_id_estudiante
                      where r.id_registro = registro_emocional_motivo.registro_emocional_id_registro
                        and e.auth_user_id = (select auth.uid())));

-- ---------------------------------------------------------------------
-- 2) Consentimientos
-- ---------------------------------------------------------------------
create table if not exists public.consentimiento (
  id_consentimiento bigint generated always as identity primary key,
  codigo            text not null unique check (codigo ~ '^[a-z][a-z0-9_]{1,39}$'),
  descripcion       text not null check (length(btrim(descripcion)) between 1 and 300)
);

insert into public.consentimiento (codigo, descripcion)
values
  ('analitica_anonima', 'Compartir datos anónimos de emociones y tests con Bienestar.'),
  ('contacto', 'Permitir que Bienestar contacte al estudiante.')
on conflict (codigo) do nothing;

-- Historial append-only: cada activación o desactivación es una fila nueva.
create table if not exists public.estudiante_consentimiento (
  id_estudiante_consentimiento     bigint generated always as identity primary key,
  estudiante_id_estudiante         bigint not null references public.estudiante(id_estudiante),
  consentimiento_id_consentimiento bigint not null references public.consentimiento(id_consentimiento),
  otorgado                         boolean not null,
  version                          text not null check (length(btrim(version)) between 1 and 40),
  registrado_en                    timestamptz not null default now()
);
create index if not exists estudiante_consentimiento_vigente_idx
  on public.estudiante_consentimiento
  (estudiante_id_estudiante, consentimiento_id_consentimiento, registrado_en desc, id_estudiante_consentimiento desc);
create index if not exists estudiante_consentimiento_consentimiento_idx
  on public.estudiante_consentimiento (consentimiento_id_consentimiento);

alter table public.consentimiento enable row level security;
alter table public.estudiante_consentimiento enable row level security;

-- Sin UPDATE ni DELETE para clientes; registrado_en lo fija el servidor.
revoke all on public.consentimiento, public.estudiante_consentimiento from anon, authenticated;
grant select on public.consentimiento to anon, authenticated;
grant select on public.estudiante_consentimiento to authenticated;
grant insert (estudiante_id_estudiante, consentimiento_id_consentimiento, otorgado, version)
  on public.estudiante_consentimiento to authenticated;
grant select on public.consentimiento, public.estudiante_consentimiento to service_role;

drop policy if exists "public catalogs are readable" on public.consentimiento;
create policy "public catalogs are readable" on public.consentimiento
  for select to anon, authenticated using (true);

drop policy if exists "student reads own consents" on public.estudiante_consentimiento;
create policy "student reads own consents" on public.estudiante_consentimiento
  for select to authenticated
  using (exists (select 1 from public.estudiante e
                 where e.id_estudiante = estudiante_consentimiento.estudiante_id_estudiante
                   and e.auth_user_id = (select auth.uid())));

drop policy if exists "student records own consents" on public.estudiante_consentimiento;
create policy "student records own consents" on public.estudiante_consentimiento
  for insert to authenticated
  with check (exists (select 1 from public.estudiante e
                      where e.id_estudiante = estudiante_consentimiento.estudiante_id_estudiante
                        and e.auth_user_id = (select auth.uid())));

-- Estado vigente: última fila por estudiante y consentimiento. Respeta la RLS de quien consulta.
create or replace view public.estudiante_consentimiento_actual
with (security_invoker = true) as
select distinct on (ec.estudiante_id_estudiante, ec.consentimiento_id_consentimiento)
  ec.estudiante_id_estudiante,
  ec.consentimiento_id_consentimiento,
  c.codigo,
  ec.otorgado,
  ec.version,
  ec.registrado_en
from public.estudiante_consentimiento ec
join public.consentimiento c on c.id_consentimiento = ec.consentimiento_id_consentimiento
order by ec.estudiante_id_estudiante, ec.consentimiento_id_consentimiento,
         ec.registrado_en desc, ec.id_estudiante_consentimiento desc;

revoke all on public.estudiante_consentimiento_actual from anon, authenticated;
grant select on public.estudiante_consentimiento_actual to authenticated, service_role;

-- ---------------------------------------------------------------------
-- 3) Borrado de cuenta: también elimina el historial de consentimientos.
--    Los motivos se borran en cascada con registro_emocional.
-- ---------------------------------------------------------------------
create or replace function public.erase_student_personal_data(p_auth_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_student_id bigint;
begin
  if p_auth_user_id is null then
    raise exception 'El usuario de Auth es obligatorio';
  end if;

  select e.id_estudiante
    into v_student_id
  from public.estudiante e
  where e.auth_user_id = p_auth_user_id
  for update;

  if not found then
    return;
  end if;

  delete from public.alerta_bienestar
  where estudiante_id_estudiante = v_student_id;

  delete from public.aplicacion_test
  where estudiante_id_estudiante = v_student_id;

  delete from public.registro_emocional
  where estudiante_id_estudiante = v_student_id;

  delete from public.estudiante_consentimiento
  where estudiante_id_estudiante = v_student_id;

  update public.estudiante
  set auth_user_id = null,
      rut = 'ELIMINADO-' || v_student_id::text,
      primer_nombre = 'Eliminado',
      segundo_nombre = null,
      primer_apellido = 'Eliminado',
      segundo_apellido = null,
      numero_telefonico = null,
      correo = null
  where id_estudiante = v_student_id;
end;
$$;

revoke all on function public.erase_student_personal_data(uuid) from public, anon, authenticated;
grant execute on function public.erase_student_personal_data(uuid) to service_role;

commit;

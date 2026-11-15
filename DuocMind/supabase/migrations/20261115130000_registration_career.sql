-- Spec 022: la carrera elegida en el registro se guarda en `estudiante_carrera`.
-- El registro la envía en los metadatos de Auth (`carrera_id`) y este disparador la asigna
-- al crear el perfil de estudiante, aunque la persona confirme el correo en otro dispositivo.
-- Un valor ausente o que no existe en el catálogo se ignora: el perfil se crea igual.
-- SECURITY DEFINER porque el estudiante no puede leer auth.users ni insertar su carrera; va en
-- public (como erase_student_personal_data) porque `private` no admite funciones definer, y
-- nadie puede ejecutarla directamente: solo el disparador.
begin;

create or replace function public.assign_registration_career() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_raw text;
  v_career bigint;
begin
  if new.auth_user_id is null then
    return new;
  end if;
  select u.raw_user_meta_data ->> 'carrera_id' into v_raw
  from auth.users u where u.id = new.auth_user_id;
  if v_raw is null or v_raw !~ '^[1-9][0-9]{0,17}$' then
    return new;
  end if;
  select c.id_carrera into v_career from public.carrera c where c.id_carrera = v_raw::bigint;
  if v_career is null then
    return new;
  end if;
  insert into public.estudiante_carrera (estudiante_id_estudiante, carrera_id_carrera)
  values (new.id_estudiante, v_career)
  on conflict do nothing;
  return new;
end;
$$;

revoke all on function public.assign_registration_career() from public, anon, authenticated;

drop trigger if exists estudiante_assign_registration_career on public.estudiante;
create trigger estudiante_assign_registration_career
  after insert on public.estudiante
  for each row execute function public.assign_registration_career();

commit;

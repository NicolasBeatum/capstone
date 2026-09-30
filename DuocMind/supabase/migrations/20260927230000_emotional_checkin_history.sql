begin;

insert into public.emocion_especifica (nombre_emocionesp, emocion_general_id_emocion)
select 'Sin especificar', eg.id_emocion
from public.emocion_general eg
on conflict (emocion_general_id_emocion, nombre_emocionesp) do nothing;

alter table public.registro_emocional
  add column client_request_id uuid not null default gen_random_uuid(),
  add constraint registro_emocional_client_request_id_key unique (client_request_id);

grant insert (client_request_id) on public.registro_emocional to authenticated;
grant delete on public.registro_emocional to authenticated;

create policy "student deletes own emotional records"
  on public.registro_emocional for delete to authenticated
  using (
    exists (
      select 1
      from public.estudiante e
      where e.id_estudiante = estudiante_id_estudiante
        and e.auth_user_id = (select auth.uid())
    )
  );

create function public.erase_student_personal_data(p_auth_user_id uuid)
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
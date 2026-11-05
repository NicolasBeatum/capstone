-- «Mi perfil»: el estudiante edita su nombre y su teléfono.
-- El correo de acceso no se edita aquí: cambia con auth.updateUser y rige al confirmarlo.
-- rut, auth_user_id y creado_en quedan fuera del permiso: no se pueden modificar desde el cliente.

grant update (primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, numero_telefonico)
  on public.estudiante to authenticated;

create policy "student updates own profile" on public.estudiante for update to authenticated
  using (auth_user_id = (select auth.uid()))
  with check (auth_user_id = (select auth.uid()));

-- Spec 022: los datos emocionales solo llegan al servidor con al menos un consentimiento
-- opcional vigente y otorgado (`analitica_anonima` o `contacto`), igual que en la app.
-- Los consentimientos se buscan por código, nunca por id. La vista respeta la RLS de quien
-- consulta, así que cada estudiante solo puede ver los suyos.
-- Los motivos no necesitan la regla: solo se insertan sobre un registro propio ya subido.
-- Revocar no borra lo ya subido; solo impide insertar desde ese momento.
begin;

alter policy "student creates own emotional records" on public.registro_emocional
  with check (
    exists (
      select 1 from public.estudiante e
      where e.id_estudiante = registro_emocional.estudiante_id_estudiante
        and e.auth_user_id = (select auth.uid())
    )
    and exists (
      select 1
      from public.estudiante_consentimiento_actual eca
      join public.consentimiento c on c.id_consentimiento = eca.consentimiento_id_consentimiento
      where eca.estudiante_id_estudiante = registro_emocional.estudiante_id_estudiante
        and eca.otorgado
        and c.codigo in ('analitica_anonima', 'contacto')
    )
  );

alter policy "student creates own test applications" on public.aplicacion_test
  with check (
    exists (
      select 1 from public.estudiante e
      where e.id_estudiante = aplicacion_test.estudiante_id_estudiante
        and e.auth_user_id = (select auth.uid())
    )
    and exists (
      select 1
      from public.estudiante_consentimiento_actual eca
      join public.consentimiento c on c.id_consentimiento = eca.consentimiento_id_consentimiento
      where eca.estudiante_id_estudiante = aplicacion_test.estudiante_id_estudiante
        and eca.otorgado
        and c.codigo in ('analitica_anonima', 'contacto')
    )
  );

commit;

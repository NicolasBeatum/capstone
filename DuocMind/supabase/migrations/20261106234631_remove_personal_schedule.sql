-- Spec 017: el horario y los semestres se guardan solo en el dispositivo.
-- Elimina los datos remotos de horario sin exportarlos, por decisión del usuario.

drop function public.save_personal_schedule(integer, uuid, jsonb);
drop function public.load_personal_schedule();

drop table schedule_private.schedule_request;

-- Una sola sentencia: personal_schedule y schedule_semester se referencian entre sí.
drop table public.schedule_block, public.schedule_subject, public.schedule_semester,
  public.personal_schedule;

-- Solo quedan los ayudantes de validación y escritura del horario.
drop schema schedule_private cascade;

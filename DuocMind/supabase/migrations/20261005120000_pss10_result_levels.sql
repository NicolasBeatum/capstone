-- PSS-10 was published without result levels, so aplicacion_test inserts were rejected
-- by aplicacion_nivel_fk and validar_puntaje_aplicacion_test. Ranges match PSS10_RANGES
-- in stressTestRepository.ts. freeze_levels blocks writes on published tests, so it is
-- disabled only inside this transaction.
begin;

alter table public.test_resultado_nivel disable trigger freeze_levels;

insert into public.test_resultado_nivel
  (test_id, test_version, nivel_resultado, puntaje_minimo, puntaje_maximo, label, interpretation)
select t.id_test, t.version, l.nivel, l.minimo, l.maximo, l.label, l.interpretation
from public.test_bienestar t
cross join (values
  ('leve', 0, 13, 'Estrés leve',
   'Tus respuestas indican un nivel de estrés leve dentro de los rangos normales y esperables.'),
  ('moderado', 14, 26, 'Estrés moderado',
   'Tus respuestas indican un nivel de estrés moderado. Podría ser de ayuda revisar tus horarios y momentos de descanso.'),
  ('severo', 27, 40, 'Estrés severo',
   'Tus respuestas indican un nivel de estrés elevado. Te sugerimos conversar con el equipo de bienestar estudiantil.')
) as l(nivel, minimo, maximo, label, interpretation)
where t.nombre_test = 'Escala de Estrés Percibido (PSS-10)'
  and t.version = 1
on conflict (test_id, test_version, nivel_resultado) do nothing;

alter table public.test_resultado_nivel enable trigger freeze_levels;

commit;

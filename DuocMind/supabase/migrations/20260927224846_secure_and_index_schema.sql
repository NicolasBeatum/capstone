begin;

alter function public.validar_puntaje_aplicacion_test() set search_path = '';

create index alerta_aplicacion_estudiante_idx on public.alerta_bienestar(aplicacion_test_id_aplicacion, estudiante_id_estudiante);
create index alerta_estado_idx on public.alerta_bienestar(estado_alerta_id_estado);
create index alerta_tipo_idx on public.alerta_bienestar(tipo_alerta_id_tipoalerta);
create index alerta_carrera_idx on public.alerta_bienestar(estudiante_carrera_id, estudiante_id_estudiante);
create index aplicacion_carrera_idx on public.aplicacion_test(estudiante_carrera_id, estudiante_id_estudiante);
create index aplicacion_nivel_idx on public.aplicacion_test(test_id, test_version, nivel_resultado);
create index aplicacion_test_version_idx on public.aplicacion_test(test_id, test_version);
create index carrera_asignatura_asignatura_idx on public.carrera_asignatura(asignatura_id_asignatura);
create index estudiante_asignatura_carrera_idx on public.estudiante_asignatura(carrera_asignatura_id, carrera_id_carrera);
create index estudiante_asignatura_historial_idx on public.estudiante_asignatura(estudiante_carrera_id, estudiante_id_estudiante, carrera_id_carrera);
create index estudiante_carrera_carrera_idx on public.estudiante_carrera(carrera_id_carrera);
create index evento_estado_idx on public.evento_academico(estado_id);
create index evento_tipo_idx on public.evento_academico(tipo_evento_id);
create index evento_inscripcion_estudiante_idx on public.evento_academico(estudiante_asignatura_id, estudiante_id_estudiante);
create index material_emocion_emocion_idx on public.material_emocion(emocion_general_id_emocion);
create index material_test_nivel_idx on public.material_test(test_id, test_version, nivel_resultado);
create index registro_carrera_idx on public.registro_emocional(estudiante_carrera_id, estudiante_id_estudiante);
create index registro_emocion_especifica_idx on public.registro_emocional(emocion_especifica_id_emocionesp);

commit;

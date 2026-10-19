# Tareas 013 — Horario por semestre y actividades locales

| Campo | Valor |
| --- | --- |
| Versión | 0.1.2 |
| Estado | APROBADAS |
| Fecha | 2026-10-18 |
| Spec | `spec.md` 0.1.2, APROBADA, con ajustes del formulario solicitados el 2026-10-18 |
| Plan | `plan.md` 0.1.2, APROBADO, con ajustes solicitados el 2026-10-18 |
| Constitución | 2.0.0 |
| Rama | `feature/agenda-semestres` |
| Aprobación | Confirmada por el usuario el 2026-10-18 al indicar «adelante! esta bien», con trabajo exclusivamente local, sin push ni PR. |
| Base de la rama | `origin/dev` en `0c6246501c34fc8430bc034b11affb01970092b4` |

## Reglas de ejecución

Ejecutar en el orden indicado, una tarea por vez. Cada checkbox permanece abierto
hasta que su cambio esté completo, pase la verificación específica y el
repositorio siga válido. Después de cada tarea de código ejecutar, desde
`DuocMind/`, `npm run typecheck` y `npm test`. Las tareas de herramientas también
ejecutan sus pruebas aplicables. No desactivar regresiones ni relajar validaciones.

Registrar comandos, resultados y limitaciones reales en `verification.md`,
identificando tarea y criterio. Crear ese registro con la primera tarea de
implementación; no escribir resultados anticipados. Una comprobación parcial no
permite cerrar una tarea que exige integración, persistencia o dispositivo real.

Los cambios remotos, despliegues, commits y push quedan fuera de estas tareas.
Toda integración usa destinos locales y datos sintéticos. No reiniciar ni borrar
un backend local con datos de otros trabajos sin autorización. Si el entorno no
permite una verificación requerida, conservar el trabajo revisable y dejar su
tarea abierta con el motivo y el procedimiento pendiente.

## Implementación ordenada

- [x] T001 Crear en `shared/planner/domain/` los tipos y validadores del horario, semestres, ramos y bloques, con UUID y referencias válidas, campos opcionales, límites de tamaño y primer semestre activo. Implementar las mutaciones puras de crear/editar semestre, crear/editar/eliminar ramo y seleccionar el activo sin borrar semestres. Verificar en `plannerDomain.test.mjs` nombres manuales, campos opcionales, identidades inválidas, referencias ajenas al documento y conservación de otros semestres (CA-001, CA-002, CA-006).

- [x] T002 Implementar las reglas puras de bloques y proyección semanal en `shared/planner/domain/`: altas/ediciones/bajas, sala y docente por bloque, duplicados, advertencia de cruces, días ISO, vigencia y reloj civil Santiago. Verificar en `weeklySchedule.test.mjs` salas distintas dentro del mismo ramo, edición independiente, bloques consecutivos, término exacto, cambio de día y horario de verano con instantes controlados (CA-003, CA-004, CA-005).

- [x] T003 Crear mediante el CLI fijado la migración nueva con tablas, claves compuestas, restricciones, índices, RLS y RPC de lectura/escritura transaccional del plan. Implementar revisión global, selección activa atómica y recibos de idempotencia, con permisos exactos y función privilegiada restringida. Verificar en backend local estructura, inserciones inválidas, rollback de una petición inválida, dos primeras escrituras concurrentes, aislamiento entre cuentas, escritura directa denegada, reintentos tras commit y cambios concurrentes. Conectar las pruebas dedicadas en `tools/tests/` al runner local (CA-001, CA-002, CA-006, CA-008).

- [x] T004 Definir las interfaces de persistencia, sesión y remoto en `shared/planner/application/` e implementar el gateway Supabase en `infrastructure/`. Validar respuestas externas y serializar exclusivamente `ScheduleDocument`, sin propietario suministrado por la pantalla ni actividades locales. Verificar peticiones y respuestas, errores de migración ausente, identificadores inválidos y ausencia de contenido de actividades en todos los payloads del horario (CA-006, CA-012).

- [x] T005 Implementar el almacén compartido transaccional y sus contratos locales: base confirmada, borrador, revisión, petición en vuelo inmutable, conflicto, actividades y recibos locales. Serializar mutaciones por cuenta y mantener el estado previo si falla una escritura. Verificar con persistencia simulada fallos antes/después de escribir, lectura corrupta, validación de documentos y que una nueva edición no sea sustituida por una respuesta anterior (CA-007, CA-008, CA-010, CA-011).

- [x] T006 Implementar la persistencia Android SQLCipher por cuenta y la variante web con clave por cuenta, Web Locks y detección entre pestañas. Guardar el estado local de forma atómica, comprobar cifrado y clave, y no reemplazar una base que no abra. Verificar el adaptador web con dos escritores, recarga, cuota, datos corruptos y falta de bloqueo; verificar las transacciones nativas mediante backend SQLite de prueba o development build, incluida reapertura con clave correcta/incorrecta. La verificación final offline Android se conserva en T020 (CA-006, CA-007, CA-011, CA-013).

- [x] T007 Implementar actividades locales por cuenta y las operaciones de copiar/mover en lote, con tipo, asociación opcional, instantáneas de nombres y UUID de operación. Conservar fechas por defecto, aceptar cambios explícitos y mantener referencias no disponibles tras resolver un conflicto. Verificar en `personalActivities.test.mjs` originales conservados al copiar, identidad conservada al mover, destino propio o general, operaciones parciales rechazadas, versiones cambiadas y reintentos sin duplicados; demostrar que estas operaciones no llaman al gateway remoto (CA-010, CA-011, CA-012).

- [x] T008 Implementar la lectura e importación explícita del almacén heredado Android/web sin integrarla a la carga normal. Advertir sobre el propietario desconocido antes de mostrar registros, permitir selección, guardar la huella por cuenta y conservar intacto el origen. Verificar recuperación idempotente, registros inválidos, cancelación, ausencia de importación automática y cambio de cuenta sin exposición automática (CA-012, CA-013).

- [x] T009 Implementar la sesión del planner con captura de cuenta/generación, primer acceso válido, lectura offline autorizada, suscripciones y bloqueo durante borrado. Verificar en `plannerSession.test.mjs` cambios de cuenta, cierre de sesión, sesión caducada, bloqueo y respuestas tardías. Comprobar que una petición iniciada por A nunca utiliza el JWT de B ni escribe su almacén (CA-006, CA-007, CA-013).

- [x] T010 Implementar el servicio de sincronización de horario: guardado local previo, envío serializado, recibos, recuperación tras timeout y reinicio, descarga sin retroceso y conflictos explícitos. Verificar en `plannerSync.test.mjs` fallo antes/después del commit, ediciones durante el envío, recibo de una revisión antigua, conflicto repetido, conservación de semestres remotos y aislamiento del contenido de actividades. Usar el backend local para comprobar la recuperación desde un segundo cliente (CA-001, CA-007, CA-008, CA-012).

- [x] T011 Incorporar contexto, hooks y `PlannerProvider` compartidos, con actualización de reloj, NetInfo, foco/primer plano y consulta cada 60 segundos mientras corresponda. Limpiar suscripciones y estado visible al cambiar de cuenta. Preparar la sustitución del proveedor antiguo manteniendo la app compilable en cada paso. Verificar carga local antes de red, reintentos serializados, pausa en segundo plano y ausencia de temporizadores o listeners duplicados (CA-006, CA-007, CA-009, CA-013).

- [x] T012 Crear las pantallas de gestión de semestres y ramos manuales, con rutas que solo reexporten pantallas. Permitir crear/renombrar, indicar semestre consultado y activo, activación explícita y fechas opcionales; editar nombre/sigla/sección y confirmar eliminación de ramo con sus bloques. Verificar formularios, recuperación de errores sin perder valores, primer semestre activo, conservación de los anteriores y selección accesible (CA-001, CA-002, CA-006).

- [x] T013 Crear el editor de bloques dentro de cada ramo con día, inicio, término, sala y docente independientes. Mostrar cruces y exigir confirmación para conservarlos; rechazar duplicados e intervalos inválidos. Verificar el recorrido de un mismo ramo lunes en sala 301 y miércoles en laboratorio 402, edición de una sola sala, datos opcionales y persistencia tras recarga (CA-002, CA-003, CA-004, CA-005).

- [x] T014 Adaptar el formulario y las tarjetas de actividades locales para tipo, ramo manual opcional y asociación general/semestre. Añadir selección múltiple y resumen de copiar/mover, con fechas visibles y editables, confirmación y mensaje «Solo en este dispositivo». Incorporar el flujo explícito de recuperación heredada. Verificar cancelación, cambio de fecha solicitado, copia, traslado, errores y ausencia de sincronización de actividades (CA-010, CA-011, CA-012, CA-013).

- [x] T015 Integrar las clases del semestre activo con las actividades y eventos guardados en la agenda diaria. Mostrar duración y salas reales, clases terminadas consultables, indicadores de días y orden estable; sustituir el selector institucional por los ramos manuales y completar la retirada del proveedor global anterior. Verificar `agendaItems` y los recorridos de agenda, incluidos días vacíos, semestres fuera de vigencia, cruces y eventos cancelados o de varios días (CA-003, CA-004, CA-009, CA-010, CA-014).

- [x] T016 Conectar el inicio con las proyecciones reales compartidas: clase o clases en curso, progreso, minutos restantes, próxima clase y tres próximos pendientes locales con navegación a agenda. Retirar `SAMPLE_CURRENT_CLASS`, `SAMPLE_UPCOMING` y `SAMPLE_WEEK_INSIGHT` de los consumidores y eliminar datos ficticios sin uso. Verificar en `plannerProjection.test.mjs` límites exactos de tiempo, cruces, estados vacíos, sala/docente omitidos y actualización al volver a primer plano; comprobar que siguen funcionando tutorial, perfil y gráfico emocional (CA-004, CA-009, CA-014).

- [x] T017 Integrar limpieza, bloqueo y cierre de recursos del planner con autenticación y eliminación de cuenta. Conservar copia cifrada al cerrar sesión, impedir acceso desde otra cuenta y borrar base/clave propias al eliminarla; verificar la cascada remota de horarios/recibos en backend local. Probar eliminación interrumpida, operaciones en vuelo y reintento remoto sin recrear el almacén borrado. Preservar el origen heredado y documentar el límite de otro dispositivo desconectado (CA-006, CA-012, CA-013).

- [x] T018 Completar regresión y verificación del backend local: aislamiento de lectura/escritura, referencias manipuladas, permisos de funciones/esquemas, validación del snapshot, recibos, activación concurrente, historial de migraciones y coexistencia con eventos. Ejecutar consultas posteriores y advisors de seguridad/rendimiento aplicables; corregir los hallazgos introducidos por este incremento. Ensayar recuperación/reversión solo con datos sintéticos y sin borrar entornos compartidos (CA-001, CA-006, CA-007, CA-008, CA-012, CA-013, CA-014, CA-015).

- [x] T019 Ejecutar las validaciones declaradas del proyecto y herramientas y revisar la interfaz web con datos sintéticos, incluidos el acceso directo para agregar clases y el formulario por tipo con semestre activo e inicio/término configurables solicitado el 2026-10-18: semestres, ramo sin códigos, salas distintas, copias/traslados, vacíos, carga, error y conflicto. Comprobar texto ampliado, lectores de pantalla/etiquetas y objetivos táctiles de 44 px. Actualizar README y documentación de configuración/contratos con horarios sincronizados, actividades locales, recuperación heredada, migración pendiente y limitaciones; registrar los resultados sin acreditar Android con la web (CA-001 a CA-016, salvo cierre de verificación nativa).

- [ ] T020 Validar en un development build Android con SQLCipher: creación de dos semestres, varios bloques con salas diferentes, cambio de activo, reapertura y edición sin conexión, reinicio con cambios pendientes, reconexión y recuperación en segundo cliente. Provocar y resolver un conflicto, copiar/mover actividades, cambiar de cuenta y eliminar una cuenta sintética. Registrar dispositivo/build, comandos, pasos y resultados; si no hay dispositivo o build válido, mantener esta tarea abierta y no declarar cerrada la spec (CA-003, CA-004, CA-005, CA-006, CA-007, CA-008, CA-010, CA-011, CA-013, CA-015).

## Cobertura y cierre

| Requisito | Tareas principales |
| --- | --- |
| RF-001 — Semestres y activo | T001, T003, T010, T012, T015, T020 |
| RF-002 — Ramos manuales | T001, T003, T012, T014 |
| RF-003 — Bloques semanales | T002, T003, T013, T015, T020 |
| RF-004 — Agenda e inicio reales | T002, T011, T015, T016, T019 |
| RF-005 — Actividades y traslado | T005, T006, T007, T008, T014, T017, T020 |
| RF-006 — Persistencia y sincronización | T003, T004, T005, T006, T009, T010, T011, T018, T020 |
| Privacidad y compatibilidad | T003, T004, T006, T008, T009, T015, T017, T018, T019, T020 |

Antes de cerrar el incremento deben estar verificados todos los criterios,
incluida la prueba nativa. No se marca una tarea completa por tener solo su
implementación o por haber pasado una prueba simulada cuando exige integración
real. Las verificaciones pendientes se distinguen de defectos del código.

## Aprobación y límites

Las tareas fueron aprobadas el 2026-10-18. Se ejecutan secuencialmente dentro del
alcance aprobado. La rama se renombró a `feature/agenda-semestres` por indicación
del usuario. El trabajo permanece local; no se crean PR ni se hace push hasta
que lo solicite explícitamente. Tampoco se aplican migraciones remotas.

## Autorización de publicación — 2026-10-19

El usuario indicó «estaríamos entonces crea un PR a la dev y adelante».
Autoriza commit, publicación de `feature/agenda-semestres` y PR hacia `dev`.
No autoriza fusión ni migraciones o despliegues remotos. T020 sigue pendiente
y se informa en el PR. Esta autorización sustituye el límite de trabajo
exclusivamente local de la aprobación inicial para esta entrega.

## Autorización de migración cloud — 2026-10-19

Tras revisar el proyecto y la migración concreta, el usuario confirmó «si adelante»
para aplicar `20261018175733_personal_semester_schedule.sql` en Duocmind cloud
(`ashgvanzjeaeekpygqgy`) y verificar permisos/RPC. Esta autorización amplía el
límite anterior exclusivamente para esa migración. No incluye copiar los datos
locales, desplegar la aplicación ni cerrar T020. La evidencia se registra en
`verification.md` y el PR #24 se actualiza con el estado real.

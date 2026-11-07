# Plan 017 — Horario y semestres solo en el dispositivo

| Campo | Valor |
| --- | --- |
| Versión | 0.3.0 |
| Estado | APROBADO |
| Fecha | 2026-11-06 |
| Spec | `spec.md` 0.6.0, APROBADA el 2026-11-06 |
| Aprobación | Confirmada explícitamente por el usuario el 2026-11-06: «apruebo», en respuesta a la solicitud de aprobación del plan 0.3.0. |
| Constitución | 2.0.0 |
| Rama | `feature/horario-local` |
| Base | `origin/dev` en `d45c3429b5bacdb3a246c2cfbb2329cfba94b19c` |

## 1. Decisiones

1. Conservar el almacén actual: `duocmind-planner-<userId>.db` con SQLCipher en
   Android y `duocmind.planner.v1.<userId>` en web. No cambian nombres, claves,
   tablas locales ni cifrado, por lo que no hay que mover datos entre almacenes.
2. Simplificar el documento local en vez de dejar campos de sincronización sin uso.
   No hay conversión de datos anteriores, porque la app sigue en desarrollo.
3. Mantener `shared/planner/` y `PlannerProvider`. Solo se retira lo remoto.
4. No añadir dependencias.
5. Trabajar y verificar en local. La migración de producción se ejecuta únicamente
   con confirmación explícita en ese momento.

## 2. Documento local

`PlannerDocument` pasa de `schema: 1` a `schema: 2`:

| Antes | Después |
| --- | --- |
| `base`, `inFlight`, `conflict`, `initialized` | Se eliminan. |
| `working` | Se renombra `schedule`, porque ya no existe otra versión con la que compararlo. |
| `activities`, `receipts`, `imports` | Sin cambios. Los recibos son de copia y traslado de actividades, no de sincronización. |

`parsePlanner` solo acepta `schema: 2`.

Limpieza de contenido ilegible: `invalid()` lanza un `Error` común, igual que las
validaciones de formularios, por lo que no se puede atrapar por tipo más arriba. La
limpieza se coloca solo alrededor del análisis del contenido ya leído:

- `plannerSqlite.ts`: dentro de `read(tx)`, las consultas quedan fuera del `try` y el
  análisis dentro. Si falla, borra las cuatro tablas locales en esa misma transacción
  y devuelve `emptyPlanner()`.
- `plannerStorage.web.ts`: en `read()`, `getItem` queda fuera del `try`. Si el análisis
  falla, elimina la clave y devuelve `emptyPlanner()`.
- `update` valida el resultado de `transform` fuera de esa limpieza. Una edición
  inválida sigue siendo un error y no borra nada.
- `unlockPlannerDatabase` y `openStore` no cambian: un fallo de clave o de SQLCipher
  sigue informando el error sin crear una base vacía.

`editSchedule` mantiene la regla de no quitar semestres (RF-001.7 de la spec 013),
ahora comparando contra el horario guardado en lugar de `base`.

## 3. Cambios en la aplicación

| Archivo | Cambio |
| --- | --- |
| `application/plannerContracts.ts` | Quita `RemoteSchedule`, `ScheduleSubmission`, `ScheduleResult` y `ScheduleGateway`. `PlannerAuthError` deja de hablar de sincronizar. |
| `application/plannerService.ts` | Quita `sync`, `synchronize`, `receive`, `resolve`, `plannerStatus` y los servicios `remote` y `newId`. Agrega `verifyAccount`. |
| `application/plannerStore.ts` | Documento de §2. Quita `parseRemote` y `parseSubmission`. |
| `application/plannerContext.ts` | Quita `syncing`, `syncError`, `status` y `resolve`. |
| `application/plannerPolling.ts` | Solo actualiza el reloj cada minuto. |
| `application/personalActivities.ts` | Usa `schedule` en lugar de `working`. |
| `infrastructure/scheduleGateway.ts` | Se elimina. |
| `infrastructure/plannerSessionGateway.ts` | Quita `supabaseScheduleGateway`. Implementa la consulta a Auth de §4. |
| `infrastructure/plannerRuntime.ts` | Ajusta los servicios de `PlannerService`. |
| `infrastructure/PlannerProvider.tsx` | Quita `synchronize` y NetInfo. `refresh` recarga el almacén local. |
| `features/agenda/components/PlannerSyncNotice.tsx` | Se reemplaza por `PlannerNotice.tsx`: carga, aviso «Esto se guarda en este dispositivo», error y «Reintentar». Se eliminan el comparador de versiones y la resolución. |
| `AgendaScreen`, `ScheduleScreen`, `SubjectScheduleScreen` | Usan `PlannerNotice`. |
| `PersonalActivityForm`, `PersonalActivitiesScreen`, `AgendaScreen`, `ScheduleScreen`, `SubjectScheduleScreen`, `DashboardScreen` | Leen `document.schedule`. `DashboardScreen` quita `planner.syncError`. |

`plannerSessionGateway.current()` sigue usando la sesión guardada sin conexión, por
lo que la agenda abre igual que hoy sin internet.

## 4. Detección de cuentas eliminadas

Hoy la comprobación vive dentro de la llamada a `load_personal_schedule`. Pasa a
`PlannerService.verifyAccount(session)`, con la consulta a Auth inyectada para poder
probarla sin React Native:

- `auth.getUser` con error `user_not_found`: `blockPlannerAccount` y
  `deletePlannerData`, como ahora.
- Cualquier otro error, o no tener sesión o conexión: no hace nada. El horario ya no
  necesita al servidor, así que un fallo no debe molestar a la persona ni borrar datos.
- Una sesión que cambió durante la consulta se descarta sin actuar.

`PlannerProvider` la llama al cargar, al cambiar de sesión y al volver a primer
plano. Deja de consultarse cada 60 segundos, porque el reloj no necesita red.

## 5. Migración

Crear el archivo con `supabase migration new remove_personal_schedule`, después de
`20261106140000_match_production_schema.sql`. Contenido, en orden de dependencias:

1. `drop function` de `public.save_personal_schedule(integer,uuid,jsonb)` y
   `public.load_personal_schedule()`.
2. `drop table schedule_private.schedule_request`.
3. `drop table public.schedule_block, public.schedule_subject,
   public.schedule_semester, public.personal_schedule` en una sola sentencia, por la
   referencia circular entre `personal_schedule` y `schedule_semester`.
4. `drop schema schedule_private cascade`, que solo contiene los ayudantes de horario.

Ninguna otra tabla, función ni el panel de administración referencian estos objetos.
`erase_student_personal_data` tampoco los usa, porque el borrado ocurría por la
cascada desde `auth.users`.

Local: `DOCKER_CONTEXT=default` y `supabase db reset --db-url` con el `DB_URL` de
`tools/.local/runtime.json`, y luego `fixtures.mjs` y `staff.mjs staff enable`.
`supabase db diff --linked` mostrará esta eliminación hasta aplicarla en producción.

Producción: `supabase db push`, con confirmación explícita. Después se comprueba que
los objetos ya no existen y que `db diff --linked` queda vacío. El orden respecto a
publicar la app es indiferente.

## 6. Pruebas

| Criterio | Evidencia |
| --- | --- |
| CA-001 | `plannerService.test.mjs` (renombrado desde `plannerSync.test.mjs`): guardado, cambio de activo y conservación de actividades. `plannerStorage.test.mjs` para reapertura. Recorrido Android. |
| CA-002 | `PlannerService` ya no recibe gateway remoto. `planner-e2e.mjs` registra las solicitudes y exige cero llamadas a las RPC de horario. |
| CA-003 | `plannerStorage.test.mjs`: JSON dañado, una actividad inválida y un documento `schema: 1` se limpian y `read` devuelve un almacén vacío, en SQLite real y en web. |
| CA-004 | `plannerStorage.test.mjs`: una edición inválida, la cuota llena y un fallo de lectura conservan los datos. Se mantiene la prueba de clave incorrecta. |
| CA-005 | Búsqueda de textos en `src/` y `planner-e2e.mjs`. |
| CA-006 | `plannerService.test.mjs`: `user_not_found`, error de red, sin sesión y sesión cambiada. |
| CA-007 | `db reset` local y `tools/tests/planner-removal.mjs`, que aplica la migración sobre una base temporal con datos sintéticos y comprueba que los objetos desaparecen y `asignatura` sigue. |
| CA-008 | `npm run typecheck`, `npm test`, `node --test tools/tests/*.test.mjs` y `npm --prefix tools run test:backend`. |

Pruebas que se retiran porque su contrato desaparece: `plannerGateway.test.mjs`, los
casos de timeout, envío en curso y conflicto de `plannerSync.test.mjs`, y
`tools/tests/planner-schedule.mjs`. `planner-migration.mjs` se reemplaza por
`planner-removal.mjs`, y `backend-tests.mjs` se actualiza.

En `planner-e2e.mjs` el recorrido de dos navegadores cambia su expectativa: el
segundo navegador no recibe el horario. Se quitan las esperas de «Horario
sincronizado» y «Pendiente de sincronizar».

La verificación Android es un recorrido manual sobre una instalación limpia: crear
horario, editar sin conexión y reiniciar. Si no hay dispositivo disponible, su tarea
queda abierta y la spec no se cierra.

## 7. Documentación

- `AGENTS.md`: retirar el módulo «Horario personal», quitar `schedule_*` de los
  patrones y agregarlo a la lista «Eliminado».
- `README.md`, `supabase/ENDPOINTS.md` y `docs/configurar-env-supabase.md`: describir
  el horario como local y quitar el contrato de las RPC.
- Spec y plan 013: agregar una nota que indique qué partes sustituye la spec 017, sin
  reescribir su historia. La tarea T020 de la spec 013 se actualiza con ese alcance.
- `verification.md` de este incremento con comandos y resultados reales.

## 8. Riesgos

| Riesgo | Medida |
| --- | --- |
| Una cuenta eliminada deja datos en un teléfono. | §4, con pruebas. Sin conexión, la limpieza espera hasta que haya red, como hoy. |
| Una validación equivocada borra datos válidos. | Riesgo aceptado en la spec. Las pruebas de dominio cubren los documentos válidos. |
| Un fallo pasajero se confunde con corrupción. | La limpieza solo rodea el análisis del contenido, nunca el acceso al almacenamiento ni la apertura cifrada. |

## 9. Reversión

- Código: revertir el PR. Una app anterior no entiende `schema: 2` e informa el
  error; en los dispositivos de prueba se borran los datos de la app.
- Esquema: se puede recrear con una migración nueva basada en
  `20261018175733_personal_semester_schedule.sql`. Los datos eliminados no se
  recuperan, algo que el usuario aceptó.

## Ajuste solicitado el 2026-11-06: retiro de la recuperación

Se eliminan `legacyActivities.ts`, `legacyStorage.*`, `agendaStorage.*`,
`agendaActivity.ts` y sus pruebas, además de `listLegacy` e `importLegacy`. El documento
pierde `imports` y SQLite elimina `planner_import`. El documento sigue en `schema: 2`:
Android no guarda ese campo en `planner_state`, y en web un documento que lo tenga se
limpia solo, lo que solo afecta a datos sintéticos. El usuario autorizó este ajuste al
pedir el cambio concreto. No cambia el esquema remoto ni añade dependencias.

## Ajuste solicitado el 2026-11-06: vista semanal

`semesterWeek` agrupa los bloques en el dominio y `WeekSchedule.tsx` los presenta.
`ScheduleScreen` suma el selector de semestre y las pestañas. `SubjectScheduleScreen`
abre un bloque si recibe el parámetro `block`, y `ClassScheduleForm` acepta el semestre
de destino. El usuario autorizó el ajuste al elegir la propuesta.

## 10. Aprobación y pasos posteriores

El plan fue aprobado el 2026-11-06. El siguiente paso es redactar y aprobar `tasks.md`
y después implementar. Esta aprobación no autoriza migraciones remotas, commits ni push.

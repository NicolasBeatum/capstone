# Tareas 017 — Horario y semestres solo en el dispositivo

| Campo | Valor |
| --- | --- |
| Versión | 0.1.0 |
| Estado | APROBADO |
| Aprobación | Confirmada explícitamente por el usuario el 2026-11-06: «dale y muestrame al app». |
| Fecha | 2026-11-06 |
| Spec | `spec.md` 0.3.0, APROBADA |
| Plan | `plan.md` 0.3.0, APROBADO |
| Rama | `feature/horario-local` |

Cada tarea se marca solo después de pasar su verificación, con el repositorio válido.
Toda integración usa Supabase local y datos sintéticos. Las tareas T001 a T004 cambian
contratos compartidos, por lo que `npm run typecheck` puede fallar entre ellas; deben
quedar verdes al cerrar T004.

## Aplicación

- [x] T001 Simplificar el documento local a `schema: 2` en `plannerStore.ts`: quitar `base`, `inFlight`, `conflict` e `initialized`, renombrar `working` a `schedule`, y quitar `parseRemote` y `parseSubmission`. Actualizar `personalActivities.ts`. Verificar con `plannerStore.test.mjs` y `personalActivities.test.mjs`.

- [x] T002 Implementar la limpieza de contenido ilegible en `plannerSqlite.ts` y `plannerStorage.web.ts`, solo alrededor del análisis. Verificar en `plannerStorage.test.mjs` con SQLite real y web: JSON dañado, actividad inválida y `schema: 1` se limpian (CA-003); edición inválida, cuota llena, fallo de lectura y clave incorrecta conservan los datos (CA-004).

- [x] T003 Retirar la sincronización de `plannerService.ts` y `plannerContracts.ts`, eliminar `scheduleGateway.ts` y mantener la regla de no quitar semestres en `editSchedule`. Agregar `verifyAccount` con la consulta a Auth inyectada. Renombrar `plannerSync.test.mjs` a `plannerService.test.mjs`, retirar los casos de timeout, envío y conflicto, eliminar `plannerGateway.test.mjs`, y probar `user_not_found`, error de red, sin sesión y sesión cambiada (CA-001, CA-006).

- [x] T004 Actualizar `plannerContext.ts`, `plannerPolling.ts`, `plannerRuntime.ts`, `plannerSessionGateway.ts` y `PlannerProvider.tsx`: quitar sincronización y NetInfo del proveedor, llamar a `verifyAccount` al cargar, al cambiar de sesión y al volver a primer plano, y dejar el reloj cada minuto. Ajustar las pantallas a `document.schedule`. Verificar con `plannerPolling.test.mjs`, `npm run typecheck` y `npm test`.

- [x] T005 Reemplazar `PlannerSyncNotice.tsx` por `PlannerNotice.tsx` con carga, aviso «Esto se guarda en este dispositivo», error y «Reintentar». Usarlo en agenda, horario y ramo, y quitar `planner.syncError` del inicio. Verificar con una búsqueda en `src/` que no quedan textos de sincronización de horario ni de versiones (CA-005), más `npm run typecheck`.

## Base de datos

- [x] T006 Crear con `supabase migration new remove_personal_schedule` la migración del plan §5, con timestamp posterior a `20261106140000`. Reemplazar `tools/tests/planner-migration.mjs` por `planner-removal.mjs`, eliminar `planner-schedule.mjs` y actualizar `backend-tests.mjs`. Verificar con `db reset` local, fixtures, consultas de catálogo y `npm --prefix tools run test:backend` (CA-007).

## Regresión y documentación

- [x] T007 Actualizar `tools/scripts/planner-e2e.mjs`: quitar las esperas de sincronización, comprobar que el segundo navegador no recibe el horario y exigir cero llamadas a `load_personal_schedule` y `save_personal_schedule` (CA-002). Ejecutar `npm --prefix tools run test:planner`.

- [x] T008 Actualizar `AGENTS.md`, `README.md`, `supabase/ENDPOINTS.md` y `docs/configurar-env-supabase.md`, y agregar a la spec y el plan 013 la nota de lo sustituido, con el alcance actualizado de T020. Verificar con una búsqueda de `personal_schedule` y `save_personal_schedule` fuera de migraciones y specs históricas.

- [x] T009 Ejecutar la validación completa (`npm run typecheck`, `npm test`, `node --test tools/tests/*.test.mjs`, `npm --prefix tools run test:backend`) y registrar comandos y resultados reales en `verification.md` (CA-008).

## Verificaciones con la persona responsable

- [ ] T010 Validar en Android sobre una instalación con SQLCipher: crear horario, editar sin conexión, reiniciar y comprobar que se conserva (CA-001). Requiere un dispositivo o emulador; si no está disponible, queda abierta y la spec no se cierra.

  Abierta: el usuario informó el 2026-11-06 que no tiene dispositivo ni emulador disponible.

- [ ] T011 Aplicar la migración en producción con `supabase db push`, solo con confirmación explícita en ese momento. Comprobar que los objetos ya no existen y que `supabase db diff --linked` queda vacío, y registrarlo en `verification.md`.

  Migración aplicada y objetos retirados el 2026-11-06. Sigue abierta porque `supabase db diff --linked` no queda vacío por diferencias ajenas al horario; ver `verification.md`.

## Aprobación

Las tareas fueron aprobadas el 2026-11-06. Se implementa una tarea por vez. Esta
aprobación no autoriza migraciones remotas, commits ni push; T011 exige su propia
confirmación.

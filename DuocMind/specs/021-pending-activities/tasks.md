# Tareas 021 — Pendientes como lista de plazos

| Campo | Valor |
| --- | --- |
| Versión | 0.1.0 |
| Estado | APROBADAS |
| Fecha | 2026-11-14 |
| Spec | `spec.md` 0.2.0, APROBADA |
| Plan | `plan.md` 0.1.0, APROBADO |
| Rama | `feature/pendientes` |
| Aprobación de tareas | El usuario aprobó el plan el 2026-11-14 pidiendo seguir con la implementación («adelante sigue con la implementacion») |

## Reglas de ejecución

Ejecutar en orden, una tarea por vez. Una tarea se marca `[x]` cuando su cambio
está completo y `npm run typecheck` y `npm test` pasan. No autorizan commits,
push, despliegues ni migraciones remotas.

## Tareas

- [x] T001 Agregar `doneAt?: string` a `PersonalActivity` y validarlo en `parseActivity` (ISO UTC con milisegundos). **Verificación:** `tests/plannerStore.test.mjs`. **CA-006.**
- [x] T002 Agregar `setActivityDone` en `personalActivities.ts`; `savePersonalActivity` conserva `doneAt`; la copia de `transferActivities` lo quita. **Verificación:** `tests/personalActivities.test.mjs`. **CA-003, CA-004, CA-007.**
- [x] T003 Exponer `setActivityDone` en `PlannerService`, `PlannerModel` y `PlannerProvider`. **Verificación:** `tests/plannerService.test.mjs`. **CA-003, CA-004.**
- [x] T004 `projectPlannerDashboard().upcoming` excluye las actividades hechas. **Verificación:** `tests/plannerProjection.test.mjs`. **CA-011.**
- [x] T005 Crear `features/agenda/domain/pendingActivities.ts` con `projectPending`, `countdownLabel`, `shortDayLabel` y `longDayLabel`. **Verificación:** `tests/pendingActivities.test.mjs`. **CA-001, CA-002, CA-008, CA-009.**
- [x] T006 Extraer `ActivityTransferModal` de `PersonalActivitiesScreen` sin cambiar su comportamiento. **Verificación:** typecheck.
- [x] T007 Crear los componentes de `components/pending/` y `PendingScreen.styles.ts`, y reescribir `PersonalActivitiesScreen` como contenedor (resumen, filtros, grupos, «Hechas», hoja de acciones, selección, Deshacer). **Verificación:** typecheck; recorrido web. **CA-003, CA-005, CA-008, CA-010.**
- [x] T008 Agenda: `AgendaActivityCard` muestra las hechas tachadas con «Hecha» y el enlace pasa a «Ver pendientes →». **Verificación:** typecheck; recorrido web. **CA-011.**
- [x] T009 Actualizar `../README.md` y ejecutar `npm run typecheck`, `npm test` y `npx expo export --platform web`. **CA-013, CA-014.**
- [ ] T010 Recorrido web: CA-003, 005, 008, 010 y 011, sin solicitudes de red al marcar. **CA-013.**
- [ ] T011 Recorrido Android: CA-005 y CA-012, con TalkBack y texto grande.

## Estado

- T001–T009 completas el 2026-11-14: `npm run typecheck` sin errores, `npm test` con
  426 pruebas en verde y `npx expo export --platform web` sin errores. La revisión de
  código no encontró llamadas de red ni `console.*` en el código nuevo (CA-013, parte
  de código). La parte de recorrido de T007 y T008 se comprueba en T010.
- T010 y T011 siguen abiertas: requieren los recorridos en el navegador y en un
  dispositivo Android con una cuenta de desarrollo.

### Historial de revisiones

- **0.1.0 — 2026-11-14:** tareas iniciales, aprobadas con el plan.

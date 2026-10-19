# Tareas 011 — Asignaturas reales en la agenda

| Campo | Valor |
| --- | --- |
| Versión | 0.1.0 |
| Estado | APROBADAS |
| Fecha | 2026-10-15 |
| Spec | `spec.md` 0.2.0, APROBADA |
| Plan | `plan.md` 0.1.0, APROBADO |
| Constitución | 2.0.0 |
| Aprobación de tareas | Confirmada por el usuario el 2026-10-15 al pedir «crea el plan e implementalo» |

## Reglas de ejecución

Ejecutar en orden y una tarea por vez. Una tarea se marca `[x]` cuando su cambio está
completo, pasa su verificación y `npm run typecheck` y `npm test` quedan sin fallos.
Registrar resultados y limitaciones en `verification.md`. No autorizan commits, push,
despliegues, migraciones remotas ni datos reales; toda prueba usa datos sintéticos.

## Tareas

- [x] T001 Dominio: `src/shared/subjects/domain/subject.ts` con `parseSubjects` y `subjectOptions`; pruebas en `tests/subject.test.mjs` (CA-001, CA-003).
- [x] T002 Copia local por cuenta: `src/shared/subjects/application/subjectCache.ts` y `infrastructure/subjectCacheStorage.ts` (con `deleteSubjectCache`); pruebas en `tests/subjectCache.test.mjs` (CA-007).
- [x] T003 Caso de uso `src/features/agenda/application/subjectCatalog.ts`; pruebas en `tests/subjectCatalog.test.mjs` (CA-001, CA-004, CA-005, CA-006).
- [x] T004 Gateway `src/features/agenda/infrastructure/supabaseSubjectGateway.ts` y hook `application/useSubjectCatalog.ts`.
- [x] T005 `AgendaScreen`: reemplazar `SUBJECTS` por el hook con estados de carga, vacío, error y lista guardada (CA-009).
- [x] T006 Borrado de la copia en `supabaseAuthGateway.deleteCurrentAccount`.
- [x] T007 Prueba SQL sintética de aislamiento `tests/sql/agenda-subjects-rls-smoke.sql` (CA-002); ejecutada en un contenedor `postgres:17` temporal (ver `verification.md`).
- [ ] T008 Validación contra Supabase de desarrollo con cuenta sintética inscrita y recorrido en Android, incluida la lectura offline (CA-005, CA-010). Requiere cuenta e inscripciones sintéticas y un dispositivo Android; la hace la persona responsable.

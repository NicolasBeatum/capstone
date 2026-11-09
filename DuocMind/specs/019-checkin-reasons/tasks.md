# Tareas 019 — Motivos del check-in emocional

| Campo | Valor |
| --- | --- |
| Versión | 0.1.0 |
| Estado | APROBADAS |
| Fecha | 2026-11-09 |
| Spec | `spec.md` 0.3.0, APROBADA |
| Plan | `plan.md` 0.1.0, APROBADO |
| Rama | `feature/motivo-emocion-general` |
| Aprobación de tareas | El usuario aprobó el plan el 2026-11-09 pidiendo redactar las tareas e implementar a continuación |

## Reglas de ejecución

Ejecutar en orden, una tarea por vez. Una tarea se marca `[x]` cuando su cambio
está completo y `npm run typecheck` y `npm test` pasan. No autorizan commits,
push, despliegues ni migraciones remotas.

## Tareas

- [x] T001 Agregar `domain/checkinReasons.ts` con `CheckinReason`, `parseReasonCatalog` (valida, filtra activos, ordena por `orden` y nombre) y `toggleReason`. **Verificación:** `tests/checkinReasons.test.mjs`. **CA-002.**
- [x] T002 Extender `LocalCheckinStore` con `emotional_checkin_reasons` y `reason_catalog`: `reasonIds` en `LocalCheckin`, `savePending` en transacción, `remove` borra motivos, `saveReasonCatalog`/`listReasonCatalog`. Actualizar la base en memoria web. **Verificación:** `localCheckinStore.test.mjs` y `checkinWebStorage.test.mjs`, incluido un pendiente antiguo sin motivos. **CA-005, CA-007.**
- [x] T003 `saveConfirmedCheckin` recibe `reasonIds`; agregar `fetchReasonCatalog` al gateway y `application/checkinReasons.ts` con `loadReasonCatalog`. **Verificación:** `checkinHistory.test.mjs` y `checkinReasons.test.mjs`. **CA-003, CA-006, CA-008.**
- [ ] T004 Implementar en `supabaseCheckinGateway` el guardado de motivos (`id_registro` por `client_request_id`, filtrar IDs existentes, `upsert` con `ignoreDuplicates`) y la lectura del catálogo. **Verificación:** typecheck; recorrido con Supabase de desarrollo. **CA-004.**
- [ ] T005 `MoodSlider.onCommit`, `ReasonBubbles`, hook `useCheckinReasons` e integración en `CheckinScreen` (aparición, Brote reducido, `ScrollView`). **Verificación:** typecheck; recorrido web. **CA-001, CA-009.**
- [x] T006 Subir `THANKS_VISIBLE_MS` en 1000 ms. **Verificación:** revisión de código. **CA-011.**
- [ ] T007 Recorrido Android: selección, lector de pantalla, texto ampliado, modo avión y filas en `registro_emocional_motivo`. **CA-001, CA-004, CA-005, CA-009, CA-010.**

## Estado de las tareas abiertas

- **T004:** código listo y con typecheck. Falta el recorrido contra Supabase de desarrollo para confirmar las filas en `registro_emocional_motivo`.
- **T005:** código listo; typecheck y `expo export --platform web` sin errores. Falta el recorrido visual en web.
- **T007:** pendiente; requiere un build nativo.

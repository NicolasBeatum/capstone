# Tareas 022 — Datos emocionales solo con consentimiento

| Campo | Valor |
| --- | --- |
| Versión | 0.1.0 |
| Estado | BORRADOR |
| Spec | `spec.md` 0.1.0 |
| Plan | `plan.md` 0.1.0 |

## Tareas

- [x] T001 Regla `allowsEmotionalUpload`, `canUploadEmotionalData` y textos `CONSENT_DETAILS`. **Verificación:** `consentSettings.test.mjs`. **CA-004.**
- [x] T002 Política obligatoria en `syncPendingCheckins` y `saveConfirmedCheckin` con `keptOnDevice`. **Verificación:** `checkinHistory.test.mjs`. **CA-001, CA-002.**
- [x] T003 Conectar la política en `CheckinScreen`, `SaveOverlay` y `DailyTestScreen`. **Verificación:** typecheck. **CA-001, CA-003.**
- [x] T004 `ConsentInfoModal` y enlaces «¿Qué se comparte?» en registro y Mi perfil. **Verificación:** typecheck. **CA-005.**
- [x] T005 Estado local `device` (SQLite y memoria web) para los check-ins sin permiso. **Verificación:** `localCheckinStore`, `checkinWebStorage` y `checkinHistory`. **CA-001.**
- [x] T006 Migración RLS `20261115120000` aplicada en Supabase local. **Verificación:** inserciones como `authenticated` en una transacción revertida y `npm run test:backend`. **CA-006.**
- [x] T007 Documento de privacidad 1.1 en `docs/` y `assets/`. **Verificación:** validación del `.docx` y revisión visual del PDF.
- [x] T008 Carrera del registro guardada por disparador. **Verificación:** `authentication.test.mjs` y prueba SQL revertida. **CA-007.**
- [x] T009 Copia local del último test y aviso combinado. **Verificación:** `lastStressTest.test.mjs`.
- [x] T010 Solicitudes de eliminación (tabla, RPC, cron, exclusión en dashboard y registro, RLS), pantalla de cancelación al iniciar sesión y sección en Mi perfil. **Verificación:** `scheduledDeletion.test.mjs`, prueba SQL revertida, `npm run test:backend` y `expo export --platform web`. **CA-008, CA-009.**
- [x] T011 Conservar los datos locales durante el plazo y borrarlos al abrir la app después del vencimiento. **Verificación:** `localDeletionSchedule.test.mjs` y `scheduledDeletion.test.mjs`. **CA-008.**
- [ ] T012 Recorrido web y Android: check-in y test sin consentimientos sin filas nuevas en Supabase; lo registrado sin consentimiento no se sube al activar uno; carrera guardada al registrarse; borrar datos y cuenta desde Mi perfil y cancelar al iniciar sesión; modales con lector de pantalla y texto ampliado. **CA-001 a CA-009.**

## Estado de las tareas abiertas

- **T012:** pendiente de recorrido manual. Aplicar las tres migraciones (`20261115120000`, `20261115130000`, `20261115140000`) en producción requiere autorización aparte.

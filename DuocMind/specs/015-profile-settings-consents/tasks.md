# Tareas 015 — Configuración de permisos opcionales desde el perfil

| Campo | Valor |
| --- | --- |
| Versión | 0.1.0 |
| Estado | APROBADAS |
| Fecha | 2026-10-30 |
| Spec | `spec.md` 0.2.0, APROBADA |
| Plan | `plan.md` 0.1.0, APROBADO |
| Aprobación de tareas | Confirmada por el usuario el 2026-10-30 al aprobar la spec y pedir la implementación |

## Reglas de ejecución

Ejecutar en orden y una tarea por vez. Una tarea se marca `[x]` cuando su cambio está completo, pasa su verificación y `npm run typecheck` y `npm test` quedan sin fallos. No autorizan commits, push, despliegues, migraciones remotas ni datos reales.

## Tareas

- [x] T001 Dominio y almacén: `shared/consents/domain/consents.ts` y `application/consentStore.ts`; pruebas en `tests/consentStore.test.mjs` (CA-002, CA-003, CA-005, CA-006).
- [x] T002 Caso de uso `shared/consents/application/consentSettings.ts`; pruebas en `tests/consentSettings.test.mjs` (CA-004).
- [x] T003 Infraestructura: `consentStorage.ts`, `consentOwnerGateway.ts` y mover `privacyPolicyDocument.ts` a `shared/consents/infrastructure/`; actualizar el registro y usar `CONSENT_TEXT`.
- [x] T004 Traspaso: `features/auth/application/registrationConsents.ts`, conectado a `RegisterScreen` y `ProfileScreen`; pruebas en `tests/registrationConsents.test.mjs` (CA-007).
- [x] T005 Pantalla `features/settings` (hook, pantalla, estilos) y ruta `src/app/(app)/settings.tsx` (CA-009).
- [x] T006 Menú de perfil: opción «Configuración» en `ProfileMenuModal` y navegación desde `DashboardScreen` (CA-001).
- [x] T007 Borrar el estado de consentimientos en `supabaseAuthGateway.deleteCurrentAccount` (CA-006).
- [x] T008 Registrar resultados en `verification.md`.
- [ ] T009 Recorrido en Android: menú, interruptores, persistencia y PDF (CA-008, CA-010). Lo hace la persona responsable.

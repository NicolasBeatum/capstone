# Tareas 014 — Datos académicos y consentimientos en el registro

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

- [x] T001 Dominio: `src/features/auth/domain/registration.ts` con `parseCampuses`, `parseCareers`, `SEMESTERS`, `careerOptions` y `validateAcademicSelection`; pruebas en `tests/registration.test.mjs` (CA-002, CA-003, CA-004, CA-006, CA-007).
- [x] T002 Caso de uso `src/features/auth/application/registrationCatalog.ts` y hook `useRegistrationCatalog.ts`; pruebas en `tests/registrationCatalog.test.mjs` (CA-001, CA-005).
- [x] T003 Gateway `src/features/auth/infrastructure/supabaseRegistrationCatalogGateway.ts` (solo lectura de `sede` y `carrera`).
- [x] T004 Componente `src/features/auth/components/SelectField.tsx`.
- [x] T005 PDF: copiar a `assets/privacy-consents.pdf`, instalar `expo-asset` y `expo-sharing` y crear `infrastructure/privacyPolicyDocument.ts` (CA-008).
- [x] T006 `RegisterScreen`: selectores, casillas de consentimiento opcionales, enlace al PDF y validaciones; términos sigue obligatorio (CA-004, CA-006, CA-007, CA-009).
- [x] T007 Registrar resultados en `verification.md`.
- [ ] T008 Recorrido en Android con catálogos cargados y sin conexión (CA-008). Requiere dispositivo y catálogos; lo hace la persona responsable.

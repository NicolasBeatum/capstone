# Plan 015 — Configuración de permisos opcionales desde el perfil

| Campo | Valor |
| --- | --- |
| Versión | 0.1.0 |
| Estado | APROBADO |
| Fecha | 2026-10-30 |
| Spec | `spec.md` 0.2.0, APROBADA |
| Aprobación | Confirmada por el usuario el 2026-10-30 al aprobar la spec y pedir la implementación |

## 1. Arquitectura

Los consentimientos los usan el registro (`auth`) y la configuración, por lo que su dominio y almacenamiento viven en `shared/consents/`. La pantalla vive en una funcionalidad nueva `settings`.

| Capa | Archivo | Responsabilidad |
| --- | --- | --- |
| shared/domain | `consents/domain/consents.ts` | `ConsentChoices`, `NO_CONSENTS`, `parseConsentChoices` (valida lo guardado) y `CONSENT_TEXT` (textos compartidos con el registro). |
| shared/application | `consents/application/consentStore.ts` | `createConsentStore(storage)`: `read`, `write`, `clear` por cuenta (clave con UUID); `savePending` y `adoptPending` para el traspaso. |
| shared/application | `consents/application/consentSettings.ts` | `loadConsents` y `changeConsent`: al fallar el guardado devuelve el valor anterior y `failed`. |
| shared/infrastructure | `consents/infrastructure/consentStorage.ts` | Instancia sobre `platformSecureKeyValueStorage` y `deleteConsentData` (mejor esfuerzo). |
| shared/infrastructure | `consents/infrastructure/consentOwnerGateway.ts` | Cuenta con sesión, leída localmente. |
| shared/infrastructure | `consents/infrastructure/privacyPolicyDocument.ts` | Se mueve desde `features/auth` para no importar entre funcionalidades. |
| settings | `application/useConsentSettings.ts`, `screens/SettingsScreen.tsx` y `.styles.ts` | Pantalla con dos interruptores, enlace al PDF y aviso. |
| auth | `application/registrationConsents.ts` | `rememberRegistrationConsents` y `adoptRegistrationConsents`, ambas de mejor esfuerzo. |
| dashboard | `ProfileMenuModal.tsx`, `DashboardScreen.tsx` | Opción «Configuración» que navega a `/settings`. |
| app | `src/app/(app)/settings.tsx` | Ruta que reexporta la pantalla. |

## 2. Datos y seguridad

- Sin migraciones ni escrituras remotas. Estado en `platformSecureKeyValueStorage` (SecureStore en Android; almacenamiento de sesión en web).
- Claves: `duocmind.consents.v1.<uuid>` por cuenta y `duocmind.consents.pending.v1` para el traspaso. Solo se aceptan UUID válidos en la clave.
- Valor guardado: JSON con los dos booleanos; al leerlo se valida y cualquier dato inválido equivale a «desactivado».
- Traspaso: el registro guarda el valor temporal tras crear la cuenta; al completar el perfil se mueve a la cuenta y se borra el temporal. Un fallo de cualquiera de los dos pasos no bloquea el registro ni el perfil.
- Eliminar la cuenta borra el estado de esa cuenta en `supabaseAuthGateway.deleteCurrentAccount`; al cerrar sesión no se borra (es el estado de la cuenta).
- No se registran valores ni identificadores en logs.

## 3. Interfaz

- «Configuración» en el menú, entre el nombre y «Cerrar sesión»; cierra el menú y hace `router.push('/settings')`.
- Pantalla con barra superior y botón volver, dos tarjetas (`LiquidCard` con `Reveal`) con `Switch`, enlace «Leer los consentimientos» y el aviso fijo. Carga con `GotaLoader`; mensaje de error en español si falla el guardado.

## 4. Pruebas

| Criterio | Prueba |
| --- | --- |
| CA-002, CA-003, CA-005, CA-006 | `tests/consentStore.test.mjs` |
| CA-004 | `tests/consentSettings.test.mjs` |
| CA-007 | `tests/registrationConsents.test.mjs` |
| CA-001, CA-008, CA-009, CA-010 | Revisión y validación manual en Android |

`npm run typecheck` y `npm test` deben quedar sin fallos.

## 5. Riesgos y reversión

- **Traspaso a la cuenta equivocada:** el valor temporal es único por dispositivo; lo adopta la primera cuenta que completa el perfil. Aceptable porque solo una cuenta nueva pasa por ese paso.
- **Ruta tipada:** `router.push('/settings')` requiere regenerar los tipos de rutas; se verifica con el typecheck.
- **Reversión:** revertir los cambios; no hay datos remotos que deshacer.

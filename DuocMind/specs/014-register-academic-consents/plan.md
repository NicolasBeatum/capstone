# Plan 014 — Datos académicos y consentimientos en el registro

| Campo | Valor |
| --- | --- |
| Versión | 0.1.0 |
| Estado | APROBADO |
| Fecha | 2026-10-30 |
| Spec | `spec.md` 0.2.0, APROBADA |
| Aprobación | Confirmada por el usuario el 2026-10-30 al aprobar la spec y pedir la implementación |

## 1. Arquitectura

Sigue las capas de `AGENTS.md`; todo bajo `features/auth` porque el registro es su única consumidora.

| Capa | Archivo | Responsabilidad |
| --- | --- | --- |
| domain | `domain/registration.ts` | Tipos `Campus` y `Career`, `parseCampuses`/`parseCareers` (validan lo que llega del backend), `SEMESTERS` (1–13), `careerOptions(careers, campusId)`, `validateAcademicSelection`. Sin React ni backend. |
| application | `application/registrationCatalog.ts` | Interfaz `RegistrationCatalogGateway` y `loadRegistrationCatalog`, que devuelve `{ campuses, careers, failed }` sin lanzar. |
| application | `application/useRegistrationCatalog.ts` | Hook con estados `loading`/`failed` y `reload`. |
| infrastructure | `infrastructure/supabaseRegistrationCatalogGateway.ts` | Lee `sede` y `carrera` con el cliente anónimo (política de lectura pública existente). |
| infrastructure | `infrastructure/privacyPolicyDocument.ts` | Abre el PDF empaquetado. |
| components | `components/SelectField.tsx` | Selector de opciones desplegable, accesible, sin dependencia nueva. |
| screens | `RegisterScreen.tsx` | Tres selectores, dos casillas de consentimiento y enlace al PDF. |

La pantalla no consulta Supabase directamente. No se guarda caché local: el registro ocurre antes de tener sesión y los catálogos son públicos y pequeños.

## 2. Datos y seguridad

- Sin migraciones ni escrituras: sede, carrera, semestre y consentimientos viven en el estado de la pantalla (RF-003.5). `registerAccount` no cambia.
- Lectura con la clave anónima y la política «public catalogs are readable» ya existente. Sin claves privilegiadas.
- Los valores elegidos no se registran en logs ni errores.
- Si `sede` o `carrera` están vacías o fallan, el registro queda bloqueado con mensaje y reintento (RF-002).

## 3. PDF empaquetado

- El documento se copia a `assets/privacy-consents.pdf` (nombre sin espacios ni tildes). El original en `docs/` se conserva.
- Metro ya trata `.pdf` como asset, por lo que `require('../../../../assets/privacy-consents.pdf')` basta.
- Android: se resuelve el asset con `expo-asset` y se entrega con `expo-sharing` (`shareAsync` con `mimeType: 'application/pdf'`), que convierte el archivo en un URI de contenido y deja elegir un visor. Funciona sin conexión porque el archivo va en la app.
- Web (solo previsualización): se abre el URI del asset con `Linking.openURL`.
- Dependencias nuevas justificadas: `expo-asset` y `expo-sharing`; `expo-linking` solo alcanza para URLs, no para un archivo local en Android. Se instalan con `npx expo install` para fijar versiones compatibles con Expo 57. `expo-sharing` se agrega a `plugins` solo si su documentación lo exige.
- Un fallo al abrir muestra un mensaje en español y no bloquea el formulario (RF-004.2).

## 4. Interfaz

- Selectores con la paleta y estilos de `authForm.styles.ts`; opciones tocables con `ScalePress`, objetivos de al menos 44 px, `accessibilityRole` y `accessibilityState`.
- Carga con `GotaLoader`; sin animaciones nuevas.
- Casillas con el mismo estilo que la de términos. El texto del primer consentimiento contiene el enlace «Leer los consentimientos» (rol `link`).
- Orden del formulario: correo, contraseña, confirmación, sede, carrera, semestre, términos (obligatorio), consentimiento 1, consentimiento 2.

## 5. Pruebas

| Criterio | Prueba |
| --- | --- |
| CA-002, CA-003, CA-004, CA-006, CA-007 | `tests/registration.test.mjs` (dominio) |
| CA-001, CA-005 | `tests/registrationCatalog.test.mjs` (caso de uso con gateway simulado) |
| CA-009 | Revisión del código |
| CA-008 | Validación manual en Android, incluido sin conexión |

`npm run typecheck` y `npm test` deben quedar sin fallos.

## 6. Riesgos y reversión

- **Catálogos vacíos:** bloquean el registro. Mitigación: mensaje claro; cargar los catálogos antes de distribuir.
- **API de `expo-sharing`/`expo-asset` en Expo 57:** se verifica contra el paquete instalado antes de usarla.
- **Reversión:** revertir los cambios; no hay migraciones ni datos remotos que deshacer.

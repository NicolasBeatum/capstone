# Tareas 012 — Tipos de eventos institucionales en administración

| Campo | Valor |
| --- | --- |
| Versión | 0.1.0 |
| Estado | APROBADAS |
| Fecha | 2026-10-15 |
| Spec | `spec.md`, versión 0.1.0, aprobada |
| Plan | `plan.md`, versión 0.1.0, aprobado |
| Constitución | 2.0.0 |
| Rama | `feat/admin-event-types` |

## Condiciones de ejecución

Ejecutar una tarea por vez en el orden indicado, sin delegar implementación.
Comenzar después de aprobar esta lista. Marcar `[x]` solo con el cambio completo
y su verificación satisfactoria; registrar evidencia real en `verification.md`.
Usar exclusivamente Supabase local y cuentas sintéticas. Mantener pendientes
las comprobaciones sin infraestructura disponible, sin sustituirlas por datos
o cuentas remotas. No modificar Android ni desplegar.

## Backend

- [x] T001 Preparar y comprobar el entorno local: versiones, ayuda de CLI, migraciones aplicadas, fixtures sintéticas y servicios disponibles. Revisar documentación vigente pertinente de Supabase y abrir `verification.md` sin registrar secretos. **Verificación:** disponibilidad real de DB/Auth/API locales y ausencia de datos heredados incompatibles en el catálogo. Documentar cualquier limitación. **CA-001, CA-005, CA-007.**
- [x] T002 Generar con la CLI una migración aditiva para revisión positiva, nombre normalizado, orden válido e inmutabilidad del código del catálogo. Conservar IDs, códigos, FK y lectura pública existentes; revisar permisos de la secuencia. **Verificación:** migración local reproducible, tipos iniciales intactos, límites/cambio de código rechazados y escrituras directas de anon/alumnos denegadas. **CA-002, CA-004, CA-005.**
- [x] T003 Incorporar consultas y mutaciones SQL del catálogo en `admin_read`/`admin_mutate`, con orden estable, bloqueo de fila, revisión e idempotencia existentes. Mantener las ramas previas y autorización por operación. **Verificación:** creación/edición, normalización, código duplicado, revisión antigua, petición repetida/payload distinto, tipo inexistente y cuenta sin permiso mediante SQL local. **CA-001, CA-002, CA-005, CA-006.**
- [x] T004 Ampliar lecturas/escrituras SQL de eventos con `typeId` validado y guardado atómico. Distinguir campo omitido y null explícito; conservar revisión, publicación, inscripción y cancelación. **Verificación:** crear/cambiar/quitar tipo, omisión de cliente anterior, FK inválida sin escritura parcial, cancelado ineditable, publicación sin tipo y contrato estudiantil con nombre actualizado. **CA-003, CA-004, CA-007.**
- [x] T005 Ampliar validación de `admin-api` para rutas del catálogo y referencia opcional de eventos; conservar límites, errores sanitizados y comprobación de sesión. Integrar pruebas de validación y SQL/HTTP en las suites existentes. **Verificación:** Deno check/test, HTTP local de casos válidos/negativos, autorización y regresión backend; advisors locales si están disponibles, registrando limitaciones. **CA-001 a CA-007.**

## Panel web

- [x] T006 Añadir entidades, parsers y gateway del catálogo y `EventContent.typeId`, sin acceso directo a tablas desde presentación. **Verificación:** pruebas de contratos válidos/nulos y rechazo de IDs, campos y valores inválidos; `npm --prefix admin-web run typecheck` y pruebas del panel. **CA-002, CA-003, CA-004.**
- [x] T007 Implementar `useEventTypes` y la página `/events/types`, accesible desde Eventos, con listado, creación y edición en `EditorDialog`. Mostrar código fijo al editar, alcance del renombrado, carga/vacío/error, recarga y protección de cambios/reintentos mediante `useWrite`. Conservar identidad tras un guardado confirmado aunque falle su lectura posterior. **Verificación:** Playwright local de crear/editar/recargar, foco/cierre, conflicto y respuesta incierta sin pérdida ni duplicado; typecheck y pruebas. **CA-001, CA-002, CA-006.**
- [x] T008 Integrar catálogo y selector «Tipo de evento»/«Sin tipo» en creación, edición y listado de eventos. Incorporar tipo a `dirty` y restauración del formulario; impedir guardar con catálogo no disponible y mantener cancelados de solo lectura. **Verificación:** Playwright local de asignar/cambiar/quitar tipo y recargar, tipo renombrado, fallo de catálogo con reintento y conflicto que conserva selección. **CA-003, CA-004, CA-006, CA-007.**

## Verificación y entrega

- [x] T009 Ejecutar la regresión backend pertinente y las validaciones completas del panel (`typecheck`, `test`, `build`, `test:e2e`). Corregir fallos sin relajar tipos ni deshabilitar pruebas; documentar resultados reales y comprobaciones pendientes por criterio. **Verificación:** comandos previstos en el plan con resultados reproducibles, sin servicios ni datos remotos. **CA-001 a CA-007.**
- [x] T010 Actualizar README y contratos/operación del catálogo, compatibilidad y orden de aplicación de migración/API/web. Consolidar evidencia y revisar el diff y ausencia de secretos. Publicar `feat/admin-event-types` y abrir un PR hacia `dev`, sin integrarlo. **Verificación:** documentación coincide con lo probado; PR describe comportamiento, migración, pruebas y límites. **CA-004, CA-005, CA-007.**

## Aprobación

Spec y plan aprobados por el usuario el 2026-10-15. El usuario aprobó esta lista explícitamente mediante «adelante» el 2026-10-15. La rama y el PR
posterior ya están autorizados; no se presume autorización para migraciones
remotas, despliegues ni integración del PR.

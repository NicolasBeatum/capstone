# Tareas 009 — Eventos y agenda personal

| Campo | Valor |
| --- | --- |
| Versión | 0.1.0 |
| Estado | APROBADAS |
| Fecha | 2026-10-11 |
| Spec | `spec.md` 0.1.2, APROBADA |
| Plan | `plan.md` 0.1.0, APROBADO |
| Constitución | 2.0.0 |
| Rama | `feature/eventos-horario` |
| Aprobación de tareas | Confirmada por el usuario el 2026-10-11: «adelante prosigue» |

## Reglas de ejecución

Ejecutar en orden y una tarea por vez, después de aprobar este documento.
No delegar ni paralelizar tareas. Toda verificación usa cuentas y datos sintéticos.
Los cambios de esquema se verifican únicamente en Supabase local.

Una tarea se marca `[x]` cuando su cambio está completo, pasa su verificación
específica y el repositorio conserva las validaciones aplicables. Registrar
cambio, comando o recorrido, resultado y limitaciones en `verification.md`.
Las pruebas diferidas a otra tarea deben aparecer como pendientes, nunca como
ejecutadas. La spec no se cierra mientras quede pendiente la validación Android.

Estas tareas no autorizan migraciones remotas, despliegues, commits, push,
inscripción interna ni datos reales. Las actividades personales actuales no se
migran a una cuenta ni se mezclan con el almacén de intereses.

## Preparación y reglas compartidas

- [x] T001 Preparar la verificación reproducible y abrir `verification.md` con versiones, línea base y cuentas sintéticas. Comprobar Node/npm declarados, dependencias desde lockfiles, Docker/backend local y disponibilidad de development build Android. Consultar documentación oficial y `--help` antes de ejecutar CLI; registrar cualquier herramienta ausente sin sustituir verificaciones por servicios remotos. **Verificación:** `typecheck` y pruebas actuales de app; validaciones actuales del panel/backend cuando su entorno esté disponible; inventario de comprobaciones Android pendientes. **CA-010.**

- [x] T002 Implementar tipos, validación de contratos y cálculos puros compartidos de eventos en `shared/events/domain`: estado temporal, inscripción y motivo de cierre, claves/intervalos de calendario en Santiago, duración cero, varios días, selección de fecha y detección de cambios de fecha/hora/ubicación. No importar React ni backend. **Verificación:** pruebas con reloj inyectado para límites exactos, prioridades, URLs inválidas, medianoche, cambios de horario, instantes inválidos, cancelados y ausencia de descripción; `typecheck` y pruebas de la app. **CA-001, CA-003, CA-004, CA-007, CA-011.**

## Backend y panel administrativo

- [x] T003 Crear una migración aditiva para condiciones de inscripción y ampliar escrituras/consultas administrativas y validación de `admin-api`. Generar el archivo mediante Supabase CLI. Conservar eventos existentes, publicación, cancelación, revisión, sesión, permiso e idempotencia. Permitir condiciones incompletas en borradores y exigirlas al publicar o editar publicados; cierre/reapertura se guardan con revisión. **Verificación:** SQL/HTTP local con URL y plazo válidos/inválidos, borrador incompleto, publicación rechazada/aceptada, cierre manual, reapertura vencida, edición cancelada, concurrencia y payload repetido; pruebas de compatibilidad, permisos y advisors; Deno check y pruebas aplicables. **CA-002, CA-003, CA-004, CA-010.**

- [x] T004 Incorporar la RPC de lectura `get_student_events(p_event_id)` con `SECURITY INVOKER`, referencias calificadas, `search_path` fijo y grants explícitos. Devolver catálogo completo ordenado y `serverTime` mediante una única consulta, o solo el evento solicitado, preservando RLS y ocultando borradores. **Verificación:** llamadas locales sin sesión, con estudiante y funcionario; cancelados publicados visibles, borradores ocultos, consulta por ID inexistente/borrador, lista vacía y catálogo de más de 1000 eventos sintéticos sin truncamiento; advisors y regresión de lectura/escritura. **CA-001, CA-002, CA-004, CA-007, CA-010.**

- [x] T005 Ampliar contratos, gateway, `useEvents` y editor del panel con inscripción requerida, enlace, plazo y cierre manual. Reutilizar conversiones de Santiago y selección de desfase para horas ambiguas. Mostrar avisos de reprogramación y mensajes que distingan borrador, publicación y cierre; conservar formularios ante conflicto y no consultar intereses. **Verificación:** pruebas de contratos y recorrido Playwright con ambos tipos de evento, borrador incompleto, publicación, cierre/reapertura, validación de plazo, horas inexistentes/ambiguas y conflicto; `typecheck`, pruebas, build y E2E del panel. **CA-002, CA-003, CA-010.**

## Almacenamiento y casos de uso personales

- [x] T006 Definir interfaces de catálogo, interés, sesión, enlace y reloj; implementar el contrato de persistencia y el adaptador web por UUID en `sessionStorage`. Validar íntegramente el documento versionado, serializar mutaciones e impedir que aceptar una actualización inserte un interés quitado. **Verificación:** agregar repetido, quitar repetido, actualización condicionada a versión, recarga de pestaña, aislamiento de cuentas, respuesta corrupta, fallo de cuota y almacenamiento no disponible; `typecheck` y pruebas de la app. **CA-005, CA-006, CA-007, CA-009.**

- [ ] T007 Implementar el almacén Android independiente por cuenta con SQLCipher y claves en SecureStore, usando Crypto instalado. Compartir el helper de claves solo cuando ambas funcionalidades lo utilicen. Validar UUID/clave, verificar soporte de cifrado y mantener catálogo/meta e intereses separados, con transacciones exclusivas y SQL parametrizado. No destruir archivo ni reemplazar clave ante error. **Verificación:** contrato de almacenamiento con fallos transaccionales, reinicio, duplicados y actualización tras quitar; comprobación Android de cifrado, lectura sin clave fallida, conservación de clave existente y lectura/escritura offline; `typecheck` y pruebas de la app. La ausencia de build/dispositivo mantiene pendiente la evidencia nativa. **CA-005, CA-006, CA-007, CA-008, CA-009.**

- [ ] T008 Implementar coordinación de sesión y limpieza local compartida. Capturar identidad/generación por operación, vaciar vistas y cancelar suscripciones al cambiar cuenta; incorporar eventos a la eliminación existente sin importar internals de otra funcionalidad. Bloquear comandos, esperar mutaciones, cerrar base y eliminar archivo/clave/cachés de manera idempotente. Cerrar sesión conserva intereses para su propietario. **Verificación:** dos cuentas con lecturas/escrituras diferidas, cierre durante consulta, reintento de eliminación parcial, ausencia de resultados de otra cuenta y regresión del caso de uso de eliminación; comprobación Android de archivo/clave eliminados. **CA-006, CA-008, CA-009, CA-010.**

- [x] T009 Implementar gateway Supabase y casos de uso de carga, guardado, retirada y reconciliación de intereses. Reemplazar catálogo solo después de validar una respuesta completa y conservarlo ante fallo. Identificar cambios pendientes y eventos no disponibles; aceptar solo la versión vigente y sin recrear intereses quitados. Implementar inscripción con nueva consulta del evento y hora del servidor antes de abrir un enlace HTTPS. **Verificación:** interfaces simuladas para fallos de red, consulta individual que no reemplaza catálogo completo, cancelación/reprogramación, cambio adicional antes de aceptar, sesión cambiada, cierre entre carga y pulsación, URL inválida y fallo de apertura; integración con RPC local; `typecheck` y pruebas de la app. **CA-001, CA-003, CA-004, CA-005, CA-006, CA-007, CA-008, CA-009.**

- [x] T010 Incorporar hooks y composición de presentación con carga al enfocar, volver a primer plano, recuperar conexión y actualizar manualmente. Refrescar catálogo cada minuto y reloj cada 30 segundos solo mientras la pantalla esté activa; liberar recursos al salir y rechazar respuestas de generaciones anteriores. Separar error, vacío y última copia disponible, con acciones locales offline. **Verificación:** reloj/red/sesión controlados para cierre de plazo sin recarga, reactivación, respuesta tardía, temporizadores liberados, errores que conservan datos y guardado confirmado antes de mostrar éxito; `typecheck` y pruebas de la app. **CA-003, CA-004, CA-006, CA-008, CA-009, CA-010.**

## Eventos, accesos y agenda

- [x] T011 Crear listado, selector mensual y detalle de Eventos con rutas mínimas, filtros Próximos/Por fecha/Anteriores y tarjetas accesibles. Mostrar datos reales, zona horaria, condición de inscripción, motivo de cierre e interés; ofrecer agregar/quitar/ver agenda según el estado. Conservar fecha/origen al volver; manejar ID inválido, vacío, carga, error y offline. Usar ScalePress, Reveal, GotaLoader y los tokens de movimiento existentes. **Verificación:** recorrido web reproducible con fixtures locales de todos los estados, varios días, fecha vacía, meses consecutivos, navegación directa y regreso; texto ampliado, etiquetas accesibles y movimiento reducido; `typecheck` y pruebas de la app. **CA-001, CA-003, CA-004, CA-005, CA-006, CA-007, CA-008, CA-010, CA-011.**

- [ ] T012 Añadir calendario discreto de 20 px con área táctil mínima de 44 × 44 px arriba a la derecha del dashboard y tarjeta de acceso en Bienestar. Ambos abren Eventos; preservar campana, perfil, saludo y referencia utilizada por WelcomeIntro. Adaptar el encabezado a pantalla estrecha/texto ampliado sin superposición, badges ni movimiento permanente. **Verificación:** navegación desde ambos accesos, encabezado estrecho y texto ampliado, lector de pantalla y bienvenida tras login; `typecheck` y pruebas de la app. **CA-001, CA-010.**

- [x] T013 Incorporar el caso de uso de agenda que lee actividades actuales e intereses mediante gateways y los proyecta como tipos distintos, sin convertir eventos a bloques de una hora ni migrar almacenamiento heredado. Ordenar por hora/ID y representar intervalos en Santiago, continuaciones, cancelados, finalizados y cambios pendientes. **Verificación:** pruebas de composición del día con duración real, varios días, medianoche, coincidencias, horas iguales, reprogramación pendiente/aceptada, eventos ausentes, fallos de cada almacén y actividades heredadas intactas; `typecheck` y pruebas de la app. **CA-005, CA-006, CA-007, CA-008, CA-010.**

- [x] T014 Integrar tarjetas institucionales y acciones en «Mi agenda», validar parámetro `date` y permitir consulta de fechas anteriores. Mantener reglas actuales de creación y filtrado de actividades personales. Recargar intereses al enfocar, mostrar errores independientes y actualizar ambas pantallas al quitar o aceptar un cambio. **Verificación:** recorrido Eventos → agregar → ver fecha en Agenda → quitar → volver a Eventos; coincidencia con actividad, evento finalizado/cancelado, aceptar reprogramación sin duplicar y fallo de almacenamiento sin falso éxito; `typecheck` y pruebas de la app. **CA-005, CA-006, CA-007, CA-008, CA-010.**

## Verificación integrada y entrega

- [ ] T015 Completar la verificación integrada en Android con development build y cuentas sintéticas: catálogo, inscripción externa, agenda, navegación, texto ampliado, lector de pantalla y movimiento reducido; descargar/desconectar/agregar/quitar/reiniciar; cambiar cuentas y eliminar datos/clave; aceptar reprogramaciones y conservar cancelados. Ejecutar las validaciones completas de app, panel, Deno, backend y advisors declaradas en el plan sobre el estado final, y verificar aplicación limpia de las migraciones nuevas en local. **Verificación:** evidencia reproducible por CA-001 a CA-011, con resultados reales y limitaciones; web no sustituye Android y cualquier comprobación fallida mantiene la tarea abierta. **CA-001, CA-002, CA-003, CA-004, CA-005, CA-006, CA-007, CA-008, CA-009, CA-010, CA-011.**

- [x] T016 Actualizar documentación funcional, contrato de datos y guía de ejecución/pruebas conforme a la implementación final. Consolidar trazabilidad y ensayo de reversión local conservando eventos, condiciones e intereses. Documentar límites de la previsualización web y almacenamiento heredado; no afirmar despliegue remoto ni inscripción confirmada. **Verificación:** revisión de documentación contra código y evidencia, `git diff --check`, ausencia de secretos/datos reales/créditos de herramientas y estado de tareas coherente. La entrega permanece abierta si falta validación obligatoria. **CA-002, CA-006, CA-008, CA-009, CA-010.**

## Trazabilidad de aceptación

| Criterio | Tareas de implementación | Verificación integrada |
| --- | --- | --- |
| CA-001 | T002, T004, T009, T011, T012 | T015 |
| CA-002 | T003, T004, T005 | T015, T016 |
| CA-003 | T002, T003, T005, T009, T010, T011 | T015 |
| CA-004 | T002, T003, T004, T009, T010, T011 | T015 |
| CA-005 | T006, T007, T009, T011, T013, T014 | T015 |
| CA-006 | T006, T007, T008, T009, T010, T011, T013, T014 | T015, T016 |
| CA-007 | T002, T004, T006, T007, T009, T011, T013, T014 | T015 |
| CA-008 | T007, T008, T009, T010, T011, T013, T014 | T015, T016 |
| CA-009 | T006, T007, T008, T009, T010 | T015, T016 |
| CA-010 | T001, T003, T004, T005, T008, T010, T011, T012, T013, T014 | T015, T016 |
| CA-011 | T002, T011 | T015 |

## Estado inicial

La spec, el plan y estas 16 tareas están aprobados por el usuario el 2026-10-11.
La autorización «adelante prosigue» habilita implementar esta lista; no autoriza
operaciones remotas. Los checkboxes y `verification.md` reflejan la ejecución real.


## Estado de implementación

Implementación y verificación web/local registradas en `verification.md`.
T007/T008 requieren evidencia Android de cifrado y eliminación; T012 conserva
pendiente la comprobación con lector de pantalla/escala del sistema; T015 no se
cierra sin development build Android. Los demás checks corresponden a las
pruebas reales descritas, no a una aprobación nativa ni a un despliegue remoto.

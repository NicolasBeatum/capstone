# Tareas 005 — Administración de Bienestar y Salud

| Campo | Valor |
| --- | --- |
| Versión | 0.2.0 |
| Estado | APROBADAS |
| Fecha | 2026-10-04 |
| Spec | `spec.md`, versión 0.2.0, APROBADA |
| Plan | `plan.md`, versión 0.2.0, APROBADO |
| Constitución | 2.0.0 |
| Aprobación | Aprobadas el 2026-10-04 |

## Condiciones de ejecución

La spec, el plan y esta lista 0.2.0 fueron aprobados el 2026-10-04.
La implementación administrativa está verificada. El estado de cada tarea y sus
comprobaciones se registran abajo y en `verification.md`. T023 se omite por decisión
del usuario del 2026-10-04; no se considera una prueba completada.

Ejecutar una tarea por vez en el orden indicado; las tareas dependen de las
anteriores salvo dependencia más concreta en su texto. No delegar ni paralelizar
implementación. Marcar `[x]` solo con cambio completo, comprobación satisfactoria
y repositorio válido; conservar `[ ]` ante trabajo parcial, fallo o infraestructura
faltante. Usar cuentas y contenidos sintéticos exclusivamente en Supabase local.

El alcance comprende panel y backend administrativos. No implementar integración,
descarga ni presentación de contenidos nuevos en Android, selección de tips,
offline, snapshot público ni actualización del gateway de recuperación. T023
verifica únicamente compatibilidad de lo existente. Ninguna tarea autoriza cambios
remotos, despliegues, cuentas reales ni creación de la futura spec de integración.

## Preparación y backend

- [x] T001 Inventariar esquema, consultas existentes e instrumentos; comprobar compatibilidad mediante migraciones, código y definiciones actuales. Identificar nombres protegidos, IDs/FK, versiones activas y la consulta PSS-10 por nombre/activo. **Verificación:** inventario reproducible que distingue estado actual de capacidades propuestas, documenta ambigüedades y no modifica datos. Los casos SQL se reproducen después de preparar fixtures en T003. **CA-005, CA-010.**
- [x] T002 Preparar `admin-web/` como proyecto npm independiente con React, TypeScript estricto, Vite, React Router y CSS propio; fijar dependencias/lockfile, variables públicas ficticias, exclusiones y guía de trabajo. **Verificación:** instalación desde lockfile y comandos `typecheck`, `test`, `build` y `test:e2e` reproducibles, sin secretos ni cambios al proyecto Expo. **CA-011.**
- [x] T003 Preparar Supabase local, CLI/Deno, Auth, Edge Functions y buzón con versiones reproducibles, descubriendo comandos con `--help`. Crear fixtures de alumno, cuenta Auth sin autorización y funcionario sin perfil de alumno; su habilitación se realiza en T004. Abrir `verification.md`. **Verificación:** arranque/autenticación locales sin solicitudes remotas; disponer también de una cuenta con perfil para probar aislamiento tras habilitarla. **CA-001.**
- [x] T004 Crear `private.admin_staff` con `auth_user_id` UUID PK/FK a `auth.users.id`, borrado en cascada, `enabled` NOT NULL por defecto `false` y `created_at` por defecto `now()`. Preparar provisión y revocación de servidor fuera del panel. **Verificación:** habilitar el primer funcionario sin administrador previo ni perfil de alumno; rechazar autoasignación, duplicados y cuentas inexistentes; registro estudiantil no crea privilegios y borrar Auth elimina la autorización. **CA-001.**
- [x] T005 Crear registros operativos de idempotencia/límites con `expires_at`, vencimiento lógico de 24 horas y limpieza Cron cada cinco minutos; documentar comprobación, recuperación e historial técnico de siete días. **Verificación:** registros vencidos no se usan y, en operación normal, se eliminan antes de 24 horas y cinco minutos sin solicitudes al panel; fallos mantienen vencimiento y la siguiente ejecución limpia el atraso. No almacenar correos, tokens ni contenido sensible. **CA-009, CA-011.**
- [x] T006 Crear catálogo y versiones de tests, manifiesto protegido y backfill conservando IDs/FK. Añadir publicación/revisión, nuevos borradores inactivos, protección de contenido publicado y reserva de nombres de instrumentos validados. **Verificación:** fixtures compatibles conservan PSS-10 y definiciones; casos ambiguos fallan sin sobrescribir; contenido publicado queda fijo incluso inactivo y no vuelve a borrador. **CA-004, CA-005, CA-010.**
- [x] T007 Crear eventos institucionales y estados/reglas de tips reutilizando `material_apoyo`, `material_emocion` y `material_test`; registrar consejos generales actuales sin modificar Android. **Verificación:** fechas válidas, FK a ánimo o versión/nivel publicados, relaciones únicas, cancelación con publicación conservada y ausencia de vínculos a alumnos; reglas históricas no exigen versión activa. **CA-006, CA-007, CA-008.**
- [x] T008 Configurar grants y RLS para ocultar borradores en padres e hijos y restringir tablas privadas; conservar aislamiento de perfiles, check-ins, resultados y derivaciones. **Verificación:** SELECT y joins directos de anon/alumnos ocultan borradores; acceso al perfil propio y consultas publicadas existentes siguen funcionando, sin lectura personal ampliada. **CA-006, CA-009, CA-010.**
- [x] T009 Implementar operaciones transaccionales de guardado/publicación/activación/clonación, reglas de tips, revisiones e idempotencia. Revalidar actor, sesión y permiso en SQL antes de usar privilegios. **Verificación:** publicación no activa; activar rechaza borradores y sustituye una sola versión; probar rangos, concurrencia, referencias históricas, respuestas perdidas, vencimiento y payload diferente con UUID vigente. **CA-004, CA-006, CA-007, CA-008, CA-011.**
- [x] T010 Implementar autenticación y autorización por operación en `admin-api`: JWT verificado, actor/sesión derivados del token, acceso vigente, validación, CORS, límites y errores sanitizados. **Verificación:** cuenta sin permiso, fila ausente/deshabilitada, rol/actor manipulado y RPC directa se rechazan; tras revocación la siguiente petición falla sin renovar JWT. Logs sin cuerpos ni tokens. **CA-001, CA-009, CA-011.**
- [x] T011 Implementar consultas de alumnos, catálogos, versiones y opciones de formularios, con proyección mínima, correo vigente de Auth, filtros/paginación y contratos inequívocos. **Verificación:** correo de perfil distinto no sustituye Auth; cuentas desvinculadas devuelven `email: null`; UUID de catálogo, ID bigint decimal y número de versión no se confunden; niveles históricos publicados sirven al editor. **CA-002, CA-008, CA-009.**
- [x] T012 Implementar envío de recuperación con destinatario resuelto nuevamente en servidor, redirect fijo, límites atómicos, idempotencia y plantilla/allowlist locales. La plantilla usa el enlace con hash solo para el redirect web configurado y conserva `ConfirmationURL` para solicitudes existentes. **Verificación:** buzón sintético correcto en ambos recorridos de plantilla, rechazo de correo/redirect alternativos, perfil desvinculado, límites y timeout sin reenvío automático; el funcionario no recibe enlace ni token. **CA-003.**

## Panel administrativo

- [x] T013 Implementar casos de uso, gateway y acceso con sesión en `sessionStorage`, comprobación de `/session`, rutas protegidas y navegación. **Verificación:** funcionario habilitado sin perfil de alumno accede; alumnos sin autorización se rechazan; restauración/cierre y revocación con sesión abierta limpian listados ante `401/403`; estados accesibles de conexión/error. **CA-001, CA-011.**
- [x] T014 Implementar listado de alumnos, búsqueda, filtros, paginación y solicitud confirmada de recuperación. Mantener listados en memoria. **Verificación:** solo campos permitidos, perfiles incompletos, correo canónico mostrado, `email: null` con acción deshabilitada y destinatario resuelto por ID en servidor; vacío, fallo y pérdida de red no confirman envíos. **CA-002, CA-003.**
- [x] T015 Implementar la página pública `/recover` con cliente Auth separado sin persistencia, limpieza temprana de URL, acción explícita para verificar hash y establecer contraseña. **Verificación:** enlaces válidos/inválidos/vencidos/usados, confirmación/política de contraseña, recarga y red; sesión del funcionario intacta y tokens ausentes de logs. No modificar el gateway Android. **CA-003.**
- [x] T016 Implementar casos de uso, gateway y editor de cuestionarios propios: borrador, preguntas/opciones/puntajes, niveles, vista previa, publicación, activación y clonación. **Verificación:** rangos completos, publicación sin activación, reemplazo de versión activa, nuevas versiones y formulario conservado ante conflicto; estados publicado/inactivo y publicado/activo separados, sin afirmar recepción por alumnos. **CA-004.**
- [x] T017 Implementar consulta de instrumentos protegidos y controles de disponibilidad con contenido de solo lectura. **Verificación:** panel y API permiten activar/desactivar versiones publicadas, incrementan revisión y rechazan edición de código, preguntas, opciones, puntajes, niveles y reglas; no permiten clonarlos como versiones protegidas nuevas. **CA-005.**
- [x] T018 Implementar administración de eventos: borradores, edición, publicación, cancelación y revisiones, con fechas `America/Santiago` convertidas a UTC. **Verificación:** fechas normales/inválidas/ambiguas, estado confirmado en web/base, cancelación conserva contenido y conflictos conservan formulario. No incorporar pantalla Android. **CA-007.**
- [x] T019 Implementar administración de tips generales y reglas OR por ánimo o catálogo/versión/nivel, con edición, publicación, activación y revisión. **Verificación:** múltiples reglas, versión histórica inactiva, FK inválida, borrador, conflicto y desactivación; sin selección de alumnos ni contexto emocional personal. No implementar selección personalizada en Android. **CA-008, CA-009.**

## Verificación y entrega

- [x] T020 Verificar backend local: permisos, transacciones, contratos, correo Auth, recuperación, protección de instrumentos, contenido/reglas, revisión, idempotencia y limpieza. **Verificación:** suite reproducible SQL/HTTP con cuentas sintéticas, reloj controlado, buzón y fallos Cron sin tráfico; evidencia de CA-001 a CA-009 y CA-011, sin jobs remotos.
- [x] T021 Verificar recorridos Playwright de acceso, alumnos, recuperación, tests, eventos y tips, accesibilidad, conflictos y errores de conexión. **Verificación:** estados confirmados corresponden al backend; edición no se pierde ni afirma éxito ante error, borradores no se filtran y versiones históricas se conservan. **CA-001, CA-002, CA-003, CA-004, CA-005, CA-007, CA-008, CA-011.**
- [x] T022 Incorporar validaciones de panel y backend local a CI conservando las existentes: instalaciones desde lockfiles, typecheck, pruebas y build. **Verificación:** ejecutar los mismos comandos localmente; configuración, logs y artefactos sin secretos ni datos reales; ningún job modifica Supabase remoto. **CA-009, CA-011.**
- [ ] T023 **OMITIDA por decisión del usuario, 2026-10-04.** Verificar compatibilidad con Android existente: reproducir consulta PSS-10 por nombre/activo y padres/hijos en local, conservar IDs/FK/definiciones y comprobar recorridos actuales en un development build con cuentas sintéticas. **Verificación:** acceso, recuperación existente, instrumentos locales, PSS-10 y rutas de ayuda sin regresión introducida; aislamiento personal conservado. No exigir nuevos tests/tips/eventos ni cambios de rutas o gateways. SDK/dispositivo faltante o prueba fallida mantiene la tarea abierta. **CA-010.**
- [x] T024 Documentar ejecución de panel/backend local, habilitación del primer funcionario, revocación, correo/plantilla, contratos, publicación/activación, inventario, limpieza y recuperación. Consolidar `verification.md` y la trazabilidad. **Verificación:** operación sintética reproducible desde entorno limpio, evidencias reales por criterio y límites identificados; pasos remotos pendientes y consumo Android remitido a futura spec sin afirmar que ya funciona. **CA-001, CA-009, CA-011.**

## Evidencia y cierre

Por cada tarea registrar en `verification.md`: ID de revisión 0.2.0, cambio,
comando o recorrido, versiones, cuentas sintéticas, resultado y limitación.
No incluir secretos, correos reales, sesiones ni respuestas emocionales.

La evidencia de implementación y pruebas administrativas se encuentra en
`verification.md`. T023 se omite por decisión del usuario y no bloquea esta entrega
administrativa. No se acredita compatibilidad nativa ni se incluyen funciones de
la futura spec de integración.

# Verificación — Spec 005

Rama: `feature/admin-dashboard-implementation`. Entorno exclusivamente local y cuentas sintéticas.

## T001 — Inventario

Comando: `node DuocMind/scripts/admin-inventory.mjs`. Resultado: satisfactorio. Esquema y hashes reproducidos; consulta PSS-10 e inexistencia de seed verificadas. Ver `inventory.md`. No se consultó ni modificó el proyecto remoto.

## T002 — Base web

Node 24.16.0 / npm 11.13.0. React 19.2.3, TypeScript 5.9.3, Supabase JS 2.116.0, Vite 8.3.2, React Router 7.18.4 y Playwright 1.63.0 fijados. `npm ci --ignore-scripts`, `npm run typecheck`, `npm test`, `npm run build` y `npm run test:e2e` satisfactorios (1 recorrido inicial). Chromium local; no backend remoto.

## T003 — revisión 0.2.0

Supabase CLI 2.119.0, Deno 2.9.6 y PostgreSQL 17.11 locales. Arranque aplicó las cuatro migraciones originales. local-env.mjs valida localhost y guarda claves solo en archivos ignorados. fixtures.mjs creó cuatro cuentas sintéticas, comprobó login/logout y funcionario sin perfil. API, Auth, buzón y Edge Runtime disponibles; no se usó el proyecto remoto.

## T004 — revisión 0.2.0

staff.mjs habilita/revoca solo fixtures locales fuera del panel. SQL y tools/tests/staff.mjs pasaron: enabled=false inicial, duplicados, FK inexistente, autoasignación denegada y cascada al borrar Auth dentro de transacción revertida. Funcionario inicial habilitado sin perfil estudiantil.

## T005 — revisión 0.2.0

operations.mjs y cron.mjs pasaron: vencimiento de 24h, eliminación, Cron sin tráfico y recuperación tras fallo controlado. Job operativo */5, job temporal de prueba eliminado. operations.md documenta comprobación, reactivación, recuperación e historial de siete días. Sin correos ni tokens en registros.

## T006 — revisión 0.2.0

versions.mjs y migration-compatibility.mjs pasaron. Manifiesto generado desde TS sin modificar Android. Base temporal sintética: migración rechaza PSS-10 ambiguo y conserva IDs/opciones/textos de fixture compatible; no se inventa instrumento validado. Triggers protegen preguntas, opciones, niveles, identidad y publicación; desactivación exige revisión atómica.

## T007 — revisión 0.2.0

content.mjs pasó: fechas inválidas rechazadas, relaciones únicas, reglas de resultados históricos publicados/inactivos y cancelación conserva publicación. Seeds de tres tips generales actuales sin modificar Android. Eventos/tips sin relaciones a alumnos.

## T008 — revisión 0.2.0

rls.mjs pasó como anon y authenticated: borradores invisibles en catálogo, versiones, preguntas, opciones, niveles, tips, reglas y eventos; contenido publicado legible y cuenta dual conserva solo su perfil. Auditoría local: ninguna rutina private es SECURITY DEFINER. Sin cambios a políticas personales.

## T009 — revisión 0.2.0

transactions.mjs y concurrency.mjs pasaron bajo service_role con sesión Auth sintética: permiso vigente, publicación separada, rangos completos, clonación, una activa, reglas históricas, conflicto concurrente, UUID/payload, reintento tras respuesta perdida y vencimiento de deduplicación. Revocación rechaza siguiente operación. Las rutinas son invoker y respuestas operativas mínimas.

## T010 — revisión 0.2.0

deno check y api-access.mjs pasaron contra Edge Runtime 1.77.1 local. Auth verifica JWT; SQL revalida sesión y permiso. Probados JWT inválido, cuentas sin autorización, actor extra, RPC directa, CORS ajeno, revocación con token vigente y sign-out. JSON limitado a 256 KiB, contratos estrictos y errores sanitizados.

## T011 — revisión 0.2.0

queries.mjs pasó por HTTP local: proyección exacta, correo canónico Auth distinto de perfil, cuenta desvinculada null, búsqueda literal con porcentajes, paginación y contratos separados. Editor recibe niveles publicados de una versión sintética temporalmente desactivada; se restauró su disponibilidad.

## T012 — revisión 0.2.0

recovery.mjs pasó: destinatario Auth en buzón, plantilla web y ConfirmationURL existente, sin enlace/token en respuesta, cuenta desvinculada, extras, límites 1/minuto y 10/hora, UUID idempotente y estado incierto sin reenvío. recovery_test.ts pasó con TimeoutError inyectado y retry que no vuelve a enviar. Plantilla y allowlist exclusivamente locales; Site URL existente conservada.

## T013 — revisión 0.2.0

Panel compila con contratos validados, gateway separado, sesión sessionStorage y descarte de respuestas tras cierre. typecheck/build y tres recorridos Playwright pasaron: acceso/restauración/cierre, alumno denegado, revocación con sesión abierta. @types/node 24.19.1 fijado para validar las pruebas. Datos personales solo en memoria.

## T014 — revisión 0.2.0

typecheck y dos recorridos Playwright pasaron: proyección mínima/correo Auth, filtros, vacío y acción deshabilitada sin cuenta. Recuperación exige confirmación; fallo de red conserva selección y no confirma envío. Listados en memoria, respuestas atrasadas descartadas y UUID conservado para retry incierto.

## T015 — revisión 0.2.0

typecheck y tres recorridos Playwright pasaron: hash limpiado antes de render, validación explícita, confirmación, cambio real y restauración de fixture, sesión administrativa intacta, enlace usado/inválido/vencido, recarga y red fallida. Cliente Auth separado sin persistencia ni auto-refresh; ningún cambio al gateway Android.

## T016 — revisión 0.2.0

typecheck, dos pruebas Node y dos recorridos Playwright pasaron: suma/rangos, vista previa sin guardar respuestas, crear/guardar/publicar sin activar, activar y clonar versión 2; contenido publicado readonly. Conflicto 409 conserva descripción local. Gateway y casos de uso separados; UUID/revisión en escrituras y ventana de retry de 24h.

## T017 — revisión 0.2.0

typecheck y Playwright protected.spec.ts pasaron: WHO-5 readonly sin editor/clonación, desactivar/reactivar conserva contenido. protected-api.mjs rechazó edición, clonación, publicación y cambio de código mediante HTTP; JSON protegido intacto. SQL obliga incremento de revisión en disponibilidad.

## T018 — revisión 0.2.0

typecheck, cinco reglas Node acumuladas y dos recorridos Playwright pasaron: UTC/Santiago, hora inexistente y ambigua con elección explícita, crear/publicar/cancelar y contenido conservado, conflicto que conserva formulario. Cambios sin guardar bloquean publicación; respuesta de escritura conserva ID confirmado aunque falle la lectura posterior.

## T019 — revisión 0.2.0

typecheck y dos recorridos Playwright pasaron: consejos generales, ánimo más regla de resultado OR, versión 1 histórica inactiva con versión 2 activa, guardado/publicación/edición/desactivación y conflicto conserva formulario. API/SQL validan correspondencia y FK; sin destinatarios ni contexto personal. No se implementó selección Android.

## T020 — revisión 0.2.0

Reconstrucción --local aplicó las nueve migraciones nuevas tras las cuatro originales. backend-tests.mjs pasó las suites SQL/HTTP; security.mjs y prueba Deno de timeout pasaron. Incluyen permisos, firmas/metadatos, perfiles/emociones duales, rangos, concurrencia, contratos, reglas/FK, correo y buzón, límites, expiración/recovery Cron sin tráfico. supabase db advisors --local (seguridad/rendimiento, warn+) no encontró problemas. Datos y sesiones exclusivamente sintéticos.

## T021 — revisión 0.2.0

typecheck, siete pruebas Node y suite completa de 18 recorridos Playwright pasaron contra Supabase local. Incluyen teclado/etiquetas, sesión/revocación, alumno, recuperación, tests protegidos/propios, eventos/tips, conflictos, red y respuesta perdida con UUID idéntico/un solo evento. Imagen del listado sintético revisada; sin trazas, tokens ni contraseñas en artefactos. Formularios y listados no se persisten.

## T022 — revisión 0.2.0

CI admin.yml añadido sin cambiar validate.yml. npm ci de ambos lockfiles, bootstrap/env/serve/ready, Deno frozen check/test, suite backend, advisors y panel typecheck/test/build/18 e2e pasaron localmente. YAML válido. Expo typecheck y ocho archivos de pruebas existentes pasaron; tsconfig separa las funciones Deno, que se validan estrictamente en CI. Sin artefactos de secretos ni acceso remoto. Job GitHub aún no ejecutado; instalación de bibliotecas del sistema --with-deps corresponde al runner Ubuntu.

## T023 — OMITIDA, revisión 0.2.0

Regresión nativa omitida por decisión del usuario el 2026-10-04. No se acredita
desarrollo ni pruebas funcionales Android en esta entrega. El chequeo TypeScript y
los ocho archivos de pruebas existentes sí pasaron en T022. La consulta PSS-10 con
joins se observó satisfactoria durante una comprobación local parcial; su fixture
temporal fue retirada y las protecciones restauradas. T023 no se marca completada.

## T024 — revisión 0.2.0

README del panel, operations.md y contracts.md documentan arranque, fixtures, primer funcionario, revocación, correo, versiones, contratos, Cron y recuperación. Reconstrucción limpia y comandos de CI verificados en T020/T022. Revisión final: typecheck, pruebas Node, build y 19 recorridos Playwright satisfactorios; fallo de lectura de versión bloquea escrituras y 403 sin JSON limpia sesión. Auditoría de 111 archivos candidatos sin credenciales del entorno local/remoto; archivos privados ignorados y restringidos. Advisors de seguridad local sin problemas. Rama feature/admin-dashboard-implementation desde dev. T023 omitida; CI remoto, despliegue y consumo Android no acreditados.

## Trazabilidad de aceptación

| Criterio | Evidencia reproducible | Resultado |
| --- | --- | --- |
| CA-001 | `staff.mjs`, `api-access.mjs`, `security.mjs`; Playwright `access.spec.ts` y `resilience.spec.ts`. | Permiso explícito, autoasignación denegada y revocación efectiva con sesión abierta. |
| CA-002 | `queries.mjs`; Playwright `students.spec.ts`. | Proyección mínima, filtros, correo Auth y cuenta desvinculada. |
| CA-003 | `recovery.mjs`, Deno `recovery_test.ts`; Playwright `recovery.spec.ts` y `students.spec.ts`. | Buzón local, enlace web, límites, sesión separada y envío incierto sin duplicación. |
| CA-004 | `versions.mjs`, `transactions.mjs`, `concurrency.mjs`; Playwright `tests.spec.ts`. | Contenido inmutable, publicación separada, activación atómica y versiones conservadas. |
| CA-005 | `versions.mjs`, `protected-api.mjs`, manifiesto; Playwright `protected.spec.ts`. | Instrumentos protegidos de solo lectura y disponibilidad con revisión. |
| CA-006 | `rls.mjs` y `content.mjs`. | Borradores y relaciones ocultos en lecturas directas. |
| CA-007 | `content.mjs`, reglas Node de fechas; Playwright `events.spec.ts`. | Estados, fechas, cancelación y conflictos verificados localmente. |
| CA-008 | `content.mjs`, `transactions.mjs`; Playwright `tips.spec.ts`. | Consejos generales, reglas OR e históricos publicados/inactivos. |
| CA-009 | `security.mjs`, inspección de contratos/registros y auditoría de archivos. | Sin acceso administrativo a datos emocionales individuales ni secretos versionables. |
| CA-010 | T006/T008 comprueban conservación de esquema/IDs/RLS; T022 valida tipos y pruebas existentes. | Parcial. Regresión nativa T023 omitida por decisión del usuario; criterio completo no acreditado. |
| CA-011 | `operations.mjs`, `cron.mjs`, `concurrency.mjs`; Playwright `resilience.spec.ts` y conflictos de editores. | Expiración, limpieza sin tráfico, recuperación, idempotencia y errores accesibles. |

## Estado de entrega

23 tareas completadas; T023 omitida por decisión del usuario, sin marcarla como
completada. Suite web final: 19 recorridos satisfactorios. Backend, reglas Node,
tipos estrictos y build verificados en local. Los comandos de CI se reprodujeron
localmente; no se ejecutó un job de GitHub ni se desplegó. No se aplicaron
migraciones, configuración de correo o trabajos Cron en Supabase remoto. La futura
integración Android conserva su alcance independiente.

## Ajuste visual — 2026-10-04

Por solicitud del usuario, el panel adopta la identidad de DuocMind definida en
`shared/theme.ts`, los estilos de dashboard/acceso y `shared/components/glass.tsx`:
azul marino, crema, amarillo, tarjetas redondeadas y superficies translúcidas.
Aplicado a navegación, acceso, recuperación, formularios y tablas con variables
CSS propias, tipografía del sistema, foco visible y objetivos de al menos 44 px.
El ajuste corresponde a la presentación de T002/T013–T019; conserva los contratos,
las reglas y el estado de las tareas existentes.

`npm --prefix admin-web run typecheck`, `test`, `build` y `test:e2e` pasaron: 19
recorridos web satisfactorios. Capturas sintéticas de acceso y alumnos revisadas
en escritorio (1440 px) y móvil (390 px); alumnos, editor, eventos y tips no
presentan desbordamiento horizontal de página a 390 px con datos cargados. La tabla
mantiene su desplazamiento interno para consultar todas las columnas. Capturas,
credenciales y configuración local siguen ignoradas por Git. Revisión visual en
web; T023 nativa permanece omitida.

## Operación remota posterior autorizada — 2026-10-04

Se aplicaron nueve migraciones y `admin-api` al Supabase real, se verificaron
RLS/grants, preservación del PSS-10 y Cron activo con ejecución satisfactoria.
`remote-check.mjs` pasó las comprobaciones públicas y negativas. La cuenta
administrativa sintética solicitada se creó mediante Auth Admin, se habilitó por
operador y pasó acceso API (200), cierre y rechazo de sesión cerrada (401).
El navegador verificó inicio y cierre del panel sin errores JavaScript ni
guardar capturas/datos personales. DuocMind respondió 200 y su comprobación
pública de Auth mostró «Backend conectado» sin errores JavaScript.

Las secciones de tests, eventos y tips recibieron respuestas 200 de la API real
sin alertas visibles. Pasaron tipos Deno, sintaxis de los scripts remotos y
revisión de espacios/diff; el config mínimo coincide con sus campos remotos
declarados. Los servicios quedaron ejecutándose para las pruebas del usuario.

Auth recibió únicamente la URL permitida `/recover`; la plantilla fue rechazada
por una restricción del proveedor predeterminado del plan gratuito. No se
acredita recuperación web remota completa ni entrega de correos. Los comandos
de validación funcional anteriores siguen usando exclusivamente Supabase local.
Ver `remote.md` para detalle, recuperación y límites. T023 permanece omitida;
conectar ambas webs al mismo backend no implementa nuevo consumo Android.

## Editor de tests guiado — 2026-10-04

Refinamiento de T016/T021, CA-004/CA-005/CA-011: cuatro pasos con ejemplos,
preguntas/respuestas separadas, explicación de puntajes, resultados por intervalo
y simulación. Referencias de resultados automáticas y estables; guardar desde
otro paso enfoca el campo pendiente. No cambia contratos ni contenido protegido.

Pasaron `typecheck`, pruebas Node y build del panel. La primera ejecución E2E
detectó un selector de pregunta ambiguo tras el cambio de etiquetas; se corrigió
a coincidencia exacta. La ejecución final de
`ADMIN_E2E_PORT=5174 npm --prefix admin-web run test:e2e -- tests.spec.ts protected.spec.ts`
pasó cinco recorridos con Supabase local y cuentas sintéticas: creación,
publicación/activación/clonación, conflicto, fallo de lectura, validación de
pasos/cobertura/puntaje y protección de instrumentos. Las secciones nuevas se
revisaron visualmente a 1440 px y 390 px; sin desbordamiento horizontal a 390 px.
Capturas sintéticas permanecen ignoradas. No se repitió la suite de recuperación
ni se modificó el backend remoto; la API local retorna a su origen habitual 5173.

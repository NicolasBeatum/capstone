# Verificación 012 — Tipos de eventos institucionales

Fecha de inicio: 2026-10-15 (America/Santiago). Rama: `feat/admin-event-types`.
Spec, plan y tareas aprobados explícitamente. Solo cuentas sintéticas y Supabase local.

## T001 — Preparación

Node 24.16.0. Ayuda de CLI consultada para `migration new`, `db advisors`,
`migration list` y `functions serve`. Documentación oficial de RLS y changelog
revisados; el aviso reciente de TLS no cambia los contratos locales utilizados.
La descarga Markdown falló; se consultaron las páginas HTML oficiales.

Docker local usa el contexto default y `unix:///var/run/docker.sock`; se arrancó
la API con `DOCKER_HOST` explícito porque el contexto predeterminado apuntaba
a Docker Desktop ausente. Las migraciones de inscripción/catálogo están aplicadas
con numeraciones previas (`20261011190525`, `20261011191037`); se detectó antes
de seguir intentando aplicar la misma estructura. Se conservó ese historial.
Se aplicó únicamente la migración faltante de Hans al entorno local.
Catálogo inicial comprobado: Charla, Taller y Actividad, IDs 1, 2 y 3; orden 1–3.
No hay nombres/órdenes heredados incompatibles. No se imprimen credenciales.

## T002–T006 — Backend y contratos

- CLI generó `20261016015100_admin_event_types.sql` (timestamp UTC del host).
- `event-types-schema.mjs`: IDs iniciales, restricciones, código fijo y permisos pasan.
- `event-types.mjs`: creación/edición, nombre normalizado, orden, duplicados,
  revisiones, idempotencia, asignación/cambio/null/omisión y contrato estudiantil pasan.
- `event-types-api.mjs`: HTTP local, permisos, revocación, dos ediciones concurrentes
  con una respuesta 200 y una 409, petición repetida y asignación pasan.
- Deno check y tres pruebas Deno pasan. Suite backend completa pasa.
- Asesores de seguridad locales: `No issues found`.
- Typecheck y tres archivos de pruebas del panel pasan, incluidos contratos nuevos.

## T007 — Catálogo web

Typecheck y build pasan. Vite informa advertencias de directivas de React Router
 y tamaño de chunk, sin errores de compilación.
La primera ejecución de cuatro E2E falló en login por configuración local:
`local-env.mjs` derivó puertos 54321/54322 desde config.toml, mientras los
contenedores de DuocMind existentes publican 55321/55322 (correo 55324).
Se corrigieron únicamente los archivos ignorados runtime.json y .env.local.
Se volvió a comprobar API, fixtures y suite HTTP del catálogo en DuocMind.
No se ejecutaron escrituras de aplicación contra el otro servicio local.
La repetición de los cuatro E2E del catálogo pasó. Los siete casos nuevos del
incremento y los tres existentes de eventos también pasaron en una ejecución
conjunta (10/10). Un selector del test usaba coincidencia exacta de texto del
label que incluía opciones; se corrigió para usar el nombre accesible del combobox.
No se relajó ninguna comprobación de comportamiento.



## T008–T009 — Integración y validación final

- `typecheck`: pasa; `npm test`: tres archivos pasan, sin omisiones.
- `build`: pasa. Advertencias de directivas React Router y chunk >500 kB.
- Deno check y las tres pruebas Deno: pasan.
- Suite backend completa con los cuatro archivos nuevos: pasa.
- Migración completa probada sobre estado previo dentro de transacción: conserva
  catálogo/IDs y rechaza datos heredados incompatibles. Rollback restaura el entorno.
- Suite Playwright completa: **33/33 pasan** en 1,3 minutos; siete casos nuevos.
- Asesores de seguridad repetidos con URL explícita del contenedor de DuocMind,
  puerto 55322 y `sslmode=disable`: cero hallazgos. El primer `--local` usó la
  configuración en disco; por eso se repitió con la conexión correcta. La CLI
  etiqueta `--db-url` como conexión remota incluso para localhost; runtime rechaza
  cualquier URL de pruebas que no sea loopback.
- Migración final registrada en el historial local después de comprobar el SQL.
- `git diff --check`: pasa.

| Criterio | Evidencia satisfactoria |
| --- | --- |
| CA-001 | SQL/HTTP del catálogo y E2E de creación/edición/recarga. |
| CA-002 | Pruebas SQL de esquema/mutación, Deno y parsers; código fijo en UI. |
| CA-003 | SQL y E2E de asignar/cambiar/quitar/recargar y revisión. |
| CA-004 | Cliente antiguo omite referencia sin perderla; publicación sin tipo; contrato estudiantil y nombre vigente; migración conserva IDs. |
| CA-005 | Roles anon/authenticated sin escrituras, cuenta sintética sin permiso y revocación; regresión RLS; advisors sin hallazgos. |
| CA-006 | SQL de revisión/idempotencia, HTTP concurrente 200/409 y E2E de conflicto, respuesta perdida y lectura fallida tras guardar. |
| CA-007 | Suite completa backend, Deno, typecheck, pruebas/build y 33 E2E del panel. |

## T010 — Entrega

README, contratos y endpoints describen uso, compatibilidad y orden de actualización.
Cambios disponibles en el [PR #23](https://github.com/NicolasBeatum/capstone/pull/23)
hacia `dev`, desde `feat/admin-event-types`.
No se modificó Android ni se aplicaron migraciones o despliegues remotos.


## T011 — Operación remota autorizada, 2026-10-16

El usuario autorizó aplicar la migración del PR #23 y actualizar admin-api en
`ashgvanzjeaeekpygqgy`. Antes del cambio se guardaron fuera del repositorio las
definiciones SQL, políticas, código/configuración de la API y conteos/huellas
institucionales. Los cuerpos remotos de admin_read/admin_mutate coincidían
exactamente con la versión base local de inscripción. Los tres tipos cumplían
las restricciones nuevas.

- Migración `admin_event_types` aplicada con éxito. El servicio generó inicialmente
  `20261016104509`; se alineó su registro a `20261016015100` para coincidir con
  `20261016015100_admin_event_types.sql` y evitar reaplicar el mismo cambio.
- admin-api desplegada como versión 2 ACTIVE. Código de index, validation,
  recovery y deno.json idéntico al repositorio. Se conservó la autenticación propia
  y la configuración verify_jwt previa, sin ampliar acceso.
- El primer despliegue fue rechazado porque heredó un import_map_path absoluto
  del paquete anterior. Se corrigió enviando `deno.json` explícitamente; el
  siguiente despliegue fue satisfactorio.
- Conteos antes/después: dos eventos y tres tipos. Sus huellas de contenido/IDs
  coinciden; las políticas de ambas tablas permanecen idénticas. No se editaron
  eventos, tipos, perfiles ni información emocional.
- RLS del catálogo activo; anon/authenticated sin INSERT, UPDATE o DELETE y sin
  ejecución de admin_read. Referencias typeId y rutas /event-types presentes en
  ambas funciones administrativas.
- Consultas administrativas comprobadas con la cuenta remota sintética ya
  provisionada: catálogo de tres tipos y listado de dos eventos con contratos
  nuevos válidos. Solo se devolvieron conteos/booleanos, sin datos de sesión.
- HTTP: catálogo público con revisión devuelve 200. remote-check.mjs pasa:
  API exige sesión, CORS/preflight correcto, token inválido y RPC anónima
  rechazados; consulta PSS-10 conserva 10 preguntas y 50 opciones.
- Asesores: sin incidencias del catálogo. Tres avisos INFO por tablas privadas
  con RLS sin políticas (acceso exclusivo del backend) y un WARN de Auth por
  [protección de contraseñas filtradas desactivada](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).
  No se modificaron ajustes de Auth; ese aviso está fuera del cambio de eventos.

No se ejecutaron suites locales de mutación contra la nube. El recorrido visual
remoto no se verificó porque el control de esa pestaña fue bloqueado por la
política del navegador. El usuario puede recargar el panel para consumir los
contratos remotos actualizados.

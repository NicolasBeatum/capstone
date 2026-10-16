# Plan 012 — Tipos de eventos institucionales en administración

| Campo | Valor |
| --- | --- |
| Versión | 0.1.0 |
| Estado | APROBADO |
| Fecha | 2026-10-15 |
| Spec | `spec.md`, versión 0.1.0, aprobada el 2026-10-15 |
| Constitución | 2.0.0 |
| Rama | `feat/admin-event-types`, creada desde `dev` en `2741c6e` |

## 1. Decisiones y alcance

Extender el panel y la API existentes, reutilizando sus sesiones, permisos,
revisiones, idempotencia y editor modal. No añadir dependencias ni modificar
Android. La implementación y las pruebas usan exclusivamente Supabase local.
El PR final apunta a `dev`; no se despliega ni se aplica SQL remoto.

El usuario aprobó este plan explícitamente el 2026-10-15 y solicitó el prefijo
`feat` para la rama. A continuación se redacta `tasks.md` para su aprobación
antes de implementar. La autorización para crear rama y PR no sustituye ese orden.

## 2. Base de datos

Crear una migración aditiva con la CLI del proyecto, descubriendo primero la
sintaxis mediante `--help`. Mantener intacta la migración de Hans.

En `tipo_evento_institucional`:

- Añadir `revision integer not null default 1` con restricción positiva.
- Mantener identidad `smallint`, unicidad de código, FK y lectura pública actuales.
- Exigir nombre sin espacios exteriores, longitud 1–40 y orden 0–32767.
  Comprobar previamente datos heredados; abortar con error si no cumplen, sin
  normalizar ni sobrescribir silenciosamente contenido existente.
- Impedir cambios de código mediante un trigger con `search_path` vacío.
  Las escrituras administrativas incrementan la revisión bajo bloqueo de fila.
- Revisar los permisos de la secuencia de identidad y otorgar solo lo necesario
  a `service_role`. No ampliar escrituras de `anon` o `authenticated`.

Actualizar `public.admin_read` y `public.admin_mutate` mediante definiciones
versionadas, conservando sus demás ramas y permisos. Todas las operaciones
verifican actor/sesión con `private.assert_admin`. Reutilizar el registro de
peticiones y su bloqueo por requestId para creación, edición y asignación.

La lectura de eventos añade `typeId` (ID decimal como string o null). La escritura
acepta ese campo opcional: omitirlo conserva la referencia existente al editar;
null explícito la borra; un valor identifica un tipo existente. Validar tipo JSON,
formato, rango positivo smallint y existencia también en SQL. Guardar referencia y
contenido del evento en la misma transacción con su revisión habitual. Mantener
el rechazo de edición de cancelados. La consulta estudiantil de Hans conserva
su contrato; el join existente refleja automáticamente el nombre vigente.

## 3. Contratos y API

| Operación | Contrato |
| --- | --- |
| `GET /event-types` | Lista ordenada de `{ id: string, code: string, name: string, order: number, revision: number }`. Sin parámetros de consulta. |
| `POST /event-types` | `{ requestId, code, name, order }`; devuelve `{ id, revision }`. |
| `PUT /event-types/:id` | `{ requestId, expectedRevision, name, order }`; devuelve `{ id, revision }`. El código no es un campo editable. |
| `GET /events` | Conserva los campos actuales y añade `typeId: string | null`. |
| `POST /events`, `PUT /events/:id` | Añaden `typeId?: string | null`, conservando compatibilidad con clientes anteriores. |

La validación de `admin-api` rechaza campos extra, IDs inválidos, tipos JSON
incorrectos, código inválido y orden fuera de rango. Recortar nombre en la
operación de guardado, tanto en frontend como en SQL; validar su longitud tras
recortarlo. La edición no acepta código, ni siquiera si coincide con el actual.

Reutilizar errores sanitizados existentes: 403 sin permiso, 404 tipo inexistente,
409 revisión o petición en conflicto, 422 datos inválidos/duplicados y 503
operación incierta. No registrar cuerpos, credenciales ni tokens.

## 4. Panel web

Separar presentación, aplicación y gateway siguiendo la estructura actual:

- Dominio: tipos de contenido y entidad de catálogo; `EventContent.typeId` es
  string o null, separado del tipo de participación/inscripción existente.
- Infraestructura: parsers estrictos de catálogo y referencia; métodos del
  gateway para listar, crear y editar tipos, sin acceso directo a tablas.
- Aplicación: `useEventTypes` mantiene catálogo/selección en memoria y reutiliza
  `useWrite`. Tras guardar vuelve a leer el catálogo; conflictos conservan el
  formulario y ofrecen recarga explícita.
- Presentación: página `/events/types`, accesible desde «Tipos de evento» en
  Eventos, con listado y acciones para crear/editar. Reutilizar `EditorDialog`
  para foco, Escape, cierre con cambios y operación sin confirmar. Mostrar código
  fijo al editar y explicar que renombrar afecta a todos los eventos de ese tipo.
- Eventos carga su catálogo al entrar y ofrece selector «Tipo de evento» con
  «Sin tipo». El listado resuelve el nombre desde ese catálogo. Un fallo de carga
  impide guardar una selección incompleta y permite reintentar; no se presenta un
  fallo como catálogo vacío. Volver de Tipos a Eventos recarga ambas lecturas.

La edición mantiene la selección hasta guardar o descartar. `dirty` incorpora
`typeId`; guardar, recargar y abrir otro evento actualizan el formulario con la
referencia confirmada. El catálogo sigue disponible para consulta en cancelados,
pero el selector y el guardado permanecen deshabilitados.

## 5. Verificación y trazabilidad

| Criterios | Comprobaciones |
| --- | --- |
| CA-001, CA-002 | SQL/HTTP local de listado, creación, nombre normalizado, orden, duplicado, límites y rechazo de cambio de código; pruebas de validación Deno y parsers web. |
| CA-003, CA-004 | Crear/cambiar/quitar tipo, comprobar FK y revisión, omisión por cliente anterior, publicación sin tipo y consulta estudiantil con tipo/nombre vigente. |
| CA-005 | Cuentas sintéticas sin permiso, revocación, RPC protegidas, lectura pública de catálogo, rechazo de escritura directa y borradores ocultos. |
| CA-006 | Petición repetida crea una sola fila; UUID reutilizado con otro cuerpo y revisión antigua producen conflicto; Playwright conserva el formulario ante 409 y respuesta incierta. |
| CA-007 | Regresión backend pertinente, typecheck, pruebas, build y suite E2E completa del panel. |

Usar las utilidades `runtime.mjs`, que rechazan URLs remotas, y fixtures sintéticas.
La suite SQL usa transacción/rollback cuando corresponda. Los casos HTTP/E2E
crean contenido sintético identificable sin imprimir sesiones ni contraseñas.
Registrar resultados reales y límites en `verification.md`; no marcar tareas
completas por una prueba simulada o una infraestructura ausente.

Comandos previstos, ajustados únicamente según la ayuda de las herramientas:

```bash
node DuocMind/tools/scripts/local-ready.mjs
node DuocMind/tools/scripts/backend-tests.mjs
DuocMind/tools/node_modules/.bin/deno check --frozen --config DuocMind/supabase/functions/admin-api/deno.json DuocMind/supabase/functions/admin-api/index.ts
DuocMind/tools/node_modules/.bin/deno test --frozen --config DuocMind/supabase/functions/admin-api/deno.json DuocMind/supabase/functions/admin-api
npm --prefix admin-web run typecheck
npm --prefix admin-web test
npm --prefix admin-web run build
npm --prefix admin-web run test:e2e
```

Revisar advisors locales si están disponibles con la CLI instalada. Cuando una
herramienta o servicio no esté disponible, documentarlo y mantener pendiente la
comprobación correspondiente. No instalar componentes globales ni usar cuentas
remotas para sustituir las pruebas locales.

## 6. Riesgos, recuperación y entrega

- La sustitución de funciones SQL puede afectar otras operaciones: conservar
  las ramas actuales y ejecutar la regresión de tests, tips e inscripción.
- Un cambio de tipo no debe perderse desde un cliente anterior: distinguir
  explícitamente campo omitido y null, con prueba dedicada.
- Los códigos determinan estilos de Android: mantenerlos inmutables; los tipos
  nuevos usan el estilo neutro ya implementado, sin personalización nueva.
- Si falla una lectura posterior a guardar, no permitir una nueva creación
  accidental; conservar la identidad confirmada y ofrecer recarga.
- Recuperar mediante una migración correctiva que restaure contratos anteriores
  conservando catálogo y referencias. No borrar tipos, eventos ni sus intereses.
- La web nueva requiere primero la migración y API actualizadas. Documentar ese
  orden sin ejecutarlo en remoto en esta entrega.

Tras verificaciones satisfactorias, revisar el diff, registrar la evidencia y
publicar `feat/admin-event-types` con un PR hacia `dev`.
El PR describe comportamiento, migración, compatibilidad, pruebas y límites.
No integrar el PR ni modificar `dev` directamente.

## 7. Fuentes y aprobación

Fuentes: constitución 2.0.0, `admin-web/AGENTS.md`, specs 005/009, spec 012 aprobada,
migración de Hans `20261015120000_event_types.sql`, API y gateways existentes.
Referencia de seguridad para implementar: [RLS de Supabase](https://supabase.com/docs/guides/database/postgres/row-level-security).

Aprobado explícitamente por el usuario el 2026-10-15 mediante «el plan está bien».
La aprobación de las tareas se registra por separado antes de implementar.

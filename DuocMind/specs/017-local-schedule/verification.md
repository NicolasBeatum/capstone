# Verificación 017 — Horario y semestres solo en el dispositivo

Rama: `feature/horario-local`. Resultados del 2026-11-06. Las pruebas usaron Supabase
local y datos sintéticos. La migración se aplicó en producción con autorización
explícita del usuario: «aplica la migracion a produccion».

## Comandos y resultados

| Comando | Resultado |
| --- | --- |
| `npm run typecheck` | Correcto. |
| `npm test` | 322 pruebas correctas (la línea base era 319). |
| `node --test tools/tests/*.test.mjs` | 7 pruebas correctas. |
| `supabase db reset --db-url "$DB_URL?sslmode=disable"` | 31 migraciones aplicadas. Catálogo: 0 tablas de horario, 0 esquemas `schedule_private`, 0 RPC, 30 tablas en `public`. |
| `npm --prefix tools run test:backend` | Suite completa correcta, incluido `planner-removal`. |
| `npm --prefix tools run test:planner` | Recorrido Chromium completo y correcto en `http://localhost:8091`. |

## Criterios de aceptación

| ID | Estado | Evidencia |
| --- | --- | --- |
| CA-001 | Parcial | Servicio, almacén y recorrido web con el backend cortado. Falta Android (T010). |
| CA-002 | Correcto | `PlannerService` no recibe gateway remoto; el recorrido web exige cero llamadas a las RPC de horario. |
| CA-003 | Correcto | `plannerStorage.test.mjs`: JSON dañado, actividad inválida y `schema: 1`, en SQLite real y web. |
| CA-004 | Correcto | `plannerStorage.test.mjs`: edición inválida, cuota, fallo de lectura y clave incorrecta. |
| CA-005 | Correcto | Búsqueda sin textos de sincronización en agenda, inicio y planner; recorrido web. |
| CA-006 | Correcto | `plannerService.test.mjs`: `user_not_found`, error de red, otro error, sin sesión y sesión cambiada. |
| CA-007 | Correcto | Verificado en local y en producción (ver abajo). |
| CA-008 | Correcto | Comandos de la tabla anterior. |

## Observaciones del entorno

- `supabase migration new` espera la entrada estándar si no hay terminal; se ejecuta
  con `</dev/null`.
- `db reset --db-url` exige `sslmode=disable` en el stack local.
- Tras ese reinicio, `cron.mjs` falló hasta reiniciar el contenedor de la base. No se
  determinó la causa exacta; `pg_cron` figuraba activo antes de reiniciar.
- `event-types-api.mjs` devuelve 503 si no corre `npm --prefix tools run local:serve`.
- `tools/.local/planner-demo.mjs`, ignorado por Git, todavía llama a
  `load_personal_schedule`: crea la cuenta de demostración y luego falla.

## Producción

Proyecto `ashgvanzjeaeekpygqgy`, 2026-11-06.

| Comprobación | Resultado |
| --- | --- |
| `supabase db push --linked --dry-run` | Solo `20261106234631_remove_personal_schedule.sql`. |
| `supabase db push --linked --yes` | Aplicada. |
| Consulta de catálogo | 0 tablas de horario, 0 esquemas `schedule_private`, 0 RPC, 30 tablas en `public`, 8 usuarios y 6 estudiantes. |
| `supabase migration list --linked` | 31 migraciones, sin diferencias entre local y remoto. |
| `supabase db diff --linked` | **No queda vacío.** No menciona objetos del horario. |

El diff restante afecta a la secuencia de `tipo_evento_academico`, a las funciones
`get_student_events`, `herramientas_home` y `set_updated_at`, y a sus permisos. Esta
migración no toca esos objetos y el diff no se aplicó. Por eso T011 sigue abierta.

## Ajustes posteriores

Retiro de la recuperación y vista semanal, 2026-11-06:

| Comando | Resultado |
| --- | --- |
| `npm run typecheck` | Correcto. |
| `npm test` | 317 pruebas correctas. Bajan porque se retiran las del almacén antiguo. |
| `npm --prefix tools run test:planner` | Recorrido completo y correcto. |
| `npm --prefix tools run test:student-events` | Recorrido completo y correcto. |

Comprobación manual en la previsualización a 412 px: la pestaña Semana agrupa las clases
por día, y tocar una clase abre el formulario de ese bloque con sus datos.

Tras alinear la estética con la agenda se repitieron `typecheck`, `npm test` (317),
`test:planner` y `test:student-events`, todos correctos, y se revisaron las pestañas
Semana y Ramos a 412 px. El recorrido real en Android sigue pendiente.

Tras sacar la tarjeta de la agenda, agregar la tuerca y cambiar el aviso sin conexión se
repitieron `typecheck`, `npm test` (317), `test:planner` y `test:student-events`, todos
correctos, y se revisó la agenda a 412 px. El aviso nuevo sin conexión no se vio en pantalla.

Rediseño del formulario de actividades, con hora de 24 horas: `typecheck`, `npm test` (318), `test:planner` y
`test:student-events` correctos, y revisión de la hoja a 412 px antes de cambiar las filas de hora. Falta probarla en Android,
incluido el teclado sobre la hoja.

Calendario mensual: `typecheck`, `npm test` (319) y `test:planner` correctos, con revisión
de la captura `tools/.local/planner/activity-month-calendar.png`.

## Pendiente

- T010: validación Android. El usuario informó que hoy no tiene dispositivo ni emulador.
- T011: revisar el diff residual, ajeno al horario, para que quede vacío.

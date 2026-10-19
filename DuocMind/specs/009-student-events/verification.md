# Verificación 009 — Eventos y agenda personal

Fecha de inicio: 2026-10-11. Spec 0.1.2, plan 0.1.0 y tareas 0.1.0 aprobados.
Rama: `feature/eventos-horario`, creada desde `dev`. Implementación y pruebas con datos sintéticos/backend local; aplicación cloud posterior autorizada al final de este documento.

## T001 — Preparación

- Node 24.16.0 y npm 11.13.0 disponibles; dependencias de app/tools existentes y
  `npm ci --ignore-scripts` en admin-web completado desde el lockfile.
- App: `npm run typecheck` aprobado. Primer `npm test` dentro del sandbox bloquea
  `spawnSync` en androidRelease (EPERM); se verifica fuera del sandbox sin modificar pruebas.
- Panel: `npm run typecheck`, `npm test` y `npm run build` aprobados en la línea base.
  Vite informa avisos existentes de directivas React Router y tamaño de chunk.
- Docker 29.8.1 accesible por `/var/run/docker.sock`; el contexto de Docker Desktop
  configurado en el host apunta a un socket inexistente. No se modifican contenedores ajenos.
- `adb` no está disponible en PATH; evidencia Android pendiente. La web no sustituye esa prueba.
- CLI Supabase y Deno del proyecto disponibles; se consultó `--help` para migraciones.
- Se revisaron changelog y guías oficiales de Supabase; no se utiliza Realtime ni
  se cambia el backend remoto. Las nuevas RPC declaran grants explícitos.

## Evidencia de implementación

Se añadirá por tarea al completar sus cambios y verificaciones. Ninguna
comprobación pendiente se considera superada.

La repetición autorizada de `npm test` fuera del sandbox aprobó las 104 pruebas actuales. T001 completa como preparación; backend local se está iniciando y Android sigue pendiente.

## T002 — Dominio

Tipos, contratos, estados y calendario implementados; `typecheck` y cinco pruebas nuevas aprobados. Incluyen límites exactos, URLs, cancelación, medianoche, DST, duplicados y cambios pendientes.

Docker local usa puertos alternativos 553xx durante la verificación para no interferir con otro proyecto. El config original se restaurará al finalizar; no se alteran contenedores ajenos.

## T003–T004 — Backend

Migraciones nuevas verificadas en la base local. Pruebas de inscripción, catálogo (>1000 eventos), contenido y transacciones aprobadas. RPC invoker/grants/RLS comprobados, Deno check/test aprobados y advisors sin issues. La verificación de reconstrucción limpia y HTTP queda en T015.

## T005 — Panel

Tipos/pruebas/build aprobados y 3 recorridos Playwright de Eventos aprobados, incluido borrador incompleto, inscripción, cierre y reapertura.

## T006 — Persistencia compartida/web

Tipos y 3 pruebas de almacenamiento aprobados: deduplicación, aislamiento, recarga, cuota, corrupción, versiones y retirada antes de actualización tardía.

## T007–T010 — Servicios personales

Almacén nativo, limpieza, coordinación de sesión, casos de uso y hook de actualización implementados; comprobación de tipos aprobada. Dos pruebas de sesión y tres de servicio aprobadas. T007/T008 conservan pendiente su comprobación nativa de cifrado y eliminación; no se marcan completas con evidencia web.


## T010–T014 — Presentación y agenda

- Hooks con reloj de 30 s y catálogo de 60 s solo enfocados/activos, limpieza de
  temporizadores y recuperación de conexión. La suscripción de identidad se
  conserva mientras la pantalla está montada para vaciar también vistas ocultas.
- Prueba controlada de polling aprobada; pruebas de servicios cubren descarga
  diferida tras cambio de cuenta, fallo de enlace, versión obsoleta y consulta
  individual que conserva el catálogo. Persistencia serializa también lecturas;
  pruebas cubren eliminación parcial/reintento y tarjeta retirada del catálogo.
- El acceso local usa la identidad de la sesión persistida cuando no hay conexión
  o falla la renovación por transporte, incluyendo tokens vencidos. No autoriza
  RPC remotas ni guarda tokens nuevos. La clave de almacenamiento de Auth se
  declara explícitamente conservando la convención existente del SDK instalado.
- `agendaItems.test.mjs`: 3 pruebas aprobadas de coincidencia/orden por ID,
  duración real, continuación, medianoche exclusiva, finalizados, cancelados,
  ausencia y cambios pendientes/aceptados. Las actividades heredadas permanecen
  separadas; su filtrado y almacenamiento originales se conservan.
- `student-events-e2e.mjs` aprobado sobre el código final con backend local:
  Inicio/Bienestar → Eventos, descripción/lugar, agregar/ver fecha/quitar,
  actividad personal coincidente, error de escritura sin falso éxito,
  reprogramación sin duplicar, filtros Próximos/Anteriores/Por fecha, meses
  consecutivos, fecha vacía, vuelta al calendario, varios días, estados en curso/
  finalizado/cancelado y copias históricas guardadas, ID inválido, revalidación y
  apertura externa interceptada con formulario sintético, caché/retirada offline
  con token vencido, dos cuentas y conservación de intereses al regresar.
- Chromium con `reducedMotion: reduce`; objetivos y nombres accesibles comprobados
  por Playwright. Cabecera revisada visualmente a 360 px y 320 px; esta última
  con tamaños/alturas de texto multiplicados por 1,5 en CSS. Calendario/campana
  mantienen objetivos 44 × 44 sin superposición; bienvenida tras login conserva
  saludo y destino. Esto no acredita escalado del sistema ni lector Android.
- Capturas locales ignoradas en `tools/.local/student-events/`: `home-360.png`,
  `home-320-enlarged.png`, `agenda.png`, `calendar.png`, `detail.png`.

## T015–T016 — Integración y entrega

| Comprobación | Resultado |
| --- | --- |
| App `npm run typecheck` | Aprobado |
| App `npm test` | 126 pruebas aprobadas, 0 fallos |
| Panel `npm run typecheck`, `npm test`, `npm run build` | Aprobados; 8 pruebas unitarias; avisos de React Router/chunk existentes |
| Backend local | Suite completa aprobada sobre reconstrucción limpia; incluye condiciones, catálogo de 1002 filas y reversión transaccional |
| Panel Playwright | 26 recorridos aprobados; ejecución final secuencial con backend registrada en logs locales |
| Deno check y recovery_test | Aprobados; 1 prueba Deno |
| Advisors local | Sin issues |
| Supabase `db reset --local --no-seed` | Reconstrucción desde las migraciones versionadas aprobada |
| Reversión local | Contratos administrativos anteriores conservan condiciones; revocar RPC y restaurar dentro de transacción aprobado |
| Android development build/dispositivo | Pendiente; `adb`/SDK no disponibles en este entorno |

La base local anterior solo tenía migraciones hasta administración 005. La
primera suite completa detectó la columna emocional faltante; se aplicaron las
migraciones existentes y después se reconstruyó el entorno desde cero. No se
cambiaron las migraciones de otros incrementos ni se modificó el backend remoto.
Las pruebas de recuperación tenían el puerto 54324 fijo; ahora usan el buzón
local de `runtime.json` y validan localhost, permitiendo los puertos alternativos
sin depender de otro proyecto.

Antes del reset se guardó un `pg_dump` privado del entorno sintético en
`tools/.local/events-before-clean-reset.sql`. El ensayo de reversión usa rollback:
no elimina columnas, eventos, condiciones ni almacenes de intereses. La
reconstrucción/fixtures y logs permanecen en directorios ignorados, sin incluir
credenciales en documentación o commits.

### Trazabilidad y límites

| Criterio | Evidencia disponible | Pendiente |
| --- | --- | --- |
| CA-001 | Recorrido Inicio/Bienestar y contenido; cabecera estrecha/CSS ampliado | Android y lector de pantalla |
| CA-002 | SQL/API/contratos/Playwright administrativos; compatibilidad/reversión | Recorrido completo autenticado cloud |
| CA-003 | Dominio con reloj controlado, polling y estados en preview | Reloj/primer plano Android |
| CA-004 | Servicios con revalidación/cambio de cuenta/cierre y enlace externo interceptado | Apertura Android |
| CA-005–CA-006 | Persistencia, composición, deduplicación, coincidencia, error y recorrido quitar/regresar | Reinicio/persistencia nativa |
| CA-007 | Dominio, composición y calendario: cambios, ausencia, medianoche, DST, cancelados/finalizados | Confirmación Android |
| CA-008 | Preview offline y token vencido; gateway/persistencia con fallos | SQLCipher offline y reinicio Android |
| CA-009 | Cuentas/operaciones diferidas y eliminación parcial; aislamiento preview | Cifrado, archivo/clave eliminados y cambio de cuenta Android |
| CA-010 | Tipos/pruebas/build/backend/advisors/Deno/recorridos | Accesibilidad y regresión Android |
| CA-011 | Selección, dots, fechas vacías, meses y vuelta desde detalle | Calendario Android |

La implementación está disponible en la rama de trabajo y la spec sigue abierta.
T007, T008, T012 y T015 conservan comprobaciones nativas pendientes. No hay
commit, push ni despliegue de aplicación. Las migraciones cloud posteriores se registran a continuación. Para cerrar el
incremento se debe ejecutar T015 con development build SQLCipher y cuentas
sintéticas, incluyendo lectura sin clave fallida, lectura/escritura offline,
reinicio, texto ampliado del sistema, lector de pantalla y eliminación local.

La ejecución final secuencial de backend (incluido `event-rollback`) y los 26
recorridos administrativos aprobó. Se detuvieron únicamente los servidores de
previsualización/API iniciados para esta tarea y la instancia sintética
`duocmind-admin-local`, conservando sus datos. Se restauró el `config.toml`
original: los puertos temporales 553xx no forman parte del cambio entregado.
`git diff --check` aprobado; revisión de fuentes nuevas sin credenciales reales
ni créditos de herramientas. Los pendientes Android mantienen abierta la spec.


## Aplicación cloud autorizada — 2026-10-11

La persona responsable solicitó conectar la previsualización a su entorno cloud
existente y autorizó explícitamente aplicar las dos migraciones de Eventos.
Proyecto: `ashgvanzjeaeekpygqgy`. No se aplicaron otras migraciones pendientes.

- Inventario previo: tabla institucional y RPC administrativas presentes; sin
  columnas de inscripción ni RPC del catálogo. Respaldo privado de definiciones,
  ACL y políticas en `tools/.local/events-cloud-schema-before.json`, ignorado y
  protegido; sin copiar filas de usuarios, eventos ni respuestas emocionales.
- Migraciones aplicadas mediante MCP: `20261011200847_student_event_registration`
  y `20261011200855_student_event_catalog`. El proveedor asignó estas versiones;
  se sincronizaron los nombres de los dos archivos SQL locales con el historial
  remoto, conservando exactamente su contenido verificado en local.
- Verificación posterior: cuatro columnas, trigger de validación, RPC disponible,
  RLS activa, `SECURITY INVOKER`, permiso de ejecución para `authenticated` y
  ausencia de permiso para `anon`. Se conservaron los dos eventos existentes.
- Consulta transaccional con `SET LOCAL ROLE authenticated`: arreglo de dos
  eventos visibles y `serverTime` presente; rollback sin escrituras.
- Advisors de seguridad: ningún aviso relativo a las nuevas columnas/RPC. Se
  observan tres avisos informativos por tablas privadas con RLS sin políticas y
  un aviso Auth por protección contra contraseñas filtradas desactivada. No se
  modificó esa configuración. Referencia del aviso Auth:
  https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
- La previsualización de `http://localhost:8089` utiliza el `.env` cloud existente
  y la clave publicable; health de Auth respondió HTTP 200. No se crean cuentas
  ni eventos sintéticos en la nube, ni se despliega la aplicación o la Edge Function.
- Las comprobaciones nativas pendientes y el estado abierto de la spec se mantienen.


## Preparación del PR — 2026-10-12

La persona responsable autorizó crear el commit, publicar `feature/eventos-horario`
y abrir un PR hacia `dev`. La base coincide con `origin/dev` al comprobarla.
Se mantiene el PR en borrador mientras estén pendientes las comprobaciones nativas.

Verificación antes de publicar:

- `npm --prefix DuocMind run typecheck`: aprobado.
- `npm --prefix DuocMind test`: 126 pruebas aprobadas, cero fallos.
- `npm --prefix admin-web run typecheck`: aprobado.
- `npm --prefix admin-web test`: tres archivos de pruebas aprobados, cero fallos.
- `npm --prefix admin-web run build`: aprobado; conserva avisos de React Router
  y del tamaño del bundle ya registrados.
- `node --check DuocMind/tools/scripts/student-events-preview.mjs`: aprobado.
- `git diff --check`: aprobado. Archivos `.env`, `.local`, respaldos privados y
  credenciales excluidos del commit.
- Backend, Deno, 26 recorridos administrativos y recorrido estudiantil local:
  se conserva la evidencia previa; no se repiten porque no cambió su código desde
  esa verificación. El ajuste posterior de nombres de migración conserva su SQL.

El código del panel/Edge Function acepta las nuevas condiciones, pero `admin-api`
no se ha desplegado en cloud. Se necesita desplegar su versión actualizada antes
  de utilizar el editor nuevo de inscripciones contra la nube. Este PR no autoriza
  ese despliegue ni integra los cambios en `dev`.

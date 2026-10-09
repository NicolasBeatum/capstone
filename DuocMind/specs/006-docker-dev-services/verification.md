# Verificación 006 — Entornos Docker independientes

Fecha: 2026-10-08. Rama: `chore/docker-dev-services`, desde `dev` (`84b88a9`).
Spec y plan 0.1.0 aprobados por la solicitud de implementar la propuesta concreta.
Implementación Docker verificada; incremento abierto por la prueba Android.

## Entorno y comandos

- Host: Node 24.16.0 y npm 11.13.0. Imágenes: Node 24.21.0 bookworm slim,
  usuario `node` (UID 1000). Sin cambios de dependencias o lockfiles.
- Docker Engine 29.8.1, Compose 5.5.1; contexto `default`. El contexto seleccionado
  `desktop-linux` no tenía daemon disponible; no se cambió el contexto global.
- NicoThings ocupaba 8081 y los puertos Supabase 543xx. No se detuvo ni modificó.
  Se agregó `MOBILE_WEB_PORT` y se verificó Expo raíz en 18081 (8081 por defecto).

Comandos principales ejecutados desde la raíz:

```bash
node --test DuocMind/tools/tests/*.test.mjs
docker --context default compose config --quiet
docker --context default compose -f DuocMind/compose.yaml config --quiet
docker --context default compose --parallel 1 build
MOBILE_WEB_PORT=18081 docker --context default compose up --build -d
docker --context default compose exec -T mobile npm ls --depth=0
docker --context default compose exec -T admin npm ls --depth=0
docker --context default compose restart admin
docker --context default compose stop mobile
MOBILE_WEB_PORT=18081 docker --context default compose up -d mobile
docker --context default compose stop admin
MOBILE_WEB_PORT=18081 docker --context default compose up -d admin
MOBILE_WEB_PORT=18081 docker --context default compose up -d --force-recreate
npm --prefix DuocMind run typecheck
npm --prefix DuocMind test
npm --prefix admin-web run typecheck
npm --prefix admin-web test
npm --prefix admin-web run build
```

Los procesos hijos Node del test nuevo inicialmente fueron bloqueados con EPERM
por el sandbox. La misma suite pasó al ejecutarse con permiso fuera del sandbox;
no se alteraron pruebas para ocultar el fallo. Las operaciones con Docker y
HTTP también requirieron ese permiso en este equipo.

## Resultados por criterio

| Criterio | Evidencia | Resultado |
| --- | --- | --- |
| CA-001 | Ambos Compose válidos; ambas imágenes construidas; contenedores sin red confirmaron UID 1000 y ausencia de `.env`, archivos privados y herramientas locales. | Aprobado |
| CA-002 | HTTP 200 para Expo en 18081 y panel en 5173. Reiniciar admin conservó el StartedAt de mobile. Cada servicio continuó disponible al detener y arrancar el otro. | Aprobado |
| CA-003 | `capstone_mobile_node_modules` y `capstone_admin_node_modules` diferentes; npm ls completo antes y después de recrear ambos contenedores; nombres de volúmenes conservados. | Aprobado |
| CA-004 | URL y clave publicable del archivo administrativo generado comparadas con el `.env` sin imprimir valores; módulo Vite servido usa la URL cloud. Auth settings cloud respondió 200 y Expo mostró «Backend conectado». Sin sesión ni escrituras cloud. | Aprobado |
| CA-005 | Login administrativo y home de Expo visibles en navegador. Cambio temporal de un texto en cada proyecto apareció automáticamente; originales restaurados byte por byte y sin diff. Compose antiguo levantado en 18082 mediante override temporal respondió 200; luego se retiró conservando volúmenes. Regresiones locales aprobadas. | Aprobado |
| CA-006 | 7 pruebas: generación sin runtime/paquetes externos, compatibilidad anon, archivo ausente, proyecto incorrecto y rechazo de secret, service_role e inválida; configuración local preservada, salida sin claves, archivo remoto con modo 0600. Mounts de archivos requeridos no crean carpetas si falta el origen. | Aprobado |
| CA-007 | README contrastados con ejecución; YAML válido; comandos Docker del nuevo job CI aprobados localmente; tipos/tests/build y E2E aprobados. CI remoto todavía no ejecutado. | Aprobado localmente |
| CA-008 | Sin adb en PATH/rutas habituales ni APK de desarrollo local disponible. No hubo comprobación en dispositivo o emulador. | Pendiente |

## Regresiones locales y CI

- Tipos: aprobados en ambos proyectos.
- Tests existentes: 13 archivos de DuocMind y 3 administrativos aprobados.
- Generador remoto: 7/7 casos aprobados.
- Build administrativo: aprobado; conserva los avisos existentes de directivas
  `use client` y bundle superior a 500 kB. No se modificó código de producto.
- Playwright: 25/25 recorridos aprobados en 41 segundos.

Para Playwright se copió código a `/tmp/capstone-docker-006-local`, excluyendo
entornos reales, datos privados y dependencias; se enlazaron las dependencias
instaladas del host. Solo esa copia cambió el project_id a
`duocmind-admin-docker-006`, puertos Supabase a 554xx e inspector a 18083. Las
referencias del buzón en la copia de las pruebas se cambiaron a 55424, conservando
los escenarios y aserciones. No se modificaron esos archivos versionados.

En la copia se ejecutaron los scripts existentes `local-start`, `fixtures`,
`staff staff enable`, `local-serve`, `local-ready` y
`npm --prefix admin-web run test:e2e` con cuentas exclusivamente sintéticas.
Se detuvo admin Docker para liberar 5173 y luego se restauró en modo remoto.
La instancia temporal se detuvo con `supabase stop --project-id
duocmind-admin-docker-006`, con backup, sin `--all` ni eliminación de volúmenes.

CI incorpora las pruebas del generador, un job que valida ambos Compose y
construye las imágenes, y el Compose raíz en los filtros administrativos. No
requiere `.env` real ni arranca servicios cloud. No hubo commit, push, PR,
despliegue, migración ni cambio remoto; CI remoto no se acredita.

## Riesgos y estado de entrega

El build Docker de Expo informó **33 avisos de npm audit: 10 moderados, 22 altos
y 1 crítico**, usando el lockfile preexistente. El panel informó cero. Esta
entrega no actualiza paquetes ni constituye una revisión o corrección de esas
dependencias; los avisos requieren un incremento propio antes de considerar
esta base apta para producción o datos reales.

La configuración de origen se monta en modo lectura; el panel solo recibe el
generador y la configuración publicable necesarios, sin runtime ni fixtures.
Los README documentan lectura/escritura por UID 1000 y el reinicio tras cambiar
el `.env`. Docker continúa limitado al desarrollo y previsualización web.

T001–T007 completadas. T008 queda abierta: la evidencia está consolidada pero
falta validar Android. La spec no se declara cerrada. Los servicios cloud de
desarrollo quedan disponibles en 18081 y 5173, sin alterar NicoThings.

## Publicación de la rama

El 2026-10-09 el usuario autorizó publicar e integrar esta rama a dev mediante
PR y comprobar el workflow de APK del incremento 007. Se conservan e incluyen
los cambios Docker aprobados del 006. La integración está sujeta a checks y
protecciones de dev; no cierra la comprobación Android pendiente.

PR #16 integrado el 2026-10-09, commit ea91b4c452f3cdbead281122108f1e32cb3ca334.
Checks remotos del PR correctos: validate (36 s), docker (40 s) y admin
(3 min 3 s), runs 37878340224 y 37878340288. CI remoto queda acreditado; la
prueba Android del incremento 006 continúa pendiente.

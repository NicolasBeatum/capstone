# Plan 006 — Entornos Docker independientes con Supabase cloud

| Campo | Valor |
| --- | --- |
| Versión | 0.1.0 |
| Estado | APROBADO |
| Fecha | 2026-10-08 |
| Spec | `spec.md` 0.1.0, APROBADA |
| Aprobación | Solicitud «Implement the proposed plan», sobre la propuesta concreta revisada en la conversación. |
| Rama | `chore/docker-dev-services`, desde `dev` (`84b88a9`) |

## 1. Arquitectura

El Compose raíz construye `mobile` usando el Dockerfile actual de DuocMind y
`admin` usando uno nuevo en admin-web. Ambos usan `node:24.21.0-bookworm-slim`,
instalan desde sus lockfiles y ejecutan como `node`. No hay un servicio Node
adicional ni cambios de dependencias.

- **mobile:** código `DuocMind/` en `/app`, volumen `mobile_node_modules` en
  `/app/node_modules`, `npm ci --prefer-offline` seguido de Expo web en LAN dentro
  del contenedor, puerto host `127.0.0.1:8081`. Montar `.env` adicionalmente como
  archivo de solo lectura sin crear el origen si falta.
  El puerto host admite `MOBILE_WEB_PORT` (8081 por defecto). En este equipo,
  NicoThings ya ocupa 8081; verificar en 18081 sin detener ese proyecto.
- **admin:** código `admin-web/` en `/workspace/admin-web`, volumen
  `admin_node_modules` en su `node_modules`, `npm ci --prefer-offline` seguido de
  `npm run dev:remote -- --host 0.0.0.0 --port 5173 --strictPort`, puerto host
  `127.0.0.1:5173`. Montar solo el generador remoto y `DuocMind/.env` en las rutas
  relativas que espera su hook, como archivos de solo lectura. El hook genera
  `.env.remote.local` dentro de la carpeta administrativa ignorada por Git.

El generador remoto resuelve `projectRoot` con `import.meta.dirname` y `node:path`,
sin importar `runtime.mjs`, `pg` ni Supabase. Conserva la URL autorizada, aceptación
de clave publicable/anon legado y rechazo de claves privilegiadas. En ausencia
de archivo, informa del requisito sin imprimir valores ni un stack con datos.

Los Dockerfile excluyen entornos, dependencias, resultados y archivos privados de
herramientas. El Compose anterior permanece disponible con su volumen existente;
ambos flujos Expo no se ejecutan simultáneamente en 8081. Los scripts del panel
local no cambian; las suites locales se ejecutan con el servicio remoto detenido.

## 2. Trazabilidad y pruebas

| Requisitos / criterios | Decisión y tareas | Evidencia |
| --- | --- | --- |
| RF-001; CA-001–003 | Imágenes no privilegiadas, volúmenes por servicio; T003–T005 | Config/build, usuario, mounts, npm ls y reinicio/recreación. |
| RF-002; CA-004, CA-006 | Hook cloud autónomo; T002 y T005 | Pruebas temporales con configuración sintética; comparación de URL y comprobación Auth de solo lectura sin credenciales en logs. |
| RF-003; CA-002, CA-005 | Puertos locales y bind mounts; T004–T006 | Respuesta HTTP, navegador, recarga, Compose antiguo y regresiones existentes. |
| RF-004; CA-007 | Exclusiones, documentación y CI; T003, T006, T007 | Inspección de imágenes y comandos; workflow de configuración/build sin claves ni backend remoto. |
| CA-008 | Regresión Android; T008 | Dispositivo, development build, cuenta sintética y resultado. |

CI incorpora config y builds al workflow general, las pruebas del generador al
mismo workflow y el Compose raíz a los filtros del workflow administrativo.
No inicia el modo remoto ni proporciona configuración real en CI.

Checks existentes: tipos y tests de DuocMind; tipos, tests, build y Playwright de
admin-web con backend local, fixtures sintéticas y API local preparados mediante
los scripts existentes. Descubrir la CLI con `--help` antes de usarla. Los pasos
se ejecutan secuencialmente, una tarea por vez, conforme a las guías.

## 3. Operación, riesgos y reversión

Usar el contexto Docker `default` para verificar en este equipo; su daemon está
operativo, mientras el contexto seleccionado `desktop-linux` no lo está. No
cambiar el contexto global. Para otros equipos usar su contexto operativo.

Los archivos montados deben ser legibles por UID 1000, propietario `node` de la
imagen; este equipo usa ese UID. No cambiar permisos de secretos para resolver
errores. La generación remota solo escribe configuración publicable y mantiene
permisos privados. Una URL equivocada o clave privilegiada debe detener el hook.

El arranque instala dependencias y puede necesitar red. Un puerto ocupado debe
fallar en lugar de seleccionar silenciosamente otro. Las pruebas no operan datos
remotos. La falta de dispositivo/build Android mantiene T008 abierta; no se
presenta la previsualización como evidencia nativa.

Para revertir, detener los servicios del Compose raíz sin `--volumes` y revertir
los cambios de Git de esta rama. Las dependencias en los volúmenes son
reconstruibles; no se eliminan automáticamente volúmenes ni archivos de entorno.
No hay migraciones, despliegues ni cambios remotos que revertir.

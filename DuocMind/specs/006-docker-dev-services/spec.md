# Spec 006 — Entornos Docker independientes con Supabase cloud

| Campo | Valor |
| --- | --- |
| Versión | 0.1.0 |
| Estado | APROBADA; implementación abierta |
| Fecha | 2026-10-08 |
| Constitución | 2.0.0 |
| Aprobación | Solicitud «Implement the proposed plan», después de revisar el alcance y el plan propuestos en la conversación. |

## 1. Problema y resultado

Expo ya tiene un contenedor de desarrollo; el panel administrativo depende de
Node instalado en el equipo. El equipo necesita levantar ambos proyectos juntos
o por separado, sin mezclar sus dependencias y utilizando el Supabase cloud del
`DuocMind/.env` existente.

Esta spec se redactó inicialmente como propuesta en BORRADOR en la conversación.
El usuario confirmó administración remota por defecto y Expo exclusivamente como
previsualización web, y aprobó la propuesta antes de crear estos archivos o
implementar. La aprobación no acredita verificaciones pendientes.

## 2. Alcance

Incluye dos servicios de desarrollo, sus imágenes Node, código montado, volúmenes
independientes de dependencias, configuración cloud compartida, documentación y
verificación reproducible. Conserva el Compose antiguo de Expo y el desarrollo
local administrativo existente. No requiere instalar Node en el host para
arrancar los dos servicios.

No incluye un tercer servicio Node, builds Android dentro de Docker, workspaces,
actualizaciones de dependencias, cambios de producto, migraciones ni despliegues
o cambios remotos. Las pruebas automatizadas usan backend local y datos sintéticos.

## 3. Requisitos

- **RF-001 — Separación:** el Compose raíz DEBE definir `mobile` y `admin`,
  arrancables y reiniciables de forma independiente. Cada uno DEBE usar su
  lockfile y un volumen exclusivo de `node_modules`, sincronizado con `npm ci`
  antes de iniciar el servidor. El proceso DEBE ejecutarse sin privilegios.
- **RF-002 — Configuración cloud:** Expo DEBE leer su `.env` existente y el
  panel DEBE generar su configuración remota desde la misma URL y clave
  publicable. El generador DEBE conservar las validaciones existentes, no
  depender de paquetes de las herramientas del backend y fallar claramente
  ante configuración ausente o inválida. No se copian claves privilegiadas al
  cliente ni se imprimen claves en logs.
- **RF-003 — Desarrollo:** el código DEBE permitir recarga; los puertos DEBEN
  publicarse solo en la interfaz local: Expo en 8081 y administración en 5173.
  El Compose previo de Expo y el modo administrativo local DEBEN seguir válidos.
- **RF-004 — Reproducibilidad:** las imágenes DEBEN excluir configuración real,
  dependencias locales y archivos privados. CI DEBE validar el Compose y construir
  ambas imágenes sin conectarse al backend remoto. Los README DEBEN explicar
  arranque individual/conjunto, configuración, parada, reconstrucción y límites.

## 4. Criterios de aceptación

| Criterio | Resultado observable | Comprobación |
| --- | --- | --- |
| CA-001 | Compose válido e imágenes reproducibles desde lockfiles, con usuario no privilegiado. | `docker compose config --quiet`, build e inspección de usuario. |
| CA-002 | Ambos servidores responden juntos y por separado; reiniciar uno no interrumpe el otro. | HTTP/navegador y reinicio individual. |
| CA-003 | Dependencias aisladas, completas y conservadas al recrear los contenedores. | Inspección de mounts, `npm ls --depth=0`, recreación. |
| CA-004 | El panel y Expo usan la URL cloud del `.env`; solo se exporta configuración publicable. | Comprobación sin imprimir valores y disponibilidad Auth de solo lectura, sin sesión ni escrituras remotas. |
| CA-005 | Cambiar código se refleja en cada servidor; el flujo anterior permanece utilizable. | Comprobación de recarga, Compose antiguo y regresiones locales. |
| CA-006 | Configuración ausente, proyecto incorrecto y clave privilegiada se rechazan sin revelarla. | Pruebas del generador en directorios temporales sintéticos. |
| CA-007 | README y CI coinciden con los comandos realmente verificados. | Inspección, checks existentes y builds Docker. |
| CA-008 | La app existente conserva funcionamiento en Android. | Humo en development build con cuenta sintética, dispositivo/build y resultado registrados. |

## 5. Límites y cierre

Docker sirve previsualizaciones de desarrollo; no acredita comportamiento nativo
ni offline. Red y daemon Docker son requisitos de instalación y construcción.
Puertos ocupados o archivos de configuración ausentes impiden el arranque con un
error verificable. No se arranca simultáneamente el Compose antiguo y el nuevo
Expo en el mismo puerto.

La spec permanece abierta hasta completar todos los criterios, incluida la
comprobación Android requerida por la constitución. Las tareas que carezcan de
evidencia siguen sin marcar.

# Spec 001 — Inicio del proyecto

| Campo | Valor |
| --- | --- |
| Versión | 0.3.0 |
| Estado | APROBADA — regularización histórica; implementación abierta |
| Fecha | 2026-09-09 |
| Última revisión | 2026-09-20 |
| Aprobación | 2026-09-20, posterior al commit |
| Incremento documentado | Commit `6043772` |
| Plataforma | Android; previsualización web de desarrollo |

## 1. Propósito

Dejar una base vacía de DuocMind que permita instalar dependencias, abrir una pantalla inicial con Expo y ejecutar la previsualización web en un contenedor de desarrollo. Este incremento documenta exclusivamente lo incorporado por el commit `6043772`. No acredita funcionalidades del producto, persistencia offline ni conexión a Supabase.

El código precede a esta versión de la spec, al plan y a las tareas. La excepción histórica se registra en `plan.md`; no implica que se haya seguido el orden habitual `spec.md → plan.md → tasks.md → implementación` ni que los artefactos hayan sido aprobados antes del commit. La aprobación actual valida el alcance del documento, no certifica que todos los criterios estén cumplidos.

## 2. Usuario y resultado esperado

Como integrante del equipo, quiero clonar el repositorio, instalar las dependencias fijadas y levantar la pantalla inicial localmente o con Docker para continuar el desarrollo desde una base común.

## 3. Alcance

### Incluido

- Proyecto administrado de Expo SDK 57 con Expo Router, React Native y TypeScript estricto.
- Una ruta inicial vacía en `src/app/` y configuración para Android y previsualización web del mismo proyecto.
- Node.js 24, npm 11, dependencias exactas y `package-lock.json` versionado.
- Scripts `start`, `android`, `web` y `typecheck`.
- Dockerfile y Compose para ejecutar el servidor de desarrollo web; reglas de exclusión para artefactos y archivos de entorno.
- Instrucciones básicas de ejecución local y con Docker en `README.md`.

### Fuera de este incremento

- Carpetas `features/` y `shared/`, casos de uso, repositorios y adaptadores.
- Supabase, SQLite, SecureStore, conectividad, SQLCipher, EAS y datos de usuarios.
- Autenticación, agenda, emociones, recursos, sincronización y cualquier funcionalidad de negocio.
- Scripts de lint, formato, pruebas, doctor y validación completa; GitHub Actions y protecciones de ramas.
- Publicación de Android o web. Docker es solo una herramienta de desarrollo; no produce APK ni valida comportamiento nativo.

Estos temas requieren especificaciones y verificaciones posteriores. La constitución sigue vigente y esta spec no se considera cerrada por reducir su alcance.

## 4. Requisitos

### RF-001 — Scaffold

1. El proyecto DEBE declarar Expo SDK 57, Expo Router, React Native y TypeScript con `strict: true`.
2. `src/app/_layout.tsx` DEBE componer la navegación y `src/app/index.tsx` DEBE mostrar la pantalla inicial sin acceso a datos ni reglas de negocio.
3. La configuración DEBE declarar Android como producto objetivo y web como previsualización del mismo proyecto, sin aplicación web independiente.
4. La creación del scaffold NO DEBE reemplazar `AGENTS.md`, `docs/` ni `specs/`.

### RF-002 — Entorno y dependencias

1. `.nvmrc`, `package.json` y `.npmrc` DEBEN fijar Node 24, npm 11 y la instalación de versiones exactas.
2. `package-lock.json` DEBE versionarse y permitir una instalación limpia mediante `npm ci`.
3. Los scripts declarados DEBEN iniciar Expo, Android, web y la verificación de tipos sin requerir herramientas npm globales.

### RF-003 — Docker de desarrollo

1. La imagen DEBE usar Node 24, instalar con `npm ci` y ejecutar el proceso como usuario no privilegiado.
2. Compose DEBE construir la imagen local, exponer el puerto 8081 y permitir desarrollo con el código montado.
3. `.dockerignore` DEBE excluir dependencias locales, artefactos, Git y archivos de entorno.
4. La ejecución en Docker DEBE servir la previsualización web en `http://localhost:8081`; no se presentará como build Android ni despliegue de producción.

### RF-004 — Documentación

`README.md` DEBE indicar los comandos de instalación y arranque local, el comando de Compose, la URL de previsualización y el límite de Docker para Android.

## 5. Criterios de aceptación y comprobación

| Criterio | Resultado observable | Comprobación |
| --- | --- | --- |
| CA-001 | Expo SDK 57, Router, Android, web y TypeScript estricto están declarados; la ruta inicial muestra «DuocMind». | Inspección de configuración y rutas; `EXPO_NO_TELEMETRY=1 npx expo config --json`; `npm run typecheck`. |
| CA-002 | Las dependencias del lockfile se instalan limpiamente con Node 24 y npm 11. | `node --version`, `npm --version`, `npm ci` y `npm ls --depth=0`. |
| CA-003 | La configuración de Compose es válida y la imagen se construye con el Dockerfile versionado. | `docker compose config --quiet` y `docker compose build`. |
| CA-004 | La pantalla inicial se puede abrir en la previsualización web local y mediante Compose en el puerto 8081. | Arrancar cada servidor, solicitar `http://localhost:8081` y comprobar la pantalla en navegador. |
| CA-005 | El README describe comandos existentes y distingue Docker de la ejecución Android. | Comparar `README.md` con `package.json`, `compose.yaml` y `Dockerfile`. |
| CA-006 | El scaffold no incluye secretos ni datos reales; los archivos de entorno quedan excluidos del build y de Git. | Inspeccionar archivos versionados, `.gitignore` y `.dockerignore`. |
| CA-007 | La pantalla inicial abre en Android con datos sintéticos. | Prueba de humo en dispositivo o emulador, con entorno y resultado registrados. |

## 6. Casos límite y cierre

- Si falta red durante `npm ci` o la primera descarga de la imagen base, la instalación o el build puede fallar; no se afirma reproducibilidad hasta verificar ambos comandos.
- Si Docker no está disponible, CA-003 y la parte de Compose de CA-004 permanecen sin verificar.
- La previsualización web no prueba Expo Go, APK, persistencia ni uso offline.
- Una dependencia con aviso de seguridad requiere revisión antes de usar esta base para datos reales; este incremento no introduce datos.

La Spec 001 está aprobada como documento, pero su implementación permanece abierta hasta contar con evidencia de todos sus criterios y de las puertas aplicables de la constitución, incluida una comprobación Android y los controles de CI correspondientes. Las tareas comprobadas individualmente pueden marcarse sin presentar la spec completa como terminada.

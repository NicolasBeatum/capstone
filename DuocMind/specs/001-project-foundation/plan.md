# Plan 001 — Inicio del proyecto

| Campo | Valor |
| --- | --- |
| Versión | 0.1.0 |
| Estado | Registro histórico; sin aprobación previa a la implementación |
| Fecha | 2026-09-20 |
| Spec | `spec.md` versión 0.3.0 |
| Implementación documentada | `6043772` (`build: crear proyecto vacío y dockerizarlo`) |

## 1. Solución incorporada

- `package.json` usa `expo-router/entry`, Expo 57.0.22, React Native 0.86.3 y React 19.2.3. `app.json` declara Android y web; esta última es solo una previsualización de desarrollo. No hay código de dominio ni acceso a datos.
- `src/app/_layout.tsx` monta `Stack` y la barra de estado. `src/app/index.tsx` muestra «DuocMind» y «Proyecto vacío». `tsconfig.json` extiende la base de Expo, activa `strict` y declara el alias `@/*` hacia `src/*`. El alias no implica que existan aún `features/` o `shared/`.
- `.nvmrc` declara Node 24; `package.json` exige Node 24 y npm 11, y `.npmrc` exige cumplir los engines y guardar versiones exactas. `package-lock.json` fija el árbol instalable por `npm ci`. Los únicos scripts disponibles son `start`, `android`, `web` y `typecheck`.
- `Dockerfile` parte de Node 24.21.0 bookworm slim, instala con `npm ci` y ejecuta Expo como usuario `node`. `compose.yaml` expone 8081, monta el código y conserva `node_modules` en un volumen. `.dockerignore` excluye Git, dependencias, artefactos y archivos de entorno. Docker sirve la previsualización web; no compila ni verifica Android.
- `README.md` describe instalación, arranque local y arranque con Compose. No promete una funcionalidad del producto ni persistencia.

Las dependencias incluidas son la base de Expo Router, React Native y React Native Web, con paquetes de navegación, enlace, constantes y barra de estado requeridos por ese scaffold. Sus versiones están fijadas en el manifiesto y el lockfile para reducir variación entre instalaciones. El aviso de seguridad emitido durante el build Docker requiere revisión antes de incorporar datos reales; esta regularización no cambia dependencias ni equivale a una auditoría de licencias, seguridad o tamaño del bundle.

## 2. Trazabilidad y verificación

| Requisito | Criterio | Cambio del commit | Verificación específica |
| --- | --- | --- | --- |
| RF-001 | CA-001 | `app.json`, `tsconfig.json`, `src/app/` | Configuración Expo, inspección de rutas y `npm run typecheck`. |
| RF-002 | CA-002 | `.nvmrc`, `.npmrc`, `package.json`, `package-lock.json` | Versiones de Node/npm, `npm ci`, `npm ls --depth=0`. |
| RF-003 | CA-003 | `Dockerfile`, `compose.yaml`, `.dockerignore` | `docker compose config --quiet` y `docker compose build`. |
| RF-001, RF-003 | CA-004 | Ruta inicial y servidor Expo | Abrir la ruta con `npm run web` y con Compose; comprobar HTTP 200 y el texto visible. |
| RF-004 | CA-005 | `README.md` | Comparar instrucciones con scripts, configuración y ejecución observada. |
| RF-003 | CA-006 | `.gitignore`, `.dockerignore` y archivos versionados | Inspección de exclusiones y búsqueda de credenciales; no probar con datos reales. |
| RF-001 | CA-007 | Ruta inicial Android | Prueba de humo en dispositivo o emulador; registrar dispositivo, build y resultado. Pendiente. |

La prueba Android es indispensable antes de cerrar la spec. Tampoco se afirma que exista `npm run validate` o CI: ambos pertenecen a trabajo posterior y siguen siendo puertas generales de la constitución. La evidencia real de este incremento queda junto a cada checkbox en `tasks.md`.

## 3. Riesgos, límites y reversión

- La previsualización web y el contenedor no acreditan Expo Go, ejecución nativa, persistencia ni funcionamiento offline. No introducir datos personales o emocionales con esta base.
- `npm ci` dentro del build Docker informó 13 vulnerabilidades moderadas. Se registra el aviso sin actualizar paquetes a ciegas; cualquier actualización debe tener una spec o tarea propia y verificación.
- El bind mount de Compose está destinado al desarrollo. La imagen no contiene configuración de producción ni mecanismos de despliegue.
- No hay esquema, migraciones ni datos creados por este incremento. Para revertirlo, revertir `6043772` y la documentación de regularización mediante cambios Git revisables; eliminar los contenedores de desarrollo con `docker compose down` si estuvieran activos.

## 4. Excepción histórica acotada

La constitución exige aprobar spec, plan y tareas antes de implementar, y prohíbe justificarlos retrospectivamente. El usuario autorizó expresamente registrar una excepción para el commit ya existente `6043772`. Su alcance es solo describir ese commit y verificar sus partes; el responsable del registro es el mantenedor del repositorio que solicitó la regularización. El riesgo es confundir la documentación posterior con una aprobación previa. Se mitiga fechando la aprobación posterior de la spec, señalando la secuencia real y dejando sin marcar toda tarea sin prueba. La excepción vence el 2026-09-20 al completar esta regularización y no se extiende a otros commits ni a la siguiente spec.

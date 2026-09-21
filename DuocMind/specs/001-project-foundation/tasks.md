# Tareas 001 — Inicio del proyecto

| Campo | Valor |
| --- | --- |
| Estado | Registro histórico; Spec 001 aprobada con implementación abierta |
| Fecha de verificación | 2026-09-20 |
| Implementación original | Commit `6043772` |

Estos checkboxes registran código preexistente verificado durante la regularización autorizada en `plan.md`. No representan aprobaciones previas ni el flujo ordinario de implementación. Una tarea abierta no se considera terminada por la sola presencia del archivo.

- [x] **T001 — Fijar entorno y dependencias** (RF-002, CA-002). Incorporar `.nvmrc`, `.npmrc`, `package.json` y `package-lock.json` con Node 24, npm 11 y versiones exactas. **Verificación:** Node `v24.16.0`, npm `11.13.0`; `npm ci --no-audit --no-fund` instaló 629 paquetes; `npm ls --depth=0 --all=false` terminó sin dependencias faltantes.
- [x] **T002 — Crear scaffold y pantalla inicial** (RF-001, CA-001; depende de T001). Configurar Expo SDK 57, Expo Router, Android, web y TypeScript estricto; crear `src/app/_layout.tsx` y `src/app/index.tsx`. **Verificación:** `EXPO_NO_TELEMETRY=1 npx expo config --json` mostró SDK 57.0.0, Android y web; `npm run typecheck` pasó; la pantalla mostró «DuocMind» y «Proyecto vacío» en navegador. No se atribuyen carpetas de funcionalidades que aún no existen.
- [x] **T003 — Dockerizar el servidor de desarrollo** (RF-003, CA-003 y CA-006; depende de T001 y T002). Incorporar `Dockerfile`, `compose.yaml` y `.dockerignore` con Node 24, usuario `node`, instalación por lockfile y puerto 8081. **Verificación:** `docker compose config --quiet` y `docker compose build` pasaron; se inspeccionaron exclusiones de Git, dependencias y archivos de entorno. El build informó 13 avisos de seguridad moderados en dependencias; no se modificaron versiones.
- [x] **T004 — Comprobar previsualización web local y con Docker** (CA-004; depende de T002 y T003). Arrancar `npm run web` y `docker compose up -d` por separado. **Verificación:** el navegador mostró «DuocMind» y «Proyecto vacío» en ambos casos; Compose respondió HTTP 200 en `http://localhost:8081`. Los procesos de prueba se detuvieron con Ctrl+C y `docker compose down`.
- [x] **T005 — Documentar ejecución básica y revisar archivos públicos** (RF-004, CA-005 y CA-006; depende de T001–T004). Mantener `README.md` con `npm ci`, `npm run start`, `docker compose up --build`, URL 8081 y límite Android de Docker. **Verificación:** instrucciones comparadas con scripts y Compose; `git ls-files`, `.gitignore`, `.dockerignore` y una búsqueda de patrones de credenciales no mostraron secretos ni archivos de entorno versionados.
- [ ] **T006 — Verificar pantalla inicial en Android** (CA-007; depende de T002). Ejecutar una prueba de humo con Expo Go, dispositivo o emulador y datos sintéticos; registrar dispositivo, versión y resultado. **Pendiente:** no se hizo una ejecución Android y `adb` no está instalado en este entorno.

## Estado de cierre

La Spec 001 está aprobada como documento, pero CA-007 sigue pendiente y la implementación no está cerrada. Tampoco existe `npm run validate` ni evidencia de CI para satisfacer las puertas generales de la constitución. Esos controles no se presentan como trabajo realizado por `6043772`; su implementación se especificará en un incremento posterior.

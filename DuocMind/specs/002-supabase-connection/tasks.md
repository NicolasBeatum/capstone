# Tareas 002 — Conexión básica con Supabase

| Campo | Valor |
| --- | --- |
| Estado | APROBADAS para implementación por la solicitud del usuario de ejecutar el plan presentado |
| Fecha | 2026-09-20 |
| Spec | `spec.md` versión 0.1.0 |
| Plan | `plan.md` versión 0.1.0 |

Las tareas se ejecutan en orden. Cada checkbox se marca solo tras completar el cambio, pasar su verificación específica y confirmar que el repositorio sigue válido.

- [x] **T001 — Configurar dependencias y entorno** (RF-001, CA-001, CA-006). Instalar y fijar el cliente Supabase, el polyfill de URL y NetInfo; agregar `.env.example` ficticio y las instrucciones locales. **Verificación:** `npm ls --depth=0 --all=false` y `npm run typecheck` pasaron; `git check-ignore .env .env.local` confirmó la exclusión, `git ls-files` no mostró esos archivos y `git diff --check` pasó. El ejemplo contiene solo marcadores ficticios y las dependencias quedaron fijadas en el lockfile.
- [x] **T002 — Implementar la comprobación aislada** (RF-001, RF-002, RF-003; CA-001, CA-002, CA-003, CA-005). Validar configuración, construir el cliente sin sesiones, consultar salud, clasificar red y errores, y exponer el resultado mediante un caso de uso. **Verificación:** `npm test` pasó con configuración ausente o inválida sin solicitud, respuesta correcta, respuesta fallida, red ausente y transporte fallido controlados; `npm run typecheck` y `git diff --check` pasaron. La inspección no encontró logs ni mensajes que incluyan clave o respuesta remota.
- [x] **T003 — Mostrar estados y reintento en la pantalla inicial** (RF-002, RF-003; CA-003, CA-004, CA-005). Ejecutar la comprobación al abrir, presentar los cinco estados y permitir reintento sin resultados obsoletos. **Verificación:** en la previsualización web se observó «Falta configuración» sin `.env` y «Backend no disponible» con una clave ficticia, junto al botón «Reintentar»; se inspeccionó visualmente la pantalla y se pulsó el botón. `npm run typecheck`, `npm test` y `git diff --check` pasaron; la ruta no importa Supabase, NetInfo ni `fetch`.
- [x] **T004 — Confirmar el proyecto activo y verificar la conexión real** (CA-002, CA-006). Comprobar el estado de `Duocmind` y reactivarlo solo si es necesario; probar la solicitud real con su URL y clave publicable, sin publicar credenciales. **Verificación:** el proyecto ya figuraba `ACTIVE_HEALTHY`, por lo que no se ejecutó una reactivación. La solicitud `GET /auth/v1/health` devolvió HTTP 200 y `name: GoTrue`; la previsualización web mostró «Backend conectado». `git check-ignore .env` confirmó la exclusión y `git ls-files -- .env` no mostró el archivo; `npm run typecheck` y `npm test` pasaron.
- [ ] **T005 — Verificar Android y cerrar criterios** (CA-003, CA-004). Probar la pantalla y el reintento en dispositivo o emulador Android; registrar modelo o emulador, versión, red y resultado. **Avance:** `npx expo export --platform android --output-dir /tmp/duocmind-android-export` generó el bundle Android, pero no acredita ejecución nativa. **Pendiente:** `npm run android` falló con `spawn adb ENOENT`; no hay SDK Android, AVD, `/dev/kvm` ni dispositivo USB disponible en este entorno. La tarea y la spec siguen abiertas hasta una prueba Android real.

## Estado de cierre

La Spec 002 permanece abierta por T005. La prueba web, la consulta HTTP directa y la exportación del bundle no reemplazan la prueba Android.

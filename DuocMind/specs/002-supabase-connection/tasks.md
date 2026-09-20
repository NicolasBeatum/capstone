# Tareas 002 — Conexión básica con Supabase

| Campo | Valor |
| --- | --- |
| Estado | APROBADAS para implementación por la solicitud del usuario de ejecutar el plan presentado |
| Fecha | 2026-09-20 |
| Spec | `spec.md` versión 0.1.0 |
| Plan | `plan.md` versión 0.1.0 |

Las tareas se ejecutan en orden. Cada checkbox se marca solo tras completar el cambio, pasar su verificación específica y confirmar que el repositorio sigue válido.

- [x] **T001 — Configurar dependencias y entorno** (RF-001, CA-001, CA-006). Instalar y fijar el cliente Supabase, el polyfill de URL y NetInfo; agregar `.env.example` ficticio y las instrucciones locales. **Verificación:** `npm ls --depth=0 --all=false` y `npm run typecheck` pasaron; `git check-ignore .env .env.local` confirmó la exclusión, `git ls-files` no mostró esos archivos y `git diff --check` pasó. El ejemplo contiene solo marcadores ficticios y las dependencias quedaron fijadas en el lockfile.
- [ ] **T002 — Implementar la comprobación aislada** (RF-001, RF-002, RF-003; CA-001, CA-002, CA-003, CA-005). Validar configuración, construir el cliente sin sesiones, consultar salud, clasificar red y errores, y exponer el resultado mediante un caso de uso. **Verificación:** configuración ausente o mal formada sin solicitud; respuestas correctas, fallidas y de transporte controladas; `npm run typecheck` e inspección de errores/logs.
- [ ] **T003 — Mostrar estados y reintento en la pantalla inicial** (RF-002, RF-003; CA-003, CA-004, CA-005). Ejecutar la comprobación al abrir, presentar los cinco estados y permitir reintento sin resultados obsoletos. **Verificación:** recorrido controlado en web, inspección de importaciones y `npm run typecheck`.
- [ ] **T004 — Reactivar y verificar el proyecto de desarrollo** (CA-002, CA-006). Reactivar únicamente `Duocmind`, comprobar su estado y probar la solicitud real con su URL y clave publicable, sin publicar credenciales. **Verificación:** respuesta del endpoint de salud y pantalla web mostrando «Backend conectado»; registrar estado, entorno y resultado.
- [ ] **T005 — Verificar Android y cerrar criterios** (CA-003, CA-004). Probar la pantalla y el reintento en dispositivo o emulador Android; registrar modelo o emulador, versión, red y resultado. **Verificación:** prueba Android real y validaciones aplicables. Si no hay entorno Android disponible, dejar la tarea y la spec abiertas con la razón documentada.

## Estado de cierre

La Spec 002 permanece abierta hasta completar todas las tareas y verificaciones. La prueba web o la consulta HTTP directa no reemplazan la prueba Android.

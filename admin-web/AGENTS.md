# Guía del panel administrativo

Aplican la constitución y los artefactos de `../DuocMind/specs/005-admin-dashboard/`, junto con los principios de `../DuocMind/AGENTS.md`. Implementar una tarea por vez; no delegar ni paralelizar. La spec, el plan y las tareas 0.2.0 están aprobados.

Separar presentación, casos de uso y gateways. TypeScript estricto; validar contratos externos. No consultar tablas personales desde componentes. Configuración publicable únicamente; sesiones en `sessionStorage` y datos de alumnos solo en memoria. Secretos, credenciales y contexto emocional no se registran ni versionan.

Verificar con Supabase local y cuentas sintéticas. No usar cuentas remotas, desplegar ni modificar Android. `npm run typecheck`, `npm test`, `npm run build` y `npm run test:e2e` forman parte de la entrega. Marcar tareas completas solo con evidencia.

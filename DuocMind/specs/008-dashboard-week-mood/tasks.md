# Tareas — Gráfico semanal de ánimo con datos reales

**Plan:** `plan.md` (aprobado) · **Estado:** APROBADO
**Aprobación:** confirmada por el usuario el 2026-10-09, junto con la autorización para aplicar la migración en Supabase remoto (T007).

- [x] T001 Crear `domain/weekMood.ts` con `currentWeekRange` y `summarizeWeek`, y sus pruebas en `tests/weekMood.test.mjs` (6 pruebas aprobadas en las zonas America/Santiago, UTC y Pacific/Kiritimati).
- [x] T002 Aceptar un rango opcional en `CheckinRemoteGateway.list` y `loadCheckinHistory`, aplicarlo en `supabaseCheckinGateway` y probarlo en `tests/checkinHistory.test.mjs` (typecheck y 7 pruebas de historial aprobadas).
- [x] T003 Crear la migración `20261009120000_registro_emocional_realtime.sql` e implementar `supabaseCheckinRealtime.ts` con la interfaz `CheckinChangeFeed` (typecheck aprobado; la migración es idempotente y aún no se aplica en remoto, ver T007).
- [x] T004 Crear `hooks/useWeekMood.ts`: carga al enfocar, recarga en primer plano y suscripción Realtime con espera de 300 ms (typecheck aprobado; comportamiento en dispositivo queda en T008).
- [x] T005 Adaptar `WeekChart` a días sin ánimo, animación de altura con driver nativo y movimiento reducido, y etiquetas de accesibilidad (typecheck aprobado; duración en `motionDuration.chartBar`).
- [x] T006 Conectar `DashboardScreen` a `useWeekMood` y eliminar `SAMPLE_WEEK`; `npm run typecheck` y `npm test` en verde (104 pruebas aprobadas; bundle Android generado con `expo export --no-bytecode`).
- [ ] T007 Aplicar la migración en Supabase remoto (requiere autorización explícita) y verificar la publicación con SQL. Pendiente: este equipo no tiene Supabase CLI enlazado ni credenciales de administración; se aplica desde el SQL Editor del proyecto.
- [ ] T008 Validar en Android: actualización al volver al dashboard y en tiempo real desde otra sesión. Pendiente: no hay `adb` ni Android SDK en este equipo.

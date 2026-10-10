# Plan — Gráfico semanal de ánimo con datos reales

**Spec:** `spec.md` (aprobada) · **Estado:** APROBADO
**Aprobación:** confirmada por el usuario el 2026-10-09, junto con la autorización para aplicar la migración en Supabase remoto (T007).

## Decisiones técnicas

### Sin librería de gráficos nueva

Se evaluó ECharts (`echarts` + `@wuba/react-native-echarts` + un renderer SVG o Skia). Se descarta: añade cerca de 1 MB al bundle y una dependencia nativa para dibujar siete barras, y obligaría a rehacer un diseño que ya calza con la app. El componente actual `WeekChart` se conserva y se anima con `Animated` y el driver nativo, que es lo que evita que el gráfico "se pegue": la animación corre en el hilo de UI aunque JS esté ocupado.

### Tiempo real con Supabase Realtime

`@supabase/supabase-js` ya incluye el cliente Realtime (WebSocket); no se agrega dependencia. Se usa `postgres_changes` sobre `registro_emocional`:

- Evento `INSERT` con filtro `estudiante_id_estudiante=eq.<id propio>`. Realtime además valida la política RLS de lectura de cada suscriptor antes de entregar un evento.
- No se escuchan `DELETE` (no se pueden filtrar y entregan la clave primaria a todos los suscriptores de la tabla) ni `UPDATE` (el estudiante no tiene permiso de actualizar).
- El evento no se usa como dato: dispara una consulta normal, con espera de 300 ms para agrupar ráfagas. Así el gráfico siempre sale de la misma consulta y la outbox local.
- La suscripción vive solo mientras el dashboard está enfocado y la app en primer plano; se cierra al salir.

La tabla debe estar en la publicación `supabase_realtime`. Migración forward-only `20261009120000_registro_emocional_realtime.sql`, idempotente:

```sql
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'registro_emocional'
  ) then
    alter publication supabase_realtime add table public.registro_emocional;
  end if;
end $$;
```

### Consulta de la semana

- Semana = lunes 00:00 a lunes siguiente 00:00 en hora local; se envía a Supabase como rango ISO (`gte`/`lt` sobre `fecha_hora`), que usa el índice existente `registro_emocional_estudiante_fecha_idx`.
- El resumen por día se calcula en el cliente: los pendientes de la outbox local solo existen en el dispositivo, y el día depende de la zona horaria local. Son a lo más unas decenas de filas.
- Promedio de la escala por día; altura = promedio / 5; color = ánimo del promedio redondeado.

## Arquitectura

- `features/emotional-checkin/domain/weekMood.ts`: funciones puras `currentWeekRange(now)` y `summarizeWeek(entries, now)`. Sin React ni backend.
- `features/emotional-checkin/application/checkinHistory.ts`: `CheckinRemoteGateway.list` acepta un rango opcional; `loadCheckinHistory` recibe el mismo rango y filtra también la copia local. Se agrega la interfaz `CheckinChangeFeed`.
- `features/emotional-checkin/infrastructure/supabaseCheckinGateway.ts`: aplica el rango en la consulta.
- `features/emotional-checkin/infrastructure/supabaseCheckinRealtime.ts`: implementa `CheckinChangeFeed` con un canal Realtime y lo cierra con `removeChannel`.
- `features/emotional-checkin/hooks/useWeekMood.ts`: orquesta carga al enfocar, recarga al volver a primer plano (`AppState`) y suscripción Realtime. Devuelve los siete días. Sigue el patrón de `useStressTestLauncher`, que el dashboard ya consume.
- `shared/components/WeekChart.tsx`: acepta días sin ánimo, anima la barra con `translateY` dentro de una pista recortada (driver nativo, sin deformar los bordes redondeados) y agrega etiquetas de accesibilidad. Duración y curva salen de `motionTokens`.
- `features/dashboard/screens/DashboardScreen.tsx`: usa `useWeekMood` y elimina `SAMPLE_WEEK`.

## Estados

- Carga inicial: barras vacías que suben al llegar los datos; sin spinner dentro de la tarjeta.
- Sin sesión o sin perfil: barras vacías.
- Sin conexión: datos de la outbox local; la suscripción falla en silencio y se reintenta al volver a primer plano o al enfocar.
- Error de consulta remota: se muestran los datos locales.

## Riesgos y mitigaciones

- La migración no está aplicada en remoto: sin ella no llegan eventos, pero la recarga al enfocar y al volver a primer plano sigue funcionando. Aplicarla requiere autorización explícita.
- Cambio de día con el dashboard abierto: el rango se recalcula en cada carga.
- Conexiones Realtime: una por dispositivo con el dashboard abierto; se cierra al salir de la vista.
- Web no acredita el comportamiento Android; se valida en el APK.

## Pruebas y verificación

- `tests/weekMood.test.mjs`: límites lunes/domingo, promedio y redondeo, días vacíos y futuros, registros fuera de la semana ignorados. Fechas construidas en hora local para no depender de la zona del equipo.
- `tests/checkinHistory.test.mjs`: el rango se pasa al gateway remoto y filtra la copia local.
- Smoke SQL tras aplicar la migración: `select * from pg_publication_tables where tablename = 'registro_emocional'` devuelve una fila.
- Manual en Android: registrar un check-in y volver al dashboard; con el dashboard abierto, insertar un check-in propio desde la web y ver la barra subir.
- `npm run typecheck` y `npm test`.

## Reversión

- Cliente: revertir el commit; el gráfico vuelve a los datos de muestra.
- Base de datos: migración nueva con `alter publication supabase_realtime drop table public.registro_emocional;`. No toca datos.

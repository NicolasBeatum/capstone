# Spec — Gráfico semanal de ánimo con datos reales

**Estado:** APROBADA
**Aprobación:** confirmada por el usuario el 2026-10-09.
**Incremento:** 008-dashboard-week-mood

## Problema

La tarjeta "Vistazo de tu semana" del dashboard dibuja siete barras con datos de muestra fijos (`SAMPLE_WEEK`). El estudiante ya registra su ánimo diario en `registro_emocional` (incremento 004), pero el gráfico no lo refleja: muestra días con ánimo aunque no haya registros y no cambia al registrar uno nuevo.

## Alcance

- Reemplazar los datos de muestra del gráfico por los check-ins del estudiante autenticado en la semana actual (lunes a domingo, hora local del dispositivo).
- Leer los registros de Supabase filtrados por la semana y combinarlos con los pendientes de la outbox cifrada local, igual que el historial del incremento 004.
- Resumir cada día en un solo ánimo: el promedio de la escala (1 = Muy mal … 5 = Muy bien) de los check-ins de ese día. La altura de la barra sigue el promedio y el color el ánimo más cercano.
- Mostrar los días sin registro y los días futuros como barra vacía, sin inventar un ánimo.
- Actualizar el gráfico sin recargar la pantalla:
  - al volver al dashboard (por ejemplo, después de registrar un check-in);
  - al volver la app a primer plano;
  - en tiempo real cuando se inserta un registro propio desde otro dispositivo o sesión, mediante una suscripción WebSocket de Supabase Realtime.
- Animar el cambio de altura de las barras de forma suave, sin rebote y respetando "reducir movimiento".
- Dar a cada barra una etiqueta de accesibilidad con el día y el ánimo o "sin registro".

## Datos y privacidad

- No se crean tablas ni columnas. Se leen solo `fecha_hora` y el nombre del ánimo general de los registros propios, ya protegidos por RLS (`student reads own emotional records`).
- Realtime entrega cambios de una tabla solo a suscriptores que pasan su política RLS de lectura. La suscripción escucha únicamente inserciones filtradas por el `id_estudiante` propio. No se escuchan eliminaciones: Supabase no puede filtrarlas y entregaría la clave primaria de registros ajenos.
- El contenido de los eventos no se guarda ni se registra en logs; un evento solo provoca una nueva consulta.
- No se envían datos emocionales a terceros ni se muestran a otras personas.

## Criterios de aceptación

1. El dashboard no usa datos de muestra para el gráfico semanal.
2. Cada día de la semana actual muestra el ánimo promedio de los check-ins propios de ese día; un día sin check-ins se muestra vacío y se anuncia como "sin registro".
3. Los check-ins pendientes de sincronizar cuentan en el gráfico; sin conexión, el gráfico se construye con la copia local.
4. Después de registrar un check-in y volver al dashboard, la barra del día refleja el nuevo registro sin reiniciar la app.
5. Con el dashboard abierto, un check-in propio insertado desde otra sesión aparece en el gráfico en segundos, sin interacción.
6. Un estudiante no recibe eventos ni datos de registros de otro estudiante.
7. Las barras cambian de altura con una transición calmada; con movimiento reducido cambian sin animación.
8. Un error de red o de sesión no bloquea el dashboard: el gráfico muestra lo disponible localmente o queda vacío.
9. Las pruebas cubren el resumen diario, los límites de la semana y la combinación local/remota.

## Fuera de alcance

- La pantalla "Ver detalle", historiales de más de una semana y comparativas entre semanas.
- El texto de "insight" de la tarjeta, que habla de la agenda y sigue con datos de muestra.
- Eliminar en tiempo real un registro borrado desde otro dispositivo; se refleja al volver al dashboard o a primer plano.
- Librerías de gráficos nuevas: el gráfico conserva su diseño actual.

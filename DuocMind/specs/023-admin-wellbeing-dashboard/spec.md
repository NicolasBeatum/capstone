# Spec 023 — Dashboard de bienestar ampliado en el panel

| Campo | Valor |
| --- | --- |
| Versión | 0.2.0 |
| Estado | APROBADA |
| Fecha | 2026-11-15 |
| Incremento | 023-admin-wellbeing-dashboard |
| Plataformas | Panel web, Supabase |
| Depende de | Spec 016 (dashboard emocional) y spec 022 (consentimientos y borrado programado) |
| Aprobación | Nicolás Hernández, 2026-11-15, tras revisar el mockup. |

## 1. Problema y resultado esperado

La página Emociones (spec 016) solo muestra ánimo: participantes, promedio, distribución,
tendencia semanal y promedio por carrera. La app ya envía, con consentimiento, los motivos
de cada check-in y los resultados del test de estrés, pero el panel no los usa, y Bienestar
no puede ver patrones (días difíciles), comparar con el periodo anterior ni mirar
una carrera en particular.

Resultado observable: Bienestar abre un dashboard con pestañas que responde, sin
identificar a nadie:

1. ¿Cómo están los estudiantes y cómo cambió respecto al periodo anterior?
2. ¿Qué motivos pesan más, y cuáles se asocian a los días malos?
3. ¿Qué días de la semana concentran los peores registros?
4. ¿Cuántos estudiantes tienen estrés alto según el test, y en qué carreras?
5. ¿Cuántos estudiantes participan y comparten datos?

## 2. Reglas de privacidad (se mantienen y se extienden)

- Solo cuenta quien tiene `analitica_anonima` vigente y otorgado, y solo lo registrado
  después de otorgarlo (RF-009 y RF-010 de la spec 016). `contacto` por sí solo no cuenta.
- Lo que tenga solicitud de borrado (spec 022) no cuenta desde la solicitud.
- **k = 5**: toda celda, barra, punto o fila que se muestre debe reunir al menos 5
  estudiantes distintos. Lo que no llegue se devuelve sin valor y el panel lo muestra
  como «sin datos suficientes». Se aplica en el servidor.
- Las celdas pequeñas se agrupan («Otras carreras», «Otros motivos») con la misma regla
  anti-diferencia de la spec 016: si el grupo resto queda entre 1 y 4, absorbe la celda
  visible más pequeña.
- Ninguna respuesta incluye ids, nombres, correos, RUT ni filas individuales.
- El filtro por carrera solo ofrece carreras con al menos 5 participantes en el periodo.

## 3. Alcance

### Controles globales

- Periodo: 7, 30 o 90 días (como hoy) y **filtro por carrera** (todas o una carrera).
- Cada métrica principal muestra la **variación respecto al periodo anterior** de igual
  duración, solo si ambos periodos cumplen k = 5.

### Pestaña «Resumen»

- KPIs: participantes, check-ins, ánimo promedio (estado + número, RF-017 de la 016),
  % de check-ins «Mal» o «Muy mal», estudiantes que hicieron el test y % con estrés alto.
- Tendencia semanal del ánimo (línea) y distribución semanal apilada por emoción (100 %).
- Ánimo promedio por día de la semana (lunes a domingo, fecha de Santiago), con el centro
  en «Neutro».
- Tarjeta «Lo más mencionado»: los 3 motivos más frecuentes del periodo.

### Pestaña «Motivos»

- Ranking de motivos: % de check-ins que mencionan cada motivo.
- Ánimo promedio por motivo (barras divergentes alrededor de «Neutro»): qué motivos
  acompañan los días malos.
- Matriz motivo × emoción (% de cada emoción dentro de cada motivo).
- Tendencia semanal de los 3 motivos principales.

### Pestaña «Estrés» (test PSS-10 activo)

- Distribución por nivel (leve, moderado, severo, con las etiquetas del servidor).
- Puntaje promedio y % en nivel alto por semana.
- % en nivel alto y puntaje promedio por carrera.
- Cuenta la última aplicación de cada estudiante en el periodo, para no sobrerrepresentar
  a quien repite el test.

### Pestaña «Carreras»

- Tabla comparativa por carrera: participantes, ánimo promedio, % días difíciles,
  % estrés alto y motivo principal, ordenada alfabéticamente (no es un ranking).

### Pestaña «Participación»

- Estudiantes registrados, % con `analitica_anonima` activo, participantes activos por
  semana y check-ins por participante (promedio).
- Solo totales; nunca listas de quién comparte.

### Fuera de alcance

- Filas individuales, exportaciones, alertas o contacto desde el dashboard.
- Tests distintos del PSS-10 activo (quedan para otra spec).
- Fechas libres o combinaciones de más de una dimensión además de la carrera.
- Patrones por hora del día: la hora refleja cuándo se abre la app, no el ánimo, y el
  cruce día × franja casi nunca reúne 5 estudiantes por celda.
- Aplicar migraciones o desplegar en el proyecto remoto.

## 4. Requisitos no funcionales

- Los agregados se calculan en el servidor (`private.*` vía `admin_read`); el panel solo
  presenta lo recibido.
- Sin dependencias nuevas para gráficos (SVG propio, como la spec 016).
- Cada gráfico tiene alternativa en tabla accesible («Ver como tabla») y no depende solo
  del color.
- No se registran en logs datos emocionales ni consentimientos.
- La página carga cada pestaña por separado para no pedir todo de una vez.

## 5. Criterios de aceptación

| Id | Criterio | Verificación |
| --- | --- | --- |
| CA-001 | Ninguna celda, barra o punto con menos de 5 estudiantes trae valor | prueba backend |
| CA-002 | Con filtro de carrera solo se ofrecen carreras con 5 o más participantes | prueba backend |
| CA-003 | «Otros motivos» y «Otras carreras» no permiten deducir una celda por diferencia | prueba backend |
| CA-004 | Solo `contacto`, sin consentimiento o con solicitud de borrado: no cuenta | prueba backend |
| CA-005 | El test cuenta solo la última aplicación por estudiante en el periodo | prueba backend |
| CA-006 | La variación respecto al periodo anterior se omite si alguno no cumple k | prueba backend |
| CA-007 | Las respuestas no contienen identificadores | prueba backend |
| CA-008 | Sin sesión de administrador las rutas nuevas se rechazan | prueba backend |
| CA-009 | Cada pestaña muestra datos, el estado insuficiente y su tabla accesible | e2e |
| CA-010 | Typecheck, pruebas, build y e2e del panel en verde | comandos |

## 6. Decisiones

- Cinco pestañas: Resumen, Motivos, Estrés, Carreras y Participación. El ánimo por día de
  la semana va en Resumen.
- El filtro por carrera aplica a todas las pestañas.
- «Estrés alto» es el nivel con el puntaje mínimo más alto del PSS-10 activo (hoy
  «severo», 27–40).
- Supresión complementaria: si en una distribución que suma 100 % queda oculta una sola
  celda, también se oculta la menor de las visibles, para que no se deduzca por resta.
- Riesgo residual: combinar periodo y carrera puede revelar cambios pequeños. Mitigación:
  k = 5 por celda y agrupación anti-diferencia; si Bienestar necesita más protección, se
  limita la vista a semanas completas.

## Historial

| Versión | Fecha | Cambio |
| --- | --- | --- |
| 0.1.0 | 2026-11-15 | Borrador inicial |
| 0.2.0 | 2026-11-15 | Aprobada: sin pestaña Patrones (ánimo por día de la semana en Resumen), filtro por carrera global, estrés alto = nivel máximo del PSS-10 y supresión complementaria |

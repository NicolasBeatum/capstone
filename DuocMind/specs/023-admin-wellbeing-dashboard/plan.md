# Plan 023 — Dashboard de bienestar ampliado en el panel

| Campo | Valor |
| --- | --- |
| Versión | 0.1.0 |
| Estado | BORRADOR |
| Fecha | 2026-11-15 |
| Spec | 023 0.2.0 |
| Aprobación | Pendiente |

## 1. Arquitectura

| Capa | Archivo | Cambio |
| --- | --- | --- |
| Migración | `supabase/migrations/20261116120000_admin_wellbeing_dashboard.sql` | Base filtrada, funciones por pestaña, ruta `/wellbeing/*` en `admin_read`, capacidad `wellbeing` |
| Edge | `supabase/functions/admin-api/validation.ts` | Valida `days` y `careerId` en `/wellbeing/*`; se retira `/emotions` |
| Panel · dominio | `admin-web/src/domain/{types,wellbeing}.ts` | Tipos del contrato y cálculos puros (estado del ánimo, variación, formato) |
| Panel · infra | `admin-web/src/infrastructure/{contracts,adminGateway}.ts` | Validadores de cada pestaña y llamadas `GET /wellbeing/<pestaña>` |
| Panel · aplicación | `admin-web/src/application/useWellbeing.ts` | Periodo, carrera y pestaña; carga solo la pestaña visible y cachea en memoria por combinación |
| Panel · gráficos | `admin-web/src/components/charts/` | `LineChart`, `StackedBars`, `HBars`, `DivergingBars`, `Matrix`, `KpiTile`, `ChartTable`, patrón «sin datos» |
| Panel · página | `admin-web/src/pages/Wellbeing.tsx` + `pages/wellbeing/*Tab.tsx` | Controles, pestañas y las cinco vistas; reemplaza `Emotions.tsx` |
| Panel · navegación | `admin-web/src/application/App.tsx`, `NavigationIcon.tsx` | «Emociones» pasa a «Bienestar» en `/wellbeing`; `/emotions` redirige |
| Herramientas | `tools/tests/wellbeing.mjs`, `tools/scripts/wellbeing-demo.mjs` | Pruebas de backend y datos sintéticos locales para mirar el panel |

`private.emotion_dashboard` y la ruta `/emotions` se retiran al final, cuando la página nueva
cubre todo lo que mostraban (T011). No hay compatibilidad hacia atrás: el panel y la función se
despliegan juntos.

## 2. Datos

### Base común

`private.wellbeing_checkins(p_from date, p_to date, p_career bigint)` devuelve una fila por
check-in que cuenta, con `sid` (solo dentro de SQL), día de Santiago, valor de la escala,
carrera vigente y el arreglo de motivos. Aplica, en un solo lugar:

- consentimiento `analitica_anonima` vigente y otorgado, buscado por `codigo`, y
  `fecha_hora >= registrado_en` (RF-009/010 de la 016);
- exclusión por `solicitud_eliminacion` (cuenta, o datos con `fecha_hora <= solicitada_en`);
- filtro de carrera opcional.

`private.wellbeing_tests(p_from, p_to, p_career)` hace lo mismo sobre `aplicacion_test` del
PSS-10 activo (`nombre_test = 'Escala de Estrés Percibido (PSS-10)'`, `is_active`), quedándose
con la **última aplicación por estudiante** del periodo (`distinct on (sid) … order by sid,
fecha_hora desc`). «Alto» = nivel con mayor `puntaje_minimo` de esa versión.

Las dos son `security invoker`, `search_path = ''`, ejecutables solo por `service_role`
(la suite exige que `private` no tenga funciones definer).

### Supresión (en SQL, nunca en el panel)

- `k = 5` estudiantes distintos por cualquier valor publicado; si no, `null`.
- Grupos con resto («Otras carreras», «Otros motivos»): misma regla anti-diferencia que la 016.
- **Complementaria** en distribuciones que suman 100 % (emoción semanal, motivo × emoción,
  niveles del test): si una fila queda con exactamente una celda oculta, se oculta además la
  menor visible. Se implementa en `private.suppress_row(jsonb)` y se prueba aparte.
- Variación vs. periodo anterior: se calcula solo si ambos periodos cumplen k; si no, `null`.
- Filtro de carrera: `careerId` que no cumpla k en el periodo devuelve `sufficient: false`
  (no 4xx, para no revelar cuántos hay).

### Contratos (`GET /wellbeing/<pestaña>?days=30&careerId=12`)

Todas las respuestas comparten `{days, from, to, minGroupSize, careerId, sufficient}` y nunca
traen ids de estudiante ni filas individuales.

- `summary`: `participants`, `checkins`, `average`, `difficultShare`, `testTaken`, `highStressShare`
  (cada uno `{value, previous}`), `weekly[{weekStart, average, distribution[5]}]`,
  `weekdays[{day 1–7, average}]`, `topReasons[{name, share}]` (máx. 3).
- `reasons`: `ranking[{name, share, average}]`, `matrix[{name, cells[5]}]`,
  `trend[{name, weeks[{weekStart, share}]}]` (los 3 primeros).
- `stress`: `participants`, `average`, `highShare` (`{value, previous}`), `levels[{level, label, students}]`,
  `weekly[{weekStart, highShare}]`, `careers[{name, highShare, average}]`.
- `careers`: `rows[{name, participants, average, difficultShare, highStressShare, topReason}]`.
- `participation`: `registered`, `sharingShare`, `active`, `checkinsPerParticipant`,
  `weekly[{weekStart, active}]`. Se calcula sin filtro de consentimiento solo para `registered`
  y `sharingShare` (totales; no se listan personas).
- `careers` del selector viene de `GET /wellbeing/careers-available?days=` (solo nombres e ids
  de carreras que cumplen k).

## 3. Interfaz

- Encabezado, aviso de privacidad, controles (periodo segmentado y selector de carrera) y
  pestañas, como el mockup aprobado. La pestaña activa vive en la URL (`/wellbeing/motivos`)
  para poder compartir el enlace.
- Gráficos en SVG propio, sin dependencias nuevas. Colores como tokens CSS:
  ánimo divergente rojo ↔ gris ↔ azul, motivos con las tres primeras ranuras categóricas
  validadas, estrés en rampa ordinal naranja validada (`validate_palette.js`).
- Cada gráfico: tooltip al pasar el mouse o enfocar, «Ver como tabla» y patrón rayado para
  «sin datos suficientes». No depende solo del color: etiquetas directas y leyenda.
- Estados: cargando por pestaña, error con reintento, «aún no hay datos suficientes».

## 4. Seguridad

- `admin_read` llama a las funciones tras `assert_admin`; `check_fields` limita la consulta a
  `days` y `careerId`; `careerId` debe ser entero positivo.
- No se registran respuestas en la Edge Function (ya está así para `/emotions`).
- Los datos solo viven en memoria del panel (sin `localStorage`).

## 5. Pruebas

| Nivel | Qué | Dónde |
| --- | --- | --- |
| SQL | CA-001 a CA-008 con datos sintéticos en transacción revertida | `tools/tests/wellbeing.mjs` |
| SQL | `suppress_row`: 0, 1 y 2 celdas ocultas | idem |
| Edge | Validación de rutas y campos | `admin-api/wellbeing_test.ts` |
| Panel | Validadores de contrato y cálculos puros | `admin-web/tests/*.test.mjs` |
| Panel | Cada pestaña con datos, insuficiente, filtro y tabla accesible (CA-009) | `admin-web/e2e/wellbeing.spec.ts` |
| Todo | `npm run typecheck`, `test`, `build`, `test:e2e`, `npm run test:backend` (CA-010) | comandos |

### Datos semilla para mirar el panel

`tools/scripts/wellbeing-demo.mjs` (`npm run local:wellbeing-demo` en `tools/`) crea, solo en el
Supabase local, unos 60 estudiantes sintéticos (`demo-*@duocmind.example.test`) repartidos en
4 carreras, más una carrera con 3 estudiantes para ver la agrupación en «Otras carreras».
Genera 90 días de check-ins con motivos y tests PSS-10 con patrones reconocibles (peor ánimo
los lunes, «Académico» ligado a días malos, estrés que sube hacia fin de semestre), deja a
~40 % sin `analitica_anonima` y a algunos con solicitud de borrado, para comprobar que no
cuentan. Es idempotente: borra y recrea solo sus cuentas `demo-*`. Se niega a correr si el
`API_URL` no es local. Nunca se aplica en la nube.

## 6. Riesgos

- Rendimiento: 90 días × varias agregaciones. Mitigación: base `materialized` por llamada e
  índices existentes en `fecha_hora`; medir con `explain analyze` sobre los datos de demo.
- Diferencias entre pestañas o periodos: mitigadas con k, grupos con resto y supresión
  complementaria; riesgo residual aceptado en la spec.
- El PSS-10 se identifica por nombre, igual que la app; si cambia el nombre, la pestaña queda
  sin datos (no falla).

## 7. Reversión

La migración solo agrega funciones y redefine `admin_read`/`admin_access`. Revertir = nueva
migración que restaura sus definiciones de `20261115140000` y elimina las funciones
`private.wellbeing_*` y `private.suppress_row`; el panel vuelve al commit anterior. No toca
datos.

## 8. Despliegue

Local primero. Aplicar en el proyecto en la nube requiere autorización explícita aparte, igual
que las migraciones de la spec 022.

## Historial

| Versión | Fecha | Cambio |
| --- | --- | --- |
| 0.1.0 | 2026-11-15 | Borrador inicial |

# Spec 021 — Pendientes como lista de plazos

| Campo | Valor |
| --- | --- |
| Versión | 0.2.0 |
| Estado | APROBADA |
| Fecha | 2026-11-14 |
| Incremento | 021-pending-activities |
| Rama | `feature/pendientes` |
| Base | `origin/dev`, commit `040a43ef19636a243b9b6f6cef8faefefcb8834b`, actualizado el 2026-11-14 |
| Constitución | 2.0.0 |
| Plataformas | Android y previsualización web |
| Aprobación | Confirmada explícitamente por el usuario el 2026-11-14: «si apruebo, adelante con el plan». Incluye las decisiones 5 a 7. |
| Mockup | Claude Design, «Pendientes rediseño» (privado): https://claude.ai/artifact/CK7Qg6XUbcSLztgFWaxqcc |

## 1. Problema y resultado esperado

La pestaña **Pendientes** abre `PersonalActivitiesScreen` («Mis actividades»).
Es la misma lista de actividades que la Agenda, sin la franja semanal y sin las
clases. Las tarjetas van ordenadas por fecha, con la fecha en formato
`2026-11-12` y tres botones grandes por tarjeta (Seleccionar, Editar y Eliminar).
El filtro principal es por semestre. No responde nada que la Agenda no responda
ya, y no hay forma de indicar que algo ya se hizo.

Cada pantalla responde una pregunta distinta:

- **Agenda:** ¿qué hago tal día? Se ordena por hora e incluye clases, eventos y
  actividades.
- **Pendientes:** ¿qué me falta y qué es lo más urgente? Se ordena por plazo,
  incluye solo pruebas, tareas y actividades personales, y su acción principal es
  **marcar como hecha**.

Resultado observable: al abrir Pendientes, la persona ve cuántas actividades tiene
atrasadas y cuántas vencen en los próximos días. Las actividades aparecen
agrupadas por urgencia, con una cuenta regresiva («en 2 días», «hace 2 días»). Con
un toque en el círculo, una actividad se marca como hecha y pasa a «Hechas».
Tocar la fila abre una hoja con las demás acciones.

## 2. Alcance

- Un estado nuevo, «hecha», en cada actividad personal. Se guarda en el almacén
  local cifrado del planificador (spec 017).
- Rediseño completo de `PersonalActivitiesScreen`:
  - resumen;
  - filtro por tipo;
  - grupos por urgencia;
  - sección «Hechas»;
  - hoja de acciones;
  - modo de selección para copiar o mover.
- Ajustes menores en otras vistas:
  - La Agenda muestra marcadas las actividades hechas.
  - El bloque «Se viene» del inicio no muestra actividades hechas.
  - El enlace de la Agenda pasa a decir «Ver pendientes».
- Se mantienen, desde la hoja y el modo de selección, las funciones que existen
  hoy: crear, editar, eliminar, y copiar o mover a otro semestre.

Fuera de alcance:

- Supabase: no hay tablas, migraciones, sincronización ni despliegues. Las
  actividades siguen existiendo solo en el dispositivo (spec 017).
- Recordatorios y notificaciones.
- Subtareas, prioridades manuales y actividades que se repiten.
- Gestos de deslizar. Se pueden evaluar después; las acciones van por toques.
- Cambiar el formulario de actividad (`PersonalActivityForm`), salvo lo indicado
  en RF-001.5.
- Conservar datos locales anteriores (ver la nota de compatibilidad de RF-001).

## 3. Requisitos funcionales

### RF-001 — Estado «hecha»

1. Cada actividad puede tener un campo opcional `doneAt`, con el instante en que se
   marcó como hecha. Si no tiene el campo, la actividad está pendiente.
2. Al marcarla como hecha, `doneAt` toma la hora actual. Al desmarcarla, el campo
   se quita.
3. Marcar o desmarcar es una escritura del almacén con control de versión, igual
   que editar. Sube `version` y, si la actividad cambió en otra pantalla, la
   escritura se rechaza con el mensaje habitual.
4. Al copiar una actividad a otro semestre, la copia queda pendiente. Al moverla,
   conserva su estado.
5. Editar una actividad desde el formulario no cambia su estado.
6. El validador del almacén acepta `doneAt` solo como fecha y hora ISO válida. Una
   actividad con `doneAt` inválido se trata como dato ilegible, con el mismo
   criterio que el resto del documento.

Compatibilidad: como `doneAt` es opcional, los documentos que ya existen siguen
siendo válidos y sus actividades quedan pendientes. No hace falta convertir datos
(ver la memoria del proyecto: la app está en desarrollo).

### RF-002 — Resumen y filtro

1. El encabezado dice «Pendientes» y lleva el botón «Nueva», que abre el formulario
   de siempre.
2. Bajo el título, un resumen dinámico, por ejemplo «1 atrasada · 4 en los
   próximos 7 días». Si no hay nada pendiente, dice «Todo al día».
3. Una tarjeta **Esta semana** muestra «X de Y hechas» y una barra de progreso.
   Cuenta las actividades con fecha entre el lunes y el domingo de la semana
   actual, en hora de Chile, igual que la franja de la Agenda. Si en la semana no
   hay actividades, la tarjeta no se muestra.
4. Filtros por tipo, con selección única: **Todas**, **Pruebas**, **Tareas** y
   **Personales**. Cada uno muestra cuántas actividades pendientes tiene.
5. Al final de la lista, un enlace «Mostrando: todos los semestres · Cambiar» abre
   una hoja para elegir entre «Todos los semestres», «Generales» o un semestre.
   Esto reemplaza la fila «Organización» actual. La opción inicial es «Todos los
   semestres».
6. Los filtros viven solo en la pantalla y no se guardan.

### RF-003 — Grupos por urgencia

Las actividades pendientes que pasan los filtros se reparten en grupos. Un grupo
vacío no se muestra. Las referencias de tiempo son el día y la hora civiles de
Chile.

| Grupo | Contenido | Orden |
| --- | --- | --- |
| **Atrasadas** | La hora de término ya pasó (`personalActivityState = 'ended'`). | Primero la más reciente |
| **Hoy** | Su fecha es hoy y aún no termina, incluidas las que están en curso. | Por hora |
| **Próximos 7 días** | De mañana a hoy + 7 días. | Por fecha y hora |
| **Más adelante** | Después de hoy + 7 días. | Por fecha y hora |

1. El grupo «Atrasadas» usa un tono de alerta (rojo oscuro con contraste ≥ 4.5:1)
   y no un color que solo se distinga por el matiz. Si tiene más de 5 actividades,
   muestra las 5 más recientes y un botón «Ver N más».
2. Cada fila muestra:
   - el círculo para marcar (RF-004);
   - el título;
   - un punto de color con el tipo y el ramo, si lo tiene;
   - a la derecha, cuándo es y cuánto falta.
3. Cuándo es y cuánto falta, según el grupo:

   | Grupo | Cuándo | Cuánto falta |
   | --- | --- | --- |
   | Hoy | Hora | «en 3 h», «en 20 min» o «Ahora» si está en curso |
   | Próximos 7 días y Más adelante | Día corto y número («Lun 16») | «mañana», «en N días» |
   | Atrasadas | Día corto y número | «hace N días», o «hace N h» si fue hoy |

4. Los colores de tipo son los del bloque «Se viene» del inicio: azul para
   pruebas, naranja para tareas y verde para personales. Siempre van acompañados
   del nombre del tipo.
5. Si no hay actividades pendientes con los filtros elegidos, se muestra «Todo al
   día» y una línea según el caso:
   - Con un filtro de tipo activo: «No tienes pendientes de este tipo».
   - Sin actividades guardadas: «Crea tu primera prueba o tarea con «Nueva»».

### RF-004 — Marcar como hecha

1. El círculo de cada fila tiene un área táctil de al menos 44×44. Al tocarlo, la
   actividad se marca como hecha y sale de su grupo con una transición corta y sin
   rebote (tokens de movimiento; sin desplazamiento con movimiento reducido).
2. Aparece un aviso breve, «Marcada como hecha», con el botón **Deshacer**. Dura
   unos 5 segundos y no tapa la barra inferior. Deshacer devuelve la actividad a
   pendiente.
3. Para el lector de pantalla, el círculo es una casilla con el nombre «Marcar
   ‹título› como hecha» y su estado de marcado.
4. Mientras se guarda, el círculo queda desactivado para evitar dobles toques. Si
   falla, la actividad vuelve a su lugar y se muestra el error.

### RF-005 — Sección «Hechas»

1. Bajo los grupos aparece «Hechas · N», plegada al abrir la pantalla. Al tocarla
   se despliega o se pliega, y anuncia su estado con `aria-expanded`.
2. Muestra las actividades hechas que pasan los filtros, empezando por la marcada
   más recientemente. Tienen menos énfasis, el título tachado y un círculo verde
   con ✓.
3. Si tiene más de 20 actividades, muestra 20 y el botón «Ver N más».
4. Tocar el círculo la devuelve a pendiente, con el mismo aviso y su Deshacer.

### RF-006 — Hoja de acciones

Tocar una fila, fuera del círculo, abre una hoja inferior (`PlannerModal` tipo
`sheet`) con lo siguiente:

1. Tipo, ramo, título, y la fecha completa con horario y cuenta regresiva, por
   ejemplo «Lunes 16 de noviembre · 10:01–11:20 · en 2 días».
2. Una acción principal: **Marcar como hecha**, o **Marcar como pendiente** si ya
   está hecha.
3. **Editar**, que abre `PersonalActivityForm`.
4. **Ver ese día en la agenda**, que abre `/agenda?date=…`.
5. **Copiar o mover a otro semestre**, que abre el flujo de traslado actual con
   esa sola actividad.
6. **Seleccionar varias**, que entra al modo de selección (RF-007) con esta
   actividad ya seleccionada.
7. **Eliminar actividad**, en tono de peligro y con la confirmación actual.

La fila se anuncia como botón con el nombre «‹Título›, ‹tipo›, ‹cuándo›». La pista
de accesibilidad es «Abre las acciones».

### RF-007 — Modo de selección

1. En este modo, los círculos se reemplazan por casillas de selección y tocar la
   fila la selecciona o la quita.
2. Una barra fija sobre la navegación muestra «N seleccionadas» y los botones
   **Copiar**, **Mover** y **Cancelar**. Copiar y Mover abren el flujo de traslado
   actual (destino y fechas).
3. Al confirmar, cancelar o cambiar de pantalla, se sale del modo y se limpia la
   selección.

### RF-008 — Coherencia con otras vistas

1. **Agenda:** una actividad hecha sigue apareciendo en su día, con el título
   tachado, menos énfasis y la etiqueta «Hecha». No cambia de lugar en la línea de
   tiempo.
2. **Agenda:** el enlace «Ver todas mis actividades →» pasa a decir «Ver pendientes
   →» y lleva a `/pendientes`.
3. **Inicio, bloque «Se viene»:** excluye las actividades hechas. Si todas lo
   están, muestra el estado «Todo al día» actual.

## 4. Requisitos no funcionales

- **Arquitectura:**
  - La agrupación, la cuenta regresiva, el resumen y el progreso son funciones
    puras de dominio, probadas con fechas fijas.
  - Marcar y desmarcar es un caso de uso del `plannerService`.
  - La pantalla solo compone.
  - El código queda en `features/agenda` y en `shared/planner`.
- **Diseño:** sigue el lenguaje visual actual: crema `#f3ecda`, tarjetas `#fffaf0`,
  azul marino `#1a2b44`, Nunito, `Reveal`, `ScalePress` y `GotaLoader`. Toma como
  referencia el mockup de la tabla inicial. No usa `ActivityIndicator` ni rebotes.
- **Accesibilidad:**
  - Áreas táctiles de al menos 44 px.
  - Contraste del texto de al menos 4.5:1.
  - Los grupos se anuncian como encabezados.
  - Con texto ampliado, la fila se reorganiza (la hora pasa bajo el título) y no
    corta el texto.
- **Rendimiento:** con 300 actividades, la pantalla se mantiene fluida. Los grupos
  se calculan una sola vez por cada cambio de datos o de reloj.
- **Reloj:** los grupos y las cuentas se actualizan con `planner.now`, igual que la
  Agenda, sin un temporizador propio.

## 5. Privacidad y riesgos

- `doneAt` y las actividades nunca salen del dispositivo: la app no hace
  solicitudes de red para esto y no registra títulos ni ramos en los logs.
- **Riesgo, «Atrasadas» se vuelve infinita.** Si nunca se marcan, las actividades
  personales que ya pasaron se acumulan. Se limita con el tope de 5 y «Ver N más»
  (RF-003.1). Si molesta en el uso, se puede agregar «Marcar todas como hechas» en
  otra spec.
- **Riesgo, marcar por error.** Se cubre con Deshacer (RF-004.2) y con la opción
  de desmarcar desde «Hechas».

## 6. Criterios de aceptación

| ID | Resultado observable | Verificación prevista |
| --- | --- | --- |
| CA-001 | Con fechas fijas, cada actividad cae en el grupo correcto (los cuatro casos y sus bordes: 23:59 de hoy, día 7 y día 8) y en el orden indicado. | Prueba de dominio. |
| CA-002 | Las cuentas regresivas («en 3 h», «mañana», «en N días», «hace N días», «Ahora») salen bien a lo largo del día. | Prueba de dominio. |
| CA-003 | Marcar guarda `doneAt`, sube la versión y la actividad pasa a «Hechas»; desmarcar quita el campo. | Prueba del servicio y recorrido web. |
| CA-004 | Marcar una actividad que cambió en otra pantalla se rechaza sin perder datos. | Prueba del servicio. |
| CA-005 | Deshacer devuelve la actividad a su grupo original. | Recorrido web y Android. |
| CA-006 | Un documento sin `doneAt` se abre igual y todas sus actividades quedan pendientes; un `doneAt` inválido se rechaza. | Prueba del almacén. |
| CA-007 | Copiar crea copias pendientes; mover conserva el estado. | Prueba de `transferActivities`. |
| CA-008 | El filtro por tipo y el de semestre se combinan, y cada filtro de tipo muestra su cuenta correcta. | Prueba de dominio y recorrido. |
| CA-009 | «Esta semana» cuenta de lunes a domingo y la barra coincide con «X de Y». | Prueba de dominio. |
| CA-010 | La hoja ofrece las 6 acciones y cada una funciona (editar, ver en la agenda, copiar o mover, seleccionar varias, eliminar, marcar). | Recorrido web. |
| CA-011 | En la Agenda, la actividad hecha se ve tachada con «Hecha»; «Se viene» la excluye. | Recorrido web. |
| CA-012 | TalkBack anuncia los grupos como encabezados, el círculo como casilla con su estado y la fila con su pista; con texto grande nada se corta. | Recorrido Android. |
| CA-013 | Ninguna operación de Pendientes llama a la red. | Revisión de solicitudes en el recorrido web y revisión de código. |
| CA-014 | Typecheck sin errores y `npm test` en verde. | `npm run typecheck` y `npm test`. |

## 7. Decisiones

Decididas por el usuario el 2026-11-14:

1. Pendientes y Agenda responden preguntas distintas: Pendientes se ordena por
   plazo y la Agenda por hora.
2. Se agrega el estado «hecha», solo local y sin cambios en Supabase.
3. El diseño sigue el mockup de Claude Design (propuesta y hoja de acciones).
4. Trabajo en `feature/pendientes`, creada desde `dev` y separada del importador de
   Duoc (spec 020, que queda en `feature/ocr-horario-duoc`).

Propuestas en esta spec y aprobadas con ella el 2026-11-14:

5. El tercer grupo se llama **Próximos 7 días** (en el mockup decía «Esta semana»).
   Un plazo móvil evita que un sábado la prueba del lunes caiga en «Más adelante».
   La tarjeta de progreso sí usa la semana de lunes a domingo, como la Agenda.
6. En la Agenda, las actividades hechas se ven tachadas en lugar de ocultarse, para
   que el día siga mostrando lo que ocurrió.
7. «Deshacer» dura unos 5 segundos y no hay confirmación al marcar.

Esta spec no autoriza migraciones remotas, despliegues, commits ni push. El plan se
redacta después de su aprobación.

## 8. Referencias

- Pantallas:
  - `src/features/agenda/screens/PersonalActivitiesScreen.tsx`
  - `src/features/agenda/screens/AgendaScreen.tsx`
  - `src/features/dashboard/screens/DashboardScreen.tsx` (bloque «Se viene»)
- Almacén y operaciones:
  - `src/shared/planner/application/plannerStore.ts` (`parseActivity`)
  - `application/personalActivities.ts` (`savePersonalActivity`,
    `transferActivities`)
  - `application/plannerService.ts`
  - `application/plannerProjection.ts` (`upcoming`)
- Tiempo: `src/shared/planner/domain/personalActivityTime.ts` y `weeklySchedule.ts`
  (`civilNow`, `addDays`).
- Componentes:
  - `components/AgendaActivityCard.tsx`
  - `components/PlannerControls.tsx` (`PlannerModal` tipo `sheet`)
  - `components/PersonalActivityForm.tsx`
- Specs relacionadas: 011 (agenda y asignaturas) y 017 (almacén local).

### Historial de revisiones

- **0.1.0 — 2026-11-14:** borrador inicial a partir del mockup y de la conversación.
- **0.2.0 — 2026-11-14:** aprobada, con las decisiones 5 a 7.

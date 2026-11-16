# Plan 021 — Pendientes como lista de plazos

| Campo | Valor |
| --- | --- |
| Versión | 0.1.0 |
| Estado | APROBADO |
| Fecha | 2026-11-14 |
| Spec | `spec.md` 0.2.0 (APROBADA) |
| Aprobación | Confirmada explícitamente por el usuario el 2026-11-14: «adelante sigue con la implementacion». |
| Rama | `feature/pendientes` |

## 1. Decisiones técnicas

1. **Sin dependencias nuevas ni cambios en Supabase.** Se trabaja con el almacén
   del planificador (spec 017), `PlannerModal`, `Reveal`, `ScalePress`,
   `GotaLoader` y los tokens de movimiento.
2. **`doneAt` es un campo opcional de `PersonalActivity`**, con el mismo patrón que
   `endTime`. `parseActivity` acepta la clave solo cuando viene en el objeto, así
   que los documentos guardados siguen pasando el validador (CA-006). Formato:
   ISO UTC con milisegundos (`2026-11-14T15:04:05.123Z`), validado con una
   expresión regular y `Date.parse`.
3. **El formulario no puede cambiar `doneAt`.** `savePersonalActivity` ignora el
   `doneAt` que recibe y conserva el de la versión anterior; una actividad nueva
   nace pendiente. Así se cumple RF-001.5 sin tocar `PersonalActivityForm`.
4. **Marcar es una operación propia del dominio:**
   `setActivityDone(doc, id, version, doneAt | null)` en `personalActivities.ts`.
   Valida la versión, pone o quita el campo y sube `version`. El servicio le pasa
   `new Date().toISOString()`, y las pruebas, un valor fijo.
5. **Traslado.** En `transferActivities`, la copia se crea sin `doneAt`. Mover
   conserva el estado, porque ya parte de `...original`.
6. **La lógica de Pendientes es una función pura**, `projectPending(activities,
   now, filters)`, en `src/features/agenda/domain/pendingActivities.ts`. Devuelve:
   - los grupos (`late`, `today`, `soon`, `later`) ya ordenados, con sus etiquetas;
   - las actividades hechas;
   - las cuentas por tipo;
   - el resumen;
   - el progreso de la semana.

   La pantalla la llama dentro de `useMemo([activities, now, filters])`. Las
   fechas se calculan con `civilNow`, `addDays`, `dateWeekday` y
   `personalActivityState`, ya existentes.
7. **Cuenta regresiva.** `countdownLabel(activity, now)` usa minutos civiles:
   - en curso: «Ahora»;
   - menos de 60 min: «en N min»;
   - el mismo día: «en N h», redondeado hacia abajo;
   - un día: «mañana»;
   - más días: «en N días»;
   - si ya pasó, lo mismo hacia atrás: «hace N min», «hace N h», «ayer» o «hace N
     días».

   La columna «cuándo» muestra la hora para Hoy y el día corto con su número
   («Lun 16») para el resto.
8. **Deshacer sin temporizadores de dominio.** La pantalla guarda
   `{ id, doneBefore }` del último cambio. `UndoToast` se oculta a los 5 s con un
   `setTimeout` que se limpia al desmontar. Deshacer busca la versión actual de la
   actividad en el snapshot y llama a `setActivityDone` con el estado anterior.
9. **Salida de la fila.** Se usa `LayoutAnimation.configureNext` (Android con
   `UIManager.setLayoutAnimationEnabledExperimental` si hace falta, y sin efecto en
   web) con la duración corta de `motionDuration`. Con movimiento reducido
   (`useReducedMotion`) no se anima.
10. **Pantalla por componentes.** `PersonalActivitiesScreen` se reescribe como
    contenedor. Las piezas van en `components/pending/`, y el modal de traslado
    actual se extrae sin cambiar su comportamiento. La ruta `/pendientes` no
    cambia.

## 2. Archivos

| Archivo | Cambio |
| --- | --- |
| `src/shared/planner/application/plannerStore.ts` | `doneAt?: string` en el tipo; validación en `parseActivity`; `isInstant()`. |
| `src/shared/planner/application/personalActivities.ts` | `setActivityDone()`. `savePersonalActivity` conserva `doneAt`. La copia de `transferActivities` lo quita. |
| `src/shared/planner/application/plannerService.ts` | `setActivityDone(session, id, version, done)` mediante `local()`. |
| `src/shared/planner/application/plannerContext.ts` | `setActivityDone(id, version, done): Promise<void>` en `PlannerModel`. |
| `src/shared/planner/infrastructure/PlannerProvider.tsx` | Conecta `setActivityDone` con `run()`. |
| `src/shared/planner/application/plannerProjection.ts` | `upcoming` excluye las actividades con `doneAt` (RF-008.3). |
| `src/features/agenda/domain/pendingActivities.ts` (nuevo) | `projectPending`, `countdownLabel`, `whenLabel`, tipos `PendingFilters` y `PendingProjection`. |
| `src/features/agenda/components/pending/PendingSummary.tsx` (nuevo) | Encabezado con «Nueva», resumen y tarjeta «Esta semana» con barra (`accessibilityRole='progressbar'`). |
| `src/features/agenda/components/pending/KindFilter.tsx` (nuevo) | Chips Todas, Pruebas, Tareas y Personales con su cuenta (`accessibilityState.selected`). |
| `src/features/agenda/components/pending/PendingRow.tsx` (nuevo) | Fila con el círculo (casilla) y el cuerpo (botón). Tiene variantes «pendiente», «hecha» y «selección», y se reorganiza con texto grande (`useWindowDimensions().fontScale`). |
| `src/features/agenda/components/pending/PendingGroup.tsx` (nuevo) | Encabezado del grupo (`accessibilityRole='header'`), tarjeta y tope de N con «Ver N más». |
| `src/features/agenda/components/pending/DoneSection.tsx` (nuevo) | «Hechas · N» plegable (`aria-expanded` y `accessibilityState.expanded`), con tope de 20. |
| `src/features/agenda/components/pending/PendingActionsSheet.tsx` (nuevo) | Hoja de RF-006 sobre `PlannerModal sheet`. |
| `src/features/agenda/components/pending/SemesterFilterSheet.tsx` (nuevo) | Elección de semestre (RF-002.5). |
| `src/features/agenda/components/pending/SelectionBar.tsx` (nuevo) | Barra «N seleccionadas» con Copiar, Mover y Cancelar. |
| `src/features/agenda/components/pending/UndoToast.tsx` (nuevo) | Aviso con «Deshacer» sobre la barra inferior (`accessibilityLiveRegion='polite'`). |
| `src/features/agenda/components/ActivityTransferModal.tsx` (nuevo) | El modal de traslado actual, extraído de `PersonalActivitiesScreen`. |
| `src/features/agenda/screens/PersonalActivitiesScreen.tsx` | Se reescribe como contenedor: estado de filtros, selección, hoja, aviso y formulario. |
| `src/features/agenda/screens/PendingScreen.styles.ts` (nuevo) | Estilos de la pantalla y de sus componentes, con los colores de la spec. |
| `src/features/agenda/components/AgendaActivityCard.tsx` | Con `doneAt`: título tachado, opacidad reducida, etiqueta «Hecha» y barra gris. |
| `src/features/agenda/screens/AgendaScreen.tsx` | El enlace pasa a «Ver pendientes →». |
| `tests/pendingActivities.test.mjs` (nuevo) | Grupos, bordes, orden, cuentas, filtros, resumen, semana y etiquetas. |
| `tests/personalActivities.test.mjs`, `tests/plannerStore.test.mjs`, `tests/plannerService.test.mjs`, `tests/plannerProjection.test.mjs` | Casos de `doneAt`. |
| `../README.md` | La fila de Agenda y Pendientes menciona «marcar como hecha». |

## 3. Interfaces

```ts
// plannerStore.ts
export interface PersonalActivity { /* … */ doneAt?: string }

// personalActivities.ts
export function setActivityDone(
  doc: PlannerDocument, id: string, version: number, doneAt: string | null,
): PlannerDocument;

// plannerContext.ts
setActivityDone(id: string, version: number, done: boolean): Promise<void>;

// features/agenda/domain/pendingActivities.ts
export type KindFilter = 'all' | ActivityKind;
export type SemesterFilter = { kind: 'all' } | { kind: 'general' } | { kind: 'semester'; id: string };
export interface PendingFilters { kind: KindFilter; semester: SemesterFilter }
export type PendingGroupId = 'late' | 'today' | 'soon' | 'later';
export interface PendingItem {
  activity: PersonalActivity;
  when: string;       // «18:00» o «Lun 16»
  countdown: string;  // «en 3 h», «mañana», «hace 2 días», «Ahora»
  a11y: string;       // «Prueba 2, prueba, lunes 16, en 2 días»
}
export interface PendingProjection {
  groups: { id: PendingGroupId; label: string; items: PendingItem[] }[]; // sin grupos vacíos
  done: PendingItem[];                                  // por doneAt descendente
  counts: Record<KindFilter, number>;                    // pendientes, filtro de semestre aplicado
  summary: string;                                      // «1 atrasada · 4 en los próximos 7 días» | «Todo al día»
  week: { done: number; total: number } | null;          // lunes a domingo; null si total = 0
}
export function projectPending(
  activities: PersonalActivity[], now: Date, filters: PendingFilters,
): PendingProjection;
```

Límites de los grupos, con `today = civilNow(now).date`:

| Grupo | Condición |
| --- | --- |
| `late` | `personalActivityState = 'ended'` |
| `today` | `date === today` y no ha terminado |
| `soon` | `today < date ≤ addDays(today, 7)` |
| `later` | `date > addDays(today, 7)` |

## 4. Datos locales

- No cambia la forma del documento ni su versión: solo se agrega una clave
  opcional a cada actividad.
- Los documentos sin `doneAt` siguen siendo válidos. Si un `doneAt` es inválido,
  todo el documento se trata como ilegible, igual que con cualquier otro campo.
- No hay conversión de datos.

## 5. Seguridad y privacidad

- Nada sale del dispositivo. No hay llamadas a la red y no se agregan `console.*`.
- El aviso de Deshacer y los mensajes de error no muestran datos personales más
  allá del título que la persona escribió, en pantalla.

## 6. Pruebas

1. **Dominio (`pendingActivities.test.mjs`)**, con `now` fijo el sábado
   2026-11-14 a las 15:00 de Chile:
   - Grupos: atrasada que terminó hace 1 min; hoy en curso; hoy a las 23:59; día
     +1; día +7 en `soon`; día +8 en `later`.
   - Orden dentro de cada grupo, y tope de 5 en `late` lo resuelve la vista.
   - Cuentas por tipo con el filtro de semestre aplicado, y filtros combinados.
   - Resumen en singular y plural, y «Todo al día».
   - Semana: de lunes 9 a domingo 15; `null` cuando no hay actividades.
   - Etiquetas: «Ahora», «en 20 min», «en 3 h», «mañana», «en 5 días», «hace 2 h»,
     «ayer» y «hace 3 días».
2. **Almacén:**
   - Se acepta `doneAt` válido, se rechaza uno inválido y sigue funcionando un
     documento sin el campo.
   - `setActivityDone` pone y quita el campo, sube la versión y rechaza una versión
     vieja.
   - `savePersonalActivity` conserva `doneAt` e ignora el que recibe.
   - Al copiar, la copia queda pendiente; al mover, conserva el estado.
3. **Servicio:** `setActivityDone` escribe y notifica.
4. **Proyección del inicio:** `upcoming` excluye las actividades hechas.
5. **Verificación general:**
   - `npm run typecheck`, `npm test` y `npx expo export --platform web`.
   - Recorrido web: CA-003, 005, 008, 010 y 011, sin solicitudes de red al marcar.
   - Recorrido Android: CA-005 y CA-012, con TalkBack y texto grande.

## 7. Riesgos

- **`LayoutAnimation` en Android** puede parpadear con listas largas. Si pasa, la
  fila sale sin animación: el aviso y la sección «Hechas» ya comunican el cambio.
- **Reloj.** Los grupos dependen de `planner.now`. Si ese valor se actualiza poco,
  una actividad tarda en pasar a «Atrasadas». Se revisa en el recorrido; la Agenda
  ya usa el mismo criterio.
- **Deshacer después de otra edición.** Si la actividad cambió entre medio,
  Deshacer usa la versión actual del snapshot. Si ya no existe, el aviso
  desaparece sin hacer nada.
- **Tamaño del contenedor.** La pantalla actual tiene unas 290 líneas. Separarla
  en componentes evita que la nueva crezca de más.

## 8. Reversión

Se revierte el commit de la rama. Las actividades que se hayan guardado con
`doneAt` dejarían de validar con el código anterior. Como la app está en
desarrollo, basta con borrar los datos locales de la app de prueba.

### Historial de revisiones

- **0.1.0 — 2026-11-14:** borrador inicial, aprobado sin cambios.

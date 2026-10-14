# Tareas 010 — Tutorial de bienvenida

| Campo | Valor |
| --- | --- |
| Versión | 0.2.0 |
| Estado | APROBADAS |
| Fecha | 2026-10-14 |
| Spec | `spec.md` 0.2.0, APROBADA |
| Plan | `plan.md` 0.2.0, APROBADO |
| Constitución | 2.0.0 |
| Rama | `feature/tutorial` |
| Aprobación de tareas | 0.1.0: confirmada por el usuario el 2026-10-13. 0.2.0: confirmada explícitamente por el usuario el 2026-10-14 |

## Reglas de ejecución

Ejecutar en el orden en que aparecen en este documento, no en el de su número, y una
tarea por vez, después de aprobar este documento. T001 a T006 son de la versión 0.1.0 y
están completas; la revisión 0.2.0 agrega T009 a T012 y reformula T007 y T008. Las tareas
completas no se reabren: T009 y T012 modifican sus archivos. No delegar ni paralelizar
tareas. Toda verificación usa cuentas y datos sintéticos.

Una tarea se marca `[x]` cuando su cambio está completo, pasa su verificación
específica y el repositorio conserva las validaciones aplicables: `npm run
typecheck` y `npm test` sin fallos nuevos. Registrar cambio, comando o
recorrido, resultado y limitaciones en `verification.md`. Una prueba diferida a
otra tarea aparece como pendiente, nunca como ejecutada. La spec no se cierra
mientras quede pendiente la validación Android.

Estas tareas no autorizan commits, push, despliegues, migraciones remotas, cambios de
backend ni datos reales. No agregan dependencias. No modifican `LoginScreen`,
`WelcomeIntro`, `AppHeader` ni el panel administrativo. El único cambio permitido en
`CheckinScreen` es el aviso de que el registro quedó guardado (T012).

## Preparación

- [x] T001 Abrir `verification.md` con la línea base antes de cambiar código: versiones de Node y npm frente a las declaradas en `package.json`, resultado de `npm run typecheck` y `npm test`, rama y estado de Git, y disponibilidad de una development build o APK Android para la validación final. Registrar cualquier herramienta ausente sin sustituir una verificación por otra. **Verificación:** ambos comandos ejecutados y su resultado real anotado, incluidas las fallas previas si las hay. **CA-011.**

## Dominio y aplicación

- [x] T002 Crear `src/shared/tutorial/domain/tutorialSteps.ts` y `tutorialFlow.ts`. Los pasos siguen el orden y el contenido de RF-002: título y texto en español, elemento resaltado (`weekCard`, `checkin`, `agenda`, `events`, `wellness` o ninguno en el cierre), sin términos de diagnóstico ni tratamiento, y «sin conexión» solo para los teléfonos de apoyo. El flujo ofrece avance, retroceso, último paso, posición («Paso 2 de 6») y `backAction`. Sin React, Expo ni `@/`; imports relativos con extensión `.ts`. **Verificación:** `tests/tutorialSteps.test.mjs` (seis pasos en orden, ids y elementos únicos, textos no vacíos, cierre sin elemento, ausencia de términos clínicos) y `tests/tutorialFlow.test.mjs` (límites de avance y retroceso, posición, último paso, `backAction` en el primer paso y en uno intermedio); `typecheck` y `npm test`. **CA-003, CA-004, CA-009.**

- [x] T003 Crear `src/shared/tutorial/application/tutorialProgress.ts`: interfaces `KeyValueStorage`, `TutorialOwnerGateway` y `TutorialProgressStore`; `createTutorialProgressStore` con clave `duocmind.tutorial.seen.v1.<ownerId>` y validación de UUID; `resolveTutorialOffer` y `completeTutorial`. Un error de lectura o un propietario inválido o ausente no ofrece el recorrido; un error de escritura no se propaga. Sin React, Expo ni `@/`. **Verificación:** `tests/tutorialProgress.test.mjs` con almacenamiento simulado: aislamiento entre dos cuentas, `markSeen`, `isSeen` y `clear`, UUID inválido, propietario ausente, ya visto, error al leer el propietario y el estado, `completeTutorial` con escritura fallida, y una captura previa que marca a su propietario aunque la sesión cambie; `typecheck` y `npm test`. **CA-002, CA-005, CA-006, CA-008.**

## Infraestructura

- [x] T004 Crear `tutorialProgressStorage.ts` y `tutorialOwnerGateway.ts` en `src/shared/tutorial/infrastructure/`. El primero cablea `createTutorialProgressStore` con `platformSecureKeyValueStorage` y exporta `deleteTutorialProgress`, de mejor esfuerzo y sin propagar errores. El segundo lee `getSupabaseClient().auth.getSession()` y devuelve el identificador de usuario o `null`, sin registrar credenciales. Agregar `deleteTutorialProgress(userId)` a `clearLocalData` de `deleteCurrentAccount` en `supabaseAuthGateway.ts`, después de los borrados existentes; `signOut` no cambia. **Verificación:** `typecheck` y `npm test`; revisión de que ninguna clave, sesión ni identificador se registra en logs; la eliminación real de la clave queda como paso 13 del recorrido Android de T008. **CA-005, CA-006, CA-008.**

## Presentación

- [x] T005 Preparar los puntos de medición, sin cambiar el comportamiento visible. Agregar `tutorialStep: 300` a `motionDuration` en `motionTokens.ts`. Hacer que `ScalePress` acepte `ref?: Ref<View>` y lo pase a `AnimatedPressable`. Agregar a `BottomNav` la prop opcional `tutorialTargets` para las pestañas Agenda y Bienestar y el botón central; sin la prop, nada cambia. **Verificación:** `typecheck` y `npm test`; la previsualización web con `npm run web` muestra Inicio, Agenda, Bienestar y el botón central sin diferencias; la medición real en Android queda para T008. **CA-011.**

- [x] T006 Crear `useTutorial.ts` en `infrastructure/` y `components/TutorialOverlay.tsx`, con el recorrido de la versión 0.1.0: `Modal` transparente que mide cada elemento con `measureInWindow`, resalta con cuatro rectángulos y un borde, coloca la tarjeta arriba o abajo del elemento, centra el paso si no puede medirlo, y ofrece «Atrás», «Omitir», «Siguiente» y «Entendido» con `ScalePress` y objetivos de al menos 44 px, con foco y región viva de accesibilidad y respeto de `useReducedMotion`. **Verificación:** `typecheck` y `npm test`; montaje y recorrido en la previsualización web. T012 reemplaza el hook y adapta el componente a la sesión única. **CA-003, CA-004, CA-010.**

## Revisión 0.2.0

- [x] T009 Actualizar el dominio al recorrido de la spec 0.2.0. En `tutorialSteps.ts`: agregar `kind: 'info' | 'checkin' | 'closing'` a cada paso y dejar los seis pasos en el orden Tu semana, Agenda, Eventos, Bienestar, Registrar cómo te sientes (`kind: 'checkin'`, elemento `checkin`) y Todo listo (`kind: 'closing'`, sin elemento). El texto del paso 5 es neutro: explica el botón, que la persona elige y puede corregir su emoción y que puede registrar ahora o más tarde, sin sugerir una emoción ni presentarlo como obligatorio. El paso 6 conserva el aviso de dónde volver a ver el tutorial. `tutorialFlow.ts` no cambia en esta tarea: `backAction` se retira en T012, junto con el código que lo usa. **Verificación:** actualizar `tests/tutorialSteps.test.mjs` (orden y elementos de los seis pasos, el 5 de tipo `checkin` y el 6 de tipo `closing` sin elemento, ids y elementos únicos, textos no vacíos, sin términos clínicos, «sin conexión» solo en Bienestar, el paso 5 sin lenguaje obligatorio ni sugerencia de emoción, el paso 6 con «Ver tutorial de la app»); `tests/tutorialFlow.test.mjs` sigue aprobado; `typecheck` y `npm test`. **CA-003, CA-009.**

- [x] T010 Crear `src/shared/tutorial/application/tutorialSession.ts` con `TutorialSession` y `describeTutorial` según el plan (§3): fases `closed`, `steps`, `awaitingCheckin` y `closing`; modos `auto` y `manual`; `openAuto` con generación, `openManual`, `next`, `back`, `startCheckin`, `returnWithoutSaving`, `checkinSaved`, `skip`, `finish`, `systemBack`, `accountChanged`, `reset`, `subscribe`, `getSnapshot` y `captureGeneration`; `onComplete` recibido por el constructor. Sin React, Expo ni `@/`; imports relativos con extensión `.ts`. **Verificación:** `tests/tutorialSession.test.mjs` con `onComplete` simulado: apertura automática y manual; límites de `next` y `back`; `describeTutorial` en cada paso, modo y fase; `startCheckin` solo en automático y en el paso 5; `returnWithoutSaving`; `checkinSaved` con la misma cuenta (marca una vez y pasa a `closing`), con otra cuenta (cierra sin marcar) y fuera de `awaitingCheckin`; `skip` marca solo en automático y en `steps`; `finish` nunca marca; `systemBack` en un paso intermedio, en el primero y en `closing`; `accountChanged` con `null`, otra cuenta y la misma; una `openAuto` con generación vencida; el modo manual nunca llama a `onComplete`; los suscriptores se notifican; `typecheck` y `npm test`. **CA-004, CA-005, CA-006, CA-007, CA-013, CA-014.**

- [x] T011 Crear `src/shared/tutorial/infrastructure/tutorialRuntime.ts`: la instancia única `tutorialSession` con `onComplete` que llama a `completeTutorial(tutorialProgressStore, ownerId)`; `watchTutorialAccount()`, que se suscribe una sola vez a `getSupabaseClient().auth.onAuthStateChange`, llama a `accountChanged` con el usuario de cada evento y no lanza si falta la configuración; y `notifyTutorialCheckinSaved(userId)`, que llama a `checkinSaved` dentro de un `try/catch` vacío. Es un archivo nuevo que nadie usa todavía: no cambia ningún comportamiento. **Verificación:** `typecheck` y `npm test`; revisión de que no se registra ninguna sesión, identificador ni emoción. **CA-005, CA-006, CA-008, CA-011.**

- [x] T012 Migrar el recorrido a la sesión única, en una sola tarea para que el repositorio compile. Reescribir `useTutorial.ts` sobre `tutorialSession` con `useSyncExternalStore` (devuelve `state`, `view`, `visible`, `offerAfterLogin`, `startManually`, `next`, `back`, `skip`, `finish`, `systemBack`, `registerNow` y `returnWithoutSaving`; `offerAfterLogin` captura la generación y descarta la oferta si cambió; llama a `watchTutorialAccount()` al montarse). Adaptar `TutorialOverlay` a las propiedades `visible`, `view`, `targets`, `onPrimary`, `onBack`, `onSkip` y `onSystemBack`: «Omitir» solo si `canSkip`, «Atrás» solo si `canGoBack`, acción principal con la etiqueta de `view.primary`, posición de `view.position` y `onRequestClose` hacia `onSystemBack`. Retirar `backAction` de `tutorialFlow.ts` y de sus pruebas. En `DashboardScreen`: `visible` solo con el inicio enfocado (`useIsFocused`), `useFocusEffect` que llama a `returnWithoutSaving`, y `onPrimary` (`next`; `register` → `if (registerNow()) router.push('/checkin')`; `finish`). En `CheckinScreen`: agregar `notifyTutorialCheckinSaved(userId)` justo después de que `saveConfirmedCheckin` devuelve, sin cambiar nada más. **Verificación:** `typecheck` y `npm test`; en la previsualización web sin sesión, con «Ver tutorial de la app»: los seis pasos resaltan el elemento correcto, «Omitir» aparece en los pasos 1 a 5 y no en el 6, «Atrás» solo en los pasos 2 a 5, el paso 5 ofrece «Siguiente» (no «Registrar ahora») y el 6 «Entendido», Escape retrocede y en el primer paso cierra, no se escribe ninguna clave de tutorial, no hay errores de consola y hay un solo `Modal` visible. La parte con login queda en T007. **CA-003, CA-004, CA-007, CA-010, CA-011, CA-014.**

- [x] T007 Verificar el recorrido automático en la web con backend local y una cuenta sintética nueva. Preparar el backend local según `README.md` y la guía del proyecto, sin usar servicios remotos, y crear la cuenta con datos sintéticos. **Verificación:** login → bienvenida → pasos 1 a 5 → «Registrar ahora» → check-in real → agradecimiento → inicio con «Todo listo» → «Entendido»; el registro aparece en el historial y en «Vistazo de tu semana»; ni la recarga ni un segundo login lo repiten; «Omitir» en el paso 5 no abre el check-in; volver del check-in sin guardar reabre el paso 5 sin «Todo listo»; con dos cuentas el estado es independiente. Un check-in que falla al guardar no se puede provocar en la web (el almacén local vive en memoria), así que esa comprobación se verifica en Android, en el paso 7 de T008 (decisión del usuario del 2026-10-14). Anotar que la web no acredita persistencia, medición nativa ni comportamiento sin conexión. **CA-001, CA-002, CA-003, CA-004, CA-005, CA-006, CA-012, CA-013, CA-014.**

## Validación y cierre

- [ ] T008 Ejecutar el recorrido Android completo del plan (§8) en una development build o APK con cuentas sintéticas y backend local, y registrar el resultado de cada uno de los 14 pasos en `verification.md`. Si `measureInWindow` o la referencia de `ScalePress` no resolvieran bien en Android, aplicar el respaldo del plan (`View` envolvente con `collapsable={false}`) como cambio mínimo y repetir los pasos afectados. Ejecutar al final `npm run typecheck` y `npm test`. Completar el cierre de `verification.md`: resultado por criterio CA-001 a CA-014, limitaciones, verificaciones pendientes y estado de la spec. **Verificación:** los 14 pasos del recorrido ejecutados en Android con resultado real anotado; validaciones finales sin fallos nuevos. **CA-001 a CA-014.**

## Trazabilidad

| Tarea | Requisitos | Criterios |
| --- | --- | --- |
| T001 | Línea base | CA-011 |
| T002 | RF-002, RF-003 | CA-003, CA-004, CA-009 |
| T003 | RF-001, RF-006 | CA-002, CA-005, CA-006, CA-008 |
| T004 | RF-006 | CA-005, CA-006, CA-008 |
| T005 | RF-002 | CA-011 |
| T006 | RF-002, RF-003 | CA-003, CA-004, CA-010 |
| T009 | RF-002 | CA-003, CA-009 |
| T010 | RF-001, RF-003, RF-004, RF-005 | CA-004, CA-005, CA-006, CA-007, CA-013, CA-014 |
| T011 | RF-004, RF-006 | CA-005, CA-006, CA-008, CA-011 |
| T012 | RF-002 a RF-005 | CA-003, CA-004, CA-007, CA-010, CA-011, CA-014 |
| T007 | RF-001, RF-004 | CA-001 a CA-006, CA-012 a CA-014 |
| T008 | RF-001 a RF-006 | CA-001 a CA-014 |

## Estado de la entrega

Tareas de la revisión 0.2.0 aprobadas el 2026-10-14. Completas: T001 a T007 y T009 a T012
(resultados en `verification.md`).

**T008 queda sin marcar**, por decisión del usuario del 2026-10-14. El build nativo de Android no
compila en el equipo de desarrollo: Gradle falla al iniciar su daemon porque `Selector.open()` de Java
no puede crear su socket `AF_UNIX` en Windows (detalle en `verification.md`). Los 14 pasos del recorrido
Android, incluida la comprobación de un check-in que falla al guardar, siguen sin ejecutarse, y la
spec no puede cerrarse mientras no se haga esa validación (constitución, principio V).

# Tareas 010 — Tutorial de bienvenida

| Campo | Valor |
| --- | --- |
| Versión | 0.1.0 |
| Estado | APROBADAS |
| Fecha | 2026-10-13 |
| Spec | `spec.md` 0.1.0, APROBADA |
| Plan | `plan.md` 0.1.1, APROBADO |
| Constitución | 2.0.0 |
| Rama | `feature/tutorial` |
| Aprobación de tareas | Confirmada explícitamente por el usuario el 2026-10-13 |

## Reglas de ejecución

Ejecutar en orden y una tarea por vez, después de aprobar este documento. No
delegar ni paralelizar tareas. Toda verificación usa cuentas y datos sintéticos.

Una tarea se marca `[x]` cuando su cambio está completo, pasa su verificación
específica y el repositorio conserva las validaciones aplicables: `npm run
typecheck` y `npm test` sin fallos nuevos. Registrar cambio, comando o
recorrido, resultado y limitaciones en `verification.md`. Una prueba diferida a
otra tarea aparece como pendiente, nunca como ejecutada. La spec no se cierra
mientras quede pendiente la validación Android.

Estas tareas no autorizan commits, push, despliegues, migraciones, cambios de
backend ni datos reales. No agregan dependencias. No modifican `LoginScreen`,
`WelcomeIntro`, `AppHeader` ni el panel administrativo.

## Preparación

- [x] T001 Abrir `verification.md` con la línea base antes de cambiar código: versiones de Node y npm frente a las declaradas en `package.json`, resultado de `npm run typecheck` y `npm test`, rama y estado de Git, y disponibilidad de una development build o APK Android para la validación final. Registrar cualquier herramienta ausente sin sustituir una verificación por otra. **Verificación:** ambos comandos ejecutados y su resultado real anotado, incluidas las fallas previas si las hay. **CA-011.**

## Dominio y aplicación

- [x] T002 Crear `src/shared/tutorial/domain/tutorialSteps.ts` y `tutorialFlow.ts`. Los pasos siguen el orden y el contenido de RF-002: título y texto en español, elemento resaltado (`weekCard`, `checkin`, `agenda`, `events`, `wellness` o ninguno en el cierre), sin términos de diagnóstico ni tratamiento, y «sin conexión» solo para los teléfonos de apoyo. El flujo ofrece avance, retroceso, último paso, posición («Paso 2 de 6») y `backAction`. Sin React, Expo ni `@/`; imports relativos con extensión `.ts`. **Verificación:** `tests/tutorialSteps.test.mjs` (seis pasos en orden, ids y elementos únicos, textos no vacíos, cierre sin elemento, ausencia de términos clínicos) y `tests/tutorialFlow.test.mjs` (límites de avance y retroceso, posición, último paso, `backAction` en el primer paso y en uno intermedio); `typecheck` y `npm test`. **CA-003, CA-004, CA-009.**

- [x] T003 Crear `src/shared/tutorial/application/tutorialProgress.ts`: interfaces `KeyValueStorage`, `TutorialOwnerGateway` y `TutorialProgressStore`; `createTutorialProgressStore` con clave `duocmind.tutorial.seen.v1.<ownerId>` y validación de UUID; `resolveTutorialOffer` y `completeTutorial`. Un error de lectura o un propietario inválido o ausente no ofrece el recorrido; un error de escritura no se propaga. Sin React, Expo ni `@/`. **Verificación:** `tests/tutorialProgress.test.mjs` con almacenamiento simulado: aislamiento entre dos cuentas, `markSeen`, `isSeen` y `clear`, UUID inválido, propietario ausente, ya visto, error al leer el propietario y el estado, `completeTutorial` con escritura fallida, y una captura previa que marca a su propietario aunque la sesión cambie; `typecheck` y `npm test`. **CA-002, CA-005, CA-006, CA-008.**

## Infraestructura

- [x] T004 Crear `tutorialProgressStorage.ts` y `tutorialOwnerGateway.ts` en `src/shared/tutorial/infrastructure/`. El primero cablea `createTutorialProgressStore` con `platformSecureKeyValueStorage` y exporta `deleteTutorialProgress`, de mejor esfuerzo y sin propagar errores. El segundo lee `getSupabaseClient().auth.getSession()` y devuelve el identificador de usuario o `null`, sin registrar credenciales. Agregar `deleteTutorialProgress(userId)` a `clearLocalData` de `deleteCurrentAccount` en `supabaseAuthGateway.ts`, después de los borrados existentes; `signOut` no cambia. **Verificación:** `typecheck` y `npm test`; revisión de que ninguna clave, sesión ni identificador se registra en logs; la eliminación real de la clave queda como paso 10 del recorrido Android de T008. **CA-005, CA-006, CA-008.**

## Presentación

- [x] T005 Preparar los puntos de medición, sin cambiar el comportamiento visible. Agregar `tutorialStep: 300` a `motionDuration` en `motionTokens.ts`. Hacer que `ScalePress` acepte `ref?: Ref<View>` y lo pase a `AnimatedPressable`. Agregar a `BottomNav` la prop opcional `tutorialTargets` para las pestañas Agenda y Bienestar y el botón central; sin la prop, nada cambia. **Verificación:** `typecheck` y `npm test`; la previsualización web con `npm run web` muestra Inicio, Agenda, Bienestar y el botón central sin diferencias, comprobado con una cuenta sintética; la medición real en Android queda para T008. **CA-011.**

- [x] T006 Crear `useTutorial.ts` en `infrastructure/` y `components/TutorialOverlay.tsx`. El hook expone `visible`, `ownerId`, `offerAfterLogin`, `startManually`, `finish` y `skip`, descarta resoluciones tardías y marca con el propietario capturado al iniciar; `startManually` abre con `ownerId` nulo y no escribe. El componente es un `Modal` transparente que mide cada elemento con `measureInWindow`, dibuja el resalte con cuatro rectángulos y un borde, coloca la tarjeta arriba o abajo del elemento, centra el paso si no puede medirlo, y ofrece «Atrás», «Omitir», «Siguiente» y «Entendido» con `ScalePress` y objetivos de al menos 44 px. Incluye posición, foco y región viva de accesibilidad, y respeta `useReducedMotion` y los tokens de movimiento. **Verificación:** `typecheck` y `npm test`; el componente se monta en la previsualización web con los elementos de prueba de T007, sin errores de consola; el comportamiento nativo queda para T008. **CA-003, CA-004, CA-010.**

- [ ] T007 Integrar el tutorial en `DashboardScreen`. Envolver la tarjeta semanal y el botón de calendario en `View` sin estilo con `collapsable={false}` y referencia, pasar `tutorialTargets` a `BottomNav`, e incluir `<TutorialOverlay>` junto a `WelcomeIntro`. Llamar a `offerAfterLogin()` en `handleIntroDone` solo cuando el inicio viene del login (`welcome === '1'`). Antes de abrirlo, volver el `ScrollView` arriba y esperar un fotograma; con «Ver tutorial» esperar además `motionDuration.reveal + 5 × motionDuration.stagger`. Agregar el enlace «Ver tutorial de la app» bajo el enlace de apoyo, con `ScalePress`, 44 px mínimos y etiqueta accesible. **Verificación:** `typecheck` y `npm test`; en la previsualización web con una cuenta sintética nueva: login → bienvenida → seis pasos → «Entendido»; la recarga de la página y un segundo login no lo repiten dentro de la misma pestaña; el enlace lo inicia sin escribir estado. Anotar que la web no acredita persistencia ni medición nativa. **CA-001, CA-002, CA-003, CA-004, CA-007, CA-011.**

## Validación y cierre

- [ ] T008 Ejecutar el recorrido Android completo del plan (§8) en una development build o APK con cuentas sintéticas, y registrar el resultado de cada uno de los 11 pasos en `verification.md`. Si `measureInWindow` o la referencia de `ScalePress` no resolvieran bien en Android, aplicar el respaldo del plan (`View` envolvente con `collapsable={false}`) como cambio mínimo y repetir los pasos afectados. Ejecutar al final `npm run typecheck` y `npm test`. Completar el cierre de `verification.md`: resultado por criterio CA-001 a CA-011, limitaciones, verificaciones pendientes y estado de la spec. **Verificación:** los 11 pasos del recorrido ejecutados en Android con resultado real anotado; validaciones finales sin fallos nuevos. **CA-001 a CA-011.**

## Trazabilidad

| Tarea | Requisitos | Criterios |
| --- | --- | --- |
| T001 | Línea base | CA-011 |
| T002 | RF-002, RF-003 | CA-003, CA-004, CA-009 |
| T003 | RF-001, RF-005 | CA-002, CA-005, CA-006, CA-008 |
| T004 | RF-005 | CA-005, CA-006, CA-008 |
| T005 | RF-002 | CA-011 |
| T006 | RF-002, RF-003, RF-005 | CA-003, CA-004, CA-010 |
| T007 | RF-001, RF-003, RF-004 | CA-001, CA-002, CA-003, CA-004, CA-007, CA-011 |
| T008 | RF-001 a RF-005 | CA-001 a CA-011 |

## Estado de la entrega

Tareas aprobadas el 2026-10-13. T001 a T006 completadas (resultados en
`verification.md`). T007 sigue abierta: el código está integrado y el recorrido
manual se verificó en la web, pero falta el recorrido con login y una cuenta
sintética, que necesita un backend local. T008 pendiente.

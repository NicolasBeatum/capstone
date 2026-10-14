# Plan 010 — Tutorial de bienvenida

| Campo | Valor |
| --- | --- |
| Versión | 0.2.0 |
| Estado | APROBADO |
| Fecha | 2026-10-14 |
| Spec | `spec.md` 0.2.0, APROBADA el 2026-10-14 |
| Constitución | 2.0.0 |
| Rama | `feature/tutorial` |
| Aprobación del plan | 0.1.1: confirmada por el usuario el 2026-10-13. 0.2.0: confirmada explícitamente por el usuario el 2026-10-14 |

## 1. Decisiones y límites

El tutorial es un recorrido de seis pasos que vive sobre el inicio (`/dashboard`).
Los pasos 1 a 4 resaltan elementos que el inicio ya muestra y los explican en una
tarjeta. El paso 5 invita a registrar el primer check-in y, con «Registrar
ahora», abre la pantalla real de check-in. El paso 6, «Todo listo», aparece en el
inicio cuando la persona vuelve de guardar el registro.

Decisiones que siguen vigentes de la versión 0.1.1:

1. **Ubicación en `shared/tutorial/`.** `AGENTS.md` prohíbe que una funcionalidad
   importe archivos internos de otra; el tutorial toca `dashboard`, `emotional-checkin`,
   `BottomNav` y el borrado de cuenta de `auth`, igual que `shared/events` sirve a
   Eventos y Agenda.
2. **Superficie con `Modal` transparente de React Native** para los pasos 1 a 6. Da el
   bloqueo de toques, el foco de accesibilidad contenido y el botón Atrás de Android
   (`onRequestClose`) sin capas propias.
3. **Resalte sin dependencias nuevas:** cuatro rectángulos oscuros y un borde dorado
   alrededor del elemento medido con `measureInWindow`.
4. **Estado «ya visto» en `platformSecureKeyValueStorage`**, una clave por cuenta
   (SecureStore en Android; `sessionStorage` en web, que no acredita persistencia).
5. **Aparece solo al iniciar sesión.** Se evalúa cuando termina la bienvenida animada
   (`?welcome=1`); una sesión ya abierta nunca lo dispara.
6. **«Ver tutorial de la app» es un enlace al final del inicio.**
7. **Sin Jest ni React Native Testing Library.** La lógica se prueba con `node --test`
   y lo visual con un recorrido Android reproducible (§8).

Decisiones nuevas de la revisión 0.2.0:

8. **El estado del recorrido pasa a ser un objeto global** (`TutorialSession`), no estado
   de React de la pantalla. Es necesario porque el recorrido atraviesa una navegación:
   «Registrar ahora» abre `/checkin` y, al guardar, `CheckinScreen` hace
   `router.replace('/dashboard')`, que crea una instancia **nueva** del inicio. El
   estado de React del inicio original se perdería; el objeto global sobrevive y
   cualquier instancia enfocada del inicio muestra el paso que corresponde.
9. **La lógica es pura y testeable.** `TutorialSession` y `describeTutorial` viven en
   `application/`, sin React ni Expo; el cableado con el almacenamiento y la sesión
   vive en `infrastructure/`.
10. **Un solo cambio en `CheckinScreen`:** llamar a `notifyTutorialCheckinSaved(userId)`
    justo después de que `saveConfirmedCheckin` devuelve. Se hace antes de la espera de
    2,2 s del guardado, para que cerrar la app durante ella no repita el tutorial.
    La función nunca lanza.
11. **La repetición manual no registra ni marca.** El paso 5 es informativo y los pasos
    5 y 6 se recorren con «Siguiente» y «Entendido».
12. **«Omitir» marca la cuenta como vista** solo en el recorrido automático y solo en
    los pasos 1 a 5. El paso 6 no marca nada: la cuenta ya quedó marcada al guardar.

No se agregan dependencias, migraciones ni cambios de backend. El plan no autoriza
despliegues, commits ni push. Aprobado el plan, se revisa `tasks.md`; la implementación
sigue una tarea por vez después de aprobarlas.

## 2. Estado observado

- El login envía `router.replace({ pathname: '/dashboard', params: { welcome: '1' } })`
  (`LoginScreen.tsx:55`). `DashboardScreen` muestra `WelcomeIntro` y, al terminar,
  `handleIntroDone` limpia el parámetro y llama a `offerAfterLogin()`.
- Ya están implementados (tareas T001 a T006, con el recorrido anterior de seis pasos):
  `domain/tutorialSteps.ts`, `tutorialFlow.ts`, `tutorialLayout.ts`;
  `application/tutorialProgress.ts`; `infrastructure/tutorialProgressStorage.ts`,
  `tutorialOwnerGateway.ts`, `useTutorial.ts`; `components/TutorialOverlay.tsx`;
  `BottomNav.tutorialTargets`, `ScalePress.ref` y `motionDuration.tutorialStep`. El
  inicio ya integra el overlay y el enlace «Ver tutorial de la app» (T007, sin cerrar).
- `BottomNav` navega con `router.push`, así que el inicio queda montado bajo `/checkin`.
  Al guardar, `CheckinScreen` hace `router.replace('/dashboard')` tras 3,2 s, o antes si
  la persona toca «Continuar» en `SaveOverlay`.
- `CheckinScreen.handleSave` obtiene `userId`, guarda con `saveConfirmedCheckin` (que
  devuelve `syncStatus`: sincronizado o guardado local) y luego espera
  `MIN_SAVING_FEEDBACK_MS` antes de mostrar el agradecimiento. Sin conexión guarda en la
  outbox cifrada y también cuenta como guardado.
- `expo-router` exporta `useIsFocused` y `useFocusEffect`.
- `tests/` usa `node --test` sobre archivos `.ts` importados con extensión explícita y
  sin el alias `@/`.

## 3. Organización e interfaces

```
src/shared/tutorial/
├── domain/
│   ├── tutorialSteps.ts        # Los 6 pasos y su tipo (info, check-in, cierre)
│   ├── tutorialFlow.ts         # Avance, retroceso y posición; funciones puras
│   └── tutorialLayout.ts       # Medición y colocación de la tarjeta (ya existe)
├── application/
│   ├── tutorialProgress.ts     # Tienda «visto» por cuenta (ya existe)
│   └── tutorialSession.ts      # Máquina de estados del recorrido y su vista
├── infrastructure/
│   ├── tutorialProgressStorage.ts  # (ya existe)
│   ├── tutorialOwnerGateway.ts     # (ya existe)
│   ├── tutorialRuntime.ts      # Instancia única, vigilancia de la cuenta y aviso del check-in
│   └── useTutorial.ts          # Hook sobre la instancia única
└── components/
    └── TutorialOverlay.tsx     # Modal, resalte y tarjeta (ya existe; se adapta)
```

No hay rutas nuevas en `src/app/`.

### Dominio

`tutorialSteps.ts` conserva `TutorialTargetId` y agrega `kind: 'info' | 'checkin' | 'closing'`
a cada paso. Los pasos, en orden:

| # | `id` | `target` | `kind` |
| --- | --- | --- | --- |
| 1 | `inicio` | `weekCard` | `info` |
| 2 | `agenda` | `agenda` | `info` |
| 3 | `eventos` | `events` | `info` |
| 4 | `bienestar` | `wellness` | `info` |
| 5 | `registro` | `checkin` | `checkin` |
| 6 | `cierre` | — | `closing` |

El texto del paso 5 es neutro y no condiciona: explica el botón, que la persona elige y
puede corregir su emoción y que puede registrar ahora o más tarde. No sugiere una
emoción. El paso 6 conserva el aviso de dónde volver a ver el tutorial. Los textos de
Bienestar y de los demás pasos no cambian.

`tutorialFlow.ts` conserva `FIRST_STEP`, `nextStep`, `previousStep`, `isLastStep` y
`positionLabel`. Se elimina `backAction`: el manejo del botón Atrás pasa a la sesión,
que conoce el modo y la fase.

### Aplicación — `tutorialSession.ts`

```ts
export type TutorialPhase = 'closed' | 'steps' | 'awaitingCheckin' | 'closing';
export type TutorialMode = 'auto' | 'manual';
export interface TutorialState {
  phase: TutorialPhase;
  index: number;
  mode: TutorialMode;
  ownerId: string | null; // solo en modo automático
  generation: number;     // sube con cada reinicio
}
export interface TutorialView {
  step: TutorialStep;
  position: string;       // «Paso 2 de 6»
  canGoBack: boolean;
  canSkip: boolean;
  primary: { kind: 'next' | 'register' | 'finish'; label: string; accessibilityLabel: string };
}
```

`TutorialSession` es una clase sin dependencias de plataforma. Recibe
`onComplete(ownerId)` en el constructor y expone `subscribe`, `getSnapshot` y
`captureGeneration()`.

| Operación | Efecto |
| --- | --- |
| `openAuto(ownerId, generation)` | Abre el recorrido automático en el paso 1. Se ignora si la generación cambió. |
| `openManual()` | Abre el recorrido manual en el paso 1. No tiene cuenta. Se ignora si ya hay uno abierto. |
| `next()` / `back()` | Cambian de paso dentro de `steps`, con los límites de `tutorialFlow`. |
| `startCheckin()` | Solo en modo automático y en el paso 5: pasa a `awaitingCheckin` y devuelve `true`. En cualquier otro caso, `false`. |
| `returnWithoutSaving()` | Si la fase es `awaitingCheckin`, vuelve a `steps` en el paso 5. |
| `checkinSaved(userId)` | Si la fase es `awaitingCheckin` y el `userId` coincide con `ownerId`: llama a `onComplete(ownerId)` y pasa a `closing` (paso 6). Si no coincide: cierra sin llamar a `onComplete`. En cualquier otra fase no hace nada. |
| `skip()` | Cierra. En modo automático, fase `steps`, llama antes a `onComplete(ownerId)`. En `closing` y en modo manual no marca nada. |
| `finish()` | Cierra, sin marcar: `Entendido` solo existe en `closing` y en el paso 6 manual. |
| `systemBack()` | `back()` si `canGoBack`; si no, `skip()`. |
| `accountChanged(userId)` | Si no hay cuenta (`null`) o es distinta de `ownerId`, reinicia. En modo manual solo reinicia ante `null`. |
| `reset()` | Cierra, borra la cuenta y sube la generación. |

`describeTutorial(state)` devuelve `TutorialView | null` (`null` si la fase es `closed`
o `awaitingCheckin`). Reglas:

- `canGoBack`: fase `steps` y paso intermedio (del 2 al 5).
- `canSkip`: fase `steps` y paso del 1 al 5.
- `primary`: `register` («Registrar ahora») en el paso 5 del modo automático; `finish`
  («Entendido») en el paso 6 y en la fase `closing`; `next` («Siguiente») en el resto.

Los `accessibilityLabel` son «Ir al paso N», «Registrar ahora, abrir el check-in» y
«Entendido, terminar el tutorial».

### Infraestructura

- `tutorialRuntime.ts` crea la instancia única `tutorialSession` con
  `onComplete = (ownerId) => completeTutorial(tutorialProgressStore, ownerId)`.
  Exporta además:
  - `watchTutorialAccount()`: suscribe una sola vez a `getSupabaseClient().auth.onAuthStateChange`
    y llama a `tutorialSession.accountChanged(userId)` en cada evento. No lanza si la
    configuración falta.
  - `notifyTutorialCheckinSaved(userId)`: llama a `tutorialSession.checkinSaved(userId)`
    dentro de un `try/catch` vacío; un fallo del tutorial nunca puede afectar al
    check-in.
- `useTutorial()` reescribe el hook anterior sobre la instancia única, con
  `useSyncExternalStore`. Devuelve `{ state, view, visible, offerAfterLogin,
  startManually, next, back, skip, finish, systemBack, registerNow,
  returnWithoutSaving }`. `offerAfterLogin` captura la generación, resuelve la oferta
  con `resolveTutorialOffer` y llama a `openAuto(owner, generación)`; si entretanto la
  sesión cambió, se descarta. Llama a `watchTutorialAccount()` al montarse.

### Presentación — `TutorialOverlay`

Recibe `visible`, `view` (`TutorialView | null`), `targets`, `onPrimary`, `onBack`,
`onSkip` y `onSystemBack`. Los cambios sobre la versión actual:

- Los botones salen de `view`: «Omitir» solo si `canSkip`, «Atrás» solo si `canGoBack` y
  la acción principal con la etiqueta de `view.primary`.
- `onRequestClose` llama a `onSystemBack`.
- La posición sale de `view.position`.
- No cambia nada de medición, resalte, colocación, accesibilidad ni movimiento.

## 4. Integración con las pantallas existentes

### `DashboardScreen`

- Usa el nuevo `useTutorial()`. `visible` del overlay es `tutorial.visible && useIsFocused()`,
  para que la instancia del inicio que queda bajo `/checkin` no muestre un segundo
  `Modal`.
- `useFocusEffect` llama a `tutorial.returnWithoutSaving()`: al volver sin guardar, el
  paso 5 reaparece. Si la fase no es `awaitingCheckin`, no hace nada.
- `onPrimary` según `view.primary.kind`: `next` → `tutorial.next()`; `register` →
  `if (tutorial.registerNow()) router.push('/checkin')`; `finish` → `tutorial.finish()`.
- El resto se mantiene: referencias a los elementos, vuelta del `ScrollView` arriba,
  `offerAfterLogin()` en `handleIntroDone` y el enlace «Ver tutorial de la app».

### `CheckinScreen`

Tras `const result = await saveConfirmedCheckin(...)` se agrega
`notifyTutorialCheckinSaved(userId)`. No cambia ninguna otra línea, ni el aspecto ni la
lógica del guardado. Importa desde `@/shared/tutorial/infrastructure/tutorialRuntime`.

### Sin cambios

`LoginScreen`, `WelcomeIntro`, rutas, backend, `AppHeader`, `BottomNav`, `ScalePress` y
`supabaseAuthGateway` (la limpieza de la marca al borrar la cuenta ya está hecha).

## 5. Estados y casos límite

| Situación | Tratamiento |
| --- | --- |
| Cuenta nueva, primer login | Bienvenida → `offerAfterLogin` → `openAuto` → paso 1. |
| Cuenta que ya lo vio | `resolveTutorialOffer` devuelve `null`; solo bienvenida. |
| Sesión ya abierta o recarga web | `welcome` no es `'1'`; no se evalúa. |
| «Registrar ahora» | Fase `awaitingCheckin`; el overlay se oculta y se abre `/checkin`. |
| Check-in guardado | `checkinSaved` marca la cuenta, fase `closing`; el inicio nuevo muestra el paso 6. |
| Check-in guardado sin conexión | Igual: `saveConfirmedCheckin` devuelve guardado local. |
| Check-in que falla | No se llama a `checkinSaved`; sigue `awaitingCheckin`. |
| Volver del check-in sin guardar | El inicio enfoca, `returnWithoutSaving` → paso 5. |
| Guardar con otra cuenta | `checkinSaved` no coincide: se cierra sin marcar ni mostrar el paso 6. |
| Cierre de sesión durante el recorrido | `onAuthStateChange` → `accountChanged(null)` → `reset()`; no queda estado para la siguiente cuenta. |
| Una oferta que se resuelve tras cambiar de cuenta | La generación cambió: `openAuto` se ignora. |
| App cerrada antes de guardar | Nada se escribió; se ofrece en el próximo login. |
| App cerrada tras guardar y antes del paso 6 | La cuenta ya quedó marcada; no se vuelve a ofrecer. |
| Error al leer propietario o estado | No se ofrece; el enlace sigue disponible. |
| Error al escribir «visto» | El recorrido continúa igual; se ofrece de nuevo en el próximo login. |
| Elemento no medible o fuera de pantalla | Paso centrado sin resalte. |
| Movimiento reducido | Sin fundidos; los pasos cambian de inmediato. |
| «Ver tutorial» | Modo manual: sin cuenta, sin check-in, sin escritura; termina en el paso 6. |

## 6. Modelo de amenazas y riesgos

El tutorial no lee, copia ni guarda la emoción registrada. El único dato que conserva es
la marca «visto» asociada al identificador de cuenta, que no se registra en logs ni sale
del dispositivo. El check-in sigue su flujo normal y sus protecciones.

- **Marca en la cuenta equivocada.** Se mitiga marcando solo al coincidir `userId` con la
  cuenta capturada, reiniciando la sesión al cerrar sesión y descartando ofertas de otra
  generación. Se prueba con `tutorialSession.test.mjs`.
- **Estado global que sobrevive a la pantalla.** Es una consecuencia buscada (decisión 8)
  y un riesgo: un recorrido a medias podría reaparecer ante otra cuenta. Lo cubre
  `accountChanged`. El riesgo residual es que `onAuthStateChange` no se haya suscrito;
  `useTutorial` lo suscribe al montarse el inicio, que ocurre antes de abrir el
  recorrido.
- **Presión para registrar.** El texto no condiciona, «Omitir» está disponible en el paso
  5 y el recorrido manual nunca registra (constitución, principio I).
- **El tutorial interfiere con el check-in.** El aviso es un `try/catch` vacío que no
  espera ni modifica nada; si falla, el check-in no lo percibe.
- **Dos overlays a la vez.** El inicio original queda bajo `/checkin` y el nuevo se monta
  tras `replace`; `useIsFocused` evita el segundo `Modal`. Se verifica en Android.
- **Medición incorrecta en Android.** Sigue siendo el riesgo principal; mitigado con el
  recorrido Android obligatorio y el paso centrado como degradación segura.
- **`ref` en `ScalePress`.** Con el respaldo de envolver en un `View` si no resolviera.
- **Interferencia con la bienvenida.** El recorrido solo se abre dentro de
  `handleIntroDone`.
- **Cuentas existentes ven el tutorial una vez.** Decisión 5 de la spec 0.1.0.
- **Datos reales.** Toda prueba que registre un check-in usa cuentas y datos sintéticos.

## 7. Cobertura de la spec

| Requisito | Decisión y componente |
| --- | --- |
| RF-001 | `resolveTutorialOffer`, `handleIntroDone`, `openAuto`, clave por cuenta |
| RF-002 | `tutorialSteps.ts`, `describeTutorial`, `TutorialOverlay` |
| RF-003 | `describeTutorial` (botones), `TutorialSession.skip/systemBack`, `onRequestClose` |
| RF-004 | `startCheckin`, `checkinSaved`, `returnWithoutSaving`, `notifyTutorialCheckinSaved` |
| RF-005 | Enlace «Ver tutorial de la app», `openManual` sin cuenta |
| RF-006 | `createTutorialProgressStore`, `deleteTutorialProgress`, sin red |

## 8. Verificación y trazabilidad

Pruebas automatizadas (`node --test`, con datos sintéticos y almacenamiento simulado):

- `tests/tutorialSteps.test.mjs` (se actualiza): seis pasos en el orden de la spec, el 5
  de tipo `checkin` con elemento `checkin` y el 6 de tipo `closing` sin elemento; ids y
  elementos únicos; textos no vacíos; sin términos clínicos; «sin conexión» solo en
  Bienestar; el paso 5 no sugiere emociones ni usa lenguaje obligatorio; el paso 6 indica
  dónde volver a ver el tutorial.
- `tests/tutorialFlow.test.mjs` (se actualiza): sin `backAction`; avance, retroceso,
  último paso y posición sobre seis pasos.
- `tests/tutorialSession.test.mjs` (nuevo): apertura automática y manual; límites de
  `next`/`back`; `describeTutorial` para cada paso, modo y fase; `startCheckin` solo en
  automático y en el paso 5; `returnWithoutSaving`; `checkinSaved` con la misma cuenta
  (marca una vez y pasa a `closing`), con otra cuenta y fuera de `awaitingCheckin`;
  `skip` marca solo en automático y en `steps`; `finish` nunca marca; `systemBack` en
  pasos intermedios, en el primero y en `closing`; `accountChanged` con `null`, otra
  cuenta y la misma; `generation` y una `openAuto` tardía; el modo manual nunca llama a
  `onComplete`; los suscriptores se notifican.
- `tests/tutorialProgress.test.mjs`, `tests/tutorialLayout.test.mjs`: sin cambios.

Comprobaciones de tipos y regresión: `npm run typecheck` y `npm test`.

Recorrido en Android (development build o APK, con cuentas sintéticas y backend local),
registrado en `specs/010-tutorial/verification.md`:

1. Cuenta nueva: login, bienvenida, pasos 1 a 5 con resalte correcto, «Registrar ahora»,
   check-in real, agradecimiento y paso 6 en el inicio; «Entendido» cierra.
2. El check-in aparece en el historial y en «Vistazo de tu semana».
3. Segundo login y reapertura con sesión activa: sin tutorial.
4. «Omitir» en cada uno de los pasos 1 a 5, y que en el 5 no abra el check-in.
5. Botón Atrás del sistema en el paso 1, en uno intermedio, en el 5 y en el 6.
6. Volver del check-in sin guardar (Atrás y barra de navegación): reaparece el paso 5.
7. Check-in que falla al guardar: el tutorial no se completa.
8. Check-in guardado sin conexión (modo avión): se completa y aparece el paso 6.
9. Cierre de la app antes de guardar: se ofrece en el próximo login; cierre tras guardar:
   no se ofrece.
10. Dos cuentas en el mismo dispositivo, con estados independientes, y cierre de sesión a
    mitad del recorrido.
11. «Ver tutorial de la app» tras completarlo: seis pasos, sin check-in ni cambios de
    estado.
12. Movimiento reducido, texto al 200 %, pantalla estrecha, rotación y TalkBack; un solo
    overlay visible con el inicio apilado bajo el check-in.
13. Eliminación de cuenta sintética: la clave local queda borrada.
14. La bienvenida, el inicio, el check-in y las pestañas se comportan como antes.

| Criterio | Comprobación |
| --- | --- |
| CA-001 | Recorrido 1; `openAuto` solo desde `handleIntroDone` |
| CA-002 | Recorrido 3; `resolveTutorialOffer` en `tutorialProgress.test.mjs` |
| CA-003 | `tutorialSteps.test.mjs` y recorrido 1 |
| CA-004 | `tutorialSession.test.mjs` (`describeTutorial`, `systemBack`) y recorrido 5 |
| CA-005 | `tutorialSession.test.mjs`, `tutorialProgress.test.mjs` y recorrido 9 |
| CA-006 | `tutorialSession.test.mjs` (`checkinSaved`, `accountChanged`) y recorrido 10 |
| CA-007 | `tutorialSession.test.mjs` (modo manual) y recorrido 11 |
| CA-008 | `tutorialProgress.test.mjs` (fallos) y recorrido 8 |
| CA-009 | `tutorialSteps.test.mjs` y revisión de contenido contra el principio I |
| CA-010 | Recorrido 12 |
| CA-011 | `npm test`, `npm run typecheck` y recorrido 14 |
| CA-012 | Recorridos 1 y 2 |
| CA-013 | `tutorialSession.test.mjs` y recorridos 6 y 7 |
| CA-014 | `tutorialSession.test.mjs` y recorrido 4 |

## 9. Reversión

Revertir el commit del incremento. No hay migraciones, dependencias ni cambios remotos.
Las marcas guardadas en dispositivos son inertes y desaparecen al desinstalar la app. El
único cambio en `CheckinScreen` es una llamada que se puede quitar sin efecto sobre el
guardado; las modificaciones de `ScalePress` y `BottomNav` son aditivas.

## 10. Fuentes y estado de la entrega

Fuentes: `AGENTS.md`, `docs/constitution.md` 2.0.0, `specs/010-tutorial/spec.md` 0.2.0 y el
código citado en §2.

Estado: la revisión 0.2.0 del plan fue aprobada el 2026-10-14. No se ha escrito código de
esta revisión. Las tareas T001 a T006 corresponden a la versión 0.1.1; las partes que cambian
(`tutorialSteps.ts`, `tutorialFlow.ts`, `useTutorial.ts` y `TutorialOverlay.tsx`) se
modificarán con tareas nuevas en `tasks.md`, no reabriendo las completadas.

### Historial de revisiones

- **0.1.1 — 2026-10-13:** `useTutorial.ts` pasa a `infrastructure/`. Aprobada.
- **0.2.0 — 2026-10-14:** sesión global del recorrido, check-in como paso 5 interactivo,
  paso 6 de cierre, aviso desde `CheckinScreen`, y recorridos de verificación
  ampliados. Aprobada el 2026-10-14.

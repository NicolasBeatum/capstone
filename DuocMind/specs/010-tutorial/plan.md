# Plan 010 — Tutorial de bienvenida

| Campo | Valor |
| --- | --- |
| Versión | 0.1.0 |
| Estado | APROBADO |
| Fecha | 2026-10-13 |
| Spec | `spec.md` 0.1.0, APROBADA el 2026-10-13 |
| Constitución | 2.0.0 |
| Rama | `feature/tutorial` |
| Aprobación del plan | Confirmada explícitamente por el usuario el 2026-10-13 |

## 1. Decisiones y límites

El tutorial es un recorrido que vive sobre el inicio (`/dashboard`). No agrega
rutas ni navega a otras pantallas: resalta elementos que el inicio ya muestra
(tarjeta semanal, calendario del encabezado, botón central y pestañas Agenda y
Bienestar) y explica cada uno en una tarjeta.

Decisiones:

1. **Ubicación en `shared/tutorial/`.** El inicio lo muestra, pero `AGENTS.md`
   prohíbe que una funcionalidad importe archivos internos de otra y pide mover
   a `shared/` lo que usan varias. El tutorial toca `dashboard`, `BottomNav` y
   el borrado de cuenta de `auth`, igual que `shared/events` sirve a Eventos y
   Agenda.
2. **Superficie con `Modal` transparente de React Native.** Ya se usa en
   `NotificationsModal` y `AppHeader`. En Android entrega gratis el bloqueo de
   toques, el foco de accesibilidad contenido en el recorrido y el botón Atrás
   (`onRequestClose`). Evita una capa propia con `BackHandler` y
   `importantForAccessibility` sobre el resto de la pantalla.
3. **Resalte sin dependencias nuevas.** Cuatro rectángulos oscuros alrededor del
   elemento y un borde dorado (`#f2c14e`, el color del botón central) dibujan el
   foco. Los elementos se miden con `measureInWindow`, como ya hace
   `WelcomeIntro`.
4. **Estado «ya visto» en `platformSecureKeyValueStorage`**, una clave por
   cuenta. En Android es SecureStore (cifrado). En la previsualización web es
   `sessionStorage`, así que allí el estado dura solo la pestaña; la web no
   acredita esta persistencia (constitución IV).
5. **Aparece solo en el inicio de sesión.** «Acceso» en la spec se interpreta como
   inicio de sesión: el tutorial se evalúa cuando termina la bienvenida animada
   (`?welcome=1`). Una sesión que ya estaba abierta nunca lo dispara (RF-001.3).
   Si la persona cerró la app a mitad del recorrido, se le ofrece en su siguiente
   inicio de sesión (RF-001.4). Quien nunca cierra sesión y lo dejó a medias puede
   verlo con «Ver tutorial».
6. **«Ver tutorial» es un enlace al final del inicio**, bajo «Ver recursos de
   apoyo». Elegí esta ubicación en lugar de las dos que mencionaba la spec:
   el menú de perfil (`AppHeader`) solo existe hoy en la vista provisoria de
   Pendientes, el avatar del inicio no es tocable y Bienestar no es un lugar
   natural. El enlace inicia el recorrido sin navegar.
7. **La repetición manual no escribe nada** (RF-004.2). Solo el recorrido
   automático registra «ya visto».
8. **Sin Jest ni React Native Testing Library.** `npm test` es `node --test` y
   ninguna de las dos está instalada. Instalarlas es un cambio de herramientas de
   prueba fuera de este incremento. La lógica se prueba en el dominio y la
   aplicación con `node --test`; el comportamiento visual se comprueba con un
   recorrido Android reproducible (§8). Esto cambia el medio de comprobación de
   CA-003 y CA-004 respecto de la spec, no su resultado observable.

No se agregan dependencias, migraciones ni cambios de backend. El plan no autoriza
despliegues, commits ni push. Aprobado el plan, se redacta `tasks.md`; la
implementación comienza después de aprobar esas tareas y sigue una tarea por vez.

## 2. Estado observado

- El login envía `router.replace({ pathname: '/dashboard', params: { welcome: '1' } })`
  (`LoginScreen.tsx:55`). `DashboardScreen` muestra `WelcomeIntro` y, al
  terminar, `handleIntroDone` limpia el parámetro.
- Los accesos a Eventos (`CalendarIcon`) y a la campana están en el encabezado
  del inicio. La tarjeta «Vistazo de tu semana» usa datos reales (spec 008).
  «Clase en curso» y «Se viene» siguen siendo datos de muestra, por lo que el
  tutorial no los presenta.
- `BottomNav` renderiza las pestañas con `ScalePress` y un botón central con
  `accessibilityLabel` «Registrar cómo te sientes». No expone referencias.
- `ScalePress` no reenvía una referencia. React 19 entrega `ref` como prop a
  los componentes de función, y `...rest` ya llega a `Pressable`.
- Bienestar muestra herramientas rápidas sin acción, el test mensual y
  «Ver líneas de ayuda». Los teléfonos de `CrisisResourcesScreen` son una lista
  estática incluida en la app, por lo que se ven sin conexión. Solo se afirma
  eso del apoyo, no de las herramientas.
- `supabaseAuthGateway.deleteCurrentAccount` limpia datos locales de eventos y
  del registro emocional antes de borrar la cuenta remota.
- `tests/` usa `node --test` sobre archivos `.ts` importados con extensión
  explícita y sin el alias `@/`; la lógica que se pruebe no puede importar React,
  Expo ni `@/`.

## 3. Organización e interfaces

```
src/shared/tutorial/
├── domain/
│   ├── tutorialSteps.ts        # Los 6 pasos: id, título, texto, elemento resaltado
│   └── tutorialFlow.ts         # Avance, retroceso y posición; funciones puras
├── application/
│   └── tutorialProgress.ts     # Interfaces, tienda por cuenta y casos de uso
├── infrastructure/
│   ├── useTutorial.ts          # Estado del recorrido; cablea gateways (como eventRuntime)
│   ├── tutorialProgressStorage.ts  # Cablea SecureStore/sessionStorage
│   └── tutorialOwnerGateway.ts     # Lee la cuenta con sesión guardada
└── components/
    └── TutorialOverlay.tsx     # Modal, resalte y tarjeta
```

No hay rutas nuevas en `src/app/`.

### Dominio

`tutorialSteps.ts` exporta `TutorialTargetId = 'weekCard' | 'checkin' | 'agenda' |
'events' | 'wellness'` y `TUTORIAL_STEPS: readonly TutorialStep[]` con
`{ id, title, body, target: TutorialTargetId | null }`. Los textos de la spec
(RF-002.1) se redactan allí, en español, con el principio I de la constitución:
sin diagnóstico ni promesas, y la emoción registrada es editable. El paso de
Bienestar afirma «sin conexión» solo para los teléfonos de apoyo.

`tutorialFlow.ts` exporta `firstStep`, `nextStep(index, total)`,
`previousStep(index)`, `isLastStep`, `positionLabel(index, total)`
(«Paso 2 de 6»), y `backAction(index)`, que devuelve `'previous'` o `'skip'`
para el botón Atrás del sistema (RF-003.4).

### Aplicación

```ts
export interface KeyValueStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  deleteItem(key: string): Promise<void>;
}
export interface TutorialOwnerGateway { currentOwner(): Promise<string | null>; }
export interface TutorialProgressStore {
  isSeen(ownerId: string): Promise<boolean>;
  markSeen(ownerId: string): Promise<void>;
  clear(ownerId: string): Promise<void>;
}
```

- `createTutorialProgressStore(storage)`: clave
  `duocmind.tutorial.seen.v1.<ownerId>`, valor `'seen'`. Antes de usar el
  `ownerId` verifica que sea un UUID; si no lo es, lanza error. Los caracteres
  de la clave son válidos para SecureStore.
- `resolveTutorialOffer(owners, store)`: devuelve el `ownerId` si debe ofrecerse
  y `null` en cualquier otro caso: sin cuenta, `ownerId` inválido, ya visto o
  error de lectura del propietario o del estado (RF-005.4: ante un fallo no se
  muestra de forma automática).
- `completeTutorial(store, ownerId)`: llama a `markSeen` y traga el error. Un
  fallo de escritura no bloquea el cierre (RF-005.4); se ofrece de nuevo en el
  siguiente inicio de sesión.
- `useTutorial()` (en `infrastructure/`, porque cablea las implementaciones; ver
  revisión 0.1.1): expone `{ visible, ownerId, offerAfterLogin(), startManually(),
  finish(), skip() }`. `offerAfterLogin` captura el propietario y abre el
  recorrido; `startManually` abre con `ownerId = null`. `finish` y `skip` cierran
  de inmediato y, si hay `ownerId`, llaman a `completeTutorial`. Una resolución
  tardía tras desmontar la pantalla se descarta. Marcar usa el propietario
  capturado al iniciar, nunca la sesión actual, por lo que un cambio de cuenta no
  marca la cuenta equivocada (RF-001.5).

### Infraestructura

- `tutorialProgressStorage.ts` exporta `tutorialProgressStore` y
  `deleteTutorialProgress(ownerId)`. Ambos usan `platformSecureKeyValueStorage`.
  `deleteTutorialProgress` es de mejor esfuerzo: captura sus errores, porque no
  se debe abortar el borrado de la cuenta por una marca no sensible.
- `tutorialOwnerGateway.ts` lee `getSupabaseClient().auth.getSession()` y devuelve
  `session.user.id` o `null`. Cualquier error se propaga a `resolveTutorialOffer`,
  que lo trata como «no ofrecer». No se leen ni registran credenciales.

### Presentación

`TutorialOverlay` recibe `steps`, `targets: Record<TutorialTargetId,
RefObject<View | null>>`, `onNext`, `onBack`, `onSkip`, `onFinish`, `index` y
`visible`.

- Un `Modal` con `transparent`, `statusBarTranslucent` y `animationType="none"`.
  `onRequestClose` aplica `backAction`.
- Al mostrar un paso mide su elemento con `measureInWindow`. Si no hay referencia,
  el tamaño es cero o el rectángulo no cabe en la ventana visible, el paso se
  muestra centrado y sin resalte (RF-002, casos límite). Se vuelve a medir al
  cambiar de paso y cuando cambian `width`, `height` o `fontScale`
  (`useWindowDimensions`).
- La tarjeta va debajo del elemento si este está en la mitad superior y encima
  si está en la inferior, con márgenes de 16 px y ancho máximo de 420 px. El
  texto va en un `ScrollView` con altura máxima del 45 % de la ventana para que
  con texto ampliado los botones sigan a la vista.
- Botones con `ScalePress` y `minHeight`/`minWidth` de 44. Orden: «Atrás»
  (desde el paso 2), «Omitir» y «Siguiente» o «Entendido».
- Accesibilidad: el título tiene `accessibilityRole="header"`; la tarjeta usa
  `accessibilityLiveRegion="polite"` y, en cada paso, el foco pasa al título con
  `AccessibilityInfo.setAccessibilityFocus`. La etiqueta incluye la posición. El
  resalte es decorativo (`accessibilityElementsHidden`,
  `importantForAccessibility="no-hide-descendants"`).
- Movimiento: fundido de entrada del recorrido con `motionDuration.reveal`
  y fundido del contenido en cada paso con un token nuevo
  `motionDuration.tutorialStep` (300 ms, curva `calm`, sin rebote), agregado a
  `motionTokens.ts`. Con `useReducedMotion` no hay fundidos: todo aparece de
  inmediato.

## 4. Integración con las pantallas existentes

### `DashboardScreen`

- Referencias `weekCardRef` y `eventsRef` sobre dos `View` sin estilo con
  `collapsable={false}` que envuelven la tarjeta semanal y el botón de
  calendario. Una referencia a un `View` sin estilo no altera el diseño.
- `useTutorial()` y `<TutorialOverlay>` junto a `WelcomeIntro`.
- En `handleIntroDone`, si el inicio vino del login (`welcome === '1'`), se llama a
  `offerAfterLogin()`. El parámetro se limpia como hoy.
- Antes de abrir el recorrido, un `ScrollView` con referencia vuelve arriba
  (`scrollTo({ y: 0, animated: false })`) y se espera un fotograma, para que los
  elementos estén en su sitio. El recorrido automático empieza tras la bienvenida,
  cuando las entradas escalonadas de `Reveal` ya terminaron. Con «Ver tutorial»
  la espera es de `motionDuration.reveal + 5 × motionDuration.stagger`.
- Enlace «Ver tutorial de la app» bajo el enlace de apoyo, con `ScalePress`,
  `minHeight` de 44 y `accessibilityLabel` «Ver tutorial de la app». Invoca
  `startManually()`.

### `BottomNav`

Prop opcional `tutorialTargets?: Partial<Record<'agenda' | 'wellness' |
'checkin', RefObject<View | null>>>`. Cada `ScalePress` correspondiente recibe
`ref`. Sin la prop no cambia nada, así que las demás pantallas no se tocan.

### `ScalePress`

Acepta `ref?: Ref<View>` y lo pasa a `AnimatedPressable`. Es un cambio aditivo.
Si en Android la referencia no resolviera `measureInWindow`, el respaldo es
envolver cada elemento en un `View` con `collapsable={false}`; se decide en la
tarea correspondiente según la comprobación en el dispositivo.

### Eliminación de cuenta

`supabaseAuthGateway.deleteCurrentAccount` agrega
`await deleteTutorialProgress(userId)` a `clearLocalData`, después de los
borrados existentes. `signOut` no lo borra: el estado se conserva para el
siguiente acceso de su propietario (RF-005).

### Sin cambios

`LoginScreen`, `WelcomeIntro`, rutas, backend, `AppHeader` y el resto de pantallas.

## 5. Estados y casos límite

| Situación | Tratamiento |
| --- | --- |
| Cuenta nueva, primer login | Bienvenida → `offerAfterLogin` → paso 1. |
| Cuenta que ya lo vio | `resolveTutorialOffer` devuelve `null`; solo bienvenida. |
| Sesión ya abierta o recarga web | `welcome` no es `'1'`; no se evalúa. |
| App cerrada a mitad del recorrido | Nada se escribió; se ofrece en el próximo login. |
| Error al leer propietario o estado | No se ofrece; el enlace sigue disponible. |
| Error al escribir «visto» | El recorrido se cierra igual; se ofrece en el próximo login. |
| Elemento no medible o fuera de pantalla | Paso centrado sin resalte. |
| Rotación o texto ampliado | Se vuelve a medir y la tarjeta se reubica. |
| Cuenta distinta durante el recorrido | Al cerrar sesión el inicio se desmonta y el recorrido se descarta sin escribir; lo marcado usa el propietario capturado. |
| Movimiento reducido | Sin fundidos; los pasos cambian de inmediato. |
| «Ver tutorial» | `ownerId = null`: no se lee ni se escribe estado. |

## 6. Modelo de amenazas y riesgos

El tutorial no maneja datos emocionales, credenciales ni datos personales. El
único dato que conserva es una marca «visto» asociada al identificador de cuenta,
que no se registra en logs ni sale del dispositivo.

- **Marca en la cuenta equivocada.** Se mitiga marcando con el propietario
  capturado al iniciar, y verificando en `tutorialProgress.test.mjs` que una cuenta
  no afecta a otra.
- **Clave arbitraria en el almacenamiento.** Se valida el UUID antes de construir
  la clave.
- **Medición incorrecta en Android.** Es el riesgo principal: `measureInWindow`
  con `Modal` y `statusBarTranslucent` puede desplazar el resalte. Se mitiga
  con un recorrido Android obligatorio en la barra de estado y la navegación
  actuales, y con el paso centrado como degradación segura.
- **`ref` en `ScalePress`.** Se mitiga con el respaldo descrito en §4.
- **Interferencia con la bienvenida.** El recorrido solo se abre dentro de
  `handleIntroDone`, nunca mientras `introVisible` sea verdadero.
- **Marca perdida al borrar cuenta.** El borrado es de mejor esfuerzo y su fallo
  no aborta la eliminación; la marca restante es un UUID sin datos y su cuenta
  ya no existe.
- **Cuentas existentes ven el tutorial una vez.** Es la decisión 5 de la spec.

## 7. Cobertura de la spec

| Requisito | Decisión y componente |
| --- | --- |
| RF-001 | `resolveTutorialOffer`, `handleIntroDone`, clave por cuenta |
| RF-002 | `tutorialSteps.ts` (contenido y orden), `TutorialOverlay` (resalte) |
| RF-003 | `tutorialFlow.ts`, `Modal.onRequestClose`, `useTutorial` |
| RF-004 | Enlace «Ver tutorial de la app», `startManually` sin escritura |
| RF-005 | `createTutorialProgressStore`, `deleteTutorialProgress`, sin red |

## 8. Verificación y trazabilidad

Pruebas automatizadas (`node --test`, con datos sintéticos y almacenamiento
simulado):

- `tests/tutorialSteps.test.mjs`: seis pasos en el orden de RF-002, ids y
  elementos únicos, textos en español no vacíos, el paso de cierre sin elemento y
  ningún texto con términos de diagnóstico o tratamiento.
- `tests/tutorialFlow.test.mjs`: límites de avance y retroceso, posición, último
  paso y `backAction`.
- `tests/tutorialProgress.test.mjs`: aislamiento entre dos cuentas, `markSeen` e
  `isSeen`, UUID inválido, `resolveTutorialOffer` ante cuenta ausente, ya visto,
  error de lectura y error de propietario, `completeTutorial` con escritura que
  falla, `clear`, y que una captura previa marque a su propietario aunque la
  sesión cambie.

Comprobaciones de tipos y regresión: `npm run typecheck` y `npm test`, incluidas
las pruebas existentes.

Recorrido en Android (development build o APK, con cuentas sintéticas y Supabase
local), registrado en `specs/010-tutorial/verification.md`:

1. Cuenta nueva: login, bienvenida, seis pasos con resalte correcto en cada
   elemento y cierre con «Entendido».
2. Segundo login de la misma cuenta, y reapertura con sesión activa: sin tutorial.
3. «Omitir» en cada paso, y botón Atrás del sistema en el paso 1 y en uno
   intermedio.
4. Cierre de la app a mitad del recorrido y nuevo login: vuelve al paso 1.
5. Dos cuentas en el mismo dispositivo con estados independientes.
6. «Ver tutorial de la app» tras haberlo completado, sin cambios de estado.
7. Modo avión durante todo el recorrido.
8. Movimiento reducido, texto al 200 %, pantalla estrecha, rotación y TalkBack.
9. Tema claro y oscuro.
10. Eliminación de cuenta sintética: la clave local queda borrada.
11. La bienvenida, el inicio y las pestañas se comportan como antes.

| Criterio | Comprobación |
| --- | --- |
| CA-001 | Recorrido 1; orden de aparición por construcción en `handleIntroDone` |
| CA-002 | Recorrido 2; `resolveTutorialOffer` en `tutorialProgress.test.mjs` |
| CA-003 | `tutorialSteps.test.mjs` y recorrido 1 |
| CA-004 | `tutorialFlow.test.mjs` y recorrido 3 |
| CA-005 | `tutorialProgress.test.mjs` y recorrido 4 |
| CA-006 | `tutorialProgress.test.mjs` y recorrido 5 |
| CA-007 | Recorrido 6 |
| CA-008 | `tutorialProgress.test.mjs` (fallos) y recorrido 7 |
| CA-009 | `tutorialSteps.test.mjs` y revisión de contenido contra el principio I |
| CA-010 | Recorrido 8 |
| CA-011 | `npm test`, `npm run typecheck` y recorrido 11 |

## 9. Reversión

Revertir el commit del incremento. No hay migraciones, dependencias ni cambios
remotos. Las marcas guardadas en dispositivos son inertes y desaparecen al
desinstalar la app. La modificación de `ScalePress` y `BottomNav` es aditiva y no
afecta a las demás pantallas si se revierte.

## 10. Fuentes y estado de la entrega

Fuentes: `AGENTS.md`, `docs/constitution.md` 2.0.0, `specs/010-tutorial/spec.md`
y el código citado en §2.

Estado: plan aprobado el 2026-10-13. No se ha escrito código. Los archivos de
`src/` y `tests/` listados arriba se crean durante la implementación, tarea por
tarea, y `verification.md` se crea cuando exista el primer resultado real que
registrar.

### Revisión 0.1.1 — 2026-10-13

`useTutorial.ts` pasa de `application/` a `infrastructure/`. `AGENTS.md` pide que
`application` defina interfaces y que `infrastructure` las implemente; el hook
une ambas y necesita importar `tutorialProgressStorage` y `tutorialOwnerGateway`.
Es un cambio de ubicación, sin efecto en interfaces, requisitos ni pruebas.

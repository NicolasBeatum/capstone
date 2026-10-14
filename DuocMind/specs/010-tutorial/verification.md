# Verificación 010 — Tutorial de bienvenida

Registro de resultados reales por tarea. Una prueba diferida aparece como
pendiente, nunca como ejecutada.

## T001 — Línea base (2026-10-13)

**Entorno**

| Elemento | Declarado | Observado |
| --- | --- | --- |
| Node | `>=24 <25` | v24.21.0 (cumple) |
| npm | `>=11 <12` | 11.4.2 (cumple; `packageManager` fija npm 11.13.0, que no coincide) |
| Rama | `feature/tutorial` | `feature/tutorial` en `64832fc`, el mismo commit que `main` |
| Git | — | Solo `specs/010-tutorial/` sin seguimiento; nada más modificado |
| `node_modules` | desde lockfile | presente; no se reinstaló |

**Comandos**

| Comando | Resultado |
| --- | --- |
| `npm run typecheck` | Sin errores. |
| `npm test` | 126 pruebas, 126 aprobadas, 0 fallidas. Aparece la advertencia `MODULE_TYPELESS_PACKAGE_JSON` de Node, anterior a este incremento. |

La línea base está limpia: no hay fallas previas que distingan de las de este
incremento.

**Disponibilidad para la validación Android (T008)**

| Elemento | Observado |
| --- | --- |
| JDK | Eclipse Adoptium 21.0.5, en `JAVA_HOME` |
| Android SDK | `%LOCALAPPDATA%\Android\Sdk`, con `platform-tools`, `emulator` y `build-tools`; `ANDROID_HOME` sin definir y `adb` fuera del `PATH` |
| Plataformas SDK | solo `android-34` |
| Emulador | AVD `Medium_Phone_API_35` con imagen de sistema `android-35` |
| Dispositivos conectados | ninguno (`adb devices` vacío; no hay emulador iniciado) |
| Proyecto nativo | no existe `android/`; `npx expo run:android` lo generaría |
| Docker | instalado; no se inició ni se usó (T001 no toca backend) |
| APK de pruebas | el workflow `android-release.yml` lo genera en GitHub Actions; no se descargó |

**Riesgos para T008, sin comprobar todavía**

- Solo hay `android-34` instalado; no se ha verificado si Expo SDK 57 exige otra
  plataforma o versión de build-tools. Se comprobará al compilar.
- Falta definir `ANDROID_HOME` y agregar `adb` al `PATH` para `expo run:android`.
- Hay dos caminos para probar en Android: development build con el emulador local
  o el APK de CI. El primero depende de que compile en este equipo.

**Limitaciones:** no se probó ninguna compilación Android ni se inició el
emulador. No se ejecutó backend local; las tareas siguientes no lo requieren
hasta el recorrido de T007 en web y el de T008 en Android, que necesitarán
cuentas sintéticas y Supabase local.

## T002 — Dominio: pasos y flujo (2026-10-13)

**Cambio:** `src/shared/tutorial/domain/tutorialSteps.ts` (seis pasos y
`TutorialTargetId`) y `tutorialFlow.ts` (avance, retroceso, último paso,
posición y `backAction`). Sin React, Expo ni `@/`.

| Comando | Resultado |
| --- | --- |
| `node --test tests/tutorialSteps.test.mjs tests/tutorialFlow.test.mjs` | 14 pruebas, 14 aprobadas |
| `npm run typecheck` | Sin errores |
| `npm test` | 140 pruebas, 140 aprobadas (126 de la línea base + 14 nuevas) |

**Cubre:** orden y elementos de RF-002.1; ids y elementos únicos; textos no
vacíos y cierre sin elemento; ausencia de términos clínicos (diagnóstico,
tratamiento, terapia, trastorno, curar, medicación); emoción corregible;
distinción entre orientación y atención profesional; «sin conexión» solo en
Bienestar y referido a los teléfonos de apoyo; límites de avance y retroceso;
posición «Paso N de 6»; `backAction`.

**Limitaciones:** la prueba de términos clínicos es una lista de palabras; no
reemplaza la revisión de contenido de CA-009, que sigue necesitando lectura
humana del texto final. La presentación visual de los pasos se verifica en T007
y T008.

## T003 — Aplicación: estado «visto» por cuenta (2026-10-13)

**Cambio:** `src/shared/tutorial/application/tutorialProgress.ts` con las
interfaces `KeyValueStorage`, `TutorialOwnerGateway` y `TutorialProgressStore`,
`createTutorialProgressStore` (clave `duocmind.tutorial.seen.v1.<uuid>`, valor
`seen`), `resolveTutorialOffer`, `completeTutorial` y `normalizeOwnerId`. Sin
React, Expo ni `@/`.

| Comando | Resultado |
| --- | --- |
| `node --test tests/tutorialProgress.test.mjs` | 11 pruebas, 11 aprobadas |
| `npm run typecheck` | Sin errores |
| `npm test` | 151 pruebas, 151 aprobadas (140 anteriores + 11 nuevas) |

**Cubre:** aislamiento entre dos cuentas; `markSeen`, `isSeen` y `clear`; que
solo se guarde `seen` bajo una clave por cuenta; valor dañado como «no visto»;
rechazo sin escritura de identificadores que no son UUID; oferta a una cuenta
nueva; sin oferta si ya lo vio, sin cuenta o con identificador inválido; error al
leer la cuenta o el estado sin oferta ni excepción; escritura fallida sin
propagar y con la cuenta aún sin marcar; que completar marque a la cuenta
capturada aunque la sesión cambie después; y que no se repita tras completarlo.

**Limitaciones:** se probó con almacenamiento simulado en memoria. El
almacenamiento real (SecureStore en Android, `sessionStorage` en web) y la
lectura de la sesión se cablean en T004 y se comprueban en T007 y T008.

## T004 — Infraestructura y borrado de cuenta (2026-10-13)

**Cambio:** `shared/tutorial/infrastructure/tutorialProgressStorage.ts`
(`tutorialProgressStore` sobre `platformSecureKeyValueStorage` y
`deleteTutorialProgress`, de mejor esfuerzo), `tutorialOwnerGateway.ts` (lee
`auth.getSession()` y propaga el error) y `supabaseAuthGateway.ts`
(`deleteTutorialProgress(userId)` en `clearLocalData`, tras los borrados de
eventos y de registro emocional; `signOut` no cambia).

| Comando | Resultado |
| --- | --- |
| `npm run typecheck` | Sin errores |
| `npm test` | 151 pruebas, 151 aprobadas |
| `grep console. src/shared/tutorial` | Sin coincidencias: no se registra nada |

**Limitaciones:** estos archivos importan Expo y Supabase, por lo que no se
ejecutan con `node --test`. Que la clave se borre al eliminar una cuenta
sintética y que se lea la sesión real quedan para el recorrido Android (T008,
paso 10) y para el recorrido web de T007. No se ejecutó nada contra backend.

## T005 — Puntos de medición (2026-10-13)

**Cambio:** `motionDuration.tutorialStep` (300 ms) en `motionTokens.ts`;
`ScalePress` acepta `ref?: Ref<View>` y lo recibe `AnimatedPressable` mediante
`...rest`; `BottomNav` acepta `tutorialTargets` (Agenda, Bienestar y botón
central). Sin la prop no cambia nada.

| Comprobación | Resultado |
| --- | --- |
| `npm run typecheck` | Sin errores |
| `npm test` | 151 pruebas, 151 aprobadas |
| Web (`localhost:8081/dashboard`), sin sesión | La barra se ve igual; la pestaña Agenda lleva a `/agenda` y Inicio regresa a `/dashboard`; sin errores de consola |

**Limitaciones**

- La comprobación web se hizo **sin sesión**. `.env` apunta a un proyecto
  Supabase remoto y no hay backend local en marcha; no se inició sesión ni se
  crearon cuentas, para no enviar credenciales a un servicio remoto. El inicio con
  una cuenta sintética queda para T007 con Supabase local.
- Nadie usa todavía `tutorialTargets`, así que esta tarea solo comprueba que no
  hay regresiones; que `ref` resuelva `measureInWindow` en Android se comprueba
  en T008, con el respaldo previsto en el plan si no lo hiciera.

## T006 — Hook y componente del recorrido (2026-10-13)

**Cambio:** `shared/tutorial/infrastructure/useTutorial.ts` (estado del
recorrido; captura la cuenta al abrir el recorrido automático; el manual no
tiene cuenta y no escribe), `components/TutorialOverlay.tsx` (`Modal`
transparente, medición con `measureInWindow`, resalte con cuatro rectángulos y
un borde, tarjeta arriba, abajo o centrada, controles de 44 px, foco y región
viva de accesibilidad, fundidos con tokens y sin movimiento si se reduce) y
`domain/tutorialLayout.ts` con `tests/tutorialLayout.test.mjs` (5 pruebas:
medición válida, margen del resalte y ubicación de la tarjeta).

| Comprobación | Resultado |
| --- | --- |
| `npm run typecheck` | Sin errores |
| `npm test` | 156 pruebas, 156 aprobadas (151 + 5 de `tutorialLayout`) |
| Montaje en web (ver T007) | Los seis pasos se muestran con el resalte esperado; sin errores de consola en una ejecución limpia con escuchas propias |

**Defectos hallados en la web y corregidos**

1. `findNodeHandle` no existe en web y rompía el recorrido al abrirse. El foco de
   accesibilidad solo se aplica fuera de la web.
2. El temporizador de respaldo de 250 ms sobrescribía una medición que sí había
   llegado, y el paso 1 aparecía sin resalte. Ahora gana la primera respuesta y
   se cancela el temporizador.

**Desviaciones menores del plan:** se agregó `domain/tutorialLayout.ts` para poder
probar la lógica de medición con `node --test`; el hook no expone `ownerId`
(la cuenta capturada no sale del hook).

**Limitaciones:** la medición y el foco de accesibilidad en Android, y el
comportamiento con TalkBack, quedan para T008.

## T007 — Integración en el inicio (2026-10-13) — **sin completar**

**Cambio:** `DashboardScreen.tsx` (referencias a la tarjeta semanal y al
calendario, `useTutorial`, `TutorialOverlay`, `offerAfterLogin()` en
`handleIntroDone`, vuelta al inicio del `ScrollView` antes de abrir, enlace
«Ver tutorial de la app»), `DashboardScreen.styles.ts` (`tutorialLink`, con 96 px
de margen inferior para que el enlace quede sobre la barra flotante) y
`supabaseAuthGateway.ts`/`BottomNav` de tareas previas.

**Verificado en la web (`localhost:8081/dashboard`, sin sesión):**

| Comprobación | Resultado |
| --- | --- |
| «Ver tutorial de la app» abre el recorrido en el paso 1 y vuelve arriba | Correcto |
| Los seis pasos resaltan, en orden: tarjeta semanal, botón «+», pestaña Agenda, calendario del encabezado, pestaña Bienestar y cierre centrado | Correcto |
| Posición «Paso N de 6», «Siguiente», «Atrás» y «Entendido» en el último paso | Correcto |
| Tecla Escape (equivale a Atrás del sistema) retrocede un paso | Correcto |
| «Omitir» cierra el recorrido de inmediato | Correcto |
| El recorrido manual no escribe nada en `sessionStorage` ni `localStorage` | Correcto (ninguna clave con «tutorial») |
| Sin errores de consola en una ejecución limpia | Correcto |

**Pendiente, por lo que la tarea sigue abierta:** la verificación exige el
recorrido completo con una cuenta sintética nueva: login → bienvenida → seis
pasos → «Entendido», y que ni la recarga ni un segundo login lo repitan. No se
pudo ejecutar:

- `.env` apunta a un proyecto Supabase remoto; iniciar sesión o crear una cuenta
  enviaría credenciales a un servicio remoto, y no hay backend local en marcha.
- Falta levantar el backend local con cuentas sintéticas (Docker está
  instalado; no se inició).

La lógica de cuándo ofrecer el tutorial sí está cubierta por
`tutorialProgress.test.mjs`, pero no su integración con el login.

**Desviación del plan:** «Ver tutorial» espera un fotograma tras volver arriba, no
`reveal + 5 × stagger`, porque el enlace está en una pantalla ya revelada.

## T009 — Dominio de la revisión 0.2.0 (2026-10-14)

**Cambio:** `domain/tutorialSteps.ts` agrega `TutorialStepKind` (`info`, `checkin`,
`closing`) y el campo `kind` a cada paso, y deja los seis pasos en el orden Tu
semana, Agenda, Eventos, Bienestar, Registrar cómo te sientes (`checkin`) y Todo
listo (`closing`). El texto del paso 5 es neutro: explica el botón, que la persona
elige y puede corregir su emoción y que puede hacerlo «ahora o más tarde». El paso 6
conserva el aviso de dónde volver a ver el tutorial. `tutorialFlow.ts` no cambió.

| Comando | Resultado |
| --- | --- |
| `node --test tests/tutorialSteps.test.mjs tests/tutorialFlow.test.mjs` | 17 pruebas, 17 aprobadas |
| `npm run typecheck` | Sin errores |
| `npm test` | 159 pruebas, 159 aprobadas (156 anteriores + 3 netas en `tutorialSteps`) |

**Cubre:** orden, ids y elementos de los seis pasos; el 5 de tipo `checkin` con
elemento `checkin` y el 6 de tipo `closing` sin elemento y titulado «Todo listo»;
un solo paso de cada tipo; ids y elementos únicos; textos no vacíos; ausencia de
términos clínicos; que el paso 5 deje la elección y la corrección a la persona, no
sugiera una emoción y no use lenguaje obligatorio; que Bienestar distinga
orientación de ayuda profesional; «sin conexión» solo en Bienestar; y que el aviso
de «Ver tutorial de la app» esté en el paso 6 y no en el 5.

**Limitaciones:** las comprobaciones de lenguaje obligatorio y de sugerencia de
emoción son listas de palabras; no reemplazan la revisión de contenido de CA-009,
que sigue necesitando lectura humana del texto final. Hasta T012 el overlay y el
hook siguen con la lógica de la versión 0.1.0: el recorrido ya muestra los pasos
en el nuevo orden, pero el paso 5 ofrece «Siguiente» y no «Registrar ahora».

## T010 — Sesión del recorrido (2026-10-14)

**Cambio:** `src/shared/tutorial/application/tutorialSession.ts` con
`TutorialSession` y `describeTutorial`. Fases `closed`, `steps`,
`awaitingCheckin` y `closing`; modos `auto` y `manual`; `openAuto` con
generación, `openManual`, `next`, `back`, `startCheckin`,
`returnWithoutSaving`, `checkinSaved`, `skip`, `finish`, `systemBack`,
`accountChanged`, `reset`, `subscribe`, `getSnapshot` y `captureGeneration`.
`onComplete` llega por el constructor, así que la clase no conoce el almacenamiento.
Sin React, Expo ni `@/`.

| Comando | Resultado |
| --- | --- |
| `node --test tests/tutorialSession.test.mjs` | 29 pruebas, 29 aprobadas |
| `npm run typecheck` | Sin errores |
| `npm test` | 188 pruebas, 188 aprobadas (159 anteriores + 29 nuevas) |

**Cubre:** apertura automática y manual, con cuenta normalizada, rechazo de cuenta
inválida, de generación vencida y de apertura sobre un recorrido abierto; límites de
`next` y `back`, y que en automático el paso 5 solo avance con «Registrar ahora»;
`describeTutorial` en cada paso, modo y fase (botón principal, `canSkip`,
`canGoBack`, posición y etiquetas de accesibilidad); `startCheckin` solo en
automático y en el paso 5; `returnWithoutSaving`; `checkinSaved` con la misma
cuenta (marca una vez y pasa a «Todo listo»), con otra cuenta (cierra sin marcar) y
fuera de la espera; `skip` que marca solo en automático y en los pasos (también en
el paso 5, sin abrir el check-in) y no marca en manual ni en «Todo listo»; `finish`
que nunca marca; `systemBack` en un paso intermedio, en el primero y en «Todo
listo»; `accountChanged` ante cierre de sesión, otra cuenta, la misma cuenta y el
modo manual; una oferta que se resuelve tras un cambio de cuenta; un fallo de
`onComplete` que no impide cerrar ni avanzar; notificación a suscriptores solo ante
cambios reales; y estados inmutables con referencia estable si no hay cambios.

**Decisión de implementación:** `accountChanged` recuerda el último usuario visto y
sube la generación cuando cambia, aunque no haya recorrido abierto. Así una oferta
que se resuelve después de cerrar sesión no abre el recorrido de la cuenta anterior.
El primer aviso de sesión solo registra al usuario y no invalida ofertas en curso.
Es un refinamiento del plan (§3, `accountChanged`), que solo reiniciaba ante otra
cuenta o ante `null`.

**Limitaciones:** la clase no tiene todavía ningún consumidor; la integración con la
sesión real de Supabase, el `useSyncExternalStore` y la pantalla llegan en T011 y
T012, y su comportamiento visible se comprueba en T012, T007 y T008.

## T011 — Instancia única y vigilancia de la cuenta (2026-10-14)

**Cambio:** `src/shared/tutorial/infrastructure/tutorialRuntime.ts` con la instancia
única `tutorialSession` (su `onComplete` llama a `completeTutorial` con la tienda
de la cuenta), `watchTutorialAccount()` (una sola suscripción a
`auth.onAuthStateChange` que llama a `accountChanged`; si falta el cliente de
Supabase no hace nada) y `notifyTutorialCheckinSaved(userId)` (llama a
`checkinSaved` dentro de un `try/catch` vacío). Archivo nuevo sin consumidores: no
cambia ningún comportamiento.

| Comando | Resultado |
| --- | --- |
| `npm run typecheck` | Sin errores |
| `npm test` | 188 pruebas, 188 aprobadas |
| `grep console. src/shared/tutorial` | Sin coincidencias: no se registra nada |

**Revisión:** ninguna sesión, identificador ni emoción se registra; `notifyTutorialCheckinSaved`
recibe solo el identificador de la cuenta, no la emoción.

**Limitaciones:** el archivo importa Supabase y no se ejecuta con `node --test`. Que el
vigilante reinicie el recorrido al cerrar sesión y que el aviso llegue desde el check-in
se comprueban en T007 y T008.

## T012 — Migración a la sesión única (2026-10-14)

**Cambio:**

- `infrastructure/useTutorial.ts` reescrito sobre `tutorialSession` con
  `useSyncExternalStore`; `offerAfterLogin` captura la generación y descarta la oferta si
  la sesión cambió; llama a `watchTutorialAccount()` al montarse.
- `components/TutorialOverlay.tsx` adaptado a `visible`, `view`, `targets`,
  `onPrimary`, `onBack`, `onSkip` y `onSystemBack`: «Omitir» solo si `canSkip`,
  «Atrás» solo si `canGoBack`, acción principal y posición tomadas de `view`.
- `domain/tutorialFlow.ts` sin `backAction`, y su prueba retirada.
- `DashboardScreen.tsx`: `visible` solo con el inicio enfocado (`useIsFocused`),
  `useFocusEffect` que llama a `returnWithoutSaving`, `handleTutorialPrimary`
  (`next`, `register` → `router.push('/checkin')`, `finish`).
- `CheckinScreen.tsx`: una llamada, `notifyTutorialCheckinSaved(userId)`, justo después
  de que `saveConfirmedCheckin` devuelve (+3 líneas, ninguna otra cambia).

| Comando | Resultado |
| --- | --- |
| `npm run typecheck` | Sin errores |
| `npm test` | 187 pruebas, 187 aprobadas (188 menos la de `backAction`) |
| `grep console. src/shared/tutorial` | Sin coincidencias |

**Recorrido manual en la web (`localhost:8081/dashboard`, sin sesión,
«Ver tutorial de la app»):**

| Comprobación | Resultado |
| --- | --- |
| Seis pasos con título y posición: Tu semana, Tu agenda, Eventos, Bienestar, Cuéntanos cómo te sientes, Todo listo | Correcto |
| «Omitir» en los pasos 1 a 5 y no en el 6 | Correcto |
| «Atrás» en los pasos 2 a 5 y no en el 1 ni en el 6 | Correcto |
| El paso 5 ofrece «Siguiente» (no «Registrar ahora») y el 6 solo «Entendido» | Correcto |
| Resalte correcto del elemento de cada paso (comprobado en los pasos 1 y 2 tras la corrección de abajo; antes de T012, en los seis) | Correcto |
| Escape (Atrás del sistema): retrocede en pasos intermedios, cierra en el primero y cierra en el 6 | Correcto |
| El recorrido manual no escribe ninguna clave de tutorial en `sessionStorage` ni `localStorage` | Correcto |
| Sin errores de consola en la ejecución limpia (escuchas propias de `error` y `console.error`) | Correcto |
| Un solo `Modal` (`aria-modal`) visible a la vez y ninguno al cerrar | Correcto |

**Defecto hallado y corregido durante la verificación:** al cambiar de paso, el respaldo
de 250 ms podía ganarle a una medición lenta y el paso quedaba centrado sin resalte. Ahora
una medición que llega tarde corrige el resultado; el respaldo solo aplica si no llegó
ninguna. Tras el cambio, el paso 2 vuelve a resaltar la pestaña Agenda.

**No verificado (queda para T007 y T008):**

- El recorrido automático con login: oferta tras la bienvenida, «Registrar ahora»,
  check-in real, aviso `notifyTutorialCheckinSaved`, «Todo listo» en el inicio nuevo y
  marca de la cuenta. No hay sesión ni backend local.
- Que el inicio apilado bajo `/checkin` no muestre un segundo `Modal` (`useIsFocused`) y
  que `returnWithoutSaving` reabra el paso 5: requiere navegar al check-in.
- El comportamiento en Android: medición con `ref` en `ScalePress`, botón Atrás,
  foco de accesibilidad y TalkBack.
- Las pruebas con `node --test` cubren la lógica de `TutorialSession`; `useTutorial`, el
  overlay y el cableado de `tutorialRuntime` solo se han ejercitado en el recorrido manual.

**Nota de trazabilidad:** durante esta tarea el árbol de trabajo pasó a tener un commit
propio de la persona responsable (`ef4b86a`, «WalkThrough Primera version»), con su
identidad y sin créditos de agentes. Esta tarea no hizo commits.

## T007 — Recorrido automático en la web con backend local (2026-10-14)

**Entorno.** Supabase local (Docker, CLI 2.119.0 desde `tools/`, proyecto `duocmind-admin-local`,
`127.0.0.1:54321`) sin Realtime ni Storage. Cuentas sintéticas `student` y `dual` de
`tools/scripts/fixtures.mjs` (credenciales solo en `tools/.local/fixtures.json`, ignorado por
Git). Expo web en `localhost:8089` con `EXPO_PUBLIC_SUPABASE_URL` apuntando a la base local;
nunca contra el proyecto remoto. Compilación: `npm run typecheck` y `npm test` sin cambios
(187 pruebas aprobadas).

**Particularidades de Windows** (no se modificó ningún script del repositorio):
`tools/scripts/local-start.mjs` y `local-env.mjs` ejecutan el CLI sin la extensión `.cmd` y
fallan en Windows. Se lanzó `supabase.cmd start` con los mismos argumentos y se generó
`tools/.local/runtime.json` con `supabase.cmd status -o json`, que es lo que haría `local-env`.
`student-events-preview.mjs` tampoco sirve en Windows por el mismo motivo; se inició
`expo start --web --localhost --port 8089` con la configuración local por variables de entorno.

| # | Comprobación | Resultado |
| --- | --- | --- |
| 1 | Login de `student` → bienvenida → el tutorial se abre solo en el paso 1 y no se superpone con la bienvenida | Correcto |
| 2 | Pasos 1 a 5 con resalte; el 5 ofrece «Registrar ahora» y resalta el botón «+» | Correcto |
| 3 | «Registrar ahora» abre `/checkin`; con el check-in abierto no hay botones del tutorial visibles ni clave «visto» | Correcto |
| 4 | Volver sin guardar (Atrás del navegador): el tutorial reaparece en el paso 5, sin «Todo listo» y sin marcar | Correcto |
| 5 | Registrar el check-in (estado «Neutro», cuenta sintética): se guarda, la cuenta queda marcada (`seen`) antes de volver al inicio y, ya en el inicio, aparece «Todo listo» solo con «Entendido» | Correcto |
| 6 | «Entendido» cierra el recorrido | Correcto |
| 7 | El registro existe en la base local (`student`: 1; `dual`: 0) y la barra de hoy aparece en «Vistazo de tu semana» | Correcto |
| 8 | Recargar `/dashboard` no vuelve a abrir el tutorial | Correcto |
| 9 | Cerrar sesión y volver a iniciar con `student` (con `?welcome=1`) no abre el tutorial | Correcto |
| 10 | Iniciar sesión con `dual` en la misma pestaña: ve el tutorial desde el paso 1 aunque `student` ya lo completó (estado independiente) y su barra de hoy está vacía | Correcto |
| 11 | «Omitir» en el paso 5 de `dual`: cierra el recorrido, no abre el check-in, no crea registros (`dual`: 0) y marca la cuenta | Correcto |
| 12 | Fallo al escribir la marca del tutorial (se inyectó un `setItem` que lanza): el check-in igual se guarda y muestra el agradecimiento, el paso «Todo listo» aparece y la marca no se escribe, de modo que se ofrecería otra vez en el siguiente login | Correcto |

**No verificado:** que un check-in que **falla al guardar** no complete el tutorial. En la web el
almacén local del check-in vive en memoria y el remoto cae a la copia local, por lo que no se
pudo provocar un fallo real de `saveConfirmedCheckin` sin modificar código. La garantía descansa
en que `notifyTutorialCheckinSaved` se llama después de `await saveConfirmedCheckin(...)` (solo
si no lanza) y en las pruebas de `TutorialSession`; queda para el recorrido Android de T008
(comprobación 7), donde se puede forzar un fallo real.

**Otras limitaciones:** la web no acredita persistencia (`sessionStorage` dura lo que la pestaña),
medición nativa ni comportamiento sin conexión. No se probó un cambio de sesión a mitad del
recorrido (cerrar sesión con el tutorial abierto) porque el overlay bloquea el menú de perfil;
la regla está cubierta por `tutorialSession.test.mjs` y queda para Android.

**Estado de la tarea:** cerrada por decisión del usuario del 2026-10-14. La comprobación de un
check-in que falla al guardar se movió al paso 7 del recorrido Android de T008 y sigue pendiente
allí. El backend y el servidor web locales siguen en marcha para T008.

## T008 — Validación en Android (2026-10-14) — **bloqueada, sin completar**

**Lo preparado**

- Emulador `Medium_Phone_API_35` iniciado; `adb devices` lo lista como `emulator-5554`.
- `adb reverse` de 54321 (Supabase local) y 8090 (Metro) hacia el equipo: la app del emulador
  usaría el backend local y nunca el remoto.
- `npx expo run:android --port 8090` ejecutó el prebuild (`android/`, ignorado por Git) y descargó
  Gradle 9.3.1. El prebuild también cambió el script `android` de `package.json`; se revirtió con
  `git checkout` porque no pertenece a este incremento.

**Resultado:** el build nativo **no compila**. Gradle falla al iniciar su daemon:

```text
java.io.IOException: Unable to establish loopback connection
Caused by: java.net.SocketException: Invalid argument: connect
```

**Diagnóstico (solo lectura, sin cambiar el sistema)**

| Prueba | Resultado |
| --- | --- |
| `Socket`/`ServerSocketChannel` TCP en loopback (IPv4 e IPv6) | Funcionan |
| `Selector.open()` con JDK 21.0.5 (Temurin) | Falla con el error de arriba |
| `Selector.open()` con JBR 21.0.3 de Android Studio y JDK 25.0.1 | Fallan igual |
| Misma prueba desde PowerShell, con `-Djava.net.preferIPv4Stack=true` y con otros `java.io.tmpdir` | Fallan igual |
| `WindowsSelectorProvider` en lugar de `WEPollSelectorProvider` | Falla igual |
| Controlador `afunix` | En ejecución |

La causa está en el JDK: en Windows, `Selector.open()` crea su tubería de despertar con un socket
Unix (`AF_UNIX`, `PipeImpl`) y su `connect` devuelve «Invalid argument» en este equipo. El código
fuente del JDK no ofrece ninguna propiedad para evitarlo. Arreglarlo exigiría cambiar la configuración
del sistema (reinicio, o revisar el software de red o seguridad que intercepta `AF_UNIX`), algo que no
me corresponde modificar. No es un problema del proyecto ni del tutorial.

**Qué falta:** los 14 pasos del recorrido Android, incluida la comprobación 7 (un check-in que falla al
guardar, movida desde T007), y el cierre de CA-001 a CA-014. Ninguno se ejecutó. **La spec no puede
cerrarse sin esta validación.**

**Caminos posibles (a decidir):**

1. Reiniciar el equipo y reintentar `expo run:android`; si persiste, revisar antivirus, VPN o
   herramientas de red que filtren `AF_UNIX`.
2. Compilar dentro de un contenedor Docker Linux con JDK y Android SDK, e instalar el APK en el emulador
   con `adb`. Requiere otra descarga grande (imagen con SDK, NDK y plataforma 36).
3. Probar en otro equipo o con un APK generado en CI con un backend accesible.

## Pendiente

T008: bloqueada por un fallo del entorno (el build nativo no compila en este equipo); ver su entrada. Los 14 pasos del recorrido Android siguen sin ejecutarse y la validación Android sigue pendiente, por lo que la spec no puede cerrarse.

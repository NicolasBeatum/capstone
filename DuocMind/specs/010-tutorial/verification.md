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

## Pendiente

T007 (recorrido con login) y T008: sin completar. La validación Android sigue
pendiente.

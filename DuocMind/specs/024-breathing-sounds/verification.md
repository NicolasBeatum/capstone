# Verificación 024 — Sonidos guiados en la respiración 4-7-8

Registro de resultados reales por tarea. Una prueba diferida aparece como pendiente,
nunca como ejecutada.

## T001 — Línea base (2026-11-26)

**Entorno**

| Elemento | Declarado | Observado |
| --- | --- | --- |
| Node | `>=24 <25` | v24.21.0 (cumple) |
| npm | `>=11 <12` | 11.4.2 (cumple; `packageManager` fija npm 11.13.0, que no coincide) |
| Rama | `feature/*` desde `dev` | `feature/sonidos-respiracion` sobre `dev` en `222fd29` (merge de #37), sin commits propios |
| Estado de Git | limpio salvo el incremento | solo `specs/024-breathing-sounds/` sin seguimiento (spec, plan, tareas y este archivo) |

**Estado de dependencias de audio.** `package.json` no contiene `expo-audio`,
`expo-av` ni `expo-haptics` (búsqueda sin coincidencias).

**Comandos de la línea base**

| Comando | Primer resultado (`node_modules` heredado) | Resultado tras sincronizar |
| --- | --- | --- |
| `npm run typecheck` | **Falla:** 2 errores TS2307, `Cannot find module 'expo-document-picker'`, en `timetableFile.native.ts` y `timetableFile.web.ts` | Sin errores |
| `npm test` | 477 pruebas, 477 correctas, 0 fallos (2,6 s) | 477 pruebas, 477 correctas, 0 fallos (2,6 s) |

**Causa del primer fallo.** No es del código. `package.json` y `package-lock.json`
declaran `expo-document-picker@~57.0.3` (lo agregó el commit `b865d32`, importación
del horario, 2026-11-14), pero el `node_modules` local era anterior a ese cambio.
Se sincronizó con `npm ci --no-audit --no-fund` (643 paquetes en 25 s), que instala
exactamente lo que dice el lockfile. No cambió ningún archivo versionado
(`git status` quedó igual). Esta sincronización no es parte del incremento: es el
estado del equipo antes de empezar.

**Entorno para probar en Android**

| Elemento | Observado |
| --- | --- |
| Android SDK | `platform-tools/adb.exe` y `emulator/emulator.exe` presentes en `%LOCALAPPDATA%\Android\Sdk` |
| Emulador | AVD `Medium_Phone_API_35` disponible; no hay ningún dispositivo ni emulador conectado ahora |
| Audio del emulador | No verificado: no se pudo leer su configuración de audio. Se comprobará al iniciarlo (riesgo R7) |
| Teléfono físico | No hay ninguno conectado |
| Docker | 28.5.1; solo existe la imagen `duocmind-app`. La imagen de compilación de Android se eliminó en la limpieza del 2026-11-08, y no hay carpeta `android/` en el proyecto |
| Compilación nativa | Gradle no corre de forma nativa en este equipo (fallo de Java `Selector.open()` ya documentado en la spec 010); la ruta conocida es un contenedor Linux, cuya reconstrucción exige descargas grandes y confirmación previa (T006) |

**Resultado.** Línea base lista: `typecheck` sin errores y 477 pruebas correctas tras
sincronizar las dependencias. Queda anotado el fallo inicial y su causa.

## T002 — Dominio de los sonidos (2026-11-26)

**Cambio.** Se creó `src/features/wellness/domain/breathingSounds.ts` con
`BreathSoundId`, `LATE_CUE_TOLERANCE_SECONDS = 0.5`, `BreathCueInput` y
`soundsForMoment`. Solo importa el tipo `BreathMoment` de `breathing478.ts` con
ruta relativa y extensión `.ts`; no usa React ni audio. No se modificó
`breathing478.ts`.

**Verificación.** `tests/breathingSounds.test.mjs` (10 pruebas) cubre cada fila de
la tabla de §3 del plan:

| Prueba | Fila de la tabla |
| --- | --- |
| Al terminar suena solo la campanilla final | `finished` |
| Sin momento y sin terminar no suena nada | `current` nulo |
| Misma fase y ciclo no vuelve a sonar | misma fase |
| Cambio detectado tarde no suena; 4,2 s y 4,5 s suenan, 4,6 s no | retraso mayor a la tolerancia (límite inclusivo) |
| Inicio de sesión: campanilla de inicio e inhalación | `sessionStart` |
| Inicio tardío: nada | `sessionStart` con retraso |
| Ciclos 2, 3 y 4 empiezan con campanilla de ciclo | inhalación de ciclos 2 a 4 |
| Inhalación del ciclo 1 sin inicio de sesión: sin campanilla | inhalación ciclo 1 |
| Pausa y exhalación suenan solas | pausa y exhalación |
| Sesión completa a 20 tics por segundo (como la pantalla) | CA-004 a nivel de dominio |

La prueba de sesión completa compara la lista exacta: inicio e inhalación en 0 s;
pausa en 4, 23, 42 y 61 s; exhalación en 11, 30, 49 y 68 s; inhalación con
campanilla de ciclo en 19, 38 y 57 s; campanilla final en 76 s; sin repeticiones.

| Comando | Resultado |
| --- | --- |
| `node --test tests/breathingSounds.test.mjs` | 10 pruebas, 10 correctas, 0 fallos |
| `npm run typecheck` | Sin errores |
| `npm test` | 487 pruebas, 487 correctas, 0 fallos (477 de la línea base + 10 nuevas) |

**Limitaciones.** El mismo aviso de Node (`MODULE_TYPELESS_PACKAGE_JSON`) que ya
aparece en las demás pruebas que importan archivos `.ts` salió al ejecutar la
prueba; no es nuevo ni afecta el resultado. CA-004 queda cubierto aquí a nivel de
dominio y se completa con el controlador en T003.

## T003 — Controlador de sonidos (2026-11-26)

**Cambio.** Se creó `src/features/wellness/application/breathingSoundController.ts`
con las interfaces `BreathSoundPlayer` y `BreathSoundController` y
`createBreathSoundController(player, isEnabled)`. No importa Expo: usa solo el
dominio (`soundsForMoment`) y recibe el reproductor por parámetro.

- `begin()` llama a `player.stopAll()`, marca la sesión como iniciada y que la
  próxima actualización es el inicio.
- `update(moment, finished)` calcula los sonidos y los reproduce solo si
  `isEnabled()` es verdadero; con el sonido apagado igual avanza el momento
  atendido. Tras el fin, la sesión queda cerrada y la campanilla final suena una
  sola vez.
- `stop()` llama a `stopAll()` y olvida el momento atendido, sin cerrar la sesión:
  al volver de segundo plano suena el siguiente cambio de fase, nunca un tono a
  mitad de fase.
- `dispose()` silencia, libera el reproductor y cierra la sesión.
- Todo llamado al reproductor va en `try/catch` sin mensajes ni registro.

**Ajuste respecto del plan.** El plan decía que `update()` solo dependía del
dominio. Se agregó una marca interna `started` (se activa con `begin()` y se
apaga al terminar o con `dispose()`) para que, sin `begin()`, ninguna
actualización suene aunque la pantalla calcule momentos (CA-003).

**Verificación.** `tests/breathingSounds.test.mjs` pasó de 10 a 21 pruebas; las 11
nuevas usan un reproductor falso que anota cada orden con el tiempo simulado y una
pantalla simulada a 20 tics por segundo:

| Prueba | CA |
| --- | --- |
| Secuencia exacta de la sesión completa con el controlador (17 sonidos: inicio e inhalación en 0; pausas en 4, 23, 42, 61; exhalaciones en 11, 30, 49, 68; ciclos en 19, 38, 57; final en 76) | CA-004 |
| Sin `begin()` no suena nada aunque la pantalla actualice | CA-003 |
| Con el sonido apagado, ninguna llamada a `play` en toda la sesión | CA-002 |
| Encender a mitad de sesión no hace sonar lo que ya pasó | CA-002, RF-001.5 |
| Apagar a mitad y volver a encender no repite nada; la pausa de 61 s sí suena | RF-001.5 |
| `begin()` y `stop()` llaman a `stopAll()`; una segunda sesión suena desde el inicio | CA-006 |
| Un reproductor que lanza errores en todos sus métodos no rompe `begin`, `update`, `stop` ni `dispose` | CA-008 |
| Si falla un sonido, los siguientes se intentan igual | CA-008 |
| Tras `stop()` a mitad de fase no suena un tono tardío; en el siguiente cambio vuelve a sonar | RF-005, RF-006 |
| El final suena una sola vez y después el controlador queda quieto | RF-006 |
| `dispose()` silencia, libera y deja de sonar | RF-006 |

**Comprobación de que las pruebas detectan fallos.** Se rompió el controlador a
propósito y se confirmó que las pruebas fallan; luego se restauró el archivo
(`diff` idéntico y 21 de 21 correctas):

| Rotura | Pruebas que fallaron |
| --- | --- |
| Quitar la marca `started` | 3 |
| Ignorar `isEnabled()` | 3 |
| Relanzar los errores del reproductor | 2 |
| No avanzar el momento atendido | 6 |

| Comando | Resultado |
| --- | --- |
| `node --test tests/breathingSounds.test.mjs` | 21 pruebas, 21 correctas, 0 fallos |
| `npm run typecheck` | Sin errores |
| `npm test` | 498 pruebas, 498 correctas, 0 fallos (487 tras T002 + 11 nuevas) |

**Limitaciones.** Todo se probó con un reproductor falso: que el audio real suene,
se silencie en menos de 200 ms y respete el volumen se verifica en T007 y T010.
CA-002, CA-003, CA-006 y CA-008 quedan cubiertos aquí a nivel de lógica y se
completan en pantalla (T009 y T010).

## T004 — Preferencia de sonido (2026-11-26)

**Cambio.**

- `src/features/wellness/infrastructure/breathSoundPreference.ts`: define
  `PreferenceStorage`, `BREATH_SOUND_KEY = 'duocmind.breathing.sound.v1'` y
  `createBreathSoundPreference(storage)` con `load()` y `save()`.
  - `load()` devuelve falso **solo** si lo guardado es `'0'`; sin valor, con `'1'`,
    con cualquier otro valor o ante un error de lectura devuelve verdadero
    (encendido por defecto).
  - `save()` guarda `'1'` o `'0'` y descarta los errores de escritura.
- `src/features/wellness/infrastructure/breathSoundPreferenceStorage.ts`: la
  instancia que usa la app, sobre `platformSecureKeyValueStorage`.

**Ajuste respecto del plan.** El plan ponía la fábrica y la instancia en un solo
archivo. Se separaron en dos porque `node --test` no resuelve el alias `@/` ni carga
`expo-secure-store`: así la fábrica se prueba con un almacenamiento en memoria y la
instancia real queda cubierta por `npm run typecheck`. El comportamiento no cambia.

**Verificación.** `tests/breathSoundPreference.test.mjs` (10 pruebas, con un
almacenamiento en memoria con la misma forma que el real):

| Prueba | CA |
| --- | --- |
| La clave es `duocmind.breathing.sound.v1` | RF-001 |
| Sin valor guardado: encendido | CA-001 |
| `'1'`: encendido; `'0'`: apagado | CA-001 |
| Valores desconocidos (`''`, `false`, `no`, `2`, ` 0`) no apagan: solo un `0` lo apaga | CA-001 |
| Guardar apagado/encendido y volver a cargar da lo guardado, escrito como `'0'`/`'1'` | CA-001 |
| Otra instancia sobre el mismo almacenamiento recupera la elección («reabrir la app») | CA-001 |
| Una lectura que falla da encendido | CA-001 |
| Una escritura que falla no lanza | RF-001 |
| Lo único guardado es el 0 o el 1; ningún dato de la persona | CA-010 |

**Comprobación de que las pruebas detectan fallos.** Se rompió el archivo a
propósito y se restauró después (`diff` idéntico y 10 de 10 correctas):

| Rotura | Pruebas que fallaron |
| --- | --- |
| Apagado por defecto (`=== '1'`) | 2 |
| `load()` relanza el error de lectura | 1 |
| `save()` invierte el valor | 3 |

| Comando | Resultado |
| --- | --- |
| `node --test tests/breathSoundPreference.test.mjs` | 10 pruebas, 10 correctas, 0 fallos |
| `npm run typecheck` | Sin errores (incluye la instancia con el alias `@/`) |
| `npm test` | 508 pruebas, 508 correctas, 0 fallos (498 tras T003 + 10 nuevas) |

**Limitaciones.**

- Que la preferencia persista de verdad al cerrar y abrir la aplicación se
  comprueba en Android en T010: allí `platformSecureKeyValueStorage` usa
  `SecureStore`, que sí persiste.
- En la previsualización web ese almacenamiento es `sessionStorage`: la elección
  se conserva al recargar la pestaña, pero se pierde al cerrar el navegador. Es
  una característica del almacenamiento compartido del proyecto, igual que la
  preferencia de la guía, y no afecta a la plataforma de entrega.
- CA-001 queda cubierto aquí a nivel de preferencia; el interruptor en pantalla se
  comprueba en T009 y T010.

## T005 — Generador de sonidos y archivos de audio (2026-11-26)

**Cambio.**

- `tools/scripts/generate-breathing-sounds.mjs`: genera los seis sonidos con ondas
  sinusoidales, sin dependencias ni material de terceros. Exporta `SAMPLE_RATE`,
  `SOUND_NAMES`, `renderSounds()`, `encodeWav()` y `describeSound()`; solo escribe
  en disco al ejecutarse directamente (`node tools/scripts/generate-breathing-sounds.mjs [carpeta]`).
  Los parámetros son los de la tabla de §3 del plan, repartidos en constantes
  fáciles de ajustar.
- `assets/sounds/breathing/`: seis archivos WAV mono, PCM de 16 bits a 22 050 Hz.

| Archivo | Duración | Pico | RMS | Tamaño |
| --- | --- | --- | --- | --- |
| `start-chime.wav` | 1,50 s | −8,0 dBFS | −20,9 dBFS | 66 194 B |
| `inhale.wav` | 4,00 s | −10,5 dBFS | −18,5 dBFS | 176 444 B |
| `hold.wav` | 7,00 s | −13,2 dBFS | −17,1 dBFS | 308 744 B |
| `exhale.wav` | 8,00 s | −10,5 dBFS | −18,4 dBFS | 352 844 B |
| `cycle-chime.wav` | 2,00 s | −8,0 dBFS | −21,3 dBFS | 88 244 B |
| `end-chime.wav` | 5,00 s | −8,0 dBFS | −22,6 dBFS | 220 544 B |
| **Total** | | | | **1 213 014 B (≈ 1,21 MB)** |

**Verificación.** `tests/breathingSoundFiles.test.mjs` (14 pruebas):

| Prueba | CA |
| --- | --- |
| Existen exactamente los seis archivos esperados | RF-004 |
| WAV PCM, mono, 16 bits, 22 050 Hz; la cabecera describe el tamaño real | RF-004 |
| Tonos de fase de 4, 7 y 8 s (±50 ms); campanillas de 1,5, 2 y 5 s | CA-005 |
| Pico ≤ 0,5012 (−6 dBFS) y ≥ 0,15 en cada archivo | CA-005 |
| RMS de los tres tonos de fase dentro de 6 dB (observado: −18,5, −17,1 y −18,4 dBFS) | CA-005 |
| Primera y última muestra casi nulas (≤ 20 de 32 767) | CA-005 |
| Sin saltos bruscos entre muestras vecinas (máximo 5 000) | CA-005 |
| Entrada y salida graduales: el pico por tramos de 10 ms crece en los primeros 50 ms y decae en los últimos 50 ms, y los tramos extremos quedan bajo el 25 % del pico | CA-005 |
| La altura sube al inhalar, se mantiene al aguantar y baja al exhalar (cruces por cero) | RF-003 |
| Peso total ≤ 1 500 000 bytes | CA-005 |
| Los archivos versionados coinciden con `renderSounds()` | CA-005 |
| Ejecutar el script dos veces da los mismos hashes SHA-256 y reproduce los archivos versionados | CA-005 |
| Importar el script no escribe nada | RF-004 |

**Corrección durante la tarea.** La primera versión de la prueba de entrada y salida
graduales falló en la inhalación. La causa estaba en la prueba, no en el audio: la
inhalación se apaga linealmente durante 80 ms, así que en sus últimos 50 ms aún
queda un 62 % del volumen, y el criterio inicial («menos del 35 % en los últimos
50 ms») no medía lo que pide la spec. Se reemplazó por una comprobación de que el
volumen crece o decae de forma continua y que los tramos extremos quedan cerca de
cero. El requisito de la spec (≥ 50 ms de entrada y salida graduales) se mantiene.

**Comprobación de que las pruebas detectan fallos.** Se rompió el generador a
propósito, se regeneraron los archivos y se confirmó que las pruebas fallan; luego
se restauró el script y se regeneró (los seis archivos coinciden con los hashes
originales y 14 de 14 pruebas pasan):

| Rotura | Pruebas que fallaron |
| --- | --- |
| La inhalación no se apaga al final | 2 (silencio al final y salida gradual) |
| La exhalación sube en vez de bajar | 1 (dirección de la altura) |
| Pico de las campanillas en 0,7 | 2 (pico y saltos bruscos) |
| La pausa dura 6 s | 1 (duración) |

| Comando | Resultado |
| --- | --- |
| `node tools/scripts/generate-breathing-sounds.mjs` | Genera los seis archivos y muestra duración, pico y RMS de cada uno |
| `node --test tests/breathingSoundFiles.test.mjs` | 14 pruebas, 14 correctas, 0 fallos |
| `npm run typecheck` | Sin errores |
| `npm test` | 522 pruebas, 522 correctas, 0 fallos (508 tras T004 + 14 nuevas) |

**Limitaciones.**

- **No se escuchó ningún sonido.** Las pruebas comprueban formato, duración, nivel,
  silencio en los extremos, ausencia de saltos y dirección de la altura, pero no si
  el resultado es agradable. Eso corresponde a CA-011 en T010; las frecuencias,
  niveles y duraciones de caída son valores de partida que se ajustan escuchando y
  se regeneran con el mismo script.
- Los archivos son idénticos entre ejecuciones en este equipo (Node 24.21.0). Si en
  CI cambiara la versión de Node y difirieran por una muestra, se aplicaría la
  salida prevista en el riesgo R4 del plan.
- Los `.wav` no están ignorados por Git y quedaron sin seguimiento, como el resto
  del incremento (sin commits).

## T006 — Dependencia `expo-audio` (parcial: solo la instalación)

Por indicación explícita del equipo, de T006 se hizo **únicamente la instalación**; el
resto queda pendiente y T006 sigue sin marcarse `[x]`.

**Hecho.** `npx expo install expo-audio` instaló la versión compatible con el SDK 57:

| Archivo | Cambio |
| --- | --- |
| `package.json` | `"expo-audio": "~57.0.5"` en `dependencies` |
| `package-lock.json` | Entrada `node_modules/expo-audio` 57.0.5 (13 líneas añadidas) |
| `app.json` | `"expo-audio"` añadido a `plugins` (lo agrega `expo install` por sí solo) |

| Comando | Resultado |
| --- | --- |
| `npm run typecheck` | Sin errores |
| `npm test` | 522 pruebas, 522 correctas, 0 fallos (igual que antes de instalar) |

**Pendiente de T006 (no se hizo):**

- Revisar el `AndroidManifest.xml` resultante y quitar los permisos que no se
  necesitan. El plugin `expo-audio` puede añadir `RECORD_AUDIO` por defecto; hay que
  desactivarlo con las opciones del plugin o con `android.blockedPermissions` (riesgo R1).
- Confirmar los nombres de la API en los tipos instalados (riesgo R3).
- Compilación nativa en Android, reproducción de un sonido de prueba y comprobación de
  que se mezcla con la música de otras apps (riesgo R2).

**Limitaciones.** Mientras no se revise el manifiesto, el plugin agregado en `app.json`
podría solicitar el permiso de micrófono en una compilación nativa: no debe generarse
ni publicarse un APK con este cambio antes de completar esa revisión. `npm install`
mostró 16 vulnerabilidades en `npm audit`, anteriores a este cambio y fuera del alcance.

## T006 — Nombres de la API de `expo-audio` confirmados (parcial, añadido durante T007)

Leídos en los tipos instalados (`node_modules/expo-audio/build`, versión 57.0.5); no se ejecutó nada en un dispositivo.

| Uso en el reproductor | Nombre confirmado |
| --- | --- |
| Crear un reproductor sin hooks | `createAudioPlayer(source)`; `source` puede ser el número de un `require` |
| Modo de audio | `setAudioModeAsync(Partial<AudioMode>)` |
| Mezcla con otras apps | `interruptionMode: 'mixWithOthers'` (también `'doNotMix'` y `'duckOthers'`); `interruptionModeAndroid` está obsoleto |
| Otras opciones del modo | `playsInSilentMode`, `shouldPlayInBackground`, `allowsRecording`, `shouldRouteThroughEarpiece` |
| Control del reproductor | `play()`, `pause()`, `seekTo(seconds)` (devuelve `Promise`), `volume` (0 a 1), `playing`, `remove()` |

La documentación de los tipos dice que en Android `'mixWithOthers'` no pide foco de audio y que sirve para
efectos cortos. Que en la práctica no corte la música sigue **sin comprobarse** (riesgo R2, pendiente de T006/T010).

**Hallazgo sobre el plugin (riesgo R1), sin cambios hechos en `app.json`.** Leído en
`plugin/build/withAudio.js`, el plugin con sus valores por defecto añade:

- Android: `RECORD_AUDIO` (opción `recordAudioAndroid`, por defecto `true`), `MODIFY_AUDIO_SETTINGS`,
  `FOREGROUND_SERVICE` y `FOREGROUND_SERVICE_MEDIA_PLAYBACK` (por `enableBackgroundPlayback`, por defecto `true`),
  y declara el servicio `expo.modules.audio.service.AudioControlsService`.
- iOS: `UIBackgroundModes` con `audio` y el texto `NSMicrophoneUsageDescription`.

La app solo reproduce efectos en primer plano, así que hará falta `recordAudioAndroid: false` y
`enableBackgroundPlayback: false` (y `microphonePermission: false` para iOS). Queda pendiente de T006 aplicarlo y
comprobar el manifiesto resultante.

## T007 — Reproductor de sonidos (`breathSoundPlayer.ts`)

**Hecho.** `src/features/wellness/infrastructure/breathSoundPlayer.ts` con `createBreathSoundPlayer(): BreathSoundPlayer`:

- Seis reproductores (`createAudioPlayer`) con `require` estáticos de `assets/sounds/breathing/*.wav`, creados una vez.
- Modo de audio configurado una sola vez: `mixWithOthers`, `playsInSilentMode: false` (con el teléfono en silencio no
  suena nada, como indica la spec), sin segundo plano y sin grabación.
- `play(id)`: cierra una salida gradual pendiente, restablece el volumen, `seekTo(0)` y `play()`.
- `stopAll()`: volumen 0,8 → 0,6 → 0,4 → 0,2 → 0 en 5 pasos de 30 ms (150 ms), y luego pausa, vuelta a 0 s y
  volumen restablecido. Un contador de generación cancela la salida si llega un `play()` nuevo.
- `release()`: silencia y llama a `remove()` en cada reproductor.
- Los fallos de un reproductor se descartan sin mensaje ni registro.

| Comando | Resultado |
| --- | --- |
| `npm run typecheck` | Sin errores |
| `npm test` | 522 pruebas, 522 correctas, 0 fallos (el archivo nuevo no tiene pruebas: depende de `expo-audio`, que `node --test` no carga) |

**Limitaciones.**

- **No se ejecutó ningún sonido.** Que los seis suenen, que la salida gradual se oiga y que `stopAll` tarde menos de
  200 ms se comprueba en Android en T010 (CA-006, CA-012).
- Metro admite `.wav` como recurso por defecto, pero no se empaquetó la app para confirmarlo.
- Se asume que el `volume` del reproductor puede cambiarse mientras suena en Android; también pendiente de T010.
- El reproductor aún no está conectado a ninguna pantalla (eso es T008).

## T008 — Hook, interruptor y pantalla

**Hecho.**

- `hooks/useBreathingSounds.ts`: arranca con sonido encendido; al montar crea el reproductor y el controlador, precarga una vez y lee la preferencia (si la persona toca el interruptor antes de que termine de leerse, su elección manda). Llama a `begin()` al pasar a `running` y a `stop()` al pasar de `running` a `idle` (no al pasar a `done`, para no cortar la campanilla final). Solo avisa al controlador cuando cambia la clave `ciclo:fase` o `finished`. `AppState` en `background` o `inactive` llama a `stop()`. Al apagar el interruptor mientras suena, silencia al instante y guarda la elección. Al desmontar hace `dispose()`.
- `components/SoundToggle.tsx`: fila con «Con sonido» / «Sin sonido», `Switch` con rol `switch`, etiqueta «Sonido de la respiración» y estado `checked`, alto mínimo de 44 px y la línea «El sonido es opcional.».
- `BreathingScreen.tsx`: usa el hook y muestra `SoundToggle` entre el texto del ciclo y el botón de acción. No se tocó el cálculo del momento ni los botones.
- `breathingGuide.ts`: nuevo paso «Sonido opcional» (tipo `info`, sin elemento destacado) antes del cierre, con el texto del plan.

| Comando | Resultado |
| --- | --- |
| `npm run typecheck` | Sin errores |
| `npm test` | 522 pruebas, 522 correctas, 0 fallos |
| Revisión de imports | `BreathingScreen.tsx` no importa `expo-audio` ni la preferencia de sonido directamente (solo el hook); sigue importando `guideStorage`, como antes |

**Limitaciones.**

- No se vio la pantalla ni se oyó nada; el recorrido en web y Android es T009 y T010.
- El hook y el componente no tienen pruebas automáticas (dependen de React Native y `expo-audio`, que `node --test` no carga).
- El repositorio no tiene configuración de ESLint, así que no se pasó lint.
- El paso nuevo dice «el interruptor Sonido»; la etiqueta accesible del interruptor es «Sonido de la respiración». Se dejó el texto del plan; se puede igualar en T009 si al verlo en pantalla confunde.

## T007 (corrección) — hallada en el recorrido web de T009

Al probar en la web, la campanilla de inicio se cortaba en el mismo instante en que empezaba la inhalación (en el
registro: `play start-chime` y `pause start-chime` con `currentTime` 0 en el mismo milisegundo). Causa: `play()` de
`breathSoundPlayer.ts` llamaba siempre a `settle()`, que pausa todos los sonidos activos. Corrección: solo cierra una
salida gradual si hay una en curso (`if (fadeTimer !== null) settle()`). Tras el cambio, la campanilla y la inhalación
suenan juntas. `npm run typecheck` y `npm test` (522 de 522) siguen en verde.

## T009 — Recorrido web de la respiración

**Entorno.** Previsualización web (`npx expo start --web --port 8089`) con `EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:9`
y una clave falsa, para que nada saliera hacia el Supabase remoto del `.env`; sin iniciar sesión. Navegador integrado
de la app. Para observar el audio se envolvieron `HTMLMediaElement.play` y `pause` en la página y se registró cada
llamada con su instante, archivo y volumen. No hubo backend, ni datos de personas, ni cambios en el repositorio por la prueba.

| Comprobación | Resultado |
| --- | --- |
| `/wellness/breathing` abre y muestra «Con sonido» con el interruptor encendido (`input` con rol `switch`, etiqueta «Sonido de la respiración», `checked`; la fila mide 44 px) | Correcto |
| Al abrir la pantalla y al recorrer la guía no hay ninguna llamada a `play` | Correcto (registro vacío) |
| La guía tiene 7 pasos y el paso 6 es «Sonido opcional» con el texto del plan, antes del cierre | Correcto |
| «Comenzar» con sonido: `start-chime` e `inhale` a 0 s, `hold` a 4 s, `exhale` a 11 s (±0,1 s) | Correcto, tras corregir el corte de la campanilla (ver T007) |
| «Detener» con sonido: el volumen baja a 0 y recién entonces se pausan todos los sonidos activos | Correcto |
| Sesión completa de 76 s: 17 sonidos en orden (inicio; en cada ciclo inhala, aguanta y exhala; `cycle-chime` a 19, 38 y 57 s; `end-chime` a 76 s) y 0 pausas forzadas; la pantalla termina en «¡Bien hecho!» y «Repetir» | Correcto |
| Interruptor apagado («Sin sonido»): sesión iniciada, 10 s y «Detener», sin ninguna llamada de audio | Correcto |
| La elección se guarda (`duocmind.breathing.sound.v1` = `0`) y al recargar el interruptor sigue apagado; al volver a encenderlo se guarda `1` | Correcto |
| Red: solo `localhost` (los seis `.wav`, el paquete y las fuentes); ninguna solicitud externa ni a Supabase por el sonido | Correcto |
| Consola: sin errores con la versión corregida. Con «Comenzar» y «Detener» inmediatos, y con 2 sesiones más, ningún rechazo sin atender | Correcto |
| Pomodoro (`/wellness/pomodoro`) y Bienestar (`/wellness`) cargan y se ven igual que antes; ningún elemento de audio en ellos | Correcto |

**Limitaciones.**

- **No se oyó nada.** Se comprobó el orden, los instantes y los volúmenes de las llamadas, no que el sonido sea agradable
  (CA-011, T010). La reproducción real de la web depende de la política de autoplay del navegador: aquí siempre ocurre
  tras tocar «Comenzar».
- La web no sustituye la prueba nativa (AGENTS.md): el silencio con el teléfono en modo silencio, la mezcla con la música,
  el paso a segundo plano y la salida de la pantalla se prueban en Android (T010). `AppState` en web no se ejercitó.
- Un primer recorrido se hizo con un paquete desactualizado (Metro en modo CI no recarga); sus dos `AbortError` de
  `play()` eran de ese código antiguo y no reaparecieron con el corregido.
- En la guía, la tarjeta de los pasos 2 a 4 se coloca encima del interruptor y del botón; es el comportamiento de la
  guía (tarjeta bajo el elemento destacado) y no impide leerla, pero el interruptor queda tapado mientras dura.
- El paso nuevo dice «el interruptor Sonido»; la etiqueta visible es «Con sonido» / «Sin sonido». Se deja el texto del plan.
- «No pudimos cargar los recursos» en Bienestar es esperable sin backend y no tiene relación con este cambio.
- El nodo exterior del `Switch` de React Native Web también expone `role=switch` sin etiqueta; el `input` interior sí
  tiene la etiqueta y el estado. Es el comportamiento del componente, no se cambió.

## Cambio de diseño sonoro (spec 0.2.0) — 2026-11-27

Tras escuchar el resultado de la versión 0.1.x, el equipo lo descartó (simple, agudo, de aspecto
mecánico) y, después de tres rondas de muestras de audición, aprobó un soplo de aire con latido con
eco más grave, sin campanillas (spec y plan 0.2.0). Por eso se reabren T002, T003, T005, T007, T008 y
T009 en `tasks.md`.

**Los resultados de las secciones T002, T003, T005, T007, T008 y T009 de arriba corresponden al diseño
0.1.x** (seis sonidos, tonos y campanillas) y se conservan solo como historial: cada tarea volverá a
verificarse y quedará registrada en una sección nueva al rehacerse. Siguen vigentes T001, T004 (la
preferencia no cambia) y la parte ya hecha de T006 (instalación de `expo-audio` y nombres de la API).
Las muestras de audición de las tres rondas están en `tools/.local/muestras-sonido/` (no versionadas).

## T002 (rehecha para la spec 0.2.0) — Dominio sin sonidos de marcador

**Hecho.** `src/features/wellness/domain/breathingSounds.ts`:

- `BreathSoundId` pasa a `'inhale' | 'hold' | 'exhale'`.
- `BreathCueInput` queda con `previous` y `current` (se quitan `sessionStart` y `finished`).
- `soundsForMoment` (lista) pasa a `soundForMoment`, que devuelve un sonido o `null`: `null` si no hay momento, si es la misma fase y ciclo, o si el cambio se detecta más de `LATE_CUE_TOLERANCE_SECONDS` (0,5 s) después del inicio de la fase; en otro caso, el tipo de fase. Importa solo `breathing478.ts`.

**Ajustes mínimos fuera del alcance de T002, necesarios para que el repositorio compile y pase** (T003 y T007
completan su forma final):

- `breathingSoundController.ts`: llama a `soundForMoment`, reproduce solo si `isEnabled()`, y se quitan las
  variables de inicio de sesión. Conserva por ahora el parámetro `finished` de `update` (T003 lo quitará).
- `breathSoundPlayer.ts`: se quitan las tres entradas de campanilla de `SOURCES` (T007 revisará el resto).
- `tests/breathingSounds.test.mjs`: la parte de dominio se reescribió (9 pruebas) y en la del controlador solo se
  ajustaron las expectativas a los 12 sonidos de fase (sin campanillas; el «final» ya no suena). T003 completará
  esa parte.

| Comando | Resultado |
| --- | --- |
| `node --test tests/breathingSounds.test.mjs` | 20 pruebas, 20 correctas |
| `npm run typecheck` | Sin errores |
| `npm test` | 521 pruebas, 521 correctas, 0 fallos (522 antes: se quitó la prueba de la campanilla final y las de inicio y de ciclo con campanilla; se añadió la de otro ciclo) |

**Pruebas del dominio:** sin momento (también al terminar), misma fase y ciclo, retraso con el límite
inclusivo, primera inhalación sin sonido de inicio, sin momento previo y fase avanzada, inhalación de los ciclos
2 a 4 sin marcador, pausa y exhalación, inhalación de otro ciclo tras una inhalación, y una sesión completa
simulada con tics de 50 ms durante 80 s: exactamente 12 sonidos (inhalación 0, 19, 38, 57 s; pausa 4, 23, 42,
61 s; exhalación 11, 30, 49, 68 s), solo de los tres tipos y ninguno después del final.

**Comprobación de mutación.** Se rompió `soundForMoment` de tres maneras y las pruebas fallaron cada vez
(tolerancia 0,5→0,6: 1 fallo; devolver `'hold'` en ciclos 2 a 4: 6 fallos; quitar la comparación de ciclo: 1
fallo, tras añadir la prueba de «otro ciclo», que al inicio no existía y dejaba pasar esa mutación). El archivo
se restauró y es idéntico al original (mismo SHA-256).

**Limitaciones.** El audio sigue sin escucharse: depende de T005 (archivos nuevos) y T007 (reproductor).
Los archivos `.wav` de campanilla siguen en disco hasta T005; sus pruebas todavía los esperan y pasan.

## T003 (rehecha para la spec 0.2.0) — Controlador sin `finished`

**Hecho.** `src/features/wellness/application/breathingSoundController.ts`:

- `update(moment)` ya no recibe `finished`. Un momento nulo significa que la sesión terminó o se detuvo: no
  reproduce nada, **no llama a `stopAll`** (la última exhalación termina sola) y el controlador queda quieto
  hasta el siguiente `begin()`.
- `begin()` silencia lo anterior (`stopAll`) y deja el controlador listo; `stop()` silencia y olvida el momento
  atendido, pero no cierra la sesión (al volver de segundo plano, el siguiente cambio de fase sí suena);
  `dispose()` silencia y libera.
- Con `isEnabled()` falso no hay llamadas a `play`, pero el momento atendido avanza igual. Todo llamado al
  reproductor va en `try/catch`, sin mensajes ni registro.
- Ajuste mínimo fuera de esta tarea: en `hooks/useBreathingSounds.ts` la llamada pasa a `update(moment)`
  para que compile. T008 limpia el resto del hook (`finished` en las dependencias del efecto).

**Pruebas** (`tests/breathingSounds.test.mjs`, parte del controlador, con un reproductor falso y tics de 50 ms
durante 80 s): secuencia exacta de 12 sonidos; sin `begin()` no suena nada; con el sonido apagado no hay
llamadas a `play`; encender a mitad de sesión no hace sonar lo que ya pasó; apagar a mitad y volver a encender
no repite nada; `begin()` y `stop()` llaman a `stopAll()`; un reproductor que lanza errores en cada método no
rompe nada y uno que falla una vez no impide los siguientes; tras `stop()` a mitad de fase no suena un sonido
tardío; al terminar no suena nada, no se llama a `stopAll`, el controlador queda quieto y un `begin()` nuevo
(«Repetir») vuelve a sonar; tras «Detener» no suena nada hasta un nuevo `begin()`; `dispose()` libera y deja
de sonar.

| Comando | Resultado |
| --- | --- |
| `node --test tests/breathingSounds.test.mjs` | 21 pruebas, 21 correctas |
| `npm run typecheck` | Sin errores |
| `npm test` | 522 pruebas, 522 correctas, 0 fallos |

**Comprobación de mutación** sobre el controlador (cada una rompió pruebas y el archivo se restauró idéntico,
mismo SHA-256): no comprobar `begin()` (4 fallos); ignorar `isEnabled` (3); no avanzar el momento con el sonido
apagado (1); cortar con `stopAll` al terminar (1); `play` sin `try/catch` (2); `begin()` sin `stopAll` (2); no
cerrar la sesión al terminar (2).

**Limitaciones.** Se prueba con un reproductor falso; el audio real depende de T005 y T007. El hook aún
conserva `finished` en sus dependencias hasta T008.

## T005 (rehecha para la spec 0.2.0) — Script y tres archivos de audio

**Hecho.**

- `tools/scripts/generate-breathing-sounds.mjs` reescrito: exporta `SAMPLE_RATE`, `SOUND_NAMES`
  (`inhale`, `hold`, `exhale`), `renderSounds()`, `encodeWav()` y `describeSound()`; solo escribe en disco al
  ejecutarse directamente; solo usa `Math` y `Buffer`. Es el soplo liso (ruido con semilla fija, pasa-bajos de cuatro
  polos, dos resonancias y algo de cuerpo grave) más el latido con eco (72 → 52 Hz con armónico, ataque de 24 ms y
  eco a 0,23 s y 0,47 s) a un latido por segundo, el primero más marcado (×1,4 en inhale y exhale, ×1,2 en hold).
  Un único factor de nivel para los tres archivos (tope −6 dBFS; hoy no hace falta reducir nada).
- `assets/sounds/breathing/`: `inhale.wav`, `hold.wav` y `exhale.wav` (838 032 bytes en total); se borraron
  `start-chime.wav`, `cycle-chime.wav` y `end-chime.wav`.
- `tests/breathingSoundFiles.test.mjs` reescrito (16 pruebas): solo existen los tres archivos; formato; duraciones
  de 4, 7 y 8 s; pico ≤ 0,5012 y no demasiado bajo; nivel RMS de cada archivo a no más de 9 dB del más fuerte;
  primera y última muestra casi nulas; sin saltos bruscos; entrada y salida graduales de 50 ms; un latido en cada
  segundo entero (4, 7 y 8) y distinguible del anterior; el primer latido es el más marcado; el soplo suena en
  inhale y exhale y no en hold; el soplo crece al inhalar y se apaga al exhalar; peso ≤ 1,5 MB; los archivos
  versionados coinciden con `renderSounds()`; dos ejecuciones dan los mismos bytes y reproducen los versionados; el
  script no escribe al importarse.

| Medida | inhale | hold | exhale |
| --- | --- | --- | --- |
| Duración | 4,00 s | 7,00 s | 8,00 s |
| Pico | −7,5 dBFS | −8,9 dBFS | −7,5 dBFS |
| RMS | −24,0 dBFS | −26,0 dBFS | −25,1 dBFS |

**Fidelidad con el sonido aprobado.** Se comparó cada archivo con la muestra «05 — latido con eco más grave, con
respiro liso» (ronda 3 de audición): desde 1,2 s hasta 1,3 s antes del final, la diferencia máxima entre muestras es
0 (idénticos). Los cambios audibles se limitan a los extremos: el primer latido de cada archivo ataca en 50 ms en
vez de 24 ms (para cumplir la entrada gradual de RF-004.4) y la salida de 150 ms apaga la cola del último latido.

**Ajuste sobre el plan.** La primera idea del plan, una entrada de 50 ms que multiplicara todo el archivo, apagaba el
énfasis del primer latido (en `hold`, el primero quedaba en 0,279 y los demás en 0,300). Se cambió por el ataque
lento solo del primer latido y se actualizó el plan (§3, riesgo R12): el énfasis queda intacto (picos de 0,420, 0,360
y 0,421 frente a 0,300 a 0,356 de los demás latidos).

| Comando | Resultado |
| --- | --- |
| `node tools/scripts/generate-breathing-sounds.mjs` | Genera los tres archivos y muestra duración, pico y RMS |
| `node --test tests/breathingSoundFiles.test.mjs` | 16 pruebas, 16 correctas |
| `npm run typecheck` | Sin errores |
| `npm test` | 524 pruebas, 524 correctas, 0 fallos |

**Comprobación de mutación** (cada una se restauró y los archivos quedaron idénticos): ataque del primer latido de
24 ms → falla la prueba de entrada gradual; quitar el último latido → falla la de «un latido en cada segundo»;
soplo en la pausa → falla la de «el soplo no suena en hold»; ruido con `Math.random` → fallan las dos de
determinismo y coincidencia; soplo casi inaudible → fallan las de soplo. **No se detecta** subir el volumen del
latido (de 0,3 a 0,9): el factor común de nivel lo devuelve a −6 dBFS y ninguna prueba fija la proporción entre
soplo y latido; esa proporción (unos 8 dB) se juzga escuchando (CA-011).

**Limitaciones.**

- **No se escuchó el resultado final.** Es idéntico al aprobado salvo en los extremos, pero la escucha de los
  archivos finales y de su ensamblado (ciclo de 19 s) la hace la persona responsable en CA-011.
- Los archivos son idénticos entre ejecuciones en este equipo (Node 24.21.0); si en CI cambiara la versión de Node,
  se aplica el riesgo R4 del plan.
- El reproductor (T007) todavía no usa los archivos nuevos: sigue pendiente de ajuste. Los tres `.wav` de
  campanilla ya no existen y ningún código los referencia.
- Los `.wav` no están ignorados por Git y siguen sin seguimiento, como el resto del incremento (sin commits).

## T007 (rehecha para la spec 0.2.0) — Reproductor de tres fuentes

**Hecho.**

- `src/features/wellness/infrastructure/breathSoundPlayerCore.ts` (nuevo): toda la lógica del reproductor, sin
  importar `expo-audio`, para poder probarla con `node --test`. Recibe por parámetro `createPlayer`,
  `configureAudio` y las `sources`. Tres reproductores (uno por sonido), modo de audio configurado una sola vez,
  `play(id)` con `seekTo(0)` y `play()`, `stopAll()` con salida gradual de 5 pasos de 30 ms (150 ms) y luego pausa,
  vuelta a 0 s y volumen restablecido, y `release()` que libera los tres.
- `src/features/wellness/infrastructure/breathSoundPlayer.ts` (reducido): conecta el núcleo con `expo-audio`
  (`createAudioPlayer`, `setAudioModeAsync` con `mixWithOthers`, sin silencio ni segundo plano ni grabación) y los
  tres `require` estáticos de `inhale`, `hold` y `exhale`.
- `tests/breathSoundPlayer.test.mjs` (nuevo, 11 pruebas) con un audio falso y temporizadores simulados.

**Cambios respecto a la 0.1.x, hallados al revisar el código:**

1. **Dos `stopAll()` seguidos reiniciaban la salida gradual desde 0,8**, de modo que el volumen subía de golpe a
   mitad del fundido (por ejemplo, «Detener» y enseguida salir de la pantalla). Ahora una salida en curso se deja
   seguir. Hay una prueba.
2. Se quitó el contador de generación: `clearInterval` (en `settle()`, que llama `play()` cuando hay una salida
   en curso) ya cancela la salida, así que el contador era redundante. Mismo comportamiento, menos código.
3. `seekTo` y el modo de audio se envuelven para que un fallo, incluso síncrono, no deje rechazos sin atender.
4. Se mantiene la corrección hallada en el recorrido web de T009: `play()` solo cierra una salida gradual en
   curso y no corta lo que suena a la vez (ahora con prueba).

| Comando | Resultado |
| --- | --- |
| `node --test tests/breathSoundPlayer.test.mjs` | 11 pruebas, 11 correctas |
| `npm run typecheck` | Sin errores (el `AudioPlayer` real encaja en `AudioPlayerLike`) |
| `npm test` | 535 pruebas, 535 correctas, 0 fallos |

**Pruebas del reproductor:** configura el audio una sola vez y crea un reproductor por archivo; `play` vuelve a 0 s,
restablece el volumen y reproduce solo ese sonido; un sonido nuevo no corta al que suena; `stopAll` baja el volumen
0,8 → 0,6 → 0,4 → 0,2 → 0 en pasos de 30 ms (150 ms, dentro de los 200 ms de RF-006.1) y luego pausa, vuelve a 0 s y
restablece el volumen; silencia a todos los que suenan a la vez; un segundo `stopAll` no sube el volumen; un `play()`
durante la salida la cancela y el sonido nuevo suena completo; `stopAll` sin nada sonando no hace nada; `release`
cancela la salida y libera los tres; un audio que falla (modo, `seekTo`, `remove`) no produce rechazos sin atender ni
excepciones; un `play()` que lanza no rompe el siguiente.

**Comprobación de mutación** (cada una rompió pruebas y el archivo se restauró idéntico, mismo SHA-256): `play`
corta todo (el error de la web), `stopAll` reinicia el fundido, fundido de 240 ms (2 fallos), `settle` sin cancelar
el temporizador, `seekTo` sin `catch`, `release` sin `remove`, modo de audio en cada llamada y `play` sin
restablecer el volumen: 1 fallo cada una salvo la de 240 ms.

**Pendiente (no se pudo ejecutar aquí).** Que los tres sonidos suenen en un teléfono, que el fundido se oiga como
silencio sin clic y que se mezcle con la música de otras apps (riesgo R2) se comprueba en Android (T010 y la parte
pendiente de T006). La web (T009, que se repite) ejercita el audio real del navegador, pero no el de Android. Los
nombres de la API usados (`createAudioPlayer`, `setAudioModeAsync`, `interruptionMode`) ya se confirmaron contra los
tipos instalados.

## T008 (rehecha para la spec 0.2.0) — Hook, interruptor, pantalla y paso de la guía

**Hecho.**

- `hooks/useBreathingSounds.ts`: sus argumentos pasan a `{ status, moment }` (se quita `finished`). El efecto que
  avisa al controlador depende solo de la clave `ciclo:fase`; cuando la sesión termina o se detiene, la clave pasa a
  `null`, el controlador recibe `update(null)` y queda quieto hasta el siguiente «Comenzar» (T003). Sigue igual: arranca
  encendido, lee la preferencia al montar (si la persona tocó el interruptor antes, su elección manda), crea
  controlador y reproductor una vez y precarga, `begin()` al pasar a `running`, `stop()` al pasar de `running` a `idle`
  (no al pasar a `done`, para no cortar la última exhalación), silencia con `AppState` en `background` o `inactive`,
  apagar el interruptor silencia al instante y guarda la elección, y libera todo al desmontar.
- `screens/BreathingScreen.tsx`: solo cambia la llamada al hook (`useBreathingSounds({ status, moment })`). No se
  tocó el cálculo del momento ni los botones.
- `domain/breathingGuide.ts`: el texto del paso «Sonido opcional» pasa a «Con el sonido encendido oirás un soplo suave
  de aire al inhalar y al exhalar, y un latido cada segundo que te ayuda a contar. Puedes apagarlo con el interruptor
  de sonido.» (tipo `info`, sin elemento destacado, justo antes del cierre).
- `components/SoundToggle.tsx`: sin cambios (fila «Con sonido» / «Sin sonido», `Switch` con rol `switch`, etiqueta
  «Sonido de la respiración» y estado `checked`, 44 px de alto mínimo y «El sonido es opcional.»).
- `tests/breathingGuide.test.mjs` (nuevo, 4 pruebas): ids únicos y cierre al final; el paso «Sonido opcional» va justo
  antes del cierre, es `info`, sin elemento destacado, y habla de soplo, latido cada segundo y de apagarlo; ningún paso
  menciona ya tonos ni campanillas; los pasos de las fases siguen señalando el círculo.

| Comando | Resultado |
| --- | --- |
| `npm run typecheck` | Sin errores |
| `node --test tests/breathingGuide.test.mjs` | 4 pruebas, 4 correctas |
| `npm test` | 539 pruebas, 539 correctas, 0 fallos |
| Revisión de imports | `BreathingScreen.tsx` no importa `expo-audio`, el reproductor ni la preferencia de sonido: solo el hook (y `guideStorage`, como antes). El hook ya no menciona `finished` |

**Comprobación de mutación sobre la guía** (restaurada idéntica, mismo SHA-256): volver al texto de «tono» (2 fallos);
dar al paso un elemento destacado (1 fallo).

**Limitaciones.**

- El hook y el componente siguen sin pruebas automáticas (dependen de React Native, `expo-audio` y `AppState`, que
  `node --test` no carga). Su lógica se cubre en el controlador (T003) y el reproductor (T007); el recorrido en pantalla
  se hace en T009 (web, que se repite) y T010 (Android).
- El paso de la guía dice «el interruptor de sonido»; la etiqueta visible es «Con sonido» / «Sin sonido» y la
  accesible, «Sonido de la respiración». Se deja el texto del plan; se puede igualar al ver la pantalla en T009.
- El repositorio no tiene configuración de ESLint, así que no se pasó lint.

## T007 (segunda corrección) — hallada en el recorrido web de T009

En el registro de la web, desde el ciclo 2 cada `play()` se llamaba con `currentTime` 4, 7 u 8 (el final del archivo
que había terminado) y el `seekTo(0)` llegaba después. Causa: al envolver `seekTo` en `Promise.resolve().then(...)`
para atrapar sus fallos, la orden de rebobinar pasó a ejecutarse en el siguiente microtick, es decir, después de
`play()`. La versión anterior la daba antes. En el navegador un audio terminado se reinicia solo al reproducirse, pero
en Android no hay esa garantía. Corrección en `breathSoundPlayerCore.ts`: `rewind` llama a `seekTo(0)` de inmediato
(dentro de un `try/catch`) y solo ignora su resultado. Prueba nueva en `tests/breathSoundPlayer.test.mjs` (12 en total):
al llamar a `play`, el orden de eventos del reproductor es `['seek0', 'play']`; con la versión defectuosa falla, con la
corregida pasa. Con el código corregido, en la web cada reproducción empieza en `currentTime` 0. `npm run typecheck` y
`npm test` (540 de 540) en verde.

## T009 (rehecha para la spec 0.2.0) — Recorrido web de la respiración

**Entorno.** Previsualización web (`npx expo start --web --port 8089 --clear`, con `EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:9`
y una clave falsa, para no tocar el Supabase remoto del `.env`), sin iniciar sesión, en el navegador integrado de la
app. Se partió de un almacenamiento limpio (sin `guideSeen` ni preferencia de sonido). Para observar el audio se envolvieron
`HTMLMediaElement.play` y `pause` en la página y se registró cada llamada con su instante, archivo, volumen y posición.
No hubo backend, datos de personas ni cambios en el repositorio por la prueba. Los tiempos son relativos al primer sonido.

| Comprobación | Resultado |
| --- | --- |
| `/wellness/breathing` abre con «Con sonido»: `input` con rol `switch`, etiqueta «Sonido de la respiración», `checked` desde el primer arranque; fila de 44 px | Correcto |
| Al abrir la pantalla y al recorrer los 7 pasos de la guía no hay ninguna llamada a `play` | Correcto (registro vacío) |
| El paso 6 es «Sonido opcional» con el texto nuevo («…un soplo suave de aire al inhalar y al exhalar, y un latido cada segundo…») | Correcto |
| Sesión completa de 76 s: 12 sonidos (`inhale` 0, 19, 38 y 57 s; `hold` 4, 23, 42 y 61 s; `exhale` 11, 30, 49 y 68 s, con ±0,1 s), ninguna campanilla, 0 pausas forzadas, 0 rechazos sin atender; termina en «¡Bien hecho!» y «Repetir» | Correcto |
| Cada reproducción empieza en `currentTime` 0 (ciclo 2: `inhale` a 20,4 s, `hold` a 24,4 s) | Correcto tras la corrección de T007 (antes empezaba en 4 y 7 s) |
| «Detener» en el ciclo 2: el volumen de los tres reproductores activos baja a 0 y recién entonces se pausan (≈ 0,15 s después del último sonido) | Correcto |
| Interruptor apagado («Sin sonido»): sesión iniciada, 20 s y «Detener», sin ninguna llamada de audio | Correcto |
| La elección se guarda (`duocmind.breathing.sound.v1` = `0`) y al recargar el interruptor sigue apagado | Correcto |
| Red en la pantalla de respiración: solo `localhost:8089` (los tres `.wav` — `inhale`, `hold`, `exhale` —, el paquete y las fuentes); ninguna solicitud externa ni de Supabase, y ningún archivo de campanilla | Correcto |
| Consola con el código corregido y el servidor vivo: sin errores nuevos tras recargar (ningún `AbortError`, `Uncaught` ni `TypeError`) | Correcto |
| Pomodoro (`/wellness/pomodoro`) y Bienestar (`/wellness`) cargan y se ven igual que antes; Bienestar no pide archivos de sonido | Correcto |

**Limitaciones.**

- **No se oyó nada en esta prueba**: se comprobó el orden, los instantes, el volumen y la posición de cada llamada de audio;
  la calidad del sonido la decide la persona responsable (CA-011, T010). La reproducción en la web ocurre siempre tras
  tocar «Comenzar» (regla de gesto del navegador).
- La web no sustituye la prueba nativa (`AGENTS.md`): el modo silencio, la mezcla con la música, el segundo plano y salir de la
  pantalla se prueban en Android (T010). `AppState` no se ejercitó en la web.
- La consola del navegador acumuló cientos de `ERR_CONNECTION_REFUSED`. Vienen de las pausas al reiniciar el servidor
  (la pestaña reintentaba conectarse) y de Bienestar, que pide recursos a la URL falsa `127.0.0.1:9` (2 solicitudes
  fallidas esperables sin backend: «No pudimos cargar los recursos»). La pantalla de respiración no hace ninguna solicitud
  externa y su carga no suma errores nuevos.
- La tarjeta de la guía en los pasos 2 a 4 se coloca sobre el interruptor y el botón mientras dura (comportamiento de la
  guía, no cambió); el paso 6 dice «el interruptor de sonido» y la etiqueta visible es «Con sonido» / «Sin sonido». Se deja
  el texto del plan.
- Se omitió repetir esta vez la prueba de movimiento reducido y lector de pantalla (CA-009): es de T010.

## T006 — Permisos de Android (parcial: opciones del plugin y manifiesto generado)

Por indicación explícita del equipo (2026-11-27) se aplicó el riesgo R1 del plan. **T006 sigue abierta**: faltan la
compilación nativa, el sonido de prueba en Android y la prueba de mezcla con música (riesgo R2).

**Hecho.** En `app.json`, el plugin `expo-audio` pasa de `"expo-audio"` a:

```json
["expo-audio", { "microphonePermission": false, "recordAudioAndroid": false, "enableBackgroundPlayback": false }]
```

Las tres opciones se leyeron en `node_modules/expo-audio/plugin/build/withAudio.{js,d.ts}`: `recordAudioAndroid` controla
`RECORD_AUDIO`; `enableBackgroundPlayback` controla `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_MEDIA_PLAYBACK`, el servicio
`AudioControlsService` y el modo de fondo `audio` de iOS; `microphonePermission: false` quita el texto de micrófono de iOS.

**Comprobación.** `npx expo prebuild --platform android --no-install` en una copia temporal del proyecto (sin `.env`, con
`EXPO_NO_DOTENV=1`, con `node_modules` enlazado), una vez con el plugin por defecto y otra con las opciones nuevas:

| Permiso o componente | Plugin por defecto (antes) | Con las opciones (ahora) |
| --- | --- | --- |
| `RECORD_AUDIO` | Sí | **No** |
| `FOREGROUND_SERVICE` | Sí | **No** |
| `FOREGROUND_SERVICE_MEDIA_PLAYBACK` | Sí | **No** |
| Servicio `AudioControlsService` (`mediaPlayback`) | Sí | **No** |
| `MODIFY_AUDIO_SETTINGS` | Sí | Sí |

`MODIFY_AUDIO_SETTINGS` se conserva: lo declara la propia librería en su `AndroidManifest.xml` y es un permiso «normal»
(se concede al instalar, sin diálogo para la persona). Ninguna otra librería de `node_modules` declara `RECORD_AUDIO`,
`FOREGROUND_SERVICE*` ni `MODIFY_AUDIO_SETTINGS`. El resto de permisos del manifiesto generado (`INTERNET`, `VIBRATE`,
`SYSTEM_ALERT_WINDOW` y `READ/WRITE_EXTERNAL_STORAGE` hasta la API 32) no vienen de este incremento.

| Comando | Resultado |
| --- | --- |
| `node -e "JSON.parse(...app.json)"` | JSON válido |
| `npx expo prebuild --platform android --no-install` (copia temporal, dos veces) | Manifiestos generados y comparados; la copia se borró y `node_modules` real quedó intacto |
| `npm run typecheck` | Sin errores |
| `npm test` | 540 pruebas, 540 correctas, 0 fallos |

**Limitaciones.** Es el manifiesto que genera `prebuild` más los manifiestos de las librerías leídos aparte, no el
manifiesto fusionado final de una compilación con Gradle: esa revisión se repite al compilar (T006, pasos pendientes).
No se probó que, sin `enableBackgroundPlayback`, los sonidos sigan reproduciéndose en Android; la app solo suena con la
pantalla abierta y se silencia al pasar a segundo plano (RF-006), pero se confirma en T010. El `app.json` solo se
modificó en esa línea; las dependencias no cambiaron.

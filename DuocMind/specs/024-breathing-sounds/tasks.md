# Tareas 024 — Sonidos guiados en la respiración 4-7-8

| Campo | Valor |
| --- | --- |
| Versión | 0.2.0 |
| Estado | APROBADAS |
| Fecha | 2026-11-27 |
| Spec | `spec.md` 0.2.0, APROBADA |
| Plan | `plan.md` 0.2.0, APROBADO |
| Constitución | 2.0.0 |
| Rama | `feature/sonidos-respiracion`, creada desde `dev` (222fd29) |
| Aprobación de tareas | Confirmada explícitamente por el usuario el 2026-11-27 para la 0.2.0 (la 0.1.0 fue aprobada el 2026-11-26). Por indicación del usuario no se agregan tareas: se reabren y ajustan las existentes |

## Reglas de ejecución

Ejecutar en orden y una tarea por vez, después de aprobar este documento. No
delegar ni paralelizar tareas. No hay datos personales ni backend en este
incremento: ninguna tarea usa Supabase, cuentas reales ni red.

Una tarea se marca `[x]` cuando su cambio está completo, pasa su verificación
específica y el repositorio conserva las validaciones aplicables: `npm run
typecheck` y `npm test` sin fallos nuevos. Registrar cambio, comando o recorrido,
resultado y limitaciones en `verification.md`. Una prueba diferida a otra tarea
aparece como pendiente, nunca como ejecutada. La spec no se cierra mientras quede
pendiente la validación en Android ni la escucha de CA-011.

Estas tareas no autorizan commits, push, despliegues, migraciones, cambios de
esquema ni datos reales. La única dependencia nueva autorizada es `expo-audio`
(T006). No modifican `breathing478.ts`, el Pomodoro, el resto de Bienestar, el
inicio ni el panel administrativo. Las descargas grandes (imagen de compilación de
Android, SDK) y los cambios de configuración del emulador se confirman con la
persona responsable antes de ejecutarlos.

## Preparación

- [x] T001 Abrir `verification.md` con la línea base antes de cambiar código: versiones de Node y npm frente a las declaradas en `package.json`, rama y estado de Git, resultado de `npm run typecheck` y `npm test`, estado de `package.json` (sin `expo-audio`) y qué entorno hay para probar en Android (emulador con audio o teléfono físico, `adb`, SDK). **Verificación:** el archivo existe con resultados reales; si algún comando falla en la línea base, se anota sin corregirlo en esta tarea. **CA-012.**

## Dominio y aplicación

- [x] T002 *(rehecha para la v0.2.0: se quitan los sonidos de marcador)* Crear `src/features/wellness/domain/breathingSounds.ts` con el tipo `BreathSoundId` (`'inhale' | 'hold' | 'exhale'`), `LATE_CUE_TOLERANCE_SECONDS = 0.5`, `BreathCueInput` (`previous` y `current`) y `soundForMoment` (devuelve un sonido o `null`), con las reglas de la tabla de §3 del plan. Solo importa `breathing478.ts` con ruta relativa y extensión `.ts`; sin React ni audio. **Verificación:** `tests/breathingSounds.test.mjs` (parte de dominio): cada fila de la tabla (sin momento, misma fase, retraso mayor a la tolerancia, inhalación incluido el inicio de sesión y los ciclos 2 a 4, pausa, exhalación); `npm run typecheck` y `npm test`. **RF-003, RF-005.** **CA-003, CA-004.**

- [x] T003 *(rehecha para la v0.2.0: sin `finished` ni inicio de sesión)* Crear `src/features/wellness/application/breathingSoundController.ts` con las interfaces `BreathSoundPlayer` y `BreathSoundController` y `createBreathSoundController(player, isEnabled)`: `begin()` silencia lo anterior y activa la sesión; `update(moment)` usa `soundForMoment`, no reproduce si `isEnabled()` es falso pero avanza el momento atendido; `stop()` silencia y olvida el estado; `dispose()` libera; todo llamado al reproductor va en `try/catch` sin mensajes ni registro. **Verificación:** ampliar `tests/breathingSounds.test.mjs` con un reproductor falso: simular tics de 50 ms durante 80 s y comparar la lista exacta de sonidos y tiempos (inhalación 0, 19, 38, 57; pausa 4, 23, 42, 61; exhalación 11, 30, 49, 68; ningún otro sonido; sin repeticiones); sin `begin()` no suena nada; con sonido apagado no hay llamadas a `play`; encender a mitad de sesión no hace sonar lo ya pasado; `stop()` y `begin()` llaman a `stopAll()`; un reproductor que lanza errores en cada método no rompe nada; reanudar tras `stop()` a mitad de fase no reproduce un sonido tardío. **RF-002, RF-005, RF-006, RF-007.** **CA-002, CA-003, CA-004, CA-006, CA-008.**

## Infraestructura

- [x] T004 Crear `src/features/wellness/infrastructure/breathSoundPreference.ts` con `createBreathSoundPreference(storage)` (`load()` devuelve falso solo si se guardó `'0'`; `save()` descarta errores) y una instancia por defecto con `platformSecureKeyValueStorage`, clave `duocmind.breathing.sound.v1`. **Verificación:** `tests/breathSoundPreference.test.mjs` con un almacenamiento en memoria: sin valor, encendido; `'1'`, encendido; `'0'`, apagado; guardar falso y volver a cargar da apagado; guardar verdadero da encendido; una lectura que falla da encendido; una escritura que falla no lanza; `npm run typecheck` y `npm test`. **RF-001, RF-008.** **CA-001, CA-010.**

- [x] T005 *(rehecha para la v0.2.0: soplo de aire y latido con eco, tres archivos)* Reescribir `tools/scripts/generate-breathing-sounds.mjs` y generar con él los tres archivos en `assets/sounds/breathing/` (`inhale`, `hold`, `exhale`, en `.wav`), borrando los tres de campanilla. Exporta `SAMPLE_RATE`, `SOUND_NAMES`, `renderSounds()`, `encodeWav()` y `describeSound()` y solo escribe en disco cuando se ejecuta directamente; usa únicamente `Math` y `Buffer`. Parámetros de partida: los de §3 del plan (muestra 05 de la ronda 3 de audición). **Verificación:** `tests/breathingSoundFiles.test.mjs`: formato WAV mono de 16 bits a 22 050 Hz; existen solo los tres archivos; duraciones de 4, 7 y 8 s (±50 ms); pico de cada archivo ≤ 0,5012 (−6 dBFS) y no demasiado bajo; primera y última muestra casi nulas, con entrada y salida graduales (sin chasquidos); un latido en cada segundo entero (4, 7 y 8); nivel RMS de cada archivo no más de 9 dB bajo el más fuerte; peso total ≤ 1,5 MB; los archivos versionados coinciden con `renderSounds()`; ejecutar el script dos veces no cambia ningún byte; `npm test`. **RF-004.** **CA-005.**

- [ ] T006 Instalar `expo-audio` con `npx expo install expo-audio`, revisar los permisos que agrega a Android y comprobar que suena un archivo en Android. Pasos: (1) la instalación cambia solo `package.json` y `package-lock.json`; (2) generar el proyecto nativo de Android en una copia o carpeta temporal y revisar el manifiesto combinado; si aparecen permisos que la app no usa (por ejemplo `RECORD_AUDIO`), quitarlos con las opciones del plugin o con `android.blockedPermissions` en `app.json`, y volver a revisar; (3) confirmar contra los tipos instalados los nombres de `createAudioPlayer`, `setAudioModeAsync` y sus opciones (riesgo R3); (4) compilar la aplicación y reproducir un `.wav` de prueba en Android, probando además el comportamiento de la mezcla con música (riesgo R2). Si la compilación nativa no corre en este equipo, se usa la ruta de contenedor ya conocida, con confirmación previa de la descarga. **Verificación:** manifiesto combinado sin permisos sobrantes (resultado anotado antes y después), el sonido de prueba se oye en Android, y la mezcla con música se describe tal como ocurre; si «mezclar» no funciona, se detiene la tarea y se pide la decisión de la persona responsable; `npm run typecheck`. **RF-006.3.** **CA-010, CA-012.**

- [x] T007 *(rehecha para la v0.2.0: tres fuentes)* Crear `src/features/wellness/infrastructure/breathSoundPlayer.ts` con `createBreathSoundPlayer(): BreathSoundPlayer`: tres reproductores creados con `require` estáticos de los archivos de `assets/sounds/breathing/`, modo de audio configurado una sola vez según lo confirmado en T006, `play(id)` con `seekTo(0)` y `play()`, `stopAll()` con salida gradual (5 pasos de 30 ms, luego pausa, regreso a 0 s y volumen restablecido, con contador de generación que cancela la salida si llega un `play()` nuevo) y `release()`. **Verificación:** `npm run typecheck` y `npm test`; la prueba en Android de los tres sonidos y del silencio gradual se hace en T010. Anotar como pendiente lo que no se pueda ejecutar aquí. **RF-006.** **CA-006, CA-012.**

## Presentación

- [x] T008 *(rehecha para la v0.2.0: el hook sin `finished` y nuevo texto del paso)* Crear `src/features/wellness/hooks/useBreathingSounds.ts` y `src/features/wellness/components/SoundToggle.tsx`, e integrarlos en `BreathingScreen.tsx`; agregar el paso «Sonido opcional» a `breathingGuide.ts`, con el texto de §3 del plan. El hook (argumentos `{ status, moment }`) arranca con `enabled = true`, lee la preferencia al montar, crea el controlador y precarga una sola vez, llama a `begin()` al pasar a `'running'` y a `stop()` al pasar a `'idle'` (no al pasar a `'done'`), actualiza solo cuando cambia la clave `ciclo:fase`, silencia con `AppState` en `background` o `inactive`, y libera todo al desmontar. `SoundToggle` es una fila con «Con sonido» o «Sin sonido», un `Switch` con rol `switch`, etiqueta «Sonido de la respiración» y estado `checked`, alto mínimo de 44 px y la línea «El sonido es opcional.»; va entre el texto del ciclo y el botón de acción. No se cambia el cálculo del momento ni los botones. **Verificación:** `npm run typecheck`, `npm test` y revisión de que `BreathingScreen` no importa `expo-audio` ni el almacenamiento directamente; la comprobación en pantalla se hace en T009 y T010. **RF-001, RF-002, RF-005, RF-006.** **CA-001, CA-002, CA-003, CA-006, CA-012.**

## Verificación

- [x] T009 *(rehecha para la v0.2.0: se repite con el sonido nuevo)* Recorrido web de la respiración con la previsualización (`npm run web`), sin backend: abrir `/wellness/breathing`; el interruptor aparece encendido; no suena nada al abrir ni al ver la guía; con «Comenzar» suena la secuencia nueva (inhalación, pausa y exhalación, cada una con su latido por segundo, y ninguna campanilla); apagar el interruptor y reabrir la pantalla lo deja apagado; con el sonido apagado no suena nada; la guía muestra el paso con el texto nuevo; revisar las solicitudes de red y la consola (ninguna por el sonido ni mensajes de error); Pomodoro y el resto de Bienestar siguen igual. Registrar cada punto con su resultado real. **Verificación:** los puntos anteriores quedan en `verification.md` con resultado y limitaciones (la web no sustituye la prueba nativa). **RF-001, RF-002, RF-008.** **CA-001, CA-002, CA-003, CA-010, CA-012.**

- [ ] T010 Recorrido en Android con la aplicación compilada, en un teléfono físico o un emulador con audio habilitado, con tomas de pantalla donde corresponda: los tres sonidos (inhalación, pausa y exhalación, con sus latidos) se oyen en el orden de la tabla de §3 de la spec y no suena ninguna campanilla; «Detener», salir de la pantalla, pasar a segundo plano y el fin silencian en menos de 200 ms y «Repetir» no superpone sonidos; el interruptor persiste al cerrar y abrir la aplicación; un fallo de audio simulado no rompe la sesión; con movimiento reducido y con TalkBack, la fase se sigue anunciando por texto y el sonido no depende del movimiento reducido; la mezcla con música ya sonando; medición del retraso de JavaScript entre el cambio de fase y `play()` (el retraso nativo se declara como limitación, riesgo R8); **escucha del conjunto por la persona responsable (CA-011), con el altavoz y con audífonos, y decisión de aplicar o no la alternativa de la decisión 14 (latido de 88 a 62 Hz)**, con los ajustes de parámetros y regeneración que pida, anotando cada iteración; Pomodoro y el resto de Bienestar sin cambios. Anotar el tamaño del APK antes y después (riesgo R10). **Verificación:** cada punto con su resultado real en `verification.md`; lo que no se pueda ejecutar queda como pendiente. **RF-001 a RF-008.** **CA-001 a CA-012.**

- [ ] T011 Cierre: completar `verification.md` con el resultado por criterio CA-001 a CA-012, las limitaciones, los pendientes y el estado de la spec; ejecutar `npm run typecheck` y `npm test` finales; revisar que `git status` solo muestre archivos del incremento y que `package.json`/`package-lock.json` solo agreguen `expo-audio` (y los cambios de permisos de `app.json`, si hubo). **Verificación:** `verification.md` completo con resultados reales y sin pruebas marcadas como ejecutadas cuando no lo fueron. **RF-001 a RF-008.** **CA-001 a CA-012.**

## Trazabilidad

| Tarea | Requisitos | Criterios |
| --- | --- | --- |
| T001 | Línea base | CA-012 |
| T002 | RF-003, RF-005 | CA-003, CA-004 |
| T003 | RF-002, RF-005, RF-006, RF-007 | CA-002, CA-003, CA-004, CA-006, CA-008 |
| T004 | RF-001, RF-008 | CA-001, CA-010 |
| T005 | RF-004 | CA-005 |
| T006 | RF-006.3 | CA-010, CA-012 |
| T007 | RF-006 | CA-006, CA-012 |
| T008 | RF-001, RF-002, RF-005, RF-006 | CA-001, CA-002, CA-003, CA-006, CA-012 |
| T009 | RF-001, RF-002, RF-008 | CA-001, CA-002, CA-003, CA-010, CA-012 |
| T010 | RF-001 a RF-008 | CA-001 a CA-012 |
| T011 | RF-001 a RF-008 | CA-001 a CA-012 |

## Estado de la entrega

Tareas 0.1.0 aprobadas el 2026-11-26; la versión 0.2.0 fue aprobada el 2026-11-27. Se conservan como
completas T001 y T004 (resultados en `verification.md`). T006 sigue parcial (instalación y nombres
de la API; manifiesto, compilación y prueba de mezcla pendientes). T002, T003, T005, T007, T008 y T009 ya fueron rehechas por el cambio de diseño sonoro de la spec 0.2.0;
sus resultados anteriores, que corresponden a la 0.1.x, quedan en `verification.md` como historial. T010 y T011 pendientes. La rama
`feature/sonidos-respiracion` no tiene commits. La spec 024 no puede cerrarse hasta completar T010,
incluida la escucha de CA-011.

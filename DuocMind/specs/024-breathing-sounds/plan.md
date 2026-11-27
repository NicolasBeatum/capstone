# Plan 024 — Sonidos guiados en la respiración 4-7-8

| Campo | Valor |
| --- | --- |
| Versión | 0.2.0 |
| Estado | APROBADO (reemplaza a la 0.1.0) |
| Fecha | 2026-11-27 |
| Spec | `spec.md` 0.2.0, APROBADA el 2026-11-27 |
| Constitución | 2.0.0 |
| Rama | `feature/sonidos-respiracion`, creada localmente desde `dev` (222fd29); sin commits |
| Aprobación del plan | Confirmada explícitamente por el usuario el 2026-11-27 para la 0.2.0 (la 0.1.0 fue aprobada el 2026-11-26) |

## 1. Decisiones y límites

El sonido se agrega a `BreathingScreen` sin tocar `breathing478.ts`: una función
pura decide qué sonido corresponde a cada cambio de momento; un controlador la
aplica; un reproductor (`expo-audio`) los emite; un hook une todo con la pantalla.
Los tres archivos de audio (inhala, aguanta, exhala; el latido de cada segundo va
dentro de ellos) se generan con un script y se versionan.

La versión 0.2.0 del plan acompaña la spec 0.2.0, que cambió el diseño sonoro: soplo
de aire y latido con eco, sin campanillas. Ya existe trabajo hecho con la 0.1.0 (§2);
este plan lo reaprovecha y define qué se cambia.

1. **Todo vive en `features/wellness/`.** Solo la respiración usa este sonido. Si
   otra herramienta lo necesita más adelante, la parte común se moverá a `shared/`
   entonces, no ahora (`AGENTS.md`: nada para funciones futuras).
2. **Sin cambios de backend ni de esquema, y sin red.** La preferencia y los
   sonidos son locales. No hay migraciones, RPC ni Edge Functions.
3. **Una dependencia nueva: `expo-audio`.** Es el módulo de audio de Expo para el
   SDK 57 y la única forma de reproducir sonidos en el flujo administrado;
   `expo-av` está en desuso. Se instala con `npx expo install expo-audio` para que
   npm resuelva la versión compatible con el SDK (hoy `~57.0.x`). Impacto: un
   módulo nativo más, el lockfile cambia y hace falta un build nuevo de la
   aplicación. No se agrega ningún otro paquete.
4. **El sonido se dispara por cambio de momento, no por temporizador** (spec
   RF-005). La pantalla ya recalcula `breathMomentAt` cada 50 ms; el controlador
   compara el momento nuevo con el anterior y solo actúa cuando cambia la fase o el
   ciclo.
5. **Un reproductor por sonido** (tres), precargados al abrir la pantalla. Evita
   cargar archivos en medio de la sesión y deja terminar la cola de eco de una fase
   mientras empieza la siguiente.
5b. **Los latidos van dentro de los archivos** (spec, decisión 7), no en un
   temporizador por segundo: no se desfasan, el controlador no necesita un reloj y el
   dominio sigue disparando solo por cambio de fase.
6. **Preferencia con el mismo almacenamiento que `guideStorage`**
   (`platformSecureKeyValueStorage`). Es un valor mínimo y no sensible; reutilizar
   el mecanismo evita infraestructura nueva. Clave `duocmind.breathing.sound.v1`:
   `'0'` = apagado; ausente, `'1'` o error de lectura = **encendido** (decisión 3
   de la spec).
7. **El encendido por defecto no es un consentimiento.** La regla de `AGENTS.md`
   «nunca preactivar casillas» se refiere a consentimientos de datos. El sonido es
   una preferencia de interfaz sin datos personales y nunca suena antes de que la
   persona toque «Comenzar».
8. **Archivos generados por un script determinista.** Las funciones de síntesis se
   exportan para que una prueba verifique los archivos versionados sin escribir en
   disco; el script solo escribe cuando se ejecuta directamente. El ruido del soplo
   sale de un generador pseudoaleatorio con semilla fija, así que la regeneración es
   idéntica.
9. **Qué se reaprovecha y qué se cambia de lo ya hecho.** Se conservan sin cambios el
   hook (salvo quitar `finished`), el interruptor, la pantalla, la preferencia y el
   almacenamiento. Cambian el dominio, el controlador (sin `finished` ni inicio de
   sesión), el script, los archivos, el reproductor y el texto del paso de la guía,
   con sus pruebas. Por indicación del usuario al aprobar, `tasks.md` no agrega tareas
   nuevas: reabre y ajusta las existentes (T002, T003, T005, T007, T008 y T009) y
   conserva T001 y T004; los resultados de la 0.1.x quedan en `verification.md` como
   historial.

## 2. Estado observado

- `BreathingScreen.tsx` mantiene `status` (`idle`, `running`, `done`), `startedAt` y
  `now`; mientras corre, un `setInterval` de 50 ms actualiza `now`. Calcula
  `moment = breathMomentAt(...)` y deriva `finished` cuando `moment` pasa a `null`
  con la sesión corriendo; entonces fija `status = 'done'`.
- Los botones son `ActionButton` con las etiquetas «Comenzar», «Detener» y
  «Repetir»; «Detener» fija `status = 'idle'`.
- `breathing478.ts` define las fases (4, 7 y 8 s) y 4 ciclos de 19 s (76 s). Sus
  pruebas viven en `tests/breathing478.test.mjs`.
- La guía de la herramienta es una lista de pasos en `breathingGuide.ts`
  (`TutorialStep`), mostrada por `ToolGuide`.
- `guideStorage.ts` guarda preferencias con `platformSecureKeyValueStorage`, con
  implementación `.native` y `.web`.
- `package.json` no incluye `expo-audio`, `expo-av` ni `expo-haptics`. `app.json`
  ya usa `expo-asset`; no hay `metro.config.js` propio, por lo que Metro trata
  `.wav` como recurso estático.
- **Trabajo hecho con la 0.1.0** (sin commits, sin subir): `breathingSounds.ts`,
  `breathingSoundController.ts`, `breathSoundPreference*.ts`, el script y seis `.wav`,
  `breathSoundPlayer.ts`, `useBreathingSounds.ts`, `SoundToggle.tsx`, el paso nuevo de
  la guía y la integración en `BreathingScreen`, más `expo-audio` instalado. Los tests
  suman 522 y pasan. El recorrido web (T009) confirmó el interruptor y la secuencia.
- Las rutas importan archivos `.ts` con extensión explícita en las capas que prueba
  `node --test` (`allowImportingTsExtensions`); las pruebas viven en
  `tests/<módulo>.test.mjs` y se ejecutan con `npm test`.

## 3. Organización e interfaces

Archivos nuevos y cambiados (todos dentro de `DuocMind/`):

```
assets/sounds/breathing/            tres .wav generados (inhale, hold, exhale); se borran los tres de campanilla
tools/scripts/generate-breathing-sounds.mjs
src/features/wellness/
├── domain/breathingSounds.ts                existe; se simplifica (v0.2.0)
├── application/breathingSoundController.ts  existe; se simplifica (v0.2.0)
├── infrastructure/breathSoundPlayer.ts      existe (expo-audio); pasa a 3 fuentes
├── infrastructure/breathSoundPreference.ts  existe; sin cambios
├── hooks/useBreathingSounds.ts              existe; sin `finished`
├── components/SoundToggle.tsx               existe; sin cambios
├── domain/breathingGuide.ts                 cambia el texto del paso «Sonido opcional»
├── screens/BreathingScreen.tsx              cambia solo la llamada al hook
└── screens/BreathingScreen.styles.ts        sin cambios
tests/breathingSounds.test.mjs               se reescribe (dominio y controlador)
tests/breathingSoundFiles.test.mjs           se reescribe (tres archivos con latidos)
tests/breathSoundPreference.test.mjs         sin cambios
app.json, package.json, package-lock.json    cambian (dependencia y, si hace falta, permisos)
```

### Dominio — `breathingSounds.ts`

Sin React ni audio; importa solo `breathing478.ts` con ruta relativa y `.ts`.

```ts
export type BreathSoundId = 'inhale' | 'hold' | 'exhale';

/** Si el cambio se detecta más tarde que esto desde el inicio de la fase, no suena. */
export const LATE_CUE_TOLERANCE_SECONDS = 0.5;

export interface BreathCueInput {
  previous: BreathMoment | null; // momento ya atendido; null si aún no hay ninguno
  current: BreathMoment | null;  // momento actual; null si no corre o terminó
}

/** El sonido que corresponde al cambio, o null si no hay que reproducir nada. */
export function soundForMoment(input: BreathCueInput): BreathSoundId | null;
```

Se quitan `sessionStart` y `finished`: sin sonidos de inicio, ciclo ni final, ya no
hacen falta. Reglas (cada una con su prueba):

| Caso | Resultado |
| --- | --- |
| `current` es `null` (no corre o terminó) | `null` |
| Misma fase y mismo ciclo que `previous` | `null` |
| Se detecta con retraso mayor a `LATE_CUE_TOLERANCE_SECONDS` | `null` |
| Inhalación (cualquier ciclo, incluido el inicio de la sesión) | `'inhale'` |
| Pausa | `'hold'` |
| Exhalación | `'exhale'` |

El retraso se calcula con `current.progress * current.phase.seconds`. Evita que
volver de segundo plano reproduzca un sonido a mitad de fase. El nombre pasa de
`soundsForMoment` (lista) a `soundForMoment` (uno o ninguno).

### Aplicación — `breathingSoundController.ts`

Define la interfaz del reproductor y el controlador; no importa Expo.

```ts
export interface BreathSoundPlayer {
  preload(): Promise<void>;
  play(id: BreathSoundId): void;
  stopAll(): void;      // salida gradual de ≤ 200 ms
  release(): void;
}

export interface BreathSoundController {
  begin(): void;                                   // sesión nueva: silencia lo anterior
  update(moment: BreathMoment | null): void;       // v0.2.0: sin `finished`
  stop(): void;                                    // silencia y olvida el estado
  dispose(): void;                                 // libera el reproductor
}

export function createBreathSoundController(
  player: BreathSoundPlayer,
  isEnabled: () => boolean,
): BreathSoundController;
```

Comportamiento:

- `begin()` llama a `player.stopAll()`, activa la sesión y borra el momento
  atendido (RF-006.2).
- `update(moment)` calcula `soundForMoment`; si `isEnabled()` es falso no reproduce,
  pero igual avanza el momento atendido. Así, encender el interruptor a mitad de
  sesión no hace sonar lo que ya pasó (RF-001.5). Sin sesión activa no hace nada.
  Cuando `moment` pasa a `null` (fin natural) no reproduce ni corta nada: la cola
  de la última exhalación termina sola.
- Todo llamado al reproductor va en `try/catch`; un fallo se descarta sin mensaje
  ni registro (RF-007).
- `stop()` llama a `player.stopAll()` y borra el estado. No se usa al terminar la
  sesión sola, para que la última exhalación suene completa.

### Infraestructura

**`breathSoundPlayer.ts`** (`createBreathSoundPlayer(): BreathSoundPlayer`):

- Crea un `AudioPlayer` por sonido con `createAudioPlayer(require(...))`, con los
  tres `require` estáticos (`inhale`, `hold`, `exhale`) para que Metro los empaquete.
- `preload()` configura el modo de audio una vez
  (`setAudioModeAsync` con mezcla con otros audios, sin reproducción en segundo
  plano) y crea los reproductores. Los nombres exactos de las opciones se
  verifican contra los tipos de la versión instalada antes de escribir el código
  (ver riesgo R3).
- `play(id)`: `seekTo(0)` y `play()` sobre el reproductor de ese sonido.
- `stopAll()`: baja el volumen de los reproductores activos en 5 pasos de 30 ms,
  los pausa, vuelve a 0 s y restablece el volumen. Un contador de generación
  cancela una salida gradual en curso si llega un `play()` nuevo.
- `release()`: libera los tres reproductores.

**`breathSoundPreference.ts`**: fábrica con almacenamiento inyectable, como
`wellnessResourceCache.web`, y una instancia por defecto con
`platformSecureKeyValueStorage`.

```ts
export function createBreathSoundPreference(storage: KeyValueStorage): {
  load(): Promise<boolean>;            // false solo si se guardó '0'
  save(enabled: boolean): Promise<void>; // errores descartados
};
```

### Hook — `useBreathingSounds`

```ts
function useBreathingSounds(args: {
  status: 'idle' | 'running' | 'done';
  moment: BreathMoment | null;
}): { enabled: boolean; setEnabled(value: boolean): void };
```

- Estado inicial `enabled = true`; al montar lee la preferencia y la aplica. Si la
  lectura falla, sigue encendido.
- Crea el controlador y el reproductor una vez (`useRef`), precarga al montar y
  los libera al desmontar (`dispose`). Los argumentos pasan a `{ status, moment }`
  (se quita `finished`).
- Un efecto en el cambio de `status` a `'running'` llama a `begin()`; en el cambio
  a `'idle'` llama a `stop()`. Cuando pasa a `'done'` no hace nada, para no cortar
  la última exhalación.
- Un efecto en la clave del momento (`ciclo:fase`) llama a `update(moment)`. Como
  solo reacciona a la clave, no se dispara en cada tic de 50 ms.
- `AppState` en `background` o `inactive` llama a `stop()`; la sesión visual no se
  altera.
- `setEnabled` guarda la preferencia y actualiza la referencia que lee el
  controlador.

### Presentación

- **`SoundToggle.tsx`**: fila con el texto «Con sonido» o «Sin sonido» y un
  `Switch` con rol `switch`, etiqueta «Sonido de la respiración» y estado
  `checked`; alto mínimo de 44 px. Debajo, una línea «El sonido es opcional.» Usa
  los colores de `BreathingScreen.styles.ts`; sin animaciones nuevas, por lo que
  no requiere `useReducedMotion` ni tokens de movimiento.
- **`BreathingScreen.tsx`**: usa el hook y coloca `SoundToggle` entre el texto del
  ciclo y el botón de acción. No cambia el cálculo del momento ni los botones.
- **`breathingGuide.ts`**: agrega, antes del paso de cierre, un paso
  «Sonido opcional» de tipo `info` y sin elemento destacado (ya existe; el texto
  cambia en la 0.2.0): «Con el sonido encendido oirás un soplo suave de aire al
  inhalar y al exhalar, y un latido cada segundo que te ayuda a contar. Puedes
  apagarlo con el interruptor de sonido.»

### Script de síntesis — `tools/scripts/generate-breathing-sounds.mjs`

Se reescribe la síntesis (v0.2.0). Exporta `SAMPLE_RATE`, `SOUND_NAMES`
(`['inhale', 'hold', 'exhale']`), `renderSounds()` (devuelve las muestras de los tres
sonidos), `encodeWav()` y `describeSound()`. Al ejecutarse directamente escribe los
archivos en `assets/sounds/breathing/`. Solo usa `Math` y `Buffer`; sin dependencias.

Formato: WAV mono, PCM de 16 bits, 22 050 Hz. El carácter reproduce la muestra
«05 — latido con eco más grave, con respiro liso» aprobada en la ronda 3 de audición
(`tools/.local/generate-sound-samples-3.mjs`, no versionado). Parámetros de partida
(se afinan al escuchar, CA-011):

| Archivo | Duración | Forma |
| --- | --- | --- |
| `inhale.wav` | 4,0 s | Soplo: ruido blanco (semilla fija) por un pasa-bajos de cuatro polos a 1 500 Hz y dos resonancias (Q 1,3 y 1,6) cuya frecuencia sube de 240 a 380 Hz y de 520 a 820 Hz; algo de cuerpo grave (≈ 200 Hz). Ganancia: entrada de 0,55 s, crece de 35 % a 100 % hasta los 3,6 s y salida de 0,25 s. Más 4 latidos en 0, 1, 2 y 3 s |
| `hold.wav` | 7,0 s | Sin soplo. 7 latidos en 0 a 6 s |
| `exhale.wav` | 8,0 s | Soplo con las resonancias bajando de 380 a 230 Hz y de 760 a 480 Hz; entrada de 0,4 s, decae con constante de ≈ 1,9 s hasta el 12 % y salida de 0,8 s. Más 8 latidos en 0 a 7 s |

**Latido.** Seno que baja de 72 a 52 Hz (curva suave en 0,2 s) más un armónico (×2)
de igual amplitud, ataque de 24 ms, caída exponencial (τ ≈ 0,14 s; el armónico,
τ ≈ 0,09 s) y dos repeticiones a 0,23 s (−11 dB) y 0,47 s (−19 dB). El primer latido
de cada archivo, ×1,4 (inhalación y exhalación) o ×1,2 (pausa). Nivel del soplo:
≈ 8 dB por debajo del latido.

**Ajustes de producción** que la muestra de audición no tenía y que cumplen RF-004:

- Un solo factor de nivel para los tres archivos, de modo que el pico mayor valga
  como máximo 0,5012 (−6 dBFS) y se conserve el equilibrio entre ellos.
- **Entrada gradual de 50 ms** y **salida de 150 ms**, para cumplir «entrada y salida
  graduales de al menos 50 ms». La entrada la da el primer latido de cada archivo, que
  ataca en 50 ms en vez de 24 ms (conserva su énfasis ×1,4 o ×1,2; una entrada que
  multiplicara todo el archivo lo apagaría y, en la pausa, dejaría el primer latido más
  bajo que los demás). Con 1 s entre latidos y una cola de eco de ≈ 1,2 s, la cola del
  último latido no cabe entera en el archivo: la salida de 150 ms la apaga antes del
  final, así que no hay corte. Fuera de esos extremos, los archivos son idénticos
  muestra por muestra a la muestra aprobada; el único cambio audible es el ataque algo
  más lento de un latido por archivo, que se escucha en CA-011.
- Los latidos de la alternativa de la decisión 14 (88 a 62 Hz) se obtienen cambiando
  solo las dos frecuencias; no se generan archivos de reserva.

## 4. Integración con la pantalla

- El interruptor aparece en la pantalla de respiración, entre el texto del ciclo y
  el botón. No cambia el diseño del círculo, del anillo ni del botón de la guía.
- El flujo de la sesión no cambia: «Comenzar» → corre → «Detener» o fin natural →
  «Repetir». El sonido solo acompaña.
- La burbuja «?» y `ToolGuide` siguen igual; la guía suma un paso.
- Pomodoro y el resto de Bienestar no se tocan.

## 5. Estados y casos límite

| Situación | Resultado |
| --- | --- |
| Primera apertura | Interruptor encendido; sin sonido hasta «Comenzar» |
| Sonido apagado | Ninguna llamada al reproductor durante la sesión; el momento atendido avanza igual |
| Encender o apagar durante la sesión | Efecto desde el siguiente cambio de fase |
| «Detener» | Silencio con salida de ≤ 200 ms; `status = 'idle'` |
| «Repetir» o «Comenzar» tras un final reciente | `begin()` silencia lo anterior antes de empezar |
| Fin natural | La última exhalación suena completa aunque `status` pase a `'done'`; luego, silencio. Sin sonido propio de cierre |
| Salir de la pantalla | `dispose()` detiene y libera los reproductores |
| App a segundo plano | `stop()`; al volver, no suena un sonido a mitad de fase |
| Archivo que no carga o reproducción que falla | La sesión visual sigue; sin mensajes ni registro |
| Teléfono en silencio o con volumen de medios en cero | No se escucha nada; la guía visual sigue disponible |
| Preferencia ilegible | Se asume encendido |
| Web | El toque en «Comenzar» cumple la regla de gesto del navegador |
| TalkBack | La fase se sigue anunciando por la región `polite` del círculo; el sonido no la sustituye |

## 6. Modelo de amenazas y riesgos

Privacidad y seguridad: no hay datos personales ni de emociones; no se envía ni se
registra nada del uso del sonido (RF-008, CA-010); sin red; sin secretos.

| ID | Riesgo | Mitigación |
| --- | --- | --- |
| R1 | `expo-audio` agrega permisos de Android que la app no necesita (por ejemplo, micrófono) | La app solo reproduce, nunca graba. Tras instalar y generar el proyecto nativo, revisar el manifiesto combinado. Los permisos sobrantes se quitan por dos vías, y se aplica la que corresponda: (a) opciones del plugin de `expo-audio` en `app.json` que desactivan el micrófono (sus nombres exactos se confirman contra la versión instalada), o (b) `android.blockedPermissions` en `app.json` con `android.permission.RECORD_AUDIO` y cualquier otro permiso sobrante, que Expo retira del manifiesto final. Después se vuelve a revisar el manifiesto y se documenta en `verification.md` |
| R2 | La mezcla con la música del usuario no se comporta igual en Android que lo definido en la spec | Probarlo en Android. Si «mezclar» no existe o corta la música, usar «bajar el volumen de los demás» y pedir la decisión al usuario antes de cerrar la tarea |
| R3 | Los nombres de opciones y métodos de `expo-audio` cambian entre versiones | La primera tarea nativa es una prueba mínima en Android con la versión instalada; el código se escribe después contra sus tipos |
| R4 | Los archivos regenerados difieren byte a byte entre versiones de Node | Node 24 está fijado; V8 usa implementaciones propias de `sin`/`cos`. Si CI difiere, la prueba pasa a comparar muestra por muestra con tolerancia de 1 LSB y se anota la desviación de CA-005 |
| R5 | El sonido resulta molesto o desagradable | CA-011: escucha y aprobación de la persona responsable; los parámetros de §3 se ajustan y los archivos se regeneran. La versión 0.1.0 ya fue descartada por este motivo; la 0.2.0 se eligió por escucha en tres rondas |
| R6 | Los temporizadores se frenan en segundo plano y el sonido se desfasa | El sonido sigue al momento calculado con `Date.now()`, no a un temporizador; en segundo plano se silencia (RF-006) |
| R7 | El emulador de Android no reproduce audio | CA-006, CA-007 y CA-011 se prueban en un teléfono físico o en un emulador con audio habilitado; si no es posible, se anota como pendiente |
| R8 | Medir la latencia nativa con precisión | Se mide el retraso del lado de JavaScript (cambio de fase a `play()`); la latencia propia del dispositivo no es medible desde la app y se declara como limitación en CA-007 |
| R9 | Sonido encendido por defecto sorprende en lugares silenciosos | No suena antes de «Comenzar»; el interruptor está visible junto al botón; la elección se recuerda |
| R10 | +0,8 MB de archivos y un módulo nativo más en el APK | Aceptable para el alcance; se anota el tamaño del APK antes y después |
| R11 | El latido (fundamental de 72 a 52 Hz) casi no se oye en el altavoz de un celular | CA-011 se escucha con altavoz y con audífonos. Si el latido no se distingue, se aplica la decisión 14 de la spec: fundamental de 88 a 62 Hz (cambio de dos números en el script). Se anota en `verification.md` |
| R12 | El ataque de 50 ms del primer latido de cada archivo y la salida de 150 ms cambian algo el sonido aprobado en la audición | Se escucha en CA-011; si molesta, se ajustan los tiempos (la entrada no puede bajar de 50 ms por RF-004.4) |
| R13 | Las pruebas de los archivos de la 0.1.0 (tonos, frecuencias) ya no aplican | Se reescriben (en T005): comprueban duración, nivel, silencio en los extremos, ausencia de saltos, un latido en cada segundo entero y regeneración idéntica |

## 7. Cobertura de la spec

| Requisito | Dónde se cumple |
| --- | --- |
| RF-001 Interruptor | `SoundToggle`, `useBreathingSounds`, `breathSoundPreference` |
| RF-002 Cuándo suena | `breathingSoundController` (`begin`, `update`) y el hook |
| RF-003 Secuencia y carácter | `breathingSounds.ts` (`soundForMoment`) y el script de síntesis |
| RF-004 Archivos | `generate-breathing-sounds.mjs` y `assets/sounds/breathing/` (tres archivos) |
| RF-005 Sincronización | El hook reacciona a la clave `ciclo:fase`; tolerancia de retraso del dominio |
| RF-006 Interrupciones | `stop()`, `begin()`, `dispose()`, `AppState` y `stopAll()` gradual |
| RF-007 Fallos | `try/catch` del controlador |
| RF-008 Privacidad | Solo almacenamiento local; sin red ni registro |
| Dependencias y arquitectura | §1 y §3; capas `domain`, `application`, `infrastructure` |
| Accesibilidad | `SoundToggle` y el texto de fase existente |

## 8. Verificación y trazabilidad

| CA | Verificación |
| --- | --- |
| CA-001 | `tests/breathSoundPreference.test.mjs` (por defecto encendido, `'0'` apaga, persiste, error → encendido); comprobación en pantalla |
| CA-002 | `tests/breathingSounds.test.mjs`: con `isEnabled` falso no hay llamadas a `play`; recorrido Android |
| CA-003 | Prueba del controlador: sin `begin()` no suena nada; recorrido web y Android |
| CA-004 | `tests/breathingSounds.test.mjs`: simula tics de 50 ms durante 80 s con un reproductor falso y compara la lista exacta de sonidos y tiempos: 12 en total (inhalación 0, 19, 38, 57; pausa 4, 23, 42, 61; exhalación 11, 30, 49, 68) y ninguno más |
| CA-005 | `tests/breathingSoundFiles.test.mjs`: lee los `.wav` y comprueba que existen solo los tres archivos, formato, duración (±50 ms), pico ≤ 0,5012, primera y última muestra casi nulas, entrada y salida graduales, un latido en cada segundo entero (4, 7 y 8), nivel de cada archivo no más de 9 dB bajo el más fuerte, peso total ≤ 1,5 MB y regeneración idéntica con `renderSounds()` |
| CA-006 | Prueba del controlador (`stop`, `begin`); recorrido Android: «Detener», salir, segundo plano y fin |
| CA-007 | Medición en Android del retraso de JavaScript entre el cambio de fase y `play()`; limitación de latencia nativa (R8) |
| CA-008 | Prueba del controlador con un reproductor que lanza errores en cada método |
| CA-009 | Recorrido Android con movimiento reducido y TalkBack |
| CA-010 | Revisión del código y de las solicitudes del recorrido web |
| CA-011 | Escucha del conjunto en un teléfono (altavoz y audífonos) por la persona responsable; resultado en `verification.md`, incluida la decisión de aplicar o no la alternativa de la decisión 14 |
| CA-012 | `npm run typecheck`, `npm test` (incluye `breathing478.test.mjs`) y recorrido Android de Pomodoro y Bienestar |

Comandos previstos: `npm run typecheck`, `npm test`,
`node tools/scripts/generate-breathing-sounds.mjs`, `npx expo install expo-audio`
y, para la revisión de permisos, el prebuild de Android en una copia temporal. El
resultado real de cada uno se registra en `verification.md`.

## 9. Reversión

- Revertir los commits del incremento: desaparecen los archivos nuevos y los
  cambios en `BreathingScreen`, `breathingGuide.ts`, `app.json` y `package.json`.
- Quitar la dependencia con `npm uninstall expo-audio`, y borrar `assets/sounds/`
  y el script.
- La clave `duocmind.breathing.sound.v1` queda huérfana en los teléfonos de
  prueba; es inocua y no requiere migración.
- Sin cambios de backend que deshacer.

## 10. Fuentes y estado de la entrega

- Spec: `specs/024-breathing-sounds/spec.md` 0.2.0.
- Código revisado: `BreathingScreen.tsx`, `breathing478.ts`, `breathingGuide.ts`,
  `guideStorage.ts` y `package.json`/`app.json` en `dev` (222fd29).
- Estado: esta revisión 0.2.0 es solo documentación. El código de la 0.1.0 ya existe
  sin commits (§2); no se modifica hasta aprobar este plan y las tareas nuevas.

### Orden sugerido para `tasks.md` (ajuste a la 0.2.0)

Sin tareas nuevas: se reabren y ajustan las existentes y se ejecutan en este orden:

1. Dominio: `soundForMoment` sin marcadores y sin `sessionStart`/`finished`, y sus
   pruebas reescritas (CA-004).
2. Controlador: `update(moment)` sin `finished`, y pruebas con reproductor falso
   (CA-002, CA-003, CA-006, CA-008).
3. Script y archivos: nueva síntesis (soplo y latido con eco), tres `.wav`, borrar los
   tres de campanilla y reescribir las pruebas de archivos (CA-005).
4. Reproductor de tres fuentes; hook sin `finished`, pantalla y texto del paso de la
   guía (con typecheck y tests).
5. Recorrido web, otra vez con el sonido nuevo.
6. T006 pendiente: permisos del manifiesto (R1), compilación nativa y prueba de
   mezcla con música (R2).
7. Recorrido Android, escucha en teléfono con altavoz y audífonos (CA-011, R11) y
   cierre de `verification.md`.

### Historial de revisiones

- **0.1.0 — 2026-11-26:** borrador inicial.
- **0.2.0 — 2026-11-27:** borrador. Se adapta a la spec 0.2.0: soplo de aire y latido
  con eco, tres archivos en vez de seis, sin campanillas. Se simplifican el dominio y el
  controlador (sin `sessionStart` ni `finished`), se reescribe el script de síntesis y
  se añaden los riesgos R11 a R13. Se conserva el trabajo hecho con la 0.1.0 donde es
  posible.
- **0.2.0 (aprobación) — 2026-11-27:** aprobado por el usuario, con la indicación de no agregar tareas
  nuevas sino ajustar las existentes de `tasks.md`.

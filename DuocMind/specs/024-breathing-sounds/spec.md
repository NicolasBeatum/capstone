# Spec 024 — Sonidos guiados en la respiración 4-7-8

| Campo | Valor |
| --- | --- |
| Versión | 0.2.0 |
| Estado | APROBADA (reemplaza a la 0.1.1) |
| Fecha | 2026-11-27 |
| Incremento | 024-breathing-sounds |
| Constitución | 2.0.0 |
| Plataformas | Android y previsualización web |
| Aprobación | Confirmada explícitamente por el usuario el 2026-11-27, con la alternativa de la decisión 14 (la 0.1.1 fue aprobada el 2026-11-26) |

## 1. Problema y resultado esperado

La herramienta «Respiración 4-7-8» de Bienestar (`BreathingScreen`) guía solo con
la vista: un círculo que crece y se achica, un anillo de progreso y el texto de la
fase («Inhala», «Aguanta», «Exhala»). Quien respira con los ojos cerrados, o mira
hacia otro lado para relajarse, pierde la guía y tiene que contar de memoria.

Este incremento agrega un acompañamiento sonoro opcional, suave y grave, pensado
para un ambiente de calma y seguridad: un **soplo de aire** que acompaña la
inhalación y la exhalación, y un **latido con eco, una vez por segundo**, que ayuda
a contar sin mirar. El sonido refuerza la guía visual; no la reemplaza.

La primera versión de esta spec (0.1.1) usaba tonos sintetizados que suben y bajan
y campanillas. Al escucharla, el equipo la descartó por simple, aguda y de aspecto
mecánico. La 0.2.0 reemplaza ese diseño sonoro; el resto del comportamiento (interruptor,
cuándo suena, silencio, privacidad) se mantiene.

Resultado observable: en la pantalla de respiración hay un interruptor «Sonido»,
encendido de entrada. Con el sonido activado, al tocar «Comenzar» y durante los 4
ciclos: al inhalar (4 s) se oye un soplo de aire suave que crece y un latido por
segundo; al aguantar (7 s) se oyen solo los latidos; al exhalar (8 s) el soplo
arranca y se va apagando, con un latido por segundo. No suenan campanillas ni
marcadores. Con el sonido apagado la herramienta funciona exactamente como hoy.

## 2. Alcance propuesto

- Tres sonidos de fase (inhala, aguanta, exhala), cada uno con los latidos de su
  duración ya incluidos en el mismo archivo. No hay sonidos de inicio, de cambio de
  ciclo ni de final.
- Un script versionado que genera los archivos de audio sin material de terceros.
- Interruptor «Sonido» en `BreathingScreen`, encendido por defecto, con preferencia
  guardada solo en el dispositivo (ya implementado en la versión 0.1.1).
- Reproducción sincronizada con la fase que ya calcula `breathMomentAt`.
- Silencio inmediato al detener, salir de la pantalla, pasar a segundo plano o
  terminar la sesión.
- Una línea en la pantalla (y un paso en la guía de la herramienta) que explique que
  el sonido es opcional y cómo suena.
- Pruebas de la secuencia de sonidos, de los archivos generados y de la
  preferencia; recorrido en Android.

Fuera de alcance:

- Sonidos del Pomodoro u otras herramientas.
- Campanillas o cuencos de inicio, de ciclo o de cierre (retirados en la 0.2.0).
- Música de fondo, sonidos de naturaleza, voz guiada o cuenta en voz alta.
- Vibración como alternativa al audio.
- Control de volumen propio, elección de sonidos o ajustes de ritmo.
- Cambiar la duración de las fases o de los ciclos.
- Sonidos descargados desde Supabase o configurables por Bienestar.
- Cambios de esquema, migraciones remotas y despliegues.
- Regularizar con una spec la herramienta de respiración original (ver §5.2).

## 3. Requisitos funcionales

### RF-001 — Interruptor de sonido

Sin cambios respecto a la 0.1.1.

1. La pantalla de respiración muestra un interruptor con la etiqueta de
   accesibilidad «Sonido de la respiración» y un texto visible que indica su
   estado («Con sonido» o «Sin sonido»).
2. El estado inicial es **encendido**: la primera vez que la persona abre la
   herramienta, el interruptor aparece activado y el sonido se escuchará al tocar
   «Comenzar». Como el sonido nunca empieza antes de ese toque (RF-002), el valor
   por defecto no produce sonidos inesperados.
3. La elección se guarda en el dispositivo y se recupera al volver a abrir la
   pantalla o la aplicación. Quien lo apague lo encuentra apagado la próxima vez.
4. El objetivo táctil mide al menos 44 px.
5. Cambiar el interruptor durante una sesión surte efecto desde el siguiente
   sonido programado; no corta ni empieza un sonido a la mitad. Apagarlo silencia lo
   que esté sonando (RF-006).

### RF-002 — Cuándo suena

Sin cambios respecto a la 0.1.1.

1. No suena nada al abrir la pantalla, al ver la guía ni antes de tocar «Comenzar».
2. Con el sonido apagado no suena nada en ningún momento.
3. Con el sonido activado, los sonidos empiezan solo después de que la persona
   toca «Comenzar».

### RF-003 — Secuencia y carácter de los sonidos

Con el sonido activado, durante una sesión de 4 ciclos (76 s) suenan solo estos
tres sonidos, uno al empezar cada fase:

| Momento | Sonido | Forma |
| --- | --- | --- |
| Inicio de cada inhalación (0, 19, 38 y 57 s) | Inhalación, 4 s | Soplo de aire suave que entra desde cero, crece con el brillo subiendo poco a poco y se corta con una salida corta; un latido con eco por segundo (4 latidos) |
| Inicio de cada pausa (4, 23, 42 y 61 s) | Pausa, 7 s | Solo latidos con eco, uno por segundo (7 latidos), sin soplo |
| Inicio de cada exhalación (11, 30, 49 y 68 s) | Exhalación, 8 s | Soplo de aire que arranca pronto y se va apagando, con el brillo bajando y una cola larga y muy baja; un latido con eco por segundo (8 latidos) |

Carácter (valores de partida, elegidos por escucha el 2026-11-27 sobre las muestras de audición):

- **Soplo de aire.** Ruido oscurecido (casi sin siseo agudo) que pasa por dos
  resonancias anchas, como garganta y boca; no es un tono ni una brisa. Liso: sin
  vaivenes lentos ni crepitación. Brillo medio cercano a 500 Hz. Nivel unos 8 dB por
  debajo del latido, de modo que el latido sea lo más presente.
- **Latido.** Golpe grave y redondo: una fundamental que baja de unos 72 Hz a unos
  52 Hz, con un armónico de igual amplitud para que se oiga en un altavoz pequeño, y
  dos repeticiones suaves (a unos 0,23 s y 0,47 s, unos 11 dB y 19 dB más bajas) que
  forman el eco. El primer latido de cada fase suena algo más marcado (inhalación y
  exhalación, ×1,4; pausa, ×1,2).
- **Sin sonidos de marcador.** El cambio de ciclo y el fin de la sesión no tienen
  sonido propio: el cambio de ciclo se oye como una nueva inhalación y el final es
  la cola de la última exhalación seguida de silencio, junto con «¡Bien hecho!».

Las frecuencias, los niveles y los tiempos son valores de partida; se afinan
escuchando el resultado (CA-011).

**Alternativa decidida de antemano (decisión 14).** Si en un teléfono real el latido
con fundamental de 72 a 52 Hz no se distingue o no se reproduce, se usa el latido
de la muestra «04 — latido con eco grave» (fundamental de unos 88 Hz a 62 Hz, mismo
eco, mismo respiro liso), sin necesidad de volver a aprobar la spec.

### RF-004 — Archivos de audio

1. Los archivos se generan con un script del repositorio
   (`tools/scripts/generate-breathing-sounds.mjs`), sin dependencias nuevas y sin
   material de terceros.
2. Salida en WAV mono de 16 bits a 22 050 Hz, en `assets/sounds/breathing/`, con
   los nombres `inhale`, `hold` y `exhale`. Se retiran `start-chime`, `cycle-chime`
   y `end-chime`.
3. Los tres sonidos duran exactamente 4, 7 y 8 segundos (tolerancia de 50 ms), y
   cada latido cae en los segundos enteros 0, 1, 2… de su archivo.
4. Cada archivo empieza y termina en silencio, con entrada y salida graduales de
   al menos 50 ms, para evitar chasquidos. Ningún latido queda cortado al final del
   archivo: el último termina su cola dentro de la duración.
5. El pico de cada archivo no supera −6 dBFS y el nivel es parejo entre archivos
   dentro de lo que permite su contenido (la pausa solo tiene latidos).
6. Ejecutar el script dos veces produce archivos idénticos (el ruido se genera con
   una semilla fija).
7. El conjunto no supera 1,5 MB.

### RF-005 — Sincronización

Sin cambios respecto a la 0.1.1.

1. Cada sonido se dispara cuando cambia la fase o el ciclo calculado por
   `breathMomentAt`, no por un temporizador aparte, para que no se desfase del
   círculo ni del anillo. Los latidos van dentro del archivo, así que no hay un
   temporizador por segundo que pueda desfasarse.
2. El sonido de una fase empieza dentro de los 100 ms posteriores al cambio de
   fase en pantalla.
3. Una sesión no reproduce el mismo sonido dos veces por el mismo cambio, aunque
   la pantalla se actualice cada 50 ms.

### RF-006 — Interrupciones y silencio

Sin cambios respecto a la 0.1.1.

1. Al tocar «Detener», salir de la pantalla, pasar la aplicación a segundo plano
   o terminar la sesión, todo sonido se detiene en menos de 200 ms con una salida
   gradual.
2. Volver a tocar «Comenzar» no deja sonidos de la sesión anterior ni los
   superpone.
3. La aplicación no pausa la música que la persona ya esté escuchando; los sonidos
   se mezclan con ella a volumen bajo.

### RF-007 — Fallos de audio

Si un archivo no carga o la reproducción falla, la sesión visual continúa sin
cambios y sin mensajes de error. El fallo no se registra con datos de la persona.

### RF-008 — Privacidad

La preferencia de sonido se guarda solo en el dispositivo. No se envía a ningún
servidor ni se mide qué tan seguido se usa el sonido o la herramienta.

## 4. Requisitos no funcionales

- **Arquitectura.** Dentro de `features/wellness/`. La función que decide qué
  sonido corresponde a cada cambio de momento vive en `domain` y es pura, sin
  React ni audio. La reproducción se implementa en `infrastructure` detrás de una
  interfaz; la pantalla usa un hook y no llama directamente a la librería de
  audio. Los nombres de archivos y de identificadores van en inglés; los textos
  de la interfaz, en español.
- **Dependencias.** Solo `expo-audio`, compatible con el SDK 57 (ya instalada en
  la versión 0.1.1). Requiere un build nativo.
- **Accesibilidad.** El texto de la fase y su anuncio por lector de pantalla
  siguen siendo el medio principal; el sonido nunca es el único indicador. El
  sonido no depende de `useReducedMotion`: reducir el movimiento no lo apaga.
- **Rendimiento.** Los tres archivos se precargan al entrar a la pantalla y se
  liberan al salir.
- **Proporcionalidad.** Sin ajustes de volumen, sin selección de sonidos y sin
  infraestructura para otras herramientas.
- **Tono no clínico.** Los textos no prometen efectos terapéuticos ni calmantes
  garantizados; mantienen el aviso existente de detenerse si hay mareo o
  incomodidad (constitución, principio I).

## 5. Hallazgos que condicionan el plan

1. **No había librería de audio.** `expo-audio` 57.0.5 ya está instalada. Su plugin
   añade permisos por defecto (`RECORD_AUDIO`, servicio de reproducción en segundo
   plano) que la herramienta no necesita; su desactivación y la revisión del
   manifiesto siguen pendientes (riesgo R1 del plan).
2. **La herramienta no tiene spec.** `BreathingScreen` y `Pomodoro` llegaron en un
   commit sin spec (`bb95a88`, 2026-11-16). Esta spec cubre solo el sonido; el plan
   debe respetar la lógica de `breathing478.ts` tal como está.
3. **La pantalla recalcula el momento cada 50 ms con `Date.now()`.** Por eso el
   sonido debe dispararse por cambio de fase o de ciclo (RF-005) y no por el
   intervalo, que se frena en segundo plano.
4. **Ya hay trabajo hecho con la versión 0.1.1** (tareas T001 a T009 del plan
   anterior): lógica de dominio, controlador, preferencia, script, archivos,
   reproductor, hook, interruptor y recorrido web. Con la 0.2.0 se conservan el
   controlador, la preferencia, el hook, el interruptor y la pantalla. Cambian el
   dominio (ya no hay sonidos de marcador), el script y los archivos (de seis a tres),
   el reproductor (tres fuentes en vez de seis), las pruebas asociadas y el texto
   del paso «Sonido opcional» de la guía. El plan debe indicar cómo se reabren esas
   tareas.
5. **Los graves bajos se oyen mal en altavoces de celular.** La fundamental del
   latido (≈ 72 a 52 Hz) casi no se reproduce en un altavoz pequeño; se oirán sobre
   todo su armónico y el eco. En parlantes o audífonos se oirá más lleno. La
   elección se hizo escuchando en un computador. Hay que comprobar en un teléfono
   real, con altavoz y con audífonos, que el latido siga siendo distinguible; si no
   lo fuera, se aplica la alternativa de la decisión 14 (latido de unos 88 a 62 Hz).
6. **El diseño sonoro se eligió por escucha.** Tras tres rondas de muestras de
   audición (2026-11-27) el equipo aprobó la muestra «latido con eco más grave, con
   respiro liso». Las muestras exploratorias viven en `tools/.local/` (no
   versionado); el script de producción deberá reproducir su carácter.
7. **No se puede juzgar la calidad del sonido sin escucharlo.** El script puede
   comprobar duración, nivel, ausencia de chasquidos y cada latido en su segundo,
   pero que el resultado sea agradable lo decide la persona responsable (CA-011).
8. **El audio en Android sigue el volumen de medios del teléfono.** Sin control de
   volumen propio, si el teléfono está en silencio no se escucha nada; la guía
   visual sigue disponible.
9. **Previsualización web.** Los navegadores solo reproducen audio después de un
   gesto de la persona; el toque en «Comenzar» lo cumple.

## 6. Criterios de aceptación

| ID | Resultado observable | Verificación prevista |
| --- | --- | --- |
| CA-001 | Existe el interruptor «Sonido», accesible, con estado visible, encendido de inicio y recordado entre aperturas (si se apaga, sigue apagado). | Prueba del almacenamiento y comprobación en pantalla. |
| CA-002 | Con el sonido apagado no suena nada en toda la sesión. | Prueba de dominio y recorrido Android. |
| CA-003 | No suena nada al abrir la pantalla, al ver la guía ni antes de «Comenzar». | Recorrido Android y web. |
| CA-004 | La secuencia de sonidos de una sesión completa es: inhalación en 0, 19, 38 y 57 s; pausa en 4, 23, 42 y 61 s; exhalación en 11, 30, 49 y 68 s; ningún otro sonido (sin campanillas ni marcador de inicio, de ciclo o de final); sin repeticiones. | Prueba de dominio con `node --test`. |
| CA-005 | Existen solo `inhale`, `hold` y `exhale`, de 4, 7 y 8 s (±50 ms); pico ≤ −6 dBFS; empiezan y terminan en silencio con entrada y salida graduales; tienen un latido en cada segundo entero (4, 7 y 8); pesan ≤ 1,5 MB en total; el script los regenera idénticos. | Prueba que ejecuta el script y analiza los archivos. |
| CA-006 | Detener, salir, pasar a segundo plano o terminar silencia en menos de 200 ms y reiniciar no superpone sonidos. | Recorrido Android. |
| CA-007 | Cada sonido de fase empieza dentro de 100 ms del cambio visible. | Medición en Android; si no es posible medirla con precisión, se anota como limitación. |
| CA-008 | Si el audio falla, la sesión visual continúa sin errores visibles. | Prueba con un reproductor simulado que falla. |
| CA-009 | Con movimiento reducido y con lector de pantalla, la fase se sigue anunciando por texto y el sonido no depende del movimiento reducido. | Recorrido Android con ambas opciones. |
| CA-010 | La preferencia no se envía ni se registra y no hay solicitudes de red por el sonido. | Revisión del código y del recorrido. |
| CA-011 | La persona responsable escucha el conjunto en un teléfono, con el altavoz y con audífonos, y lo aprueba (suave, sin molestia, sin sonar a máquina ni a estática, latido distinguible, volumen parejo). | Escucha en un teléfono o emulador; resultado anotado en `verification.md`. |
| CA-012 | El Pomodoro, la guía, el resto de Bienestar y las pruebas existentes de la respiración no cambian. | Typecheck, `npm test` y recorrido Android. |

## 7. Decisiones propuestas y aprobación

Decididas por el usuario el 2026-11-26:

1. **Sonidos sintetizados, generados por el equipo** y no descargados.
2. **El sonido es opcional** y se controla desde la pantalla de la herramienta.
3. **Encendido por defecto.** La persona puede apagarlo; la elección se recuerda.

Decididas por el usuario el 2026-11-27, tras escuchar las muestras:

4. **Identidad sonora nueva:** soplo de aire suave y latido con eco más grave, uno
   por segundo, en lugar de tonos que suben y bajan. Los sonidos deben ser suaves,
   graves y sin timbre de máquina, acordes con un ambiente de calma y seguridad.
5. **Sin campanas.** Se retiran la campanilla de inicio, la de cambio de ciclo y la
   final.
6. **Se elige la muestra 05 de la ronda 3** («latido con eco más grave, con respiro
   liso»).

Aprobadas por el usuario el 2026-11-27, tal como están redactadas:

7. **Tres archivos** (inhala, aguanta, exhala) con los latidos ya incluidos, en vez
   de un temporizador por segundo: el latido no se desfasa, el controlador no cambia
   y el reproductor pasa de seis a tres fuentes. **Esta decisión sustituye a la
   decisión 5 de la 0.1.1 («sin tics durante la pausa»):** ahora sí hay latidos en la
   pausa, porque es donde más ayudan a contar.
8. **Sin sonido de inicio, de ciclo ni de final.** La sesión empieza con la primera
   inhalación (con su latido marcado) y termina con la cola de la última exhalación
   y silencio. Si al probarlo se echa de menos algún marcador, se vuelve a evaluar en
   otro incremento.
9. **Sin vibración** en este incremento.
10. **Sin control de volumen propio.** Manda el volumen de medios del teléfono.
11. **Mezclarse con la música** que ya suene, sin pausarla.
12. **Solo la respiración.** El Pomodoro y otras herramientas quedan fuera.
13. **Archivos y script versionados** (`assets/sounds/breathing/` y
    `tools/scripts/`), para poder regenerarlos con otros valores.

Añadida por el usuario al aprobar (2026-11-27):

14. **Alternativa para los graves.** Si el latido de 72 a 52 Hz no se reproduce o no se
    distingue en un teléfono real, se usa el latido «04 — eco grave» de la ronda 3
    (unos 88 a 62 Hz), en lugar de afinar el armónico. La decisión la toma el equipo
    al escuchar en el teléfono (CA-011) y queda anotada en `verification.md`.

Esta versión 0.2.0 fue aprobada explícitamente por el usuario el 2026-11-27. Conforme a
la constitución y a `AGENTS.md`, el plan se actualiza después de esta aprobación; las
tareas nuevas, después de aprobar el plan, y el código, después de aprobar las
tareas. No autoriza instalar dependencias, migraciones remotas, despliegues, commits
ni push.

## 8. Referencias

- Pantalla: `src/features/wellness/screens/BreathingScreen.tsx` y su estilo.
- Lógica de fases: `src/features/wellness/domain/breathing478.ts` y su prueba
  `tests/breathing478.test.mjs`.
- Guía de la herramienta: `src/features/wellness/domain/breathingGuide.ts`.
- Preferencias locales existentes: `src/features/wellness/infrastructure/guideStorage.ts`.
- Origen de la herramienta: commit `bb95a88` (2026-11-16).
- Muestras de audición (no versionadas): `tools/.local/muestras-sonido/`, rondas 1 a 3,
  con sus generadores `tools/.local/generate-sound-samples*.mjs`.

### Historial de revisiones

- **0.1.0 — 2026-11-26:** borrador inicial. El mismo día, por decisión del
  usuario, el sonido pasa a estar encendido por defecto (RF-001, CA-001 y
  decisión 3).
- **0.1.1 — 2026-11-26 (solo documental):** aprobada. El botón de la pantalla se
  llama «Comenzar», no «Iniciar»; se corrigen las menciones sin cambiar el
  alcance.
- **0.2.0 — 2026-11-27:** aprobada ese mismo día, con la decisión 14 añadida por el
  usuario (alternativa de latido más agudo si los graves no se reproducen). Borrador inicial: Tras escuchar el resultado de la 0.1.1, el
  usuario lo encontró simple, agudo y de aspecto mecánico y pidió sonidos suaves.
  Cambia el diseño sonoro (RF-003, RF-004, CA-004, CA-005, CA-011, decisiones 4 a 8):
  soplo de aire y latido con eco más grave por segundo, tres archivos en vez de seis
  y sin campanillas. RF-001, RF-002 y RF-005 a RF-008 no cambian de fondo.

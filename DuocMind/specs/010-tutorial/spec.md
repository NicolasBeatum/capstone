# Spec 010 — Tutorial de bienvenida

| Campo | Valor |
| --- | --- |
| Versión | 0.2.0 |
| Estado | APROBADA |
| Fecha | 2026-10-14 |
| Incremento | 010-tutorial |
| Constitución | 2.0.0 |
| Plataformas | Android y previsualización web |
| Aprobación | 0.1.0: confirmada por el usuario el 2026-10-13. 0.2.0: confirmada explícitamente por el usuario el 2026-10-14 |

## 1. Problema y resultado esperado

Después de iniciar sesión, el estudiante llega al inicio (`/dashboard`) con
varias secciones a la vista: registro emocional, agenda, eventos y bienestar.
Hoy la app no le explica para qué sirve cada una ni dónde está. Quien la usa por
primera vez debe descubrirlo por su cuenta, y puede pasar por alto secciones
relevantes como los recursos de bienestar.

Este incremento agrega un recorrido guiado que se muestra al estudiante la
primera vez que inicia sesión. Presenta, una por una, las secciones más
relevantes de la app y propone una acción real: el estudiante registra su primer
check-in diario. Al volver al inicio después de registrar, un último paso, «Todo
listo», cierra el recorrido.

Hoy la app solo muestra la bienvenida animada del Brote tras el login
(`WelcomeIntro`, activada con `?welcome=1`). No existe ningún recorrido guiado
ni se conserva si el estudiante ya vio alguna introducción.

## 2. Alcance propuesto

- Recorrido de pasos secuenciales sobre el inicio del estudiante, que resalta
  cada sección y explica en una o dos frases para qué sirve.
- Secciones cubiertas, en este orden: resumen del inicio, Agenda, Eventos,
  Bienestar y el registro de cómo te sientes, seguido de un cierre.
- El paso del check-in (paso 5) es interactivo: lleva a la pantalla real de
  check-in, y el tutorial se da por completado cuando el check-in queda guardado.
- El cierre «Todo listo» (paso 6) aparece en el inicio al volver de registrar.
- Controles para avanzar, retroceder y omitir el recorrido en los pasos 1 a 5.
- Aparición automática una sola vez por cuenta, después de la bienvenida animada.
- Conservación local de que la persona ya completó u omitió el tutorial, aislada
  por cuenta.
- Una forma de volver a ver el tutorial después, sin que registre un check-in.
- Verificaciones reproducibles con cuentas y datos sintéticos.

Fuera de alcance:

- Cambios en el contenido o comportamiento de las secciones presentadas, incluido
  el flujo de check-in: el tutorial usa el existente sin modificar cómo se
  registra, se guarda ni se sincroniza.
- Tutoriales específicos dentro de cada pantalla, consejos contextuales,
  tooltips permanentes y recorridos previos al inicio de sesión.
- Presentar «Pendientes», que hoy es una vista provisoria («Muy pronto»), hasta
  que exista como funcionalidad.
- Sincronización del estado del tutorial entre dispositivos, analítica de uso y
  mediciones de cuántas personas lo completan.
- Sugerir, preseleccionar o inferir una emoción, y detectar si la persona ya
  registró un check-in ese día.
- Despliegues, migraciones remotas y cambios de backend.

## 3. Requisitos funcionales

### RF-001 — Cuándo aparece

1. El tutorial se ofrece automáticamente en el inicio la primera vez que una
   cuenta inicia sesión en el dispositivo. No aparece en cada inicio de sesión.
2. Comienza después de que termina la bienvenida animada (`WelcomeIntro`) y de
   que el inicio terminó de cargar. Nunca se superpone con ella.
3. No aparece al abrir la app con una sesión ya activa, al recargar la
   previsualización web ni al volver a primer plano.
4. Si la persona cierra la app a mitad del recorrido sin omitirlo ni
   completarlo, se le vuelve a ofrecer desde el primer paso en su siguiente
   inicio de sesión.
5. Dos cuentas en el mismo dispositivo no comparten el estado: que una haya
   completado el tutorial no lo oculta a la otra.

### RF-002 — Contenido del recorrido

1. El recorrido tiene, en este orden, los pasos siguientes. Cada uno resalta el
   elemento real de la interfaz que presenta y muestra un título y una
   explicación breve en español.

   | Paso | Elemento resaltado | Idea que comunica |
   | --- | --- | --- |
   | 1. Inicio | Resumen del inicio | Aquí ves cómo ha estado tu semana. |
   | 2. Agenda | Pestaña «Agenda» | Organiza tus actividades y los eventos que te interesan. |
   | 3. Eventos | Icono de calendario del encabezado | Descubre eventos institucionales y agrégalos a tu agenda. |
   | 4. Bienestar | Pestaña «Bienestar» | Recursos de bienestar y de ayuda, incluso sin conexión. |
   | 5. Registrar cómo te sientes | Botón central «+» | Registra tu estado emocional cuando quieras; tú decides qué emoción registrar y puedes corregirla. Se invita a registrar el primer check-in. |
   | 6. Todo listo | — | Ya conoces lo principal; puedes volver a ver este recorrido con «Ver tutorial de la app», al final del inicio. |

2. El texto sobre emociones y bienestar es orientativo y no clínico: no
   promete diagnóstico, tratamiento ni sustituye ayuda profesional, y distingue
   la orientación general de la ayuda profesional o de emergencia, conforme a la
   constitución (principio I). El texto del paso 5 no sugiere ni induce
   una emoción, no presenta el registro como obligatorio ni lo vincula a un
   resultado esperado, y deja claro que la persona decide qué registrar y que
   puede omitir.
3. Cada paso indica su posición («Paso 2 de 6»).
4. Solo se presentan secciones que existen y funcionan. Si el plan debe retirar o
   añadir un paso porque una sección cambió, se corrige esta spec antes.
5. Los pasos 1 a 4 y 6 no muestran ni solicitan datos personales, emocionales ni
   respuestas del estudiante. El paso 5 solo conduce al flujo existente de
   check-in; el tutorial no ve, copia ni conserva la emoción registrada.

### RF-003 — Controles y navegación

1. Los pasos 1 a 4 ofrecen «Siguiente»; desde el paso 2 ofrecen también «Atrás».
   En el paso 5 del recorrido automático, la acción principal es «Registrar
   ahora» en lugar de «Siguiente». El paso 6 ofrece solo «Entendido»: como la
   persona ya registró, no se le ofrece volver al registro.
2. «Omitir» está disponible en los pasos 1 a 5, incluido el del check-in, y
   cierra el recorrido de inmediato sin registrar nada.
3. Omitir, completar el check-in o terminar el recorrido registra que la cuenta
   ya lo vio. El cierre «Todo listo» no es requisito para completarlo.
4. Mientras el recorrido está abierto, el resto de la pantalla no responde a
   toques; el estudiante no ejecuta por accidente las acciones que se le
   explican. El botón «Atrás» del sistema en Android retrocede un paso y, en el
   primer paso, equivale a omitir.
5. Los pasos 1 a 4 no navegan fuera del inicio. La única navegación es la de
   «Registrar ahora» en el paso 5, que abre la pantalla de check-in existente.

### RF-004 — Registro del primer check-in

1. «Registrar ahora» abre la pantalla de check-in actual, sin cambiar cómo se
   elige la emoción, cómo se guarda ni qué se muestra al terminar. La persona
   elige libremente su estado.
2. El tutorial se da por completado cuando el check-in queda guardado:
   sincronizado o, si no hay conexión, guardado en el dispositivo a la espera de
   sincronizar. Un intento que falla no lo completa.
3. Al completarse se registra que la cuenta ya vio el tutorial. Esto ocurre al
   guardar, antes de que la persona vuelva al inicio: si cierra la app antes de ver
   el paso 6, el tutorial no se le vuelve a ofrecer.
4. Después de guardar, el check-in lleva al inicio con su flujo actual. Allí
   aparece el paso 6, «Todo listo», que la persona cierra con «Entendido». Es un
   cierre informativo: no registra nada más y no se ofrece volver al check-in.
5. Si la persona vuelve del check-in sin guardar (con el botón Atrás o desde la
   barra de navegación), el tutorial reaparece en el paso 5 y puede registrar,
   retroceder u omitir. No se marca como completado ni se muestra el paso 6.
6. Si el check-in se guarda con una cuenta distinta de la que inició el
   recorrido, el recorrido se cierra sin marcar como completado el de la otra
   cuenta y sin mostrar el paso 6.
7. El check-in registrado es un registro emocional normal: pertenece a la persona,
   aparece en su historial y en «Vistazo de tu semana», y se trata como dato
   sensible conforme a la constitución (principio II).

### RF-005 — Volver a verlo

1. El estudiante puede volver a iniciar el tutorial desde una acción visible y
   etiquetada, «Ver tutorial de la app», al final del inicio.
2. Al repetirlo no se pide un registro: el paso 5 resalta el botón «+», explica
   su uso y ofrece «Siguiente», y el paso 6 cierra con «Entendido». Repetirlo no
   registra ningún check-in ni altera datos de la cuenta.
3. Repetir el tutorial no cambia si la cuenta ya lo completó.

### RF-006 — Conservación, privacidad y offline

1. El tutorial conserva únicamente si la cuenta ya lo completó u omitió. No guarda
   contexto emocional ni datos personales con ese estado.
2. El estado se guarda localmente, asociado a la cuenta autenticada, sin
   registrar el correo ni el identificador en logs. No se envía al backend.
3. El tutorial funciona sin conexión después del primer acceso válido y no
   depende de ningún servicio remoto propio; el check-in conserva su comportamiento
   actual sin conexión.
4. Si no se puede leer el estado guardado, el tutorial no se muestra de forma
   automática; la persona puede iniciarlo manualmente. Un fallo de lectura o
   escritura nunca bloquea el uso del inicio ni del check-in.
5. El estado se elimina al borrar la cuenta y al desinstalar la app.

## 4. Recorridos y estados observables

### Primer acceso

Login → bienvenida animada del Brote → inicio cargado → tutorial, paso 1 →
«Siguiente» hasta el paso 5 → «Registrar ahora» → pantalla de check-in → la
persona elige su estado y registra → agradecimiento del check-in → inicio con el
paso 6, «Todo listo» → «Entendido» → inicio sin recorrido. En los accesos
siguientes la cuenta va de login a bienvenida y a inicio, sin tutorial.

### Omitir

Cualquier paso del 1 al 5 → «Omitir» → inicio, sin paso 6. No se vuelve a ofrecer
automáticamente.

### Volver del check-in sin guardar

Paso 5 → «Registrar ahora» → check-in → Atrás → inicio con el tutorial de nuevo
en el paso 5.

### Interrupción

Paso intermedio, o check-in sin guardar → cierre de la app → nuevo inicio de
sesión → el tutorial se ofrece de nuevo desde el paso 1.

### Revisión manual

«Ver tutorial de la app» → paso 1 → recorrido normal → paso 5 informativo →
paso 6 → «Entendido». No se registra ningún check-in y no cambia nada más.

### Estados y casos límite

| Situación | Resultado observable |
| --- | --- |
| Movimiento reducido activado | Sin animaciones de entrada ni desplazamiento; los pasos cambian sin movimiento. |
| Pantalla estrecha y texto ampliado | Título, texto y botones siguen legibles y no se superponen al elemento resaltado ni quedan fuera de pantalla. |
| Lector de pantalla activo | Cada paso se anuncia con su título, texto y posición; el foco queda dentro del recorrido hasta cerrarlo. |
| Elemento resaltado no medible | El paso se presenta de forma centrada, sin resalte, y el recorrido continúa. |
| Rotación o cambio de tamaño | El resalte se recoloca sobre su elemento o el paso pasa a presentarse centrado. |
| Cambio de cuenta durante el recorrido | El recorrido se cierra sin marcar como completado el de la otra cuenta. |
| Fallo al guardar el estado del tutorial | El recorrido se cierra igualmente; puede ofrecerse otra vez en el próximo inicio de sesión. |
| El check-in falla al guardar | Se muestra el aviso actual del check-in; el tutorial sigue pendiente y no se marca completado. |
| Check-in guardado sin conexión | Cuenta como registrado: el tutorial se completa, aparece el paso 6 y el check-in se sincroniza después. |
| Cierre de la app entre guardar el check-in y ver el paso 6 | El tutorial ya quedó completado; no se vuelve a ofrecer. |
| La persona ya registró un check-in ese día | No se detecta: el paso 5 se muestra igual y puede omitirse. |

## 5. Calidad y acceso

- La arquitectura respeta `AGENTS.md`: rutas mínimas en `src/app/`, lógica del
  recorrido y su estado fuera de las pantallas, y acceso al almacenamiento en
  infraestructura. El plan decide dónde viven los pasos, su presentación y cómo
  el check-in avisa que quedó guardado.
- No se añade ninguna dependencia nueva sin justificarla en el plan. Se usa
  `Animated` de React Native y los tokens de `motionTokens.ts`; los valores de
  movimiento no se escriben sueltos.
- Movimiento calmado y sin rebotes, con `ScalePress` en los botones y respeto de
  `useReducedMotion`. El movimiento no es el único medio de comunicar un paso:
  hay texto y etiquetas de accesibilidad en español.
- Objetivos táctiles de al menos 44 × 44 px y contraste suficiente sobre el
  resalte.
- Los logs no incluyen sesiones, credenciales, la emoción registrada ni datos de
  la persona.
- El cambio al flujo de check-in se limita a avisar que quedó guardado; su
  comportamiento, pantallas y datos no se modifican.
- Toda prueba que registre un check-in usa cuentas y datos sintéticos.

## 6. Criterios de aceptación

| Criterio | Resultado observable | Comprobación prevista |
| --- | --- | --- |
| CA-001 | Tras la primera sesión de una cuenta nueva, el tutorial aparece después de la bienvenida y no se superpone con ella. | Recorrido Android/web con cuenta sintética nueva; prueba de orden de aparición. |
| CA-002 | En accesos posteriores a completarlo u omitirlo, al reabrir con sesión activa y al recargar la web, no aparece de nuevo. | Reinicio de la app y recarga web con cuenta que ya lo completó. |
| CA-003 | Los seis pasos aparecen en el orden definido, con su elemento resaltado, texto en español y posición; el check-in es el quinto y «Todo listo» el último. | Pruebas del dominio y recorrido Android. |
| CA-004 | «Siguiente», «Atrás», «Omitir», «Registrar ahora» y «Entendido» funcionan según RF-003, y el botón Atrás de Android se comporta como indica. | Pruebas del estado del recorrido y recorrido Android. |
| CA-005 | Omitir o guardar el check-in marca el tutorial como visto; cerrar la app a mitad no lo marca. | Pruebas de persistencia con almacenamiento simulado; reinicio en Android. |
| CA-006 | Dos cuentas sintéticas en el mismo dispositivo conservan estados independientes, incluso al cambiar de cuenta durante el recorrido o durante el check-in. | Prueba con dos cuentas y cambio de sesión. |
| CA-007 | «Ver tutorial de la app» permite repetirlo, recorre los seis pasos hasta «Entendido», no registra ningún check-in y no cambia el estado de la cuenta. | Recorrido manual tras haberlo completado, comprobando que no se crea un registro. |
| CA-008 | El recorrido funciona sin conexión; un check-in guardado sin conexión lo completa; un fallo de almacenamiento del tutorial no bloquea el inicio ni el check-in. | Development build en modo avión; prueba con almacenamiento que falla al leer y al escribir. |
| CA-009 | El texto sobre emociones y bienestar es no clínico, distingue orientación de ayuda profesional y no sugiere ni exige una emoción. | Revisión de contenido contra el principio I de la constitución. |
| CA-010 | Con movimiento reducido, pantalla estrecha, texto ampliado y lector de pantalla, el recorrido es usable y legible. | Recorrido Android con cada opción de accesibilidad activada. |
| CA-011 | La bienvenida animada, el inicio, el check-in y las secciones presentadas conservan su comportamiento. | Typecheck, pruebas existentes de la app y recorrido Android. |
| CA-012 | «Registrar ahora» abre el check-in; guardar el registro marca el tutorial completado; el check-in aparece en el historial y en «Vistazo de tu semana»; al volver al inicio aparece «Todo listo» y «Entendido» lo cierra. | Recorrido con cuenta sintética; comprobación del registro en el historial. |
| CA-013 | Volver del check-in sin guardar reabre el tutorial en el paso 5, sin marcarlo completado y sin mostrar «Todo listo»; un check-in que falla tampoco lo marca. | Recorrido con salida sin guardar y con un guardado que falla. |
| CA-014 | «Omitir» en el paso 5 cierra el recorrido sin abrir el check-in ni registrar nada. | Recorrido manual y automático con cuenta sintética. |

## 7. Decisiones propuestas y aprobación

La versión 0.1.0 se aprobó el 2026-10-13 con las decisiones que siguen vigentes:
pasos sobre el propio inicio, «Pendientes» fuera, estado «ya visto» local por
cuenta y sin backend, y las cuentas existentes verán el tutorial una vez. La
ubicación de «Ver tutorial» se fijó en el plan como un enlace al final del
inicio.

La revisión 0.2.0 responde a la solicitud del usuario del 2026-10-14: que el
check-in sea un paso interactivo, de modo que la persona registre su check-in
diario, y que «Todo listo» cierre el recorrido al volver al inicio. Se proponen estas decisiones, abiertas
a corrección antes de aprobar:

1. **Seis pasos.** El check-in pasa a ser el paso 5 y «Todo listo» se conserva
   como paso 6, que se muestra en el inicio al volver de registrar. El aviso de
   dónde volver a ver el tutorial queda en el paso 6.
2. **Cómo es interactivo.** El paso 5 ofrece «Registrar ahora», que abre la
   pantalla real de check-in. Se descarta pedir que la persona toque el botón «+»
   resaltado: exigiría dejar un hueco táctil en la capa de bloqueo y perder el
   manejo del botón Atrás y del foco de accesibilidad que da el `Modal` actual.
3. **Cuándo se completa.** Al quedar guardado el check-in, sincronizado o en el
   dispositivo sin conexión. No espera a que la persona vea el agradecimiento ni
   a que regrese al inicio, de modo que cerrar la app antes de ver «Todo listo» no
   repite el tutorial.
4. **«Todo listo» es un cierre, no un requisito.** Solo aparece después de un
   registro guardado, se cierra con «Entendido» y no ofrece volver al check-in.
   Quien omite en el paso 5 no lo ve.
5. **No es obligatorio.** «Omitir» sigue disponible en el paso del check-in. El
   registro emocional es voluntario y la persona conserva el control de qué
   registrar; el tutorial no la condiciona a registrar para poder usar la app.
6. **Volver sin guardar** reabre el paso 5 en lugar de cerrar el tutorial.
7. **La repetición manual no registra.** Pedir un check-in cada vez que se repite
   el tutorial crearía registros emocionales sin que la persona lo decida, lo que
   contradice la regla de no alterar datos al repetirlo. El paso 5 pasa a ser
   informativo, con «Siguiente», y el recorrido termina en el paso 6.
8. **No se detecta si ya hubo un check-in hoy.** Hacerlo exigiría consultar datos
   emocionales; el paso puede omitirse.
9. **Cambio mínimo en el check-in.** La pantalla de check-in solo avisa que el
   registro quedó guardado. No cambia su aspecto ni su lógica.

Esta revisión fue aprobada explícitamente por el usuario el 2026-10-14, con las
decisiones anteriores tal como están redactadas. Conforme a la constitución y a
`AGENTS.md`, el plan y las tareas se revisan y aprueban antes de implementar. No
se presume excepción al orden ni autorización para cambios remotos.

### Historial de revisiones

- **0.1.0 — 2026-10-13:** versión inicial, aprobada ese día. Seis pasos y cierre
  informativo.
- **0.2.0 — 2026-10-14:** el check-in pasa a ser el paso 5, interactivo; guardarlo
  completa el tutorial, y «Todo listo» queda como paso 6 al volver al inicio.
  Aprobada el 2026-10-14.

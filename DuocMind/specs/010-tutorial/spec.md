# Spec 010 — Tutorial de bienvenida

| Campo | Valor |
| --- | --- |
| Versión | 0.1.0 |
| Estado | APROBADA |
| Fecha | 2026-10-13 |
| Incremento | 010-tutorial |
| Constitución | 2.0.0 |
| Plataformas | Android y previsualización web |
| Aprobación | Confirmada explícitamente por el usuario el 2026-10-13 |

## 1. Problema y resultado esperado

Después de iniciar sesión, el estudiante llega al inicio (`/dashboard`) con
varias secciones a la vista: registro emocional, agenda, eventos y bienestar.
Hoy la app no le explica para qué sirve cada una ni dónde está. Quien la usa por
primera vez debe descubrirlo por su cuenta, y puede pasar por alto secciones
relevantes como los recursos de bienestar.

Este incremento agrega un recorrido guiado que se muestra al estudiante la
primera vez que inicia sesión y presenta, una por una, las secciones más
relevantes de la app. El tutorial orienta; no registra datos ni sustituye
ninguna función existente.

Hoy la app solo muestra la bienvenida animada del Brote tras el login
(`WelcomeIntro`, activada con `?welcome=1`). No existe ningún recorrido guiado
ni se conserva si el estudiante ya vio alguna introducción.

## 2. Alcance propuesto

- Recorrido de pasos secuenciales sobre el inicio del estudiante, que resalta
  cada sección y explica en una o dos frases para qué sirve.
- Secciones cubiertas: resumen del inicio, registro de cómo te sientes (botón
  central), Agenda, Eventos, Bienestar y recursos de ayuda.
- Controles para avanzar, retroceder y omitir el recorrido en cualquier paso.
- Aparición automática una sola vez por cuenta, después de la bienvenida animada.
- Conservación local de que la persona ya vio u omitió el tutorial, aislada por
  cuenta.
- Una forma de volver a ver el tutorial después.
- Verificaciones reproducibles con cuentas y datos sintéticos.

Fuera de alcance:

- Cambios en el contenido o comportamiento de las secciones presentadas.
- Tutoriales específicos dentro de cada pantalla, consejos contextuales,
  tooltips permanentes y recorridos previos al inicio de sesión.
- Presentar «Pendientes», que hoy es una vista provisoria («Muy pronto»), hasta
  que exista como funcionalidad.
- Sincronización del estado del tutorial entre dispositivos, analítica de uso y
  mediciones de cuántas personas lo completan.
- Despliegues, migraciones remotas y cambios de backend.

## 3. Requisitos funcionales

### RF-001 — Cuándo aparece

1. El tutorial se ofrece automáticamente en el inicio la primera vez que una
   cuenta inicia sesión en el dispositivo. No aparece en cada inicio de sesión.
2. Comienza después de que termina la bienvenida animada (`WelcomeIntro`) y de
   que el inicio terminó de cargar. Nunca se superpone con ella.
3. No aparece al abrir la app con una sesión ya activa, al recargar la
   previsualización web ni al volver a primer plano.
4. Si la persona cierra la app a mitad del recorrido sin omitirlo ni terminarlo,
   se le vuelve a ofrecer desde el primer paso en su siguiente acceso.
5. Dos cuentas en el mismo dispositivo no comparten el estado: que una haya visto
   el tutorial no lo oculta a la otra.

### RF-002 — Contenido del recorrido

1. El recorrido tiene, en este orden, los pasos siguientes. Cada uno resalta el
   elemento real de la interfaz que presenta y muestra un título y una
   explicación breve en español.

   | Paso | Elemento resaltado | Idea que comunica |
   | --- | --- | --- |
   | 1. Inicio | Resumen del inicio | Aquí ves cómo ha estado tu semana. |
   | 2. Registrar cómo te sientes | Botón central «+» | Registra tu estado emocional cuando quieras; tú decides qué emoción registrar y puedes corregirla. |
   | 3. Agenda | Pestaña «Agenda» | Organiza tus actividades y los eventos que te interesan. |
   | 4. Eventos | Icono de calendario del encabezado | Descubre eventos institucionales y agrégalos a tu agenda. |
   | 5. Bienestar | Pestaña «Bienestar» | Recursos de bienestar y de ayuda, incluso sin conexión. |
   | 6. Cierre | — | Puedes volver a ver este recorrido cuando quieras. |

2. El texto sobre emociones y bienestar es orientativo y no clínico: no
   promete diagnóstico, tratamiento ni sustituye ayuda profesional, y distingue
   la orientación general de la ayuda profesional o de emergencia, conforme a la
   constitución (principio I).
3. Cada paso indica su posición («Paso 2 de 6»).
4. Solo se presentan secciones que existen y funcionan. Si el plan debe retirar o
   añadir un paso porque una sección cambió, se corrige esta spec antes.
5. El tutorial no muestra ni solicita datos personales, emocionales ni
   respuestas del estudiante.

### RF-003 — Controles y navegación

1. Cada paso ofrece «Siguiente»; desde el paso 2 ofrece también «Atrás». El
   último paso ofrece «Entendido» en lugar de «Siguiente».
2. «Omitir» está disponible en todos los pasos y cierra el recorrido de
   inmediato.
3. Terminar u omitir cierra el recorrido, deja al estudiante en el inicio y
   registra que ya lo vio.
4. Mientras el recorrido está abierto, el resto de la pantalla no responde a
   toques; el estudiante no ejecuta por accidente las acciones que se le
   explican. El botón «Atrás» del sistema en Android retrocede un paso y, en el
   primer paso, equivale a omitir.
5. El recorrido no navega fuera del inicio ni abre otras pantallas. El
   estudiante conoce cada sección sin salir de la pantalla en la que está.

### RF-004 — Volver a verlo

1. El estudiante puede volver a iniciar el tutorial desde una acción visible y
   etiquetada, por ejemplo «Ver tutorial». La ubicación exacta se decide en el
   plan.
2. Verlo de nuevo no depende de que lo haya visto antes y no altera datos de la
   cuenta.

### RF-005 — Conservación, privacidad y offline

1. Se conserva únicamente si la cuenta ya vio u omitió el tutorial. No se guarda
   contexto emocional ni datos personales con ese estado.
2. El estado se guarda localmente, asociado a la cuenta autenticada, sin
   registrar el correo ni el identificador en logs. No se envía al backend.
3. El tutorial funciona sin conexión después del primer acceso válido y no
   depende de ningún servicio remoto.
4. Si no se puede leer el estado guardado, el tutorial no se muestra de forma
   automática; la persona puede iniciarlo manualmente. Un fallo de lectura o
   escritura nunca bloquea el uso del inicio.
5. El estado se elimina al borrar la cuenta y al desinstalar la app.

## 4. Recorridos y estados observables

### Primer acceso

Login → bienvenida animada del Brote → inicio cargado → tutorial, paso 1 →
«Siguiente» hasta el paso 6 → «Entendido» → inicio sin recorrido. En los accesos
siguientes la cuenta va de login a bienvenida y a inicio, sin tutorial.

### Omitir

Cualquier paso → «Omitir» → inicio. No se vuelve a ofrecer automáticamente.

### Interrupción

Paso intermedio → cierre de la app → nuevo acceso → el tutorial se ofrece de
nuevo desde el paso 1.

### Revisión manual

Acción «Ver tutorial» → paso 1 → recorrido normal. Al terminar, no cambia nada
más.

### Estados y casos límite

| Situación | Resultado observable |
| --- | --- |
| Movimiento reducido activado | Sin animaciones de entrada ni desplazamiento; los pasos cambian sin movimiento. |
| Pantalla estrecha y texto ampliado | Título, texto y botones siguen legibles y no se superponen al elemento resaltado ni quedan fuera de pantalla. |
| Lector de pantalla activo | Cada paso se anuncia con su título, texto y posición; el foco queda dentro del recorrido hasta cerrarlo. |
| Elemento resaltado no medible | El paso se presenta de forma centrada, sin resalte, y el recorrido continúa. |
| Rotación o cambio de tamaño | El resalte se recoloca sobre su elemento o el paso pasa a presentarse centrado. |
| Cambio de cuenta durante el recorrido | El recorrido se cierra sin marcar como visto el de la otra cuenta. |
| Fallo al guardar «ya visto» | El recorrido se cierra igualmente; puede ofrecerse otra vez en el próximo acceso. |

## 5. Calidad y acceso

- La arquitectura respeta `AGENTS.md`: rutas mínimas en `src/app/`, lógica del
  recorrido y su estado fuera de las pantallas, y acceso al almacenamiento en
  infraestructura. El plan decide dónde viven los pasos y su presentación.
- No se añade ninguna dependencia nueva sin justificarla en el plan. Se usa
  `Animated` de React Native y los tokens de `motionTokens.ts`; los valores de
  movimiento no se escriben sueltos.
- Movimiento calmado y sin rebotes, con `ScalePress` en los botones y respeto de
  `useReducedMotion`. El movimiento no es el único medio de comunicar un paso:
  hay texto y etiquetas de accesibilidad en español.
- Objetivos táctiles de al menos 44 × 44 px y contraste suficiente sobre el
  resalte en tema claro y oscuro.
- Los logs no incluyen sesiones, credenciales ni datos de la persona.
- El tutorial no modifica el comportamiento de las pantallas que presenta ni de
  la bienvenida animada existente.

## 6. Criterios de aceptación

| Criterio | Resultado observable | Comprobación prevista |
| --- | --- | --- |
| CA-001 | Tras la primera sesión de una cuenta nueva, el tutorial aparece después de la bienvenida y no se superpone con ella. | Recorrido Android/web con cuenta sintética nueva; prueba de orden de aparición. |
| CA-002 | En accesos posteriores, al reabrir con sesión activa y al recargar la web, no aparece de nuevo. | Reinicio de la app y recarga web con cuenta que ya lo vio. |
| CA-003 | Los seis pasos aparecen en el orden definido, con su elemento resaltado, texto en español y posición. | Pruebas de interfaz con React Native Testing Library; recorrido Android. |
| CA-004 | «Siguiente», «Atrás», «Omitir» y «Entendido» funcionan en cada paso y el botón Atrás de Android se comporta según RF-003. | Pruebas del estado del recorrido y recorrido Android. |
| CA-005 | Terminar u omitir marca el tutorial como visto; cerrar la app a mitad no lo marca. | Pruebas de persistencia con almacenamiento simulado; reinicio en Android. |
| CA-006 | Dos cuentas sintéticas en el mismo dispositivo conservan estados independientes, incluso al cambiar de cuenta durante el recorrido. | Prueba con dos cuentas y cambio de sesión durante el tutorial. |
| CA-007 | «Ver tutorial» permite repetirlo en cualquier momento sin alterar datos. | Recorrido manual tras haberlo completado. |
| CA-008 | El tutorial funciona sin conexión y un fallo de almacenamiento no bloquea el inicio. | Development build en modo avión; prueba con almacenamiento que falla al leer y al escribir. |
| CA-009 | El texto sobre emociones y bienestar es no clínico y distingue orientación de ayuda profesional. | Revisión de contenido contra el principio I de la constitución. |
| CA-010 | Con movimiento reducido, pantalla estrecha, texto ampliado y lector de pantalla, el recorrido es usable y legible. | Recorrido Android con cada opción de accesibilidad activada. |
| CA-011 | La bienvenida animada, el inicio y las secciones presentadas conservan su comportamiento. | Typecheck, pruebas existentes de la app y recorrido Android. |

## 7. Decisiones propuestas y aprobación

Se proponen estas decisiones, abiertas a corrección antes de aprobar la spec:

1. **Pasos:** seis pasos sobre el propio inicio, sin navegar entre pantallas.
   Esto mantiene simple el recorrido y evita estados intermedios en otras
   pantallas.
2. **Pendientes queda fuera** mientras sea una vista provisoria. Se incorporará
   cuando exista como funcionalidad.
3. **Estado «ya visto» local por cuenta**, sin backend. Es suficiente para el
   MVP y evita guardar datos adicionales en Supabase. A cambio, una persona que
   inicie sesión en otro dispositivo verá el tutorial otra vez.
4. **Ubicación de «Ver tutorial»:** se decide en el plan. El perfil de la
   cuenta y el centro de Bienestar son los candidatos naturales; ambos
   requieren confirmar con el usuario si prefiere una ubicación concreta.
5. **Cuentas existentes:** quienes ya usan la app verán el tutorial una vez en
   su próximo inicio de sesión, ya que no hay registro previo de haber visto
   una introducción. Si se prefiere no mostrarlo a cuentas antiguas, hay que
   indicarlo antes de aprobar.

Esta spec fue aprobada explícitamente por el usuario el 2026-10-13, con las
decisiones anteriores tal como están redactadas. Conforme a la constitución y a
`AGENTS.md`, el plan se redacta después de esta aprobación; las tareas, después
de aprobar el plan, y la implementación, después de aprobarlas. No se presume
excepción al orden ni autorización para cambios remotos.

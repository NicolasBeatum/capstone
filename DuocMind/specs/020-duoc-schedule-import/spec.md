# Spec 020 — Importar el horario desde el boletín de carga académica de Duoc

| Campo | Valor |
| --- | --- |
| Versión | 0.3.0 |
| Estado | APROBADA |
| Fecha | 2026-11-14 |
| Incremento | 020-duoc-schedule-import |
| Rama | `feature/ocr-horario-duoc` |
| Base | `dev`, commit `040a43e` |
| Constitución | 2.0.0 |
| Plataformas | Android y previsualización web |
| Aprobación | Confirmada explícitamente por el usuario el 2026-11-14: «si adelante» |

## 1. Problema y resultado esperado

Hoy la persona arma su horario a mano en «Mis horarios» (specs 013 y 017): crea el
semestre, cada ramo y cada bloque con día, horas y sala. Duoc ya entrega ese dato en el
**Boletín de carga académica**, un PDF que cada estudiante descarga desde el portal.
Copiarlo a mano es lento y propenso a errores.

Resultado observable: en «Mis horarios», la persona toca «Importar desde Duoc», elige el
PDF del boletín y ve una vista previa con el semestre, los ramos y sus bloques. Al
confirmar, la app crea el semestre con sus ramos y bloques en el dispositivo, igual que si
los hubiera ingresado a mano.

## 2. Hallazgos sobre el documento

Se analizaron cuatro boletines reales (dos del 2.º semestre 2025 y uno del 2.º semestre
2024 de la misma persona, más los de otras dos personas). Los archivos no se versionan
porque contienen nombre y RUT (ver §5).

1. **No es una imagen escaneada.** El PDF lo genera SAP NetWeaver (formulario
   `ZRHIQ_SHOW_STUDENTS_TIMETABLE3`) con texto real, fuentes estándar sin incrustar
   (Courier y Helvetica, WinAnsi) y flujos de contenido sin comprimir. Cada texto trae
   sus coordenadas. **No hace falta OCR**: basta leer el texto y ubicarlo en la grilla.
2. **Estructura fija.** Encabezado con semestre («2do Sem. 2025»), una grilla con las
   columnas Lunes a Sábado y filas por módulo («10:01 A 10:40»), y al final el detalle de
   las clases de las asignaturas que no son semanales.
3. **Cada celda** contiene el nombre del ramo y una clave con el formato
   `CÓDIGO-SECCIÓN/SEDE-SALA`, por ejemplo `ASY6131-004D/PM-W608`. La clave puede venir
   partida en dos líneas (`ASY6131-004D/PM-` y `W608`).
4. **Una celda puede cortarse entre páginas**: la parte final queda en la primera fila,
   sin hora, de la página siguiente.
5. **Un ramo ocupa varios módulos seguidos** (por ejemplo, 16:41–17:20 y 17:31–18:10).
   Separados por el recreo de 10 a 11 minutos, forman una sola clase de 16:41 a 18:10.
6. **Hay asignaturas que no son semanales.** «Proceso de Portafolio» aparece en la grilla
   todos los lunes, pero el detalle indica que solo hay 4 clases en fechas puntuales.
7. **El boletín no trae fechas de inicio ni término del semestre.**

Un prototipo (fuera del repositorio) reconstruyó correctamente los cuatro horarios: 13
bloques en cada uno, incluidas las celdas partidas entre páginas y los módulos unidos.

## 3. Alcance

- Acción «Importar desde Duoc» en «Mis horarios».
- Selección de un archivo PDF desde el teléfono.
- Lectura del boletín **en el dispositivo**, sin enviarlo a ningún servidor.
- Vista previa editable antes de guardar: semestre, ramos (nombre, código, sección) y
  bloques (día, inicio, término y sala).
- Guardado en el horario local existente (spec 017), con las validaciones actuales.
- Mensajes claros cuando el archivo no es un boletín de Duoc o no se puede leer.

Fuera de alcance:

- **OCR de fotos o capturas de pantalla** del horario (ver decisión 1).
- Otros formatos de horario (otras instituciones, Excel o calendarios).
- Conectar los ramos importados con `estudiante_asignatura` o con la malla de la carrera.
- Guardar el PDF, el nombre o el RUT de la persona.
- Sincronizar o respaldar el horario en Supabase (sigue siendo solo local, spec 017).
- Actualizar en el futuro un horario ya importado cuando Duoc cambie el boletín.

## 4. Requisitos funcionales

### RF-001 — Selección del archivo

1. «Mis horarios» muestra la acción «Importar desde Duoc», también cuando todavía no hay
   semestres.
2. La acción abre el selector de archivos del sistema, filtrado a PDF.
3. Cancelar el selector vuelve a «Mis horarios» sin cambios ni mensajes de error.
4. Un archivo de más de 2 MB se rechaza sin leerlo, con el mensaje «Ese archivo es muy
   grande para ser un boletín de Duoc.».

### RF-002 — Lectura del boletín

1. La lectura ocurre por completo en el dispositivo y funciona sin conexión.
2. Se reconoce el semestre a partir del encabezado («2do Sem. 2025» → «2.º semestre
   2025»).
3. Se reconocen las clases de lunes a sábado con su ramo, código, sección y sala, aunque
   la clave venga partida en dos líneas o la celda se corte entre páginas.
4. Los módulos seguidos del mismo ramo, sección y sala, separados por un recreo de hasta
   15 minutos, se unen en un solo bloque.
5. Un mismo código y sección forma un solo ramo, aunque tenga clases en salas o días
   distintos.
6. Se reconoce el detalle de clases de las asignaturas no semanales: fecha, horario y
   sala de cada clase.
7. Si el archivo no es un boletín reconocible (sin grilla, sin días o con celdas que no
   cumplen el formato), no se importa nada y se muestra: «No pudimos leer este archivo.
   Descarga el boletín de carga académica desde el portal de Duoc e inténtalo de nuevo.».
8. Un error de lectura no muestra el contenido del archivo ni lo registra en logs.

### RF-003 — Vista previa y confirmación

1. Antes de guardar se muestra el semestre detectado y sus ramos, cada uno con sus
   bloques ordenados por día y hora.
2. La persona puede cambiar el nombre del semestre y del ramo, y quitar ramos o bloques
   antes de confirmar.
3. Las asignaturas que tienen detalle de clases (§2.6) no se importan como bloque
   semanal. En la vista previa aparecen aparte, bajo «Clases en fechas puntuales», con
   cada fecha y horario. Al guardar, cada fecha se crea como una actividad personal con
   el título del ramo («Proceso de Portafolio 6»), su ramo, el semestre importado y su
   hora de inicio y término. Las clases del detalle que caen el mismo día en módulos
   seguidos (como Clase 01 y Clase 02 del 30 de agosto) forman una sola actividad. La
   persona puede quitar fechas antes de guardar.
4. «Guardar horario» crea un semestre nuevo con los ramos y bloques elegidos y lo deja
   como semestre activo.
5. Si ya existe un semestre con el mismo nombre, se pregunta: «Reemplazar ese semestre»
   borra sus ramos y bloques y carga los del boletín; «Crear otro» guarda el nuevo con
   «(2)» (o el siguiente número libre). Reemplazar no borra las actividades de ese
   semestre ingresadas a mano.
6. «Cancelar» descarta la importación sin cambios.
7. Tras guardar, la agenda y el inicio muestran las clases importadas como cualquier
   clase ingresada a mano.

### RF-004 — Validaciones

1. Se aplican las reglas actuales del horario (`schedule.ts`): longitudes de texto,
   horas válidas, término posterior al inicio, límites y bloques duplicados.
2. Si algún dato no cumple esas reglas, no se guarda nada y la vista previa indica qué
   corregir.

## 5. Privacidad y riesgos

- **Datos personales.** El boletín contiene nombre, RUT, carrera y número de carrera. La
  app no los guarda, no los muestra en la vista previa y no los envía a ningún lado.
  Solo conserva ramos, bloques, salas y el nombre del semestre, igual que el ingreso manual.
- **Sin servidor.** Procesar el PDF en el dispositivo evita subir datos personales y
  respeta la decisión de la spec 017 de que el horario no salga del teléfono.
- **Datos de prueba.** Por la constitución (§II) las pruebas del repositorio usan boletines
  sintéticos con el mismo formato y nombres y RUT ficticios. Los cuatro PDF reales solo se
  usan para verificar en local y no se versionan.
- **Riesgo: cambio de formato.** Si Duoc cambia el formulario, la importación deja de
  reconocerlo. Se acepta: la app lo informa (RF-002.7) y el ingreso manual sigue
  disponible.
- **Riesgo: archivo malicioso.** El lector solo extrae texto de un archivo de hasta 2 MB
  con un tiempo acotado; no ejecuta contenido del PDF.

## 6. Criterios de aceptación

| ID | Resultado observable | Verificación prevista |
| --- | --- | --- |
| CA-001 | Un boletín sintético con el formato de Duoc produce exactamente el semestre, los ramos y los bloques esperados. | Prueba de dominio con fixtures sintéticos. |
| CA-002 | Una clave partida en dos líneas y una celda cortada entre páginas se leen bien. | Prueba de dominio. |
| CA-003 | Los módulos seguidos se unen en un bloque; los separados por más de 15 minutos no. | Prueba de dominio. |
| CA-004 | Un PDF ajeno, un archivo dañado o uno de más de 2 MB no importa nada y muestra el mensaje correspondiente. | Prueba de dominio y de caso de uso. |
| CA-005 | Los cuatro boletines reales se reconstruyen igual que su PDF. | Verificación local, sin versionar los archivos. |
| CA-006 | Confirmar la vista previa crea el semestre activo con sus ramos y bloques; cancelar no cambia nada. | Prueba de servicio y recorrido Android. |
| CA-010 | Una asignatura con detalle de clases no crea bloque semanal y sí una actividad por fecha, uniendo las clases seguidas del mismo día. | Prueba de dominio y de servicio. |
| CA-011 | Con un semestre del mismo nombre, se ofrece reemplazar o crear otro, y cada opción produce el resultado descrito sin tocar actividades manuales. | Prueba de servicio. |
| CA-007 | La importación no hace solicitudes de red y no guarda nombre ni RUT. | Revisión de código y de solicitudes del recorrido web. |
| CA-008 | La vista previa es accesible con lector de pantalla y texto ampliado. | Recorrido Android. |
| CA-009 | Las validaciones del proyecto pasan. | `npm run typecheck`, `npm test`. |

## 7. Decisiones

Decididas por el usuario el 2026-11-14:

1. **Solo PDF.** Se importa únicamente el PDF del portal, leyendo su texto en el
   dispositivo. No se leen fotos ni capturas, por lo que no se agrega OCR.
2. **Semestre repetido.** Se pregunta si se reemplaza el semestre existente o se crea
   otro (RF-003.5).
3. **Asignaturas no semanales.** Se crean como actividades en las fechas del detalle, no
   como bloque semanal (RF-003.3). Las actividades no tienen campo de sala; el plan
   define si la sala se omite o va en el título.

## 8. Aprobación y pasos posteriores

La spec fue aprobada el 2026-11-14. Conforme a `DuocMind/AGENTS.md`, ahora se
redactan `plan.md` (lector de PDF, dependencia para elegir archivos y pantallas) y
`tasks.md`, y recién entonces se implementa. No autoriza commits, push, migraciones ni
despliegues.

### Historial de revisiones

- **0.1.0 — 2026-11-14:** borrador inicial a partir de cuatro boletines reales.
- **0.2.0 — 2026-11-14:** decisiones del usuario: solo PDF, preguntar ante semestre
  repetido y actividades por fecha para las asignaturas no semanales.
- **0.3.0 — 2026-11-14:** aprobada.

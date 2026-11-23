# Plan 020 — Importar el horario desde el boletín de carga académica de Duoc

| Campo | Valor |
| --- | --- |
| Versión | 0.2.0 |
| Estado | APROBADO |
| Fecha | 2026-11-14 |
| Spec | `spec.md` 0.3.0 (APROBADA) |
| Aprobación | Confirmada explícitamente por el usuario el 2026-11-14: «adelante» |
| Rama | `feature/ocr-horario-duoc` |

## 1. Decisiones técnicas

1. **Lector de PDF propio y acotado, sin librería de PDF.** El boletín de SAP tiene
   flujos de contenido sin comprimir y cada texto se dibuja como
   `BT x y Td 0 Tw <hex>Tj ET` con fuentes WinAnsi. Un lector de unas 200 líneas,
   en TypeScript puro, recorre los flujos (`stream … endstream`), extrae los textos
   con sus coordenadas y los decodifica como WinAnsi (equivalente a Latin-1 para los
   caracteres del boletín). Se descartan `pdfjs-dist` y similares: pesan varios MB,
   necesitan workers o polyfills en Hermes y resuelven un problema mucho más amplio
   que el de la spec (constitución §IV). Si un flujo viene comprimido (`/FlateDecode`)
   o no hay textos, el archivo se trata como no reconocido (RF-002.7).
2. **Reconstrucción de la grilla por coordenadas**, validada con el prototipo sobre los
   cuatro boletines reales:
   - Se convierte `y` a coordenada desde arriba (`792 − y`) y se agrupan los textos por
     página.
   - En cada página, los encabezados «Lunes» a «Sábado» fijan el borde izquierdo de cada
     columna; un texto pertenece a la última columna cuyo borde está a su izquierda
     (tolerancia 4 pt).
   - Las horas `HH:MM` a la izquierda de «Lunes» fijan las filas: se toman de a pares
     (inicio y término; la «A» intermedia se ignora). Una fila va desde su hora de
     inicio hasta la siguiente.
   - Los textos sobre la primera hora de una página continúan la última fila de la
     página anterior (celda cortada, spec §2.4).
   - La grilla termina donde empieza «El Detalle de las clases».
   - El texto de una celda se arma en orden de lectura, sin espacio tras un guion
     final, y se valida con
     `^(.+?)\s*([A-Z]{3}\d{4})-(\d{3}[A-Z])\/([A-Z]{2})-(\S+)$`
     (nombre, código, sección, sede y sala). Una celda que no calza invalida el archivo.
3. **Unión de módulos.** Se ordenan por día e inicio, y un módulo se une al bloque
   anterior si coincide en día, código, sección y sala y empieza a lo más 15 minutos
   después de que termina el anterior (RF-002.4).
4. **Detalle de clases puntuales.** Cada sección «El Detalle de las clases de la
   asignatura "…-CÓDIGO-SECCIÓN-NOMBRE"» identifica el ramo. Sus filas se anclan en los
   textos «Clase NN», y la fecha, el horario y la sala se asignan por columna, según los
   encabezados «Fecha», «Horario» y «Sala». La fecha se lee en español
   («Lunes 25 de Agosto de 2025» → `2025-08-25`) y se valida con `isDate`. Las clases
   del mismo día separadas por hasta 15 minutos se unen (Clase 01 y 02 → 10:41–12:10).
5. **Nombres legibles.** El boletín viene en mayúsculas. Los nombres de ramo pasan a
   mayúscula inicial por palabra, con conectores en minúscula (`de`, `del`, `el`, `la`,
   `los`, `las`, `en`, `para`, `y`, `a`) salvo al inicio: «Seguridad en Sistemas
   Computacionales». El semestre se nombra «1.er semestre AAAA» o «2.º semestre AAAA».
   La persona puede editar todos los nombres en la vista previa.
6. **Sala en las actividades puntuales.** `PersonalActivity` no tiene sala. Se agrega al
   título: «Proceso de Portafolio 6 · Sala VIRTUAL01», recortado a 120 caracteres. La
   actividad es de tipo `personal`, con `subjectName` igual al nombre del ramo,
   `semesterId` y `semesterName` del semestre importado, `time` y `endTime`.
7. **El ramo puntual también se crea como ramo**, sin bloques, para que aparezca en la
   pestaña Ramos y en los formularios de actividades.
8. **Guardado atómico.** El horario y las actividades se escriben en una sola
   `store.update`, para que un fallo no deje un semestre sin sus actividades. Se agrega
   a `PlannerService` el método `applyImport(session, expected, transform)`. Comprueba
   igual que `editSchedule` que el horario no cambió y que no se pierden semestres, y
   aplica `savePersonalActivity` a cada actividad nueva. La transformación la construye
   una función pura de la funcionalidad agenda.
9. **Semestre repetido** (RF-003.5). La coincidencia de nombre ignora mayúsculas y
   espacios extremos. «Reemplazar» conserva el `id` del semestre, quita sus ramos con
   `removeSubject` (que borra sus bloques) y agrega los importados. Las actividades no
   se tocan, porque se asocian por `semesterId` y el semestre sigue existiendo. «Crear
   otro» usa el primer nombre libre entre «… (2)», «… (3)», etc. En ambos casos el
   semestre queda activo.
10. **Selección y lectura del archivo.** Se agregan con `npx expo install` (versiones
    alineadas con Expo 57):
    - `expo-document-picker`: abre el selector del sistema con `type: 'application/pdf'`
      y `copyToCacheDirectory: true`.
    - `expo-file-system`: en Android lee la copia con `new File(uri).bytes()` y la borra
      al terminar, aunque falle la lectura. Ya está instalado como dependencia de
      `expo`; se declara para no depender de una transitiva.
    En web se usa `asset.file.arrayBuffer()`, separado en `.web.ts`. Antes de leer se
    comprueba `size ≤ 2 MB` (RF-001.4). Las dos dependencias son nativas: exigen un
    build de desarrollo nuevo para probar en Android.
11. **Errores sin contenido.** El lector lanza `DuocTimetableError` con un código
    (`too_large`, `not_timetable`, `unreadable`) y nunca incluye texto del archivo. La
    pantalla traduce el código al mensaje de la spec. No hay `console.*` en la ruta.
12. **Datos personales.** El lector no extrae nombre, RUT ni carrera: solo busca
    semestre, grilla y detalle. Esos textos quedan fuera del resultado.

## 2. Archivos

```
DuocMind/
├── package.json, package-lock.json            # + expo-document-picker, expo-file-system
├── app.json                                   # plugin de expo-document-picker si lo requiere
├── src/
│   ├── app/(app)/schedule-import.tsx          # NUEVO: reexporta la pantalla
│   ├── features/agenda/
│   │   ├── domain/
│   │   │   ├── pdfText.ts                     # NUEVO: extrae textos con coordenadas
│   │   │   └── duocTimetable.ts               # NUEVO: grilla, detalle, unión, nombres
│   │   ├── application/
│   │   │   ├── scheduleImport.ts              # NUEVO: vista previa → transformación del planner
│   │   │   ├── pickTimetableFile.ts           # NUEVO: interfaz del lector de archivos
│   │   │   └── useScheduleImport.ts           # NUEVO: estado de lectura para la pantalla
│   │   ├── infrastructure/
│   │   │   ├── timetableFile.ts               # NUEVO: reexporta la versión nativa para tsc
│   │   │   ├── timetableFile.native.ts        # NUEVO: picker + expo-file-system
│   │   │   └── timetableFile.web.ts           # NUEVO: picker + File.arrayBuffer
│   │   ├── components/ImportPreview.tsx       # NUEVO: ramos, bloques y fechas con casillas
│   │   └── screens/
│   │       ├── ScheduleImportScreen.tsx       # NUEVO
│   │       ├── ScheduleImportScreen.styles.ts # NUEVO
│   │       └── ScheduleScreen.tsx             # acción «Importar desde Duoc»
│   └── shared/planner/
│       ├── application/plannerService.ts      # applyImport
│       └── application/usePlanner.ts          # expone applyImport
└── tests/
    ├── fixtures/duocTimetable.mjs             # NUEVO: genera PDFs sintéticos con el formato SAP
    ├── duocTimetable.test.mjs                 # NUEVO
    ├── scheduleImport.test.mjs                # NUEVO
    └── plannerService.test.mjs                # applyImport
```

## 3. Interfaces

```ts
// domain/pdfText.ts
export interface PdfText { page: number; x: number; y: number; text: string; }
/** Textos de un PDF sin comprimir; devuelve [] si no hay (parseDuocTimetable lanza 'unreadable'). */
export function extractPdfText(bytes: Uint8Array): PdfText[];

// domain/duocTimetable.ts
export type DuocTimetableErrorCode = 'too_large' | 'not_timetable' | 'unreadable';
export class DuocTimetableError extends Error { code: DuocTimetableErrorCode; }
export interface ParsedSubject { code: string; section: string; name: string; }
export interface ParsedBlock { subjectKey: string; weekday: number; startsAt: string; endsAt: string; room: string; }
export interface ParsedSession { subjectKey: string; date: string; startsAt: string; endsAt: string; room: string; }
export interface DuocTimetable {
  semesterName: string;
  subjects: ParsedSubject[];      // subjectKey = `${code}-${section}`
  blocks: ParsedBlock[];          // sin las asignaturas puntuales
  sessions: ParsedSession[];      // clases puntuales ya unidas
}
export const MAX_TIMETABLE_BYTES = 2 * 1024 * 1024;
export function parseDuocTimetable(bytes: Uint8Array): DuocTimetable;

// application/scheduleImport.ts
export interface ImportSelection {
  semesterName: string;
  subjectNames: Record<string, string>;   // subjectKey → nombre editado
  excluded: Set<string>;                  // claves de ramos, bloques o sesiones quitados
}
export type ImportMode = 'new' | { replace: string /* semesterId */ };
export function findSameSemester(doc: ScheduleDocument, name: string): Semester | null;
export function nextFreeSemesterName(doc: ScheduleDocument, name: string): string;
export function buildImport(
  parsed: DuocTimetable, selection: ImportSelection, mode: ImportMode,
  newId: () => string,
): (doc: PlannerDocument) => PlannerDocument;

// application/pickTimetableFile.ts
export type PickedTimetable = { kind: 'cancelled' } | { kind: 'file'; bytes: Uint8Array };
export type PickTimetableFile = () => Promise<PickedTimetable>; // lanza 'too_large'

// shared/planner/application/plannerService.ts
applyImport(session, expected: ScheduleDocument,
  transform: (doc: PlannerDocument) => PlannerDocument): Promise<void>;
```

## 4. Interfaz de usuario

- **«Mis horarios»:** botón secundario «Importar desde Duoc» bajo el selector de
  semestre, y también en el estado vacío junto a «Crear semestre».
- **`/schedule-import`:** muestra una tarjeta con dos pasos (descargar el boletín del
  portal y elegirlo) y el botón «Elegir PDF». No abre el selector al entrar, porque en web
  el navegador puede bloquear un selector que no nace de un toque. Mientras lee muestra
  `GotaLoader` con «Leyendo tu boletín…». Si se cancela el selector, vuelve a la tarjeta.
- **Vista previa:**
  - campo del nombre del semestre;
  - tarjetas por ramo con nombre editable, código y sección, y sus bloques
    («Lunes 10:41–12:10 · W608»), cada uno con una casilla;
  - sección «Clases en fechas puntuales» con cada fecha y su casilla;
  - «Guardar horario» y «Cancelar».
  Las tarjetas entran con `Reveal`, los toques usan `ScalePress` y las casillas tienen
  rol `checkbox` y estado `checked`.
- **Semestre repetido:** al guardar, una hoja inferior pregunta «Ya tienes "2.º
  semestre 2025"» con «Reemplazar ese semestre» y «Crear otro».
- **Error:** el mensaje de la spec con «Elegir otro archivo» y «Volver».
- **Tras guardar:** vuelve a «Mis horarios» con el semestre importado seleccionado.

## 5. Pruebas

- **Fixtures sintéticos.** `tests/fixtures/duocTimetable.mjs` genera un PDF mínimo con
  el mismo patrón de operadores y posiciones que el de SAP. Usa nombre y RUT ficticios y
  admite variar celdas, páginas y detalle. Los PDF reales no se versionan.
- **`duocTimetable.test.mjs`:** semestre; celda con clave partida; celda cortada entre
  páginas; unión con recreo de 11 minutos y no unión con 20; ramo en dos salas;
  sábado; detalle con unión de clases del mismo día; nombres legibles; archivo
  comprimido, sin grilla, con una celda inválida o vacío → `DuocTimetableError` sin
  texto del archivo en el mensaje; el resultado no contiene el RUT ni el nombre del
  fixture (CA-001 a CA-004, CA-007).
- **`scheduleImport.test.mjs`:** crear semestre activo con ramos, bloques y
  actividades; exclusiones; nombres editados; reemplazo que conserva actividades
  manuales; «Crear otro» con «(2)» y «(3)»; datos inválidos que no guardan nada
  (CA-006, CA-010, CA-011, RF-004).
- **`plannerService.test.mjs`:** `applyImport` es atómico y rechaza un horario
  cambiado.
- **Verificación local con los cuatro PDF reales** mediante un script temporal fuera
  del repositorio que compara con lo leído en cada PDF (CA-005).
- **Recorrido Android** con build de desarrollo: elegir PDF, vista previa, guardar,
  agenda; cancelar; archivo ajeno; TalkBack y texto ampliado (CA-006, CA-008).
- **Recorrido web:** pestaña de red sin solicitudes durante la importación (CA-007).
- `npm run typecheck` y `npm test` (CA-009).

## 6. Riesgos y mitigaciones

| Riesgo | Mitigación |
| --- | --- |
| Duoc cambia el formulario o lo comprime. | Error claro y el ingreso manual sigue disponible. Las pruebas fijan el formato conocido. |
| Coordenadas distintas en otro boletín (más filas o ramos largos). | Columnas y filas se derivan de encabezados y horas, no de posiciones fijas. Las tolerancias se prueban con los cuatro reales. |
| Archivo grande o malicioso. | Límite de 2 MB antes de leer, solo expresiones regulares lineales y ninguna ejecución de contenido. |
| La copia en caché del PDF queda en el teléfono. | Se borra en `finally` tras leerla. |
| Las dependencias nativas requieren un build nuevo. | Se anota en la PR; el resto se prueba en web y con pruebas de Node. |

## 7. Reversión

El incremento no toca Supabase ni el formato del almacén local. Revertir la rama retira
la pantalla, el lector y las dependencias. Los horarios ya importados quedan como
horarios normales.

## 8. Aprobación y pasos posteriores

El plan fue aprobado el 2026-11-14 junto con la indicación de redactar las tareas e
implementar a continuación. No autoriza
commits, push, migraciones ni despliegues.

### Historial de revisiones

- **0.1.0 — 2026-11-14:** borrador inicial.
- **0.2.0 — 2026-11-14:** ajustes de implementación: `extractPdfText` devuelve [] en vez de
  lanzar (evita una dependencia circular entre archivos de dominio), la pantalla de
  importación no abre el selector al entrar y la lectura se conecta con el hook
  `useScheduleImport`, como `useSubjectCatalog`.

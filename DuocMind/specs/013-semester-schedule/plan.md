# Plan 013 — Horario por semestre y actividades locales

| Campo | Valor |
| --- | --- |
| Versión | 0.1.2 |
| Estado | APROBADO |
| Fecha | 2026-10-18 |
| Spec | `spec.md` 0.1.2, APROBADA, con sala independiente por bloque y ajustes del formulario solicitados el 2026-10-18 |
| Constitución | 2.0.0 |
| Rama | `feature/agenda-semestres` |
| Base | `origin/dev` en `0c6246501c34fc8430bc034b11affb01970092b4` |
| Aprobación | Confirmada explícitamente por el usuario el 2026-10-18: «esta bien adelante», en respuesta a la solicitud de aprobación del plan. |

## 1. Decisiones y límites

1. Separar dos conjuntos: el horario por cuenta se sincroniza; las actividades
   personales permanecen exclusivamente en el dispositivo. No se reutiliza
   `evento_academico`, porque obliga a una inscripción institucional y no admite
   los ramos manuales ni la organización aprobada.
2. Usar tablas privadas por propietario para semestres, ramos y bloques, sin
   insertar en `asignatura`, `carrera_asignatura` o `estudiante_asignatura`.
3. Sincronizar una instantánea completa del horario de una cuenta con una revisión
   global. Es una unidad pequeña y evita aplicar parcialmente un ramo, sus
   bloques o el semestre activo. No crear un motor genérico de sincronización.
4. Una revisión global puede producir conflicto aunque dos dispositivos hayan
   editado semestres distintos. Se acepta esta limitación para evitar fusiones
   silenciosas; se ofrece una resolución explícita con ambas versiones visibles.
5. Guardar sala y docente en cada bloque. El ramo contiene nombre, sigla y sección;
   nunca se propaga automáticamente una sala a los demás bloques.
6. La agenda por fecha muestra todas las actividades locales del día, incluidas
   las generales y las asociadas a semestres anteriores. Solo las clases cambian
   con el semestre activo. Copiar o mover es una acción adicional y explícita.
7. Reutilizar SQLCipher, SecureStore, Crypto, NetInfo, Supabase y las herramientas
   instaladas. No añadir dependencias ni cambiar las versiones declaradas.
8. Trabajar y verificar con Supabase local y cuentas sintéticas. Las migraciones
   remotas, despliegues, commits y push requieren autorización específica.

## 2. Base revisada

- `AgendaProvider` usa un almacén local compartido por dispositivo; en Android es
  `duocmind-agenda.db`, sin propietario ni cifrado, y en web una clave global de
  `localStorage`. No se puede deducir con seguridad quién creó cada actividad.
- `AgendaActivity` guarda fecha, título, nombre de ramo y hora inicial; su duración
  se calcula como una hora. Se conservará la compatibilidad de esos registros.
- La spec 011 ofrece inscripciones institucionales. Su gateway y copia no se
  usarán para elegir los ramos manuales de esta funcionalidad.
- `shared/events` ya usa SQLCipher por cuenta, transacciones, bloqueo durante
  borrado de cuenta y una generación de sesión para descartar respuestas tardías.
  Se seguirá ese patrón sin acoplar las operaciones de horario a los eventos.
- `app.json` ya configura `expo-sqlite` con `useSQLCipher: true`. Expo Go y la web
  no sirven para acreditar persistencia cifrada nativa.
- El inicio consume `SAMPLE_CURRENT_CLASS`, `SAMPLE_UPCOMING` y
  `SAMPLE_WEEK_INSIGHT`. La composición actual de agenda ya integra eventos
  institucionales y debe conservar sus garantías.
- La herramienta de pruebas de backend rechaza destinos que no sean loopback.
  Se conservará esa restricción para las pruebas nuevas.
- La base remota se inspeccionó solo mediante metadatos. `pgcrypto` está instalado
  en `extensions`; no se modificó el esquema ni se leyeron actividades personales.

## 3. Modelo y contratos de dominio

Los identificadores nuevos son UUID generados una sola vez en el dispositivo.
Las fechas usan `YYYY-MM-DD`, las horas `HH:mm` y los días ISO, lunes 1 a domingo 7.
Los campos opcionales se normalizan como `null`, no como cadenas vacías.

| Tipo | Campos de negocio |
| --- | --- |
| `Semester` | `id`, `name`, `startsOn?`, `endsOn?` |
| `ScheduleSubject` | `id`, `semesterId`, `name`, `code?`, `section?` |
| `WeeklyBlock` | `id`, `subjectId`, `weekday`, `startsAt`, `endsAt`, `room?`, `teacher?` |
| `ScheduleDocument` | `schema: 1`, `activeSemesterId?`, `semesters`, `subjects`, `blocks` |
| `PersonalActivity` | `id`, `kind`, `date`, `time`, `endTime?`, `title`, `subjectName?`, `semesterId?`, `semesterName?` |

`PersonalActivity.kind` distingue `exam`, `task` y `personal`. Se conserva la
compatibilidad con la duración anterior de una hora cuando no existe `endTime`.
El formulario permite guardar término explícito, posterior al inicio el mismo día.
`endTime` es un campo opcional del JSON local: no requiere esquema SQL ni migración
remota. El parser conserva los registros antiguos sin añadir o modificar campos.
Agenda, inicio, copia y traslado usan el intervalo guardado. Los textos
`subjectName` y `semesterName` son instantáneas para no perder contexto si se edita un ramo o se resuelve un conflicto de horario.
Elegir un ramo no obliga a asociar la actividad a un semestre.

Validaciones compartidas entre cliente y SQL: nombres de semestre hasta 80
caracteres, ramos y títulos hasta 120, sigla y sección hasta 40, sala hasta 120 y
docente hasta 160. Los textos se recortan y se rechazan controles; las fechas
deben existir, el inicio no puede superar el término y las horas son minutos
válidos entre 00:00 y 23:59, con inicio estrictamente anterior al término.
El formulario de actividades mantiene su máximo existente si es más restrictivo.

Las referencias deben existir dentro del documento, con UUID únicos y un único
semestre activo existente. Con semestres presentes debe existir uno activo;
crear el primero lo selecciona y los siguientes conservan la selección actual.
Se rechazan claves desconocidas, duplicados exactos de bloques y documentos
inválidos. Límites operativos: 50 semestres, 1.000 ramos, 10.000 bloques y 2 MiB
por documento; se comunican sin truncar ni descartar datos confirmados.

El solapamiento se calcula con intervalos semiabiertos `[inicio, término)` del
mismo día y semestre. La pantalla exige confirmar antes de conservar un cruce.
Los solapamientos son datos válidos en el servidor; los duplicados exactos no.

## 4. Base de datos y API de horario

### 4.1 Tablas nuevas

| Tabla | Columnas principales y restricciones |
| --- | --- |
| `public.personal_schedule` | `user_id` PK/FK a `auth.users` con borrado en cascada, `revision` entero no negativo, `active_semester_id` nullable y `updated_at` del servidor. |
| `public.schedule_semester` | `id` UUID, `user_id`, `name`, `starts_on`, `ends_on`; PK compuesta `(id, user_id)` y FK a la raíz del propietario. |
| `public.schedule_subject` | `id` UUID, `user_id`, `semester_id`, `name`, `code`, `section`; PK `(id, user_id)` y FK compuesta `(semester_id, user_id)`. |
| `public.schedule_block` | `id` UUID, `user_id`, `subject_id`, `weekday`, `starts_at`, `ends_at`, `room`, `teacher`; PK `(id, user_id)`, FK compuesta al ramo y unicidad de ramo/día/intervalo. |
| `schedule_private.schedule_request` | `(user_id, request_id)` PK, hash del contenido y revisión aplicada; sin títulos ni copias del horario, con FK a la raíz y borrado en cascada. |

La referencia del semestre activo es compuesta por identificador y propietario y
se comprueba al finalizar la transacción, para permitir crear el primer semestre
y activarlo en un único guardado. Las FKs de ramas y bloques evitan relaciones
entre cuentas; sus eliminaciones se aplican en orden de dependencias. Se indexan
propietario y referencias que no queden cubiertas por claves existentes.
No hay endpoint para eliminar semestres: una instantánea que omita un semestre
ya sincronizado se rechaza. Eliminar ramos y bloques sí es parte del contrato.

### 4.2 Lectura y escritura

- `load_personal_schedule()` devuelve `{ revision, document }` de la cuenta
  autenticada, o revisión 0 y documento vacío si aún no hay raíz. La lectura se
  hace en una única sentencia para mantener una instantánea consistente.
- `save_personal_schedule(expected_revision, request_id, document)` aplica el
  documento completo en una transacción. No acepta `user_id`: lo obtiene de
  `auth.uid()`, verifica que la cuenta y su perfil sigan habilitados, valida el
  contrato y bloquea la raíz de esa cuenta.
- Dos primeras escrituras concurrentes se serializan al crear/bloquear la raíz,
  usando su PK. El recibo de una operación ya aplicada se consulta antes de
  comparar revisión; reutilizar el UUID con otro contenido se rechaza.
- Si la revisión coincide, se actualizan semestres y ramos por identidad, se
  aplican altas/bajas de ramos y bloques, se comprueba la selección activa y se
  incrementa la revisión. El recibo se guarda en la misma transacción.
- Una revisión distinta devuelve conflicto y la versión remota consistente, sin
  modificar filas ni registrar la operación como aplicada. Los errores de
  validación tampoco dejan datos parciales.
- La respuesta de éxito incluye revisión aplicada y el `request_id`. Una
  retransmisión devuelve ese mismo recibo aunque el servidor ya tenga cambios
  posteriores; el cliente no confunde ese recibo con el estado remoto más nuevo.
- Los recibos usan SHA-256 del JSON normalizado y la revisión esperada; se
  conservan hasta eliminar la cuenta para admitir reintentos offline prolongados.
  Solo contienen identificadores, hash y revisión, sin contenido académico.

### 4.3 Permisos

Las cuatro tablas públicas habilitan RLS y lectura propia para `authenticated`:
`user_id = (select auth.uid())`. No hay acceso anónimo, escritura directa desde
el cliente ni lectura administrativa nueva. La lectura RPC usa `SECURITY INVOKER`.

Para permitir únicamente la transacción validada, la escritura se implementa en
una función `SECURITY DEFINER` del nuevo esquema no expuesto `schedule_private`,
con `search_path = ''`, SQL estático, tablas calificadas y predicados explícitos
de propietario en cada operación. Se justifica por la transacción de varias
tablas con escritura directa revocada, no para corregir un fallo de permisos.
La RPC pública es un wrapper `SECURITY INVOKER`. Se concede solo el uso del nuevo
esquema y la ejecución exacta necesaria; nunca acceso a sus tablas ni uso del
esquema administrativo `private` ya existente. Se revoca ejecución de `PUBLIC`
y `anon` en todas las funciones nuevas y de los auxiliares para `authenticated`.

La función privilegiada debe demostrar en pruebas que deriva el propietario de
la sesión, rechaza UUID de otras cuentas y no admite cambiar propietario,
revisión o datos de auditoría mediante el documento. El rol de funciones se
limita a lo necesario. Las políticas RLS de lectura no se presentan como sustituto
de estas comprobaciones de escritura.

## 5. Persistencia local y migración

### 5.1 Android

Crear `duocmind-planner-<userId>.db`, cifrada con SQLCipher, con clave aleatoria de
32 bytes guardada en SecureStore por cuenta. Validar el UUID antes de construir
nombres, comprobar SQLCipher y leer el esquema con la clave antes de modificar
una base existente. Si falta la clave o no abre una base previa, no generar una
base vacía encima ni informar guardado exitoso.

Tablas locales: estado de horario y sincronización, actividades, recibos de
operaciones locales e importaciones heredadas. Las transacciones exclusivas
guardan documento, borrador, revisión, operación en vuelo y conflictos de forma
atómica. Las mutaciones se serializan por cuenta para evitar actualizaciones
perdidas; al destruir la base se esperan/cancelan los trabajos según su fase.

### 5.2 Web de desarrollo

Una clave versionada por cuenta en `localStorage`, con documento completo y
validación estricta, admite recarga y dos clientes de prueba. Cada mutación toma
un bloqueo exclusivo de Web Locks por cuenta, relee la última versión y guarda
el documento en una sola operación. El bloqueo evita carreras entre pestañas;
los eventos de almacenamiento actualizan las otras vistas sin reemplazar sus
formularios abiertos. Si el navegador no ofrece Web Locks, no se habilitan
escrituras y se explica la limitación. Un fallo de cuota o acceso se comunica.
El modo web es solo para datos sintéticos; no acredita cifrado ni garantías
nativas.

### 5.3 Actividades y datos heredados

Las actividades nuevas usan UUID, tipo y asociación opcional. El servicio local
solo admite destinos que existan en el horario propio o `null` para generales.
Si un conflicto descarta un semestre creado solo localmente, las actividades
conservan su referencia y etiqueta como «Semestre no disponible» hasta que la
persona elija otro destino; nunca se pierden ni se envían al backend.

Mover/copiar usa un UUID de operación generado antes de confirmar, lista de
identidades de origen y versiones esperadas, destino y cambios de fecha
explícitos. Una sola transacción verifica los originales, aplica todo y guarda
el recibo. Copiar genera las nuevas identidades una sola vez; mover conserva las
actuales. Se rechaza destino idéntico, selección vacía o un origen cambiado; se
mantiene el formulario para revisarlo. Se permite mover o copiar a «Generales»
si cambia la asociación, con la misma confirmación.

La base Android heredada y la clave global web no se leen durante la carga normal
ni se eliminan automáticamente. Una acción explícita «Recuperar actividades de
este dispositivo» informa primero que carecen de propietario verificable y
pueden proceder de otra cuenta. Solo tras aceptar esa advertencia se muestra una
selección para recuperar. Confirmar importa lo elegido como actividades generales
de la cuenta actual, con tipo `personal`, una hora de duración y el ramo como
texto; el origen permanece intacto. Una huella del registro original evita
reimportar lo mismo en esa cuenta. Datos inválidos se señalan y no se reinterpretan.
No se afirma que esta recuperación pueda verificar la autoría de registros viejos.

## 6. Servicio y sincronización

El estado local conserva `baseRevision`, la última base confirmada, `working`,
una operación `inFlight` inmutable y, si existe, la instantánea remota en conflicto.
Ninguno de estos contratos incluye actividades ni sus recibos locales.

1. Capturar `{ userId, generation }`, comprobar el primer acceso válido y abrir
   solo el almacén propio. Sin sesión válida o caché inicial autorizada, no se
   abre el editor offline. Cargar el estado local antes de esperar a la red.
2. Cada cambio valida el documento y lo persiste como `working`; solo después
   se confirma «Guardado en este dispositivo». Cambiar la selección activa es
   una mutación del mismo documento y nunca una segunda escritura independiente.
3. Si no hay operación en vuelo ni conflicto, persistir una petición inmutable
   con UUID, revisión base y una copia de `working` antes de enviarla.
4. Un éxito reconoce exactamente esa petición. Si hubo nuevas ediciones durante
   el envío, conservarlas como `working` pendiente sobre la revisión reconocida;
   no sustituirlas por la respuesta. Primero se persiste el reconocimiento y
   después se limpia la petición en vuelo.
5. Un timeout conserva la petición y vuelve a enviarla con idéntico UUID y
   contenido. No se genera otra operación hasta resolver ese resultado incierto.
6. Descargar solo sustituye el documento si no hay cambios pendientes y la
   revisión no retrocede. Una versión remota nueva frente a un borrador conserva
   ambas y establece conflicto; una respuesta antigua nunca marca datos nuevos
   como sincronizados. Tras reconocer un recibo antiguo se consulta la versión
   actual antes de publicar el estado «Sincronizado».
7. El conflicto pausa las subidas automáticas, permite inspeccionar diferencias
   y elegir «Conservar mis cambios» o «Usar la versión de la cuenta». Antes de
   confirmar se muestra qué se conservará y qué se reemplazará. Se preservan
   siempre los semestres ya sincronizados: al conservar lo local se incorporan
   los semestres que solo existan en la versión remota y se informa en la revisión.
   Las actividades locales nunca se sustituyen por ninguna de las dos opciones.
8. Resolver genera una nueva petición contra la revisión remota observada. Si
   otro dispositivo vuelve a editar, se reabre el conflicto; no hay reintento que
   fuerce una sobrescritura sin revisión.
9. NetInfo, entrada en primer plano, enfoque de pantalla y un botón «Reintentar»
   disparan trabajo serializado. Con la app visible se consulta cada 60 s para
   detectar cambios de otro dispositivo; se detiene en segundo plano, sin sesión
   o sin conectividad. No se promete ejecución en segundo plano con la app cerrada.
10. Comprobar la generación antes y después de cada operación asíncrona. Cambiar
    de cuenta limpia la vista, cancela suscripciones y descarta respuestas tardías;
    una operación antigua nunca utiliza la sesión de la nueva cuenta al enviar.

Una caducidad o error de autorización no se presenta como un mero fallo de red:
la copia permanece protegida y se solicita renovar sesión cuando corresponda.
No se borra un borrador por un error de red, validación, cuota o servidor.

## 7. Organización y pantallas

La funcionalidad compartida vive en `src/shared/planner/`, porque agenda, inicio
y autenticación deben acceder a los mismos datos sin imports internos cruzados:

| Capa | Responsabilidades |
| --- | --- |
| `domain/` | Tipos y validación, intervalos, fechas civiles Santiago y proyecciones de clases/pendientes. |
| `application/` | Interfaces de persistencia, sesión y remoto; almacén transaccional, copia/traslado, recuperación y servicio de sincronización. |
| `infrastructure/` | SQLite/SecureStore y variante web, gateway RPC, sesión, ciclo de vida, contexto y hooks. |

El `PlannerProvider` compartido sustituye el proveedor de actividades en el layout
sin cambiar el `EventProvider`. No extraer la infraestructura de eventos por
comodidad ni crear un segundo cliente Supabase. Eliminar código antiguo solo
cuando no queden consumidores; conservar tests de compatibilidad necesarios.

- Agenda: selector con semestre activo visible, acceso «Gestionar semestres»,
  creación de semestre y edición de ramos/bloques. Consultar un semestre anterior
  tiene una indicación clara y un botón independiente «Usar este horario».
- Pantallas de gestión en `features/agenda/screens/` y componentes propios en
  `features/agenda/components/`; las rutas nuevas solo reexportan pantallas.
  Los formularios separan datos de ramo y lista de bloques con sala/docente por
  fila, y conservan valores si falla el guardado.
- Agenda diaria: incorporar tarjetas de clase con su intervalo real y salas
  independientes; mantener tarjetas de eventos y actividades y un orden estable
  por hora, tipo e identificador. La consulta de clases terminadas sigue disponible.
- Actividades: alta de pruebas/tareas en el semestre activo con ramo obligatorio;
  personales generales con ramo opcional. El formulario no ofrece organización
  ni otros semestres y conserva el contexto histórico al editar. La gestión de
  selección múltiple ofrece traslado/copia explícitos. Cambiar de horario activo
  conserva las actividades completas. La fecha solo cambia mediante edición
  visible. El estado informa «Solo en este dispositivo».
- Inicio: reemplazar los tres `SAMPLE_*` por una proyección compartida. Clase en
  curso usa intervalos semiabiertos y progreso/tiempo restante; si hay cruce se
  muestran varias clases. Se ofrece próxima clase de hoy o estado de día libre,
  sin inventar datos. Los próximos pendientes se ordenan por fecha y hora, con
  un máximo de tres y enlace a agenda. La sugerencia fija de carga semanal se
  elimina; puede omitirse cuando no hay una regla validada que la sustituya.
- Los estados de reloj se calculan en `America/Santiago` con `Intl`, sin depender
  del huso del dispositivo. Para ocurrencias semanales se usan fecha/día y minutos
  civiles, sin convertir la regla en una hora UTC fija. El reloj se inyecta en
  dominio y se actualiza cada minuto y al recuperar foco/primer plano.
- Etiquetas accesibles, texto ampliado, áreas táctiles de 44 px, `GotaLoader`,
  `ScalePress`, `Reveal` y tokens existentes; sin animaciones nuevas permanentes.

## 8. Privacidad, conservación y eliminación

| Riesgo | Medida y verificación |
| --- | --- |
| Una cuenta usa identidades de otra. | RLS, propietario derivado de sesión, FKs compuestas, sin escrituras directas; SQL con dos cuentas y llamadas manipuladas. |
| Un cliente altera revisión o elige otro propietario. | RPC con claves admitidas, revisión de servidor y transacción; pruebas de permisos y CAS. |
| Cambio de cuenta durante una descarga o un envío. | Generación, captura de sesión, cancelación y almacén por UUID; pruebas con promesas retrasadas. |
| Un fallo de red provoca pérdida o duplicación. | Persistencia previa, petición inmutable y recibo duradero; pruebas de timeout tras commit y reinicio. |
| Dos dispositivos sobrescriben datos. | Revisión global y conflicto explícito, incluido cambio de semestre activo; integración concurrente. |
| Actividades personales se incluyen en una subida. | Tipo remoto separado con lista cerrada de campos y serializador exclusivo de horario; prueba de inspección del payload. |
| La recuperación atribuye datos viejos a una persona. | Flujo manual con advertencia y selección, sin importación automática; prueba de cambio de cuenta y recuperación idempotente. |
| Un build carece de cifrado o se pierde la clave. | Verificación SQLCipher y fallo explícito sin reemplazar la base; recorrido Android y prueba de apertura con clave incorrecta. |

Finalidad: organización académica privada. Propietario: la cuenta autenticada.
Ubicación: tablas de horario en Supabase y base operativa cifrada del dispositivo;
actividades únicamente en esa base local. Conservación: semestres hasta eliminar
la cuenta; ramos/bloques hasta borrarlos o eliminar la cuenta; actividades hasta
eliminarlas en el dispositivo o eliminar la cuenta desde él; recibos hasta eliminar
su cuenta/base. No se añaden logs ni auditorías con contenidos académicos.

Cerrar sesión conserva la copia cifrada para futuros accesos de esa misma cuenta,
limpia la memoria y detiene sincronización. No borra cambios aún pendientes ni
confirma una subida que no ocurrió. Otro usuario no abre esa base ni su clave.

Eliminar cuenta bloquea primero el servicio y sus reintentos, espera escrituras
locales en curso y limpia la base y clave propias mediante `clearLocalData`. La
eliminación remota existente borra `auth.users`, cuya cascada elimina horarios y
recibos. Si falla la parte remota, se mantiene la sesión para reintentar y se
impide recrear o sincronizar el almacén borrado durante ese proceso. No se amplía
el acceso de la app a funciones administrativas ni se añade una clave privilegiada.

El borrado desde un dispositivo no puede destruir físicamente copias en otro
dispositivo desconectado. Ese otro cliente bloquea y limpia su copia cuando
detecta que la cuenta ya no existe; no se promete borrado remoto inmediato offline.
El almacén heredado sin propietario queda fuera del borrado automático de una
cuenta, para no destruir registros de origen desconocido.

## 9. Verificación y orden de trabajo

Las tareas concretas se redactan solo después de aprobar este plan. Su orden será:
dominio; migración/contratos remotos; persistencia local y traslados; sesión y
sincronización; pantallas de gestión; integración agenda/inicio; limpieza de
cuenta; regresión y validación Android. Cada cambio se verifica antes de marcarlo
completo y pasar al siguiente.

| Criterios | Evidencia prevista |
| --- | --- |
| CA-001, CA-002 | `plannerDomain.test.mjs`, SQL de estructura, RPC y formulario de semestres/ramos. |
| CA-003, CA-004, CA-005 | `weeklySchedule.test.mjs`: salas diferentes, edición independiente, fechas, solapamiento, límites y relojes Santiago con cambio de horario. Recorrido Android. |
| CA-006, CA-008 | Backend local: dos cuentas, FKs manipuladas, lectura RLS, escritura directa denegada, reintentos y dos clientes concurrentes sobre raíz/activación. |
| CA-007 | `plannerSync.test.mjs` con fallo antes y después del commit; persistencia y reinicio Android; recuperación desde un segundo cliente. |
| CA-009, CA-014 | `plannerProjection.test.mjs`, regresión de `agendaItems` y eventos; recorrido de inicio/agenda sin datos de muestra y con vacíos. |
| CA-010, CA-011 | `personalActivities.test.mjs` y almacén nativo: independencia, copia/traslado en lote, fallos atómicos y reintentos con identidades estables. |
| CA-012 | Prueba de gateway capturando peticiones: documento remoto sin actividades, tanto en guardados como traslados e importación. |
| CA-013 | `plannerSession.test.mjs`, recuperación heredada, eliminación de cuenta y pruebas de respuestas tardías/cambios de sesión. |
| CA-015 | Typecheck y suites declaradas, integración backend y registro manual Android. |

En `DuocMind/`: `npm run typecheck` y `npm test`; para herramientas,
`node --test tools/tests/*.test.mjs`. Añadir pruebas de backend dedicadas a horario
en `tools/tests/` y conectarlas al runner local existente; el runner conserva la
restricción loopback y usa fixtures sintéticas. No relajar tipos ni desactivar
regresiones de la spec 011: actualizar la integración reemplazada conservando
las pruebas de sus módulos todavía usados.

Antes de cerrar: aplicar la nueva migración al backend local, ejecutar consultas
de comprobación, revisar advisors de seguridad y rendimiento, probar permisos y
borrado, ejecutar regresión de eventos y validar accesibilidad y layout web.
Android requiere development build con SQLCipher: crear horario, reiniciar sin
red, editar y volver a reiniciar, reconectar, verificar el segundo cliente,
provocar un conflicto y probar salas independientes, cambio y eliminación de
cuenta. Registrar resultados reales en `verification.md`; si no hay Android
disponible, su tarea queda abierta y no se declara cerrada la spec.

## 10. Migración, compatibilidad y reversión

Crear la migración con el CLI fijado en `tools`, consultando primero su ayuda y
`migration new`; no inventar el timestamp. Iterar únicamente sobre la base local,
revisar permisos y generar una migración final reproducible. No cambiar
migraciones históricas ni aplicar nada al proyecto remoto durante estas tareas.

El cambio es aditivo respecto de los catálogos y eventos existentes. Probar tanto
el historial local completo como la instalación de las tablas nuevas. La app
informa si falta la migración y mantiene borradores locales, sin presentar ese
error como sincronización exitosa.

Antes de revertir una implementación con datos: conservar la base cifrada y su
clave, los borradores y la base heredada; no devolver automáticamente las
actividades propias al almacén global. Desactivar la integración nueva mantiene
las tablas remotas intactas. Una reversión de esquema solo se ensaya localmente,
en orden de dependencias, con exportación previa sintética y prueba de
restauración; eliminar datos remotos exigiría autorización explícita.

La versión anterior no entiende el almacén nuevo. Si se necesita volver a ella,
se comunica esa limitación y se conserva el material para reinstalar la versión
compatible. No hay conversión destructiva automática ni pérdida silenciosa de
datos confirmados.

## 11. Referencias y estado

Fuentes del proyecto: constitución 2.0.0, `AGENTS.md`, spec 013 aprobada, specs
009 y 011 y código revisado descrito arriba. Documentación primaria consultada
el 2026-10-18:

- [Supabase: funciones de base de datos](https://supabase.com/docs/guides/database/functions).
- [Supabase: RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).
- [Supabase: proteger la Data API](https://supabase.com/docs/guides/api/securing-your-api).
- [W3C: Web Locks](https://www.w3.org/TR/web-locks/), para serializar el almacenamiento web entre pestañas del mismo origen.
- [Índice de cambios de Supabase](https://supabase.com/changelog).
- [Cambios de PostgreSQL 15.19/17.11](https://supabase.com/changelog/postgres-15-19-17-11-breaking-changes): el plan usa hash SHA-256, sin los cifrados PGP heredados afectados ni extensiones de índices afectadas.
- [Cambios de TLS en las APIs](https://supabase.com/changelog/cbc-tls-ciphers-deprecated): verificar conexión en el build Android usado para las pruebas; no cambiar cifrados del proyecto.

El usuario aprobó este plan explícitamente el 2026-10-18. El siguiente paso es
redactar y aprobar `tasks.md`, conforme al orden de la constitución y de
`AGENTS.md`. Esta aprobación no acredita implementación ni verificaciones, ni
autoriza migraciones remotas, despliegues, commits o push.

## Ajuste de usabilidad solicitado el 2026-10-18

El usuario aclaró que necesita descubrir cómo registrar sus clases al entrar en
Agenda, sin tener que interpretar los accesos «Mis horarios» y «Mis actividades».
Dentro de RF-002/RF-003/RF-004 y las pantallas ya aprobadas, se presenta una tarjeta
«Tu horario de clases», con alta directa de un ramo nuevo o existente y uno o
varios bloques en un solo formulario. Si aún no hay semestre, el mismo guardado
crea el primero con nombre editable. La operación sigue usando la mutación
transaccional existente, confirma cruces y rechaza duplicados o una base obsoleta.
El enlace secundario permite editar horarios y semestres; las actividades se
encuentran en Pendientes y junto a las acciones del día. No cambian persistencia,
sincronización, permisos ni contratos. Se reabre T019 para verificar este ajuste;
T020 sigue pendiente. Esta solicitud autoriza el ajuste de presentación dentro
del incremento aprobado, sin ampliar requisitos funcionales.

## Ajuste del formulario de actividades solicitado el 2026-10-18

Conforme a la spec 0.1.2, el alta de pruebas/tareas obtiene el semestre activo de
la instantánea del planner y exige un ramo de ese semestre. Personal oculta organización, ofrece ramo opcional del activo o «Sin ramo» y se crea como general. Las reglas del formulario se
validan mediante funciones puras compartidas antes del guardado local existente;
el cambio de tipo limpia selecciones incompatibles. El editor conserva el
semestre y el nombre histórico de actividades académicas existentes, también si
el ramo fue eliminado. La edición de una personal copiada/movida conserva esa
asociación explícita, y el ramo sigue siendo opcional. No se modifica el parser de datos ya
guardados, la recuperación heredada, el traslado ni la sincronización. Se reabre
T019 para pruebas por tipo, cambio de activo y regresión de edición/traslado.
El usuario autorizó este refinamiento al pedir el cambio concreto; se mantiene
la arquitectura aprobada y no se requieren cambios de esquema ni dependencias.

## Ajuste de duración solicitado — 2026-10-18

Añadir `endTime` opcional a la actividad local y dos campos visibles de inicio/fin.
Validar ambos en persistencia y rechazar intervalos vacíos o invertidos. Mantener
el cálculo histórico de una hora para datos anteriores, incluidos cruces de
medianoche existentes; las altas nuevas son intervalos del mismo día. Verificar
reapertura, copia/traslado, límites exactos del estado y recorrido de interfaz.
No cambia el contrato remoto ni añade dependencias. T019 permanece abierta hasta
completar tipos, suite y regresiones de navegador.

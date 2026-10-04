# Spec 005 — Administración de Bienestar y Salud

| Campo | Valor |
| --- | --- |
| Versión | 0.2.0 |
| Estado | APROBADA |
| Fecha | 2026-10-04 |
| Incremento | 005-admin-dashboard |
| Constitución | 2.0.0 |
| Plataforma | Web administrativa independiente y backend Supabase |
| Aprobación anterior | La versión 0.1.0 fue aprobada el 2026-10-04. |
| Aprobación de esta revisión | Aprobada el 2026-10-04 |

## 1. Problema y propósito

Bienestar y Salud necesita consultar el registro de alumnos y administrar tests,
eventos y tips sin depender del panel técnico de Supabase. Actualmente no existe
un panel ni una tabla o modelo de autorización administrativa. Las cuentas de
Supabase Auth y los perfiles de `estudiante` no conceden por sí solos permisos
de funcionario; este incremento debe incorporar esa autorización.

El resultado esperado es una web para funcionarios autorizados, separada de la
app Android, dentro del mismo repositorio y conectada al backend Supabase de
DuocMind. Esta spec define la administración y la publicación de contenidos en el
backend. La integración de esos contenidos en Android corresponderá a una futura
spec, que no se redacta ni implementa en esta entrega.

## 2. Usuarios y alcance

Los funcionarios autorizados de Bienestar y Salud tendrán las mismas funciones.
Los alumnos conservan su acceso estudiantil existente y pueden completar la
recuperación de contraseña en una página web pública, sin permiso administrativo.

Incluido:

- Incorporación del modelo de autorización administrativa vinculado a Supabase
  Auth, inicio y cierre de sesión y comprobación de permisos en el backend.
- Consulta del registro de alumnos con búsqueda, paginación y filtros por carrera y sede.
- Envío de enlaces de recuperación y recorrido web para establecer una nueva contraseña.
- Consulta y activación de instrumentos validados y creación de cuestionarios propios versionados.
- Creación, edición, publicación y cancelación de eventos institucionales.
- Creación y administración de tips generales o con reglas por ánimo o versión/nivel de test.
- Publicación de contenidos y permisos de lectura comprobados en Supabase local.
- Verificación de compatibilidad con consultas y recorridos de la app Android existente.

Fuera de alcance:

- Descarga y presentación de contenidos nuevos en Android, ejecución de cuestionarios
  nuevos, selección privada de tips, almacenamiento offline y actualización de contenidos.
- Nuevos adaptadores Android, cambios a su gateway de recuperación, endpoint
  `get_wellness_content` y contrato público de snapshot.
- Acceso administrativo al historial emocional, resultados individuales, respuestas o derivaciones.
- Creación, modificación o eliminación de perfiles de alumnos desde el panel.
- Asignación de tests o tips a alumnos específicos y registro de consejos recibidos.
- Exportaciones, notificaciones automáticas, inscripción a eventos y paneles estadísticos.
- Persistencia nueva de resultados o respuestas de tests.
- Edición libre de instrumentos validados, código ejecutable configurable y diagnósticos.
- Despliegue, cambios remotos, creación de otro proyecto Supabase o transición a producción.

## 3. Requisitos funcionales

### RF-001 — Acceso y autorización

1. El funcionario DEBE poder iniciar y cerrar sesión con una cuenta autorizada.
2. El backend DEBE comprobar permisos y vigencia de sesión en cada operación
   administrativa, incluso mediante llamadas directas a la API.
3. Se DEBE incorporar un registro protegido de funcionarios vinculado a
   `auth.users.id`, con autorización deshabilitada por defecto. Auth gestiona las
   credenciales; no se duplica el almacén de contraseñas ni se exige perfil de alumno.
4. Un operador autorizado DEBE habilitar al primer funcionario y revocar permisos
   mediante operaciones de servidor fuera del panel. La revocación bloquea la
   siguiente operación administrativa, aunque el navegador mantenga su sesión.
5. El registro normal de alumnos NO DEBE asignar permisos administrativos. Ni
   cambios de perfil ni metadatos editables pueden concederlos.
6. Un estudiante sin autorización o cualquier otra cuenta no autorizada NO DEBE
   consultar registros ajenos ni realizar operaciones administrativas.

### RF-002 — Registro de alumnos

1. El panel DEBE listar alumnos con paginación, búsqueda por nombre o correo y
   filtros por carrera y sede.
2. La API y el panel DEBEN limitarse a nombre, correo vigente de Auth, carrera,
   sede y el identificador interno necesario para seleccionar el registro.
3. La búsqueda por correo DEBE usar el correo vigente de la cuenta Auth vinculada;
   el correo almacenado en el perfil no lo sustituye.
4. Si falta la cuenta vinculada o un correo recuperable, se DEBE devolver
   `email: null` y deshabilitar la recuperación. Carrera o sede ausentes no se inventan.
5. El listado NO DEBE exponer RUT, teléfonos, historial emocional ni resultados individuales.

### RF-003 — Recuperación de contraseña en web

1. El funcionario DEBE poder solicitar un enlace para la cuenta seleccionada.
   El servidor resuelve nuevamente el correo desde Auth al enviar; no acepta un
   destinatario ni una URL de recuperación proporcionados por el navegador.
2. El alumno DEBE poder abrir el enlace y establecer una nueva contraseña en una
   página web pública, con manejo de enlace inválido, vencido o utilizado.
3. El funcionario NO DEBE conocer, consultar ni establecer la contraseña del alumno.
4. El flujo DEBE limitar solicitudes y distinguir envío aceptado, envío incierto
   y contraseña efectivamente cambiada, sin exponer el enlace o token al funcionario.
5. La recuperación DEBE funcionar sin alterar la sesión del funcionario. Esta
   revisión no modifica el recorrido de recuperación existente de Android.

### RF-004 — Tests, versiones y publicación

1. El panel DEBE consultar el catálogo, versiones y estados de publicación y activación.
2. El funcionario DEBE crear cuestionarios propios con título, descripción,
   preguntas, opciones, puntajes y niveles de resultado. El cálculo usa suma
   de puntajes; no admite código configurable.
3. Los cuestionarios propios DEBEN admitir edición de borrador y vista previa.
   Publicar exige validar preguntas, opciones y rangos completos sin huecos ni solapamientos.
4. Publicar DEBE congelar preguntas, opciones, puntajes, rangos, textos e identidad
   de la versión, estableciendo su estado y fecha de publicación. No se permite
   devolver una versión publicada a borrador.
5. Publicar NO DEBE activar automáticamente ni sustituir la versión activa anterior.
   Activar una versión publicada DEBE desactivar la anterior del catálogo en una
   transacción; un borrador no puede activarse. Después de publicar solo se admite
   cambiar `is_active` e incrementar `revision` atómicamente.
6. Los cambios de contenido publicado DEBEN generar un nuevo borrador por clonación
   y una nueva versión, conservando versiones y referencias anteriores.
7. Los textos, escalas, puntajes y reglas de seguridad de instrumentos validados
   DEBEN permanecer protegidos conforme a la Spec 003; el panel solo consulta y
   controla disponibilidad.
8. «Enviar tests» significa publicarlos y habilitarlos en el catálogo del backend.
   El panel DEBE confirmar esos estados sin afirmar que Android o un alumno ya los recibió.

### RF-005 — Eventos institucionales

1. El funcionario DEBE crear y editar ferias, talleres y actividades con título,
   descripción, lugar, inicio y término. El término no puede ser anterior al inicio.
2. Los eventos DEBEN admitir borrador, publicación y cancelación. La interfaz y
   la base de datos deben reflejar el estado confirmado.
3. Cancelar un evento publicado DEBE conservar su contenido y publicación previa.
   No se exige mostrarlo en Android en esta spec.
4. Los eventos se dirigen al conjunto de alumnos, sin segmentación ni inscripción
   académica y sin pertenecer a un alumno específico.

### RF-006 — Tips y configuración de reglas

1. El funcionario DEBE crear y editar tips con título y contenido, gestionar
   borradores, publicar y activar o desactivar el contenido.
2. Un tip DEBE ser general o tener reglas por uno o varios ánimos o por niveles
   de resultado de una versión concreta de un test. Sus reglas son alternativas OR.
3. Las reglas DEBEN distinguir ánimo y resultado; las de resultado identifican
   catálogo, versión y nivel publicados, incluso si esa versión está inactiva.
4. El backend DEBE guardar contenido y relaciones de forma consistente y rechazar
   referencias inexistentes, no publicadas o incoherentes.
5. El panel y sus contratos NO DEBEN recibir ánimo personal, resultados individuales,
   destinatarios ni información sobre qué alumno recibió un tip. No se guardan
   asociaciones alumno–tip ni métricas de coincidencias.
6. Los tips DEBEN ofrecer orientación de bienestar no diagnóstica en español claro.
   La selección, deduplicación y presentación personalizadas en Android quedan
   para la futura spec de integración.

## 4. Backend, privacidad y calidad

- Se propone `admin-web/` en la raíz del repositorio, con React y TypeScript estricto.
  Las herramientas y contratos administrativos concretos se detallan en el plan.
- Se separan presentación, reglas de negocio e infraestructura. Las pantallas
  no consultan directamente tablas personales de Supabase.
- Se incorpora autorización administrativa y un modelo de eventos institucionales
  separado de `evento_academico`. Para tips se aprovechan `material_apoyo`,
  `material_emocion` y `material_test`, incorporando publicación.
- RLS y grants DEBEN impedir lecturas de borradores por alumnos y cuentas públicas,
  también mediante tablas hijas. No se amplía el acceso directo a datos personales.
- Los clientes usan configuración publicable; secretos, contraseñas y tokens
  administrativos NO se incluyen en bundles, repositorio ni logs.
- Peticiones de idempotencia y contadores operativos vencen a las 24 horas y dejan
  de usarse. Una limpieza cada cinco minutos elimina vencidos sin depender del panel;
  en operación normal la eliminación física ocurre antes de 24 horas y cinco minutos.
  Un fallo mantiene el vencimiento y la siguiente ejecución satisfactoria limpia
  el atraso. Preparación, verificación y recuperación se limitan a Supabase local.
- El panel requiere conexión y presenta carga, vacío, error, acceso denegado,
  pérdida de conexión y conflicto; conserva formularios ante errores y no confirma
  escrituras fallidas. Las interfaces DEBEN ser accesibles.
- Solo se usan cuentas y datos sintéticos. La compatibilidad conserva consultas,
  contenidos y recorridos existentes de Android; no implementa funciones nuevas
  ni acredita las verificaciones pendientes de otras specs.

## 5. Criterios de aceptación y comprobación

| Criterio | Resultado observable | Comprobación prevista |
| --- | --- | --- |
| CA-001 | Un funcionario habilitado accede sin perfil de alumno; el operador habilita el primero y revoca su acceso. Cuentas sin autorización no ejecutan operaciones administrativas. | Web, SQL y API con cuentas sintéticas, autoasignación, fila ausente/deshabilitada y revocación con sesión abierta. |
| CA-002 | Listado, búsqueda y filtros usan solo datos aprobados y correo de Auth; perfiles incompletos y cuentas desvinculadas se presentan correctamente. | Consultas e interfaz con correo de perfil/Auth distintos, `email: null` y respuestas mínimas. |
| CA-003 | Se envía recuperación a la cuenta seleccionada y el alumno cambia su contraseña en web sin exponerla al funcionario. | Buzón local, destinatario resuelto en servidor, enlace inválido/vencido/usado, límites y sesión separada. |
| CA-004 | Cuestionarios propios admiten vista previa, publicación inmutable, activación separada y clonación; las versiones anteriores se conservan. | SQL, API y web con rangos inválidos, publicación sin activación, sustitución atómica y conflictos. |
| CA-005 | Instrumentos validados permiten consulta y disponibilidad; su contenido y reglas siguen protegidos. | Intentos de modificación desde API/SQL y comparación con manifiesto existente. |
| CA-006 | Alumnos y cuentas públicas no leen borradores de tests, eventos ni tips, incluidos sus datos relacionados. | SELECT y joins directos con varias cuentas sintéticas y sin sesión. |
| CA-007 | Eventos se crean, editan, publican y cancelan en el panel y backend; se rechazan fechas incoherentes. | Recorridos web y consultas locales de estados, fechas y revisiones, sin exigir presentación Android. |
| CA-008 | Tips generales o con reglas por ánimo/version/nivel se guardan, publican y desactivan correctamente; las referencias históricas publicadas se conservan. | SQL, API y editor web con múltiples reglas, versión inactiva, FK inválida y conflicto. |
| CA-009 | Contratos, tablas operativas y logs administrativos no contienen contexto emocional individual, resultados ni asignaciones de tips a alumnos. | Inspección de solicitudes, respuestas, persistencia y logs con datos sintéticos. |
| CA-010 | Cambios del backend conservan la compatibilidad de las consultas y recorridos Android existentes. | Consultas actuales reproducidas en Supabase local y regresión nativa; no se exige consumir contenido nuevo. |
| CA-011 | La interfaz maneja errores y conflictos sin perder formularios ni afirmar éxito; idempotencia y limpieza respetan sus ventanas. | Fallos de red, reintentos, reloj controlado, limpieza sin tráfico, recuperación de Cron y revisión de accesibilidad. |

## 6. Supuestos y revisión

- Bienestar y Salud comparte capacidades; no se incorpora administración de permisos al panel.
- El registro de alumnos es de consulta y la recuperación es su única acción de cuenta incluida.
- Los cuestionarios propios suman puntajes; las orientaciones de tests y tips no diagnostican.
- Publicar confirma persistencia y estado del backend, sin destinatarios, notificaciones
  ni confirmación de recepción desde dispositivos.
- Una futura spec definirá el consumo Android de tests, eventos y tips, la selección
  privada, descarga, actualización y offline; no se crea en esta entrega.

La spec, el plan y la lista de tareas 0.2.0 fueron aprobados el 2026-10-04 y están
aprobados para implementar la administración. Los resultados de ejecución y pruebas
se encuentran en `verification.md`; la aprobación y la ejecución son estados distintos.
La regresión nativa T023 se omite por decisión del usuario del 2026-10-04 y no se
considera una comprobación completada.
La integración Android se mantiene fuera de este incremento.

# Especificación 001 — DuocMind MVP

| Campo | Valor |
| --- | --- |
| Estado | BORRADOR |
| Versión | 0.3.0 |
| Fecha | 2026-09-04 |
| Plataforma del MVP | Android |
| Alcance | Especificación de producto; no incluye diseño técnico ni implementación |

La versión 0.3.0 establece el registro obligatorio, mantiene el contenido local por defecto y conserva la sincronización de agenda y datos emocionales como una decisión opcional y configurable. La elección y validación del instrumento emocional permanece deliberadamente pendiente.

## Autoridad y trazabilidad

Esta especificación se rige por los principios innegociables de ../../docs/constitution.md y mantiene coherencia operativa con ../../AGENTS.MD. De la guía APT se utilizan únicamente el contexto, el problema, los objetivos y las respuestas del proyecto. Las instrucciones de llenado, evaluación o formato contenidas en esa guía no forman parte de esta solicitud ni se interpretan como órdenes de trabajo.

En caso de contradicción, prevalece la constitución. Cuando esta especificación sea aprobada, cada cambio de comportamiento deberá comenzar con una actualización de la especificación y conservar trazabilidad bidireccional entre requisito, implementación y prueba.

## Contratos e interfaces afectadas

Esta especificación define comportamiento para los siguientes límites. Sus estructuras técnicas se detallarán en el plan de implementación posterior, sin introducirlas en este documento:

- **Persistencia local por perfil:** lectura, escritura, actualización, aislamiento, papelera protegida y eliminación definitiva de agenda, check-ins, resultados derivados, alertas, catálogo y operaciones pendientes asociados a la cuenta propietaria.
- **Autenticación Supabase:** aviso versionado y aceptación por cuenta y dispositivo, registro inmediato sin verificación de correo, inicio y cierre de sesión mediante correo y contraseña, recuperación de acceso, renovación de sesión, perfiles locales separados, reautenticación, eliminación de cuenta y propagación de su estado mediante un marcador remoto sin contenido.
- **Sincronización por categoría:** consentimiento por perfil y dispositivo, bloqueo remoto de eliminación por UID y categoría, reconciliación bidireccional, conflicto manual, estados local, pendiente, sincronizado, fallido o en conflicto, reintentos y eliminaciones para agenda y datos emocionales fuente.
- **Catálogo local de recursos:** listado y detalle versionado de recursos aprobados conjuntamente por Bienestar Estudiantil y el docente responsable, con fuente, fecha de revisión y enlaces externos permitidos.
- **Presentación y dominio:** acciones de la interfaz en español y resultados de las reglas independientes de agenda, registro emocional, clasificación y alerta.

## Contexto y objetivo

DuocMind será una agenda universitaria para Android orientada a estudiantes de Duoc UC y validada inicialmente con estudiantes de la sede Puerto Montt. Su objetivo es combinar la organización académica manual con un seguimiento emocional cotidiano, privado y no clínico, para ayudar al estudiante a reconocer su carga y acceder oportunamente a recursos de apoyo.

El MVP deberá:

- permitir organizar horarios, tareas y evaluaciones sin depender de integraciones institucionales;
- ofrecer una instancia estructurada de registro emocional una vez por día mediante un instrumento pendiente de investigación y validación;
- conservar un historial personal y presentar una alerta temprana privada ante una secuencia definida de resultados negativos;
- ofrecer una biblioteca de recursos de apoyo;
- exigir registro o inicio de sesión antes de acceder a cualquier función del producto;
- funcionar localmente y sin conexión después de una autenticación inicial satisfactoria;
- conservar localmente el contenido por defecto y permitir sincronizar, de manera separada y voluntaria, la agenda y los registros emocionales.

DuocMind no realizará diagnósticos, no reemplazará atención profesional ni servicios de emergencia y no contactará automáticamente a terceros.

La validación inicial con estudiantes utilizará exclusivamente escenarios y datos sintéticos. No se solicitarán ni conservarán experiencias emocionales reales durante esta etapa.

## Usuarios

### Usuario principal

Estudiante de Duoc UC que necesita organizar sus compromisos académicos y observar su bienestar emocional. La validación inicial se realizará con estudiantes de la sede Puerto Montt, sin restringir técnicamente el uso de la aplicación a esa sede.

### Modalidades de uso

- **Perfil autenticado con contenido local:** después de registrarse o iniciar sesión, usa el núcleo del MVP con ambas categorías de sincronización desactivadas. Solo los datos indispensables de cuenta y autenticación se tratan remotamente; la agenda y los datos emocionales permanecen en el dispositivo.
- **Perfil autenticado con sincronización opcional:** decide, por separado en cada perfil y dispositivo, si sincroniza la agenda, los registros emocionales fuente, ambas categorías o ninguna.

Una instalación podrá conservar varios perfiles locales aislados, cada uno ligado a una cuenta, pero solo uno permanecerá activo. Cambiar de perfil exigirá conexión e inicio de sesión. El MVP confiará en el bloqueo del dispositivo Android y no incorporará PIN ni biometría propios. No existirán roles de docente, administrador, familiar, profesional de salud o personal institucional dentro de la aplicación.

## Historias de usuario

- **HU-01:** Como estudiante, quiero conocer qué datos de autenticación son obligatorios, aceptar su tratamiento y registrarme para acceder inmediatamente a DuocMind.
- **HU-02:** Como estudiante, quiero registrar manualmente mis horarios, tareas y evaluaciones, para visualizar mis compromisos académicos.
- **HU-03:** Como estudiante, quiero aceptar un aviso de privacidad claro y completar un registro emocional estructurado una vez al día, para observar cómo me encuentro sin usar una herramienta diagnóstica.
- **HU-04:** Como estudiante, quiero consultar mi historial y corregir el registro del día, para mantener información personal fiel a mi experiencia.
- **HU-05:** Como estudiante, quiero recibir incluso sin conexión una alerta privada después de tres días negativos consecutivos, mantenerla hasta confirmarla y conocer su causa y recursos de apoyo.
- **HU-06:** Como estudiante autenticado previamente, quiero consultar una biblioteca básica de recursos incluso sin conexión, para contar con orientación cuando la necesite.
- **HU-07:** Como estudiante, quiero iniciar sesión, recuperar el acceso y cambiar entre perfiles aislados, para volver a mis datos sin mezclarlos con los de otra cuenta.
- **HU-08:** Como estudiante, quiero autorizar o revocar por perfil y dispositivo la sincronización académica y emocional, para controlar qué contenido sale del dispositivo sin renunciar a usar la aplicación.
- **HU-09:** Como estudiante, quiero que los errores de acceso y los estados locales, pendientes o remotos sean claros y recuperables, para no perder información ni creer que algo se sincronizó cuando no fue así.
- **HU-10:** Como estudiante, quiero recuperar elementos eliminados durante siete días y eliminar íntegramente mi cuenta y perfil, para corregir errores y conservar el control final de mis datos.

## Convención de criterios de aceptación

Los criterios funcionales utilizan notación EARS en español:

- **Evento:** CUANDO ocurre un evento, EL SISTEMA DEBERÁ responder de una forma observable.
- **Estado:** MIENTRAS se mantiene una condición, EL SISTEMA DEBERÁ conservar un comportamiento.
- **Comportamiento no deseado:** SI ocurre un error o una condición excepcional, ENTONCES EL SISTEMA DEBERÁ responder de una forma segura y verificable.
- **Permanente:** EL SISTEMA DEBERÁ mantener una condición en todos los estados aplicables.

## Requisitos funcionales

Salvo los recorridos de acceso, recuperación y gestión restringida de perfiles bloqueados o en eliminación definidos en RF-01, RF-02, RF-13 y RF-14, las funciones del MVP solo estarán disponibles para el perfil activo de una cuenta registrada o autenticada previamente.

### RF-01 — Acceso obligatorio y aviso de cuenta

La aplicación deberá exigir una cuenta antes de permitir cualquier función del producto y distinguir los datos indispensables de autenticación del contenido cuya sincronización será opcional.

- **CA-RF-01.1:** CUANDO no exista un perfil activo, EL SISTEMA DEBERÁ mostrar únicamente el onboarding, el registro, el inicio de sesión, la recuperación de acceso y, cuando corresponda, la cancelación de una eliminación programada o la eliminación local de un perfil bloqueado por una baja externa.
- **CA-RF-01.2:** CUANDO el estudiante intente por primera vez en un dispositivo una operación remota de cuenta —registro, inicio de sesión, recuperación o reautenticación—, EL SISTEMA DEBERÁ mostrar antes de transmitir datos un aviso versionado que identifique el correo, la contraseña tratada por Supabase, el UID, la sesión y los metadatos mínimos de seguridad y cumplimiento como datos obligatorios, y solicitar aceptación explícita.
- **CA-RF-01.3:** SI el estudiante rechaza o abandona el aviso inicial, ENTONCES EL SISTEMA DEBERÁ impedir la transmisión y mantener bloqueadas la agenda, el módulo emocional, el historial, las alertas, la papelera y la biblioteca.
- **CA-RF-01.4:** MIENTRAS no exista un perfil registrado o autenticado previamente, EL SISTEMA DEBERÁ impedir el acceso a todas las funciones del producto, incluida la biblioteca.
- **CA-RF-01.5:** SI el primer acceso ocurre sin conexión o Supabase no está disponible, ENTONCES EL SISTEMA DEBERÁ conservar los campos no secretos y la contraseña solo en memoria mientras la pantalla permanezca activa, explicar que el registro o inicio de sesión requiere conexión y no ofrecer un modo invitado.
- **CA-RF-01.6:** CUANDO cambie materialmente el aviso de cuenta, EL SISTEMA DEBERÁ solicitar la aceptación de su nueva versión antes de una nueva operación remota de cuenta o de sincronización de contenido.
- **CA-RF-01.7:** SI un estudiante ya autenticado rechaza una nueva versión material del aviso, ENTONCES EL SISTEMA DEBERÁ conservar su acceso al contenido local y suspender el inicio de nuevas sesiones de uso y toda sincronización hasta que la acepte; para restablecer credenciales, eliminar la cuenta o cancelar una eliminación programada, deberá mostrar y obtener aceptación de un aviso específico limitado a los datos indispensables de esa operación, sin aceptar por ello el aviso general nuevo ni abrir una sesión funcional.
- **CA-RF-01.8:** CUANDO Supabase confirme un UID después de una aceptación vigente, EL SISTEMA DEBERÁ asociar la versión, decisión, instante y dispositivo de esa aceptación al perfil confirmado; si no se confirma una identidad, no deberá atribuirla a ningún perfil.

### RF-02 — Registro, sesión y perfiles locales

La aplicación deberá permitir registrar y usar inmediatamente una cuenta mediante correo y contraseña, sin verificación de correo, además de iniciar sesión, recuperar acceso, cerrar sesión y mantener perfiles locales aislados.

- **CA-RF-02.1:** CUANDO el estudiante acepte el aviso de RF-01 y envíe un correo y una contraseña válidos, EL SISTEMA DEBERÁ solicitar a Supabase la creación de la cuenta sin recopilar un nombre ni otros datos de perfil.
- **CA-RF-02.2:** CUANDO Supabase confirme la cuenta y entregue una sesión, EL SISTEMA DEBERÁ crear o activar el perfil local correspondiente y permitir usar inmediatamente la aplicación sin exigir verificación de correo, sin presentar por ello la propiedad del correo como verificada.
- **CA-RF-02.3:** CUANDO el estudiante haya aceptado en ese dispositivo el aviso vigente e inicie sesión en línea con una cuenta existente, EL SISTEMA DEBERÁ activar exclusivamente el perfil local ligado al UID confirmado o crear uno vacío si ese dispositivo todavía no lo posee.
- **CA-RF-02.4:** CUANDO el estudiante solicite restablecer su contraseña, EL SISTEMA DEBERÁ exigir la aceptación del aviso vigente antes de transmitir el correo, salvo que un perfil autenticado previamente use la excepción mínima de CA-RF-01.7, y no deberá exponer la existencia de la cuenta ni activar una sesión funcional durante ese recorrido.
- **CA-RF-02.5:** SI el registro, inicio de sesión o recuperación falla, se cancela o vence, ENTONCES EL SISTEMA DEBERÁ conservar los campos no secretos y la contraseña solo en memoria mientras la pantalla permanezca activa, mostrar un error genérico en español y mantener el portón de RF-01 cuando no exista otro perfil activo.
- **CA-RF-02.6:** MIENTRAS una instalación conserve varios perfiles, EL SISTEMA DEBERÁ asociar cada conjunto local a un único UID, mantener solo uno activo e impedir que un perfil lea, modifique, derive o sincronice datos de otro.
- **CA-RF-02.7:** CUANDO el estudiante cierre sesión, EL SISTEMA DEBERÁ bloquear inmediatamente el perfil activo, pausar su sincronización, conservar protegidos sus datos y volver al portón de acceso sin enviarlos a la papelera.
- **CA-RF-02.8:** CUANDO el estudiante cambie de cuenta, EL SISTEMA DEBERÁ exigir conexión y credenciales, cerrar el acceso al perfil anterior y abrir únicamente el perfil de la cuenta confirmada, sin fusionar ni transferir datos.
- **CA-RF-02.9:** CUANDO una cuenta vuelva a entrar en el mismo dispositivo con el aviso vigente aceptado y sin una eliminación programada, EL SISTEMA DEBERÁ restaurar las autorizaciones conservadas para ese perfil y reanudar automáticamente solo las categorías previamente autorizadas; esta reanudación se deberá a ese consentimiento anterior, no al inicio de sesión por sí solo.
- **CA-RF-02.10:** SI Supabase confirma que la cuenta activa fue eliminada o deshabilitada externamente, ENTONCES EL SISTEMA DEBERÁ bloquear su perfil, detener su sincronización y ofrecer recuperación o eliminación exclusivamente local según RF-13.

### RF-03 — Autorización independiente de sincronización

La aplicación deberá administrar por separado, para cada perfil y dispositivo, el consentimiento para sincronizar la agenda y los datos emocionales fuente.

- **CA-RF-03.1:** CUANDO una cuenta cree por primera vez un perfil en un dispositivo, EL SISTEMA DEBERÁ presentar desactivadas las autorizaciones de agenda y datos emocionales, aunque la cuenta las haya autorizado en otro dispositivo.
- **CA-RF-03.2:** CUANDO el estudiante active o reactive una categoría, EL SISTEMA DEBERÁ explicar que la autorización incluirá el envío de datos locales existentes y futuros y la descarga de datos remotos de esa categoría, y solicitar una confirmación explícita.
- **CA-RF-03.3:** MIENTRAS una categoría permanezca desactivada, EL SISTEMA DEBERÁ impedir que su contenido ingrese a la cola de sincronización, sea enviado o sea descargado; una eliminación remota autorizada bajo RF-13 seguirá siendo una operación de privacidad independiente.
- **CA-RF-03.4:** SI el estudiante autoriza solo una categoría, ENTONCES EL SISTEMA DEBERÁ sincronizar exclusivamente esa categoría y conservar la otra únicamente de forma local.
- **CA-RF-03.5:** CUANDO el estudiante confirme la activación o reactivación de una categoría, EL SISTEMA DEBERÁ incluir en la reconciliación sus datos locales existentes y sus cambios futuros, incluidos los creados mientras estuvo desactivada.
- **CA-RF-03.6:** MIENTRAS la agenda esté autorizada, EL SISTEMA DEBERÁ limitar su contenido sincronizable a horarios, tareas, evaluaciones y sus estados de eliminación.
- **CA-RF-03.7:** MIENTRAS los datos emocionales estén autorizados, EL SISTEMA DEBERÁ limitar su contenido sincronizable a las respuestas fuente, la fecha local, el instante UTC, la zona horaria y la versión del instrumento.
- **CA-RF-03.8:** MIENTRAS un perfil esté activo, EL SISTEMA DEBERÁ mantener sus resultados, clasificaciones, secuencias, alertas e historial únicamente en ese perfil y derivarlos de sus datos fuente.
- **CA-RF-03.9:** MIENTRAS una categoría esté autorizada, EL SISTEMA DEBERÁ limitar los metadatos técnicos auxiliares a identificadores opacos de cuenta, entidad y operación, categoría, acción, versión, estado e idempotencia necesarios para autorizar, correlacionar y confirmar la transferencia, sin incorporar resultados emocionales derivados.
- **CA-RF-03.10:** MIENTRAS ambas categorías estén desactivadas, EL SISTEMA DEBERÁ mantener disponibles todas las funciones del perfil y no transmitir contenido académico ni emocional; solo podrá tratar datos indispensables de cuenta, sesión, seguridad y cumplimiento, además de estados de consentimiento o solicitudes de privacidad iniciadas explícitamente por el estudiante.

### RF-04 — Gestión manual de la agenda

La aplicación deberá permitir crear, consultar, editar y eliminar manualmente horarios, tareas y evaluaciones.

- **CA-RF-04.1:** CUANDO el estudiante seleccione crear un elemento, EL SISTEMA DEBERÁ permitir elegir entre horario, tarea y evaluación y solicitar los campos obligatorios correspondientes.
- **CA-RF-04.2:** CUANDO el estudiante confirme un elemento que cumpla RF-05, EL SISTEMA DEBERÁ guardarlo localmente y mostrar el horario en el día semanal elegido o la tarea o evaluación según su fecha y hora.
- **CA-RF-04.3:** CUANDO el estudiante edite un elemento existente y confirme datos válidos, EL SISTEMA DEBERÁ actualizar ese mismo elemento sin crear una copia.
- **CA-RF-04.4:** SI el estudiante solicita eliminar un elemento, ENTONCES EL SISTEMA DEBERÁ pedir confirmación y trasladarlo a la papelera protegida definida en RF-13.
- **CA-RF-04.5:** SI el estudiante confirma más de una vez la misma creación o edición antes de recibir respuesta, ENTONCES EL SISTEMA DEBERÁ producir una sola operación y un solo elemento.

Los campos mínimos serán: título y tipo para todo elemento; día de la semana, hora de inicio y hora de término para un horario; fecha y hora de vencimiento para una tarea; y fecha y hora para una evaluación. La asignatura será opcional. Un horario representará un bloque semanal recurrente, sin rango de vigencia, y seguirá activo hasta que el estudiante lo edite o elimine.

### RF-05 — Validación de elementos académicos

La aplicación deberá validar campos obligatorios y fechas, rechazar rangos inválidos y advertir duplicados o solapamientos.

- **CA-RF-05.1:** SI falta un campo obligatorio o una fecha u hora no es válida, ENTONCES EL SISTEMA DEBERÁ impedir el guardado, identificar el campo y conservar el contenido ya ingresado.
- **CA-RF-05.2:** SI la hora de término de un horario no es posterior a su hora de inicio, ENTONCES EL SISTEMA DEBERÁ rechazar el rango y explicar el error en español.
- **CA-RF-05.3:** SI al crear o editar un elemento su tipo, título y campos temporales coinciden con otro elemento activo, ENTONCES EL SISTEMA DEBERÁ advertir el duplicado y evitar una segunda copia hasta que el estudiante modifique o cancele la operación.
- **CA-RF-05.4:** SI al crear o editar un horario este comparte día de la semana y parte de su intervalo con otro horario activo, sin compararse consigo mismo y sin ser un duplicado exacto, ENTONCES EL SISTEMA DEBERÁ advertir el conflicto y permitir guardarlo únicamente después de una confirmación explícita.
- **CA-RF-05.5:** SI un horario termina en una fecha local distinta de aquella en que comienza, ENTONCES EL SISTEMA DEBERÁ rechazarlo como bloque nocturno no admitido en el MVP.

### RF-06 — Registro emocional diario estructurado

La aplicación deberá permitir un único check-in por fecha local mediante un instrumento estructurado, no diagnóstico y pendiente de investigación, sin fijar todavía sus preguntas, dimensiones, escala, puntuación o interpretación.

- **CA-RF-06.1:** CUANDO el estudiante intente acceder por primera vez al check-in, EL SISTEMA DEBERÁ explicar su propósito no clínico, el almacenamiento local predeterminado, la sincronización opcional y la eliminación de datos, y solicitar aceptación.
- **CA-RF-06.2:** SI el estudiante no acepta el aviso, ENTONCES EL SISTEMA DEBERÁ mantener desactivado el módulo emocional y conservar disponibles la agenda y la biblioteca.
- **CA-RF-06.3:** CUANDO el aviso esté aceptado y no exista un check-in para la fecha local actual, EL SISTEMA DEBERÁ presentar el instrumento aprobado mediante controles con opciones predefinidas y sin campos de texto libre.
- **CA-RF-06.4:** MIENTRAS falte una respuesta obligatoria del instrumento aprobado, EL SISTEMA DEBERÁ identificarla y no guardar el check-in ni producir resultados derivados.
- **CA-RF-06.5:** CUANDO el estudiante confirme un check-in completo, EL SISTEMA DEBERÁ volver a obtener la fecha y zona horaria del dispositivo y guardar una sola vez las respuestas fuente, la fecha local, el instante UTC, la zona horaria y la versión del instrumento.
- **CA-RF-06.6:** SI la fecha local cambió desde que se abrió el formulario, ENTONCES EL SISTEMA DEBERÁ informarlo y volver a validar la unicidad para la nueva fecha antes de guardar.
- **CA-RF-06.7:** SI ya existe un check-in para la fecha obtenida al confirmar, ENTONCES EL SISTEMA DEBERÁ impedir un duplicado y mostrar el registro existente según RF-07.

### RF-07 — Corrección e historial personal

La aplicación deberá permitir corregir o eliminar el check-in durante el mismo día y consultar el historial propio.

- **CA-RF-07.1:** CUANDO el estudiante abra el registro emocional y ya exista un check-in para la fecha local actual, EL SISTEMA DEBERÁ mostrar ese registro para consulta o corrección en lugar de crear otro.
- **CA-RF-07.2:** CUANDO el estudiante confirme una corrección durante la misma fecha local, EL SISTEMA DEBERÁ reemplazar el contenido del check-in existente y recalcular su resultado.
- **CA-RF-07.3:** SI el estudiante confirma la eliminación del check-in del día, ENTONCES EL SISTEMA DEBERÁ trasladarlo a la papelera protegida, excluirlo de los cálculos y recalcular los resultados derivados.
- **CA-RF-07.4:** CUANDO el estudiante consulte su historial, EL SISTEMA DEBERÁ mostrar únicamente sus registros activos, diferenciar los días sin registro y mantener los días anteriores en modo de solo lectura.

La restauración, eliminación definitiva e eliminación integral o por categoría se regirán por RF-13.

### RF-08 — Clasificación transparente del resultado

La aplicación deberá clasificar cada check-in mediante una regla determinista, comprensible y no clínica.

- **CA-RF-08.1:** CUANDO se guarde o corrija un check-in completo, EL SISTEMA DEBERÁ aplicar la misma regla documentada de interpretación y clasificación que corresponda a la versión registrada.
- **CA-RF-08.2:** CUANDO se muestre el resultado, EL SISTEMA DEBERÁ explicar en español qué respuestas y reglas aprobadas determinaron la clasificación, sin presentar diagnósticos.
- **CA-RF-08.3:** SI se corrige, restaura o envía a la papelera el check-in del día, ENTONCES EL SISTEMA DEBERÁ recalcular el resultado y toda secuencia dependiente antes de mostrar el estado actualizado.
- **CA-RF-08.4:** MIENTRAS existan resultados, clasificaciones o secuencias, EL SISTEMA DEBERÁ mantenerlos únicamente en el dispositivo y asociarlos a las versiones del instrumento y de la regla que los produjeron.
- **CA-RF-08.5:** CUANDO un dispositivo reciba datos emocionales fuente mediante sincronización, EL SISTEMA DEBERÁ reconstruir localmente sus derivados usando la versión registrada, sin descargar derivados remotos.

La elección del instrumento y la regla de interpretación permanecen pendientes en Dudas abiertas. Ningún criterio de este documento presupone todavía un número de preguntas, dimensiones, escala, puntuación o umbral.

### RF-09 — Alerta temprana privada

La aplicación deberá calcular localmente y sin conexión una única alerta privada al completar tres fechas locales consecutivas con resultado negativo.

- **CA-RF-09.1:** CUANDO se confirme el tercer resultado negativo en tres fechas locales consecutivas, EL SISTEMA DEBERÁ activar una alerta dentro de la aplicación.
- **CA-RF-09.2:** SI una fecha intermedia no tiene check-in o tiene un resultado no negativo, ENTONCES EL SISTEMA DEBERÁ reiniciar la secuencia antes de evaluar una nueva alerta.
- **CA-RF-09.3:** MIENTRAS una alerta activa no haya sido confirmada por el estudiante, EL SISTEMA DEBERÁ mantenerla disponible dentro de la aplicación.
- **CA-RF-09.4:** CUANDO el estudiante confirme una alerta, EL SISTEMA DEBERÁ archivarla localmente y evitar que vuelva a aparecer durante la misma secuencia.
- **CA-RF-09.5:** CUANDO una secuencia se haya reiniciado y posteriormente se completen tres nuevos días negativos consecutivos, EL SISTEMA DEBERÁ permitir una nueva alerta.
- **CA-RF-09.6:** SI una corrección, restauración o eliminación rompe la secuencia que originó una alerta, ENTONCES EL SISTEMA DEBERÁ recalcularla y retirar su estado activo.
- **CA-RF-09.7:** CUANDO una reconciliación incorpore check-ins anteriores, EL SISTEMA DEBERÁ recalcular localmente la secuencia y solo activar una alerta nueva si la secuencia vigente incluye la fecha local actual.
- **CA-RF-09.8:** MIENTRAS un perfil esté activo, EL SISTEMA DEBERÁ mantener la alerta activa y su historial archivado exclusivamente en ese perfil local.

### RF-10 — Biblioteca, explicación y recursos de apoyo

La aplicación deberá permitir consultar voluntariamente una biblioteca local y versionada, explicar la causa de una alerta y seleccionar recursos mediante reglas transparentes y no clínicas, sin IA, diagnósticos ni avisos automáticos a terceros.

- **CA-RF-10.1:** CUANDO el estudiante acceda a la biblioteca sin depender de una alerta, EL SISTEMA DEBERÁ mostrar los recursos vigentes aprobados conjuntamente por Bienestar Estudiantil y el docente responsable.
- **CA-RF-10.2:** CUANDO el estudiante seleccione un recurso, EL SISTEMA DEBERÁ mostrar localmente como mínimo su nombre, propósito, tipo de apoyo, canal de acceso, fuente y fecha de revisión.
- **CA-RF-10.3:** CUANDO se active una alerta, EL SISTEMA DEBERÁ indicar que fue causada por tres días consecutivos clasificados como negativos y aplicar una regla aprobada, determinista y explicable para seleccionar recursos de la biblioteca.
- **CA-RF-10.4:** MIENTRAS la alerta sea visible, EL SISTEMA DEBERÁ usar lenguaje de orientación y autocuidado, sin afirmar una condición clínica ni sustituir atención profesional.
- **CA-RF-10.5:** SI un recurso requiere abrir un enlace externo sin conexión, ENTONCES EL SISTEMA DEBERÁ mantener visible la información definida en CA-RF-10.2 e informar que el enlace no está disponible.
- **CA-RF-10.6:** MIENTRAS el estudiante use DuocMind, EL SISTEMA DEBERÁ impedir avisos automáticos a familiares, docentes, Duoc UC, profesionales u otros terceros.
- **CA-RF-10.7:** SI un enlace no usa HTTPS, no pertenece a un dominio aprobado, redirige fuera de los dominios aprobados o no puede abrirse, ENTONCES EL SISTEMA DEBERÁ impedir la navegación y mostrar un mensaje en español.
- **CA-RF-10.8:** SI no existen recursos vigentes, ENTONCES EL SISTEMA DEBERÁ mostrar un estado vacío y no presentar recursos vencidos como disponibles.
- **CA-RF-10.9:** CUANDO se prepare una entrega o se cumplan seis meses desde la última revisión, lo que ocurra primero, EL SISTEMA DEBERÁ impedir publicar como vigente un recurso sin una nueva validación conjunta.

La relación exacta entre las respuestas del futuro instrumento y las categorías de recursos seguirá pendiente junto con la regla de interpretación indicada en DA-03.

### RF-11 — Funcionamiento local sin conexión

Las funciones principales deberán permanecer disponibles localmente y sin conexión para el perfil activo que se haya registrado o autenticado satisfactoriamente al menos una vez en el dispositivo.

- **CA-RF-11.1:** MIENTRAS el dispositivo no tenga conexión y exista un perfil activo autorizado localmente, EL SISTEMA DEBERÁ permitir consultar y gestionar su agenda, completar su check-in, consultar su historial, calcular y mostrar sus alertas, acceder a la biblioteca y gestionar su papelera local.
- **CA-RF-11.2:** CUANDO una operación local válida sea confirmada, EL SISTEMA DEBERÁ persistirla antes de mostrarla como guardada y conservarla después de un cierre y reapertura normales.
- **CA-RF-11.3:** SI falla la persistencia local, ENTONCES EL SISTEMA DEBERÁ informar que la operación no fue guardada, mantener íntegro el contenido mientras la pantalla y el proceso continúen activos y ofrecer reintentar.
- **CA-RF-11.4:** SI se interrumpe el guardado de un check-in o la actualización de sus derivados, ENTONCES EL SISTEMA DEBERÁ recuperar el último estado completo y no mostrar combinaciones parciales como válidas.
- **CA-RF-11.5:** SI se detecta almacenamiento corrupto o una migración incompleta, ENTONCES EL SISTEMA DEBERÁ impedir el uso de datos parciales, conservar la copia recuperable y mostrar el estado de recuperación en español.
- **CA-RF-11.6:** SI la sesión remota vence mientras el perfil continúa activo y no existe conexión, ENTONCES EL SISTEMA DEBERÁ mantener el acceso a sus funciones y datos locales, pausar toda sincronización e informar su estado pendiente.
- **CA-RF-11.7:** CUANDO vuelva la conexión después del vencimiento de una sesión, EL SISTEMA DEBERÁ intentar renovarla antes de reanudar únicamente las categorías autorizadas del perfil.
- **CA-RF-11.8:** MIENTRAS no exista un perfil activo porque se cerró sesión, EL SISTEMA DEBERÁ mantener el portón de RF-01 y exigir conexión para registrar, iniciar sesión, recuperar acceso o cambiar de cuenta.

El registro, el inicio o cambio de sesión, la recuperación de acceso, la eliminación o cancelación de eliminación de cuenta, la sincronización y la apertura de enlaces externos no estarán disponibles sin conexión. Esta limitación no revocará el acceso local de un perfil que siga activo conforme a CA-RF-11.1.

### RF-12 — Reconciliación, cola y reintento de sincronización

La aplicación deberá sincronizar en ambos sentidos únicamente las categorías autorizadas del perfil activo en ese dispositivo usando Wi-Fi o datos móviles, conservar operaciones pendientes por cuenta y resolver manualmente los conflictos.

- **CA-RF-12.1:** CUANDO una operación del perfil activo pertenezca a una categoría autorizada y no pueda sincronizarse, EL SISTEMA DEBERÁ conservarla localmente con su UID propietario y estado pendiente.
- **CA-RF-12.2:** MIENTRAS el perfil activo tenga operaciones pendientes, EL SISTEMA DEBERÁ mostrar su estado sin presentarlas como sincronizadas.
- **CA-RF-12.3:** CUANDO se recupere la conexión y la sesión siga vigente, EL SISTEMA DEBERÁ reintentar automáticamente las operaciones autorizadas cuyo ciclo de intentos no se haya agotado.
- **CA-RF-12.4:** SI la aplicación se cierra durante un envío, ENTONCES EL SISTEMA DEBERÁ conservar la identidad estable y el estado de la operación sin confirmación para reconciliarla sin crear duplicados.
- **CA-RF-12.5:** CUANDO Supabase confirme una operación, EL SISTEMA DEBERÁ marcarla como sincronizada una sola vez.
- **CA-RF-12.6:** MIENTRAS una solicitud remota autorizada espere confirmación, EL SISTEMA DEBERÁ cerrar cada intento como timeout después de 15 segundos sin respuesta.
- **CA-RF-12.7:** CUANDO una operación autorizada inicie un ciclo automático, EL SISTEMA DEBERÁ limitarlo a cinco intentos totales: el primero se ejecutará 5 segundos después del inicio del ciclo y, si cada intento falla por red, timeout, limitación temporal o indisponibilidad, los siguientes se ejecutarán respectivamente 15, 30, 60 y 120 segundos después del fallo anterior.
- **CA-RF-12.8:** MIENTRAS una operación esté pendiente o fallida, EL SISTEMA DEBERÁ persistir su contador, próximo intento y último resultado, sin reiniciarlos al cerrar o reabrir la aplicación.
- **CA-RF-12.9:** SI se agotan sin confirmación los cinco intentos automáticos del ciclo, ENTONCES EL SISTEMA DEBERÁ marcar la operación como fallida y exigir un reintento manual para iniciar un ciclo nuevo.
- **CA-RF-12.10:** SI Supabase rechaza una operación por autenticación, autorización o validación, ENTONCES EL SISTEMA DEBERÁ detener los reintentos automáticos, conservar el dato local y solicitar la acción correctiva correspondiente.
- **CA-RF-12.11:** CUANDO se active o reactive una categoría, el perfil vuelva a iniciar sesión o la aplicación se inicie o reanude con conexión, EL SISTEMA DEBERÁ comprobar primero el aviso de cuenta vigente, la ausencia de una eliminación bloqueante y el estado remoto de cada categoría autorizada del perfil activo antes de comparar o transferir cambios.
- **CA-RF-12.12:** CUANDO un dato del perfil activo exista solo en Supabase y no presente conflicto, EL SISTEMA DEBERÁ guardarlo únicamente en ese perfil local para que quede disponible sin conexión.
- **CA-RF-12.13:** MIENTRAS una categoría permanezca desactivada para el perfil y dispositivo activos, EL SISTEMA DEBERÁ impedir tanto el envío de su contenido local como la descarga de su contenido remoto.
- **CA-RF-12.14:** SI un mismo dato presenta cambios locales y remotos incompatibles, ENTONCES EL SISTEMA DEBERÁ conservar ambas versiones, mostrar sus diferencias y solicitar al estudiante que elija cuál mantener.
- **CA-RF-12.15:** CUANDO el estudiante resuelva un conflicto, EL SISTEMA DEBERÁ conservar como activa la versión elegida, trasladar la descartada a la papelera y reanudar únicamente las operaciones dependientes de ese dato.
- **CA-RF-12.16:** SI un lote obtiene confirmaciones parciales, ENTONCES EL SISTEMA DEBERÁ actualizar cada operación por separado y reintentar solo las no confirmadas.
- **CA-RF-12.17:** SI se pierde localmente una confirmación remota, ENTONCES EL SISTEMA DEBERÁ consultar la identidad estable de la operación antes de reenviarla y evitar un efecto duplicado.
- **CA-RF-12.18:** MIENTRAS varias operaciones no confirmadas afecten el mismo dato, EL SISTEMA DEBERÁ conservar su orden lógico: crear y editar enviará la versión final, crear y eliminar antes del primer envío no transferirá contenido, y eliminar un dato ya remoto conservará la operación de eliminación.
- **CA-RF-12.19:** MIENTRAS los datos emocionales estén autorizados, EL SISTEMA DEBERÁ transferir exclusivamente los campos fuente enumerados en CA-RF-03.7 y los metadatos técnicos auxiliares limitados por CA-RF-03.9.
- **CA-RF-12.20:** MIENTRAS una instalación conserve colas de varios perfiles, EL SISTEMA DEBERÁ procesar únicamente la cola del perfil activo e impedir que una operación use la sesión, los consentimientos o los datos de otra cuenta.

### RF-13 — Revocación, papelera y eliminación de cuenta

La aplicación deberá permitir revocar la sincronización, recuperar durante siete días todo dato eliminado y eliminar de forma autoservicio una cuenta junto con su perfil local y datos remotos.

- **CA-RF-13.1:** CUANDO el estudiante desactive la sincronización de una categoría, EL SISTEMA DEBERÁ detener nuevos envíos y descargas de contenido y cancelar sus altas o cambios pendientes no confirmados, sin cancelar eliminaciones remotas ya autorizadas.
- **CA-RF-13.2:** MIENTRAS una categoría permanezca desactivada, EL SISTEMA DEBERÁ conservar sus nuevas operaciones solo en el perfil local propietario.
- **CA-RF-13.3:** CUANDO el estudiante confirme la eliminación de un elemento o una categoría, EL SISTEMA DEBERÁ trasladar el alcance seleccionado a una papelera protegida durante 168 horas antes de su eliminación definitiva; la cuenta completa seguirá el inicio de plazo definido en CA-RF-13.13.
- **CA-RF-13.4:** MIENTRAS un dato esté en la papelera, EL SISTEMA DEBERÁ ocultarlo de los flujos activos, excluirlo de cálculos y permitir su restauración al mismo perfil y alcance.
- **CA-RF-13.5:** CUANDO transcurran 168 horas desde una eliminación confirmada sin restauración, EL SISTEMA DEBERÁ eliminar definitivamente el dato del alcance solicitado y retirar su copia recuperable.
- **CA-RF-13.6:** CUANDO el estudiante elimine datos desde los controles de privacidad, EL SISTEMA DEBERÁ permitir elegir agenda o datos emocionales y distinguir entre dispositivo, Supabase o ambos alcances.
- **CA-RF-13.7:** CUANDO el estudiante solicite eliminar una categoría completa del dispositivo, de Supabase o de ambos, EL SISTEMA DEBERÁ desactivarla en ese perfil y dispositivo y, si el alcance incluye Supabase, solicitar un bloqueo de eliminación para el UID y la categoría y mostrarla como programada únicamente después de la confirmación remota.
- **CA-RF-13.8:** MIENTRAS exista una eliminación remota de categoría autorizada y pendiente o programada, EL SISTEMA DEBERÁ darle precedencia, conservarla aunque se revoque la categoría e impedir que cualquier dispositivo del mismo UID envíe, descargue o reactive esa categoría hasta que la eliminación se complete o sea restaurada.
- **CA-RF-13.9:** SI la revocación ocurre mientras un envío ya está en tránsito, ENTONCES EL SISTEMA DEBERÁ registrar cualquier confirmación posterior por su alcance real y no afirmar que el envío fue cancelado.
- **CA-RF-13.10:** SI se solicita una eliminación remota de contenido sin conexión o sesión válida, ENTONCES EL SISTEMA DEBERÁ informar que aún no fue programada y conservar la solicitud local únicamente con autorización explícita.
- **CA-RF-13.11:** SI una eliminación solicitada para dispositivo y Supabase se completa solo en un alcance, ENTONCES EL SISTEMA DEBERÁ mostrar por separado el resultado local y remoto y mantener pendiente o fallido el alcance restante.
- **CA-RF-13.12:** CUANDO el estudiante solicite eliminar su cuenta, EL SISTEMA DEBERÁ exigir conexión, reautenticación mediante contraseña y confirmación explícita antes de solicitar a Supabase la programación de la cuenta, sus datos remotos y su perfil local.
- **CA-RF-13.13:** CUANDO Supabase confirme la programación de una eliminación de cuenta, EL SISTEMA DEBERÁ registrar un único inicio y vencimiento UTC a 168 horas, bloquear las nuevas sesiones de uso y las operaciones remotas de contenido del UID, salvo la reautenticación y cancelación limitadas de CA-RF-13.15, desactivar ambas categorías y trasladar la cuenta, sus datos remotos y el perfil local completo al estado protegido de eliminación.
- **CA-RF-13.14:** MIENTRAS la eliminación de cuenta esté programada, EL SISTEMA DEBERÁ mantener bloqueado ese perfil y permitir únicamente iniciar la cancelación; los perfiles de otras cuentas deberán permanecer aislados y podrán abrirse solo mediante el cambio de cuenta en línea definido en RF-02.
- **CA-RF-13.15:** CUANDO el estudiante solicite cancelar la eliminación antes del vencimiento, EL SISTEMA DEBERÁ exigir conexión y contraseña, mantener bloqueado el perfil y restaurarlo solo después de que Supabase confirme la cancelación.
- **CA-RF-13.16:** CUANDO Supabase confirme a tiempo la cancelación, EL SISTEMA DEBERÁ restaurar la cuenta y su perfil local con ambas categorías de sincronización desactivadas.
- **CA-RF-13.17:** CUANDO venza el plazo confirmado sin cancelación, EL SISTEMA DEBERÁ purgar definitivamente la cuenta, sus datos remotos y cada perfil local que haya recibido esa programación, incluidos consentimientos, cola y papelera, sin conservar copias recuperables fuera de la política aprobada.
- **CA-RF-13.18:** SI una instalación conocía la programación pero no estaba en ejecución al vencer el plazo, ENTONCES EL SISTEMA DEBERÁ bloquear el perfil antes de mostrarlo, comprobar en línea si hubo una cancelación y, si Supabase confirma que la eliminación sigue vigente o terminó, purgarlo antes de permitir cualquier acceso; sin conexión deberá mantenerlo bloqueado sin purgarlo ni exponerlo.
- **CA-RF-13.19:** SI Supabase confirma que una cuenta fue eliminada o deshabilitada externamente sin una programación de eliminación conocida, ENTONCES EL SISTEMA DEBERÁ bloquear su perfil y ofrecer recuperación o el traslado exclusivo de ese perfil local a una papelera de 168 horas, sin afirmar que eliminará datos remotos.
- **CA-RF-13.20:** MIENTRAS un perfil bloqueado por una baja externa permanezca en su papelera local, EL SISTEMA DEBERÁ permitir restaurarlo únicamente después de recuperar y autenticar la misma cuenta antes del vencimiento.
- **CA-RF-13.21:** SI el estudiante elige eliminar solo del dispositivo y conserva una copia remota, ENTONCES EL SISTEMA DEBERÁ advertir que esa copia podrá descargarse después de una nueva autorización del mismo perfil.
- **CA-RF-13.22:** SI el estudiante elige eliminar solo de Supabase y conserva una copia local, ENTONCES EL SISTEMA DEBERÁ invalidar las autorizaciones vigentes de esa categoría en todos los dispositivos y advertir que únicamente una nueva autorización posterior a la eliminación podrá volver a enviarla.
- **CA-RF-13.23:** SI Supabase no confirma una programación, cancelación o eliminación remota, ENTONCES EL SISTEMA DEBERÁ conservar su estado como pendiente o fallido mientras exista el perfil correspondiente y nunca mostrarla como completada; una purga local ya exigida por un vencimiento confirmado no conservará contenido para representar ese estado.
- **CA-RF-13.24:** CUANDO un elemento individual de agenda o un check-in pase a la papelera o sea restaurado y su categoría esté autorizada, EL SISTEMA DEBERÁ tratar ese estado como un cambio ordinario de la categoría sin desactivar su sincronización.
- **CA-RF-13.25:** CUANDO una instalación distinta reciba de Supabase una programación de eliminación para un UID local, EL SISTEMA DEBERÁ bloquear ese perfil antes de cualquier sincronización, adoptar el mismo inicio y vencimiento UTC y aplicar la cancelación o purga según el estado remoto confirmado.
- **CA-RF-13.26:** MIENTRAS una instalación permanezca sin conexión y nunca haya recibido la programación iniciada en otro dispositivo, EL SISTEMA DEBERÁ conservar el comportamiento local de RF-11 y aplicar CA-RF-13.25 antes de cualquier operación remota en su siguiente conexión.
- **CA-RF-13.27:** CUANDO el estudiante solicite restaurar dentro del plazo una categoría eliminada de Supabase, EL SISTEMA DEBERÁ exigir conexión, sesión válida y confirmación explícita, y mantener el bloqueo por UID y categoría hasta recibir el resultado remoto.
- **CA-RF-13.28:** CUANDO Supabase confirme la restauración de una categoría, EL SISTEMA DEBERÁ devolver los datos al alcance remoto anterior y mantener desactivadas en todos los dispositivos sus autorizaciones de sincronización hasta que cada dispositivo solicite una nueva autorización conforme a RF-03.

### RF-14 — Errores y recuperación

La aplicación deberá comunicar los errores en español, proteger el contenido ingresado y representar fielmente los estados de acceso, cuenta y sincronización.

- **CA-RF-14.1:** SI ocurre un error recuperable de red, timeout, indisponibilidad, sesión vencida o rechazo remoto temporal, ENTONCES EL SISTEMA DEBERÁ explicar la acción posible en español, conservar íntegro el contenido mientras la pantalla y el proceso sigan activos y permitir reintentar.
- **CA-RF-14.2:** SI la sesión remota vence, ENTONCES EL SISTEMA DEBERÁ pausar sus envíos, conservar las operaciones en el perfil propietario y mantener el acceso local conforme a RF-11 hasta que pueda renovar la sesión o solicitar autenticación en línea.
- **CA-RF-14.3:** MIENTRAS Supabase no haya confirmado una operación, EL SISTEMA DEBERÁ distinguir su estado local, remoto y de eliminación como pendiente o fallido, pero nunca como sincronizado, programado o eliminado.
- **CA-RF-14.4:** SI un error incluye detalles internos o datos sensibles, ENTONCES EL SISTEMA DEBERÁ ocultarlos al usuario y evitar registrarlos en trazas no protegidas.
- **CA-RF-14.5:** SI una migración, lectura o escritura local falla, ENTONCES EL SISTEMA DEBERÁ conservar el último estado completo recuperable y no presentar datos parciales como válidos.
- **CA-RF-14.6:** SI una confirmación remota se pierde o un lote termina parcialmente, ENTONCES EL SISTEMA DEBERÁ mostrar el resultado por operación y mantener sin confirmar solo los alcances pendientes.
- **CA-RF-14.7:** SI una persona intenta acceder sin un perfil registrado o autenticado previamente, ENTONCES EL SISTEMA DEBERÁ mantener el portón de RF-01 sin mostrar contenido perteneciente a perfiles locales.
- **CA-RF-14.8:** SI Supabase informa un correo ya registrado, credenciales inválidas o una recuperación no disponible, ENTONCES EL SISTEMA DEBERÁ orientar de forma genérica hacia registro, inicio de sesión o recuperación sin exponer detalles que faciliten enumerar cuentas.

## Inventario y ciclo de vida de datos

El equipo DuocMind será el responsable interno de definir y verificar los controles del MVP. Cada estudiante conservará el control funcional de los datos asociados a su cuenta y perfil. Bienestar Estudiantil y el docente responsable validarán únicamente el contenido de apoyo y no tendrán acceso a cuentas, registros académicos o datos emocionales.

| Conjunto | Contenido y validación mínima | Finalidad | Clasificación | Acceso y sincronización | Responsable | Retención | Eliminación |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Cuenta y sesión | Correo normalizado, UID, referencia segura y vencimiento de sesión, identificador de operación de autenticación, instante y estado de resultado o limitación. La contraseña será tratada por el proveedor y no se persistirá en la aplicación; no se exigirá verificación previa del correo. | Cumplir el portón obligatorio de acceso, autenticar al estudiante y proteger la propiedad de cada perfil. | Dato personal; contraseña y tokens son secretos de autenticación. | Tratamiento remoto indispensable en Supabase y referencia de sesión protegida localmente; no está sujeto a los controles opcionales de RF-03. | Equipo DuocMind como responsable interno de la integración; Supabase dentro del límite remoto definido. | Correo y UID hasta eliminar la cuenta; referencia de sesión hasta cierre, revocación o sustitución; metadatos de cada intento hasta resolverlo o agotar su reintento. | La referencia local de sesión se retira al cerrar sesión; cuenta e identidad asociada se purgan al terminar la ventana confirmada de eliminación, sin contenido recuperable fuera de la política. |
| Marcador remoto de eliminación de cuenta | Identificadores no reversibles de eliminación, solicitud e instalaciones conocidas, inicio y vencimiento UTC, estado programado, cancelado o completado y confirmaciones; ningún campo permite derivar el UID, el dispositivo, el correo, las credenciales ni el contenido del perfil. | Propagar una programación, cancelación o purga a instalaciones temporalmente desconectadas e impedir la reaparición de una cuenta eliminada. | Metadato confidencial de privacidad y seguridad, sin contenido recuperable. | Solo el servicio remoto confiable y una instalación que presente la prueba técnica correspondiente al mismo perfil; no está sujeto a los consentimientos de contenido. | Equipo DuocMind como responsable interno de la integración; Supabase dentro del límite remoto definido. | Desde la programación hasta que todas las instalaciones conocidas confirmen haber recibido el estado final; si una no vuelve a conectarse, se conserva únicamente este marcador mínimo para mantener la orden. | Tras una cancelación o purga, se elimina cuando todas las instalaciones conocidas confirman el estado; nunca permite reconstruir la cuenta ni su contenido. |
| Perfil local | UID propietario, estado activo, bloqueado o en eliminación y referencias aisladas a contenido, consentimiento, cola y papelera. | Separar en el dispositivo los datos de cada cuenta y habilitar acceso local posterior a una autenticación satisfactoria. | Personal confidencial; hereda riesgo alto cuando referencia información emocional. | Solo el perfil activo puede acceder a su conjunto; cambiar de cuenta requiere autenticación en línea. | Equipo DuocMind como responsable interno; cada estudiante controla únicamente su perfil. | Persiste entre cierres de sesión y uso offline hasta su eliminación definitiva. | Se purga con la cuenta o mediante eliminación local por baja externa, siempre después de la papelera aplicable. |
| Aceptación del aviso de cuenta | Versión, alcance general o limitado, finalidad, decisión, instante UTC, identificador opaco del dispositivo y UID después de la confirmación de identidad; antes de esa confirmación la decisión pertenece solo al intento activo. | Demostrar que el estudiante fue informado sobre los datos indispensables de la operación de cuenta antes de transmitirlos. | Metadato personal confidencial e indispensable de cumplimiento de la cuenta. | Evidencia protegida local y remota vinculada a cuenta y dispositivo; no está sujeta a RF-03, no autoriza sincronizar contenido y un alcance limitado no habilita una sesión de uso. | Equipo DuocMind como responsable interno; el estudiante acepta o rechaza. | Una aceptación confirmada se conserva hasta ser sustituida por otra versión o eliminar la cuenta; un intento sin identidad confirmada se descarta al abandonar el flujo. | Se purga con la cuenta y el perfil; el rechazo inicial no genera identidad remota. |
| Consentimientos opcionales | UID, identificador opaco del dispositivo, categoría de agenda o emociones, estado, instante UTC y versión del aviso; ambas categorías comienzan desactivadas para un perfil nuevo. | Demostrar y aplicar la decisión separada de sincronizar contenido por perfil y dispositivo. | Metadato personal confidencial. | Local por perfil y dispositivo; los mismos campos se conservan remotamente solo para autorizar o bloquear la categoría correspondiente. | Equipo DuocMind como responsable interno; el estudiante activa o revoca cada categoría. | Persiste entre cierres de sesión hasta revocación, sustitución o eliminación de cuenta. | Se purga con el perfil; una eliminación remota de categoría invalida sus autorizaciones en todos los dispositivos y, después de cancelar una eliminación de cuenta, ambas categorías permanecen desactivadas. |
| Agenda | UID propietario, identidad estable, tipo, título, asignatura opcional, campos temporales, versión y marcas de tiempo; validaciones de RF-04 y RF-05. | Organizar compromisos académicos definidos manualmente por el estudiante. | Personal confidencial. | Solo el perfil propietario; Supabase únicamente con consentimiento de agenda vigente para ese perfil y dispositivo. | Equipo DuocMind como responsable interno; el estudiante controla el contenido y sus alcances. | Activa hasta que el estudiante solicite eliminarla o elimine su cuenta. | Papelera protegida durante 168 horas y posterior purga del alcance elegido o de la cuenta, salvo restauración. |
| Datos emocionales fuente | Respuestas estructuradas, fecha local, instante UTC, zona horaria y versión del instrumento; unicidad por fecha y validación del instrumento aprobado. El vínculo con el UID se conservará como metadato técnico separado conforme a CA-RF-03.9. | Registrar las respuestas elegidas por el estudiante y permitir cálculos locales no clínicos. | Información interna de riesgo alto y potencial dato personal sensible. | Solo el perfil propietario; Supabase únicamente con consentimiento emocional vigente para ese perfil y dispositivo. | Equipo DuocMind como responsable interno; el estudiante controla el contenido y sus alcances. | Activos hasta que el estudiante solicite eliminarlos o elimine su cuenta. | Papelera protegida durante 168 horas y posterior purga del alcance elegido o de la cuenta, salvo restauración. |
| Datos emocionales derivados | UID propietario, resultado, clasificación, versión de la regla, secuencia, alerta activa y alertas archivadas; deberán corresponder a una fuente y versión válidas. | Explicar localmente el resultado no clínico, detectar la secuencia y sostener el ciclo de la alerta. | Información interna de riesgo alto y potencial dato personal sensible. | Exclusivamente en el perfil local propietario; nunca se enviarán a Supabase ni a terceros. | Equipo DuocMind como responsable interno; el estudiante controla su consulta y eliminación. | Se conservan mientras sus fuentes sigan activas o durante el plazo recuperable correspondiente. | Se recalculan o eliminan con sus fuentes y se purgan con el perfil al vencer la retención. |
| Cola y conflictos | UID propietario, identificadores técnicos opacos de entidad y operación, categoría, acción, versión, estado, idempotencia, intentos, próximo intento, último resultado y versiones en conflicto. | Ejecutar sincronización recuperable, autorizada, correlacionable, idempotente y aislada por cuenta. | Hereda la clasificación del contenido relacionado. | Solo se procesa la cola del perfil activo; Supabase recibe los metadatos mínimos delimitados en CA-RF-03.9. | Equipo DuocMind como responsable interno; el estudiante decide la versión activa en un conflicto. | Hasta confirmación, cancelación, agotamiento resuelto, conflicto resuelto o eliminación de la cuenta. | Las operaciones concluidas se depuran; las versiones descartadas usan la papelera y toda la cola se purga con el perfil. |
| Papelera protegida | UID propietario, copia recuperable, alcance, instante de eliminación, fecha de purga y estado local o remoto. | Permitir reversión antes de una eliminación definitiva y hacer visible el estado real de cada alcance. | Hereda la clasificación del dato eliminado. | Solo el perfil propietario; local y/o Supabase según el alcance confirmado. | Equipo DuocMind como responsable interno; el estudiante puede restaurar dentro del plazo aplicable. | Exactamente 168 horas desde la confirmación que inicie el plazo correspondiente. | Purga definitiva al vencer el plazo, salvo restauración previa; la eliminación de cuenta incluye toda su papelera. |
| Catálogo de recursos | Nombre, propósito, tipo de apoyo, canal, fuente, dominio permitido, versión, validadores, fecha de revisión y vigencia. | Ofrecer orientación y acceso voluntario a apoyo sin personalización clínica. | Contenido público sin datos personales. | Incluido localmente para todos los perfiles autenticados; no forma parte de la sincronización de cuenta. | Equipo DuocMind mantiene el catálogo; Bienestar Estudiantil y el docente responsable lo validan conjuntamente. | Se conserva la versión íntegra vigente y la anterior únicamente hasta confirmar que una actualización completa puede abrirse y revertirse de forma segura. | Un recurso vencido deja de publicarse como vigente; la versión anterior se elimina al confirmar la actualización y el catálogo se revisa antes de cada entrega y como máximo cada seis meses. |

El MVP no recopilará telemetría. Desarrollo, pruebas, demostraciones, evidencias y validación con estudiantes utilizarán cuentas, identidades y contenido sintéticos; esta última no admitirá correos personales, narrativas ni experiencias emocionales reales.

## Requisitos no funcionales

### RNF-01 — Privacidad y minimización

- El almacenamiento local será el comportamiento predeterminado para agenda, datos emocionales y derivados; únicamente se transmitirán sin autorización de contenido los datos indispensables de cuenta, sesión, seguridad y cumplimiento, junto con estados de consentimiento o solicitudes de privacidad iniciadas explícitamente por el estudiante.
- La aplicación tratará únicamente los campos y finalidades declarados en el inventario de datos.
- Los datos emocionales fuente, resultados e inferencias se clasificarán internamente como información de riesgo alto y potenciales datos personales sensibles.
- No habrá telemetría en el MVP.
- Desarrollo, pruebas, demostraciones y evidencias deberán usar cuentas, correos, identidades y contenido sintéticos o realmente anonimizados.
- La validación inicial con estudiantes usará exclusivamente cuentas y escenarios sintéticos y no registrará correos personales ni experiencias emocionales reales.
- Cada dato de contenido sincronizado deberá corresponder al perfil propietario y a una categoría con autorización vigente y demostrable en ese dispositivo.
- La aceptación del tratamiento indispensable de autenticación no constituirá autorización para sincronizar agenda o datos emocionales.
- Antes de transmitir cualquier operación remota de cuenta en un dispositivo, la aplicación deberá obtener la aceptación versionada aplicable del aviso de RF-01; el rechazo inicial impedirá crear o abrir una sesión sin afectar a otras identidades, y las operaciones mínimas de recuperación o eliminación exigirán el aviso específico de CA-RF-01.7.
- Antes del primer check-in, la aplicación deberá obtener la aceptación del aviso definido en RF-06; rechazarlo bloqueará solo el módulo emocional.
- Toda eliminación solicitada por el estudiante sobre agenda, datos emocionales, categorías o cuenta seguirá la retención recuperable de 168 horas definida en RF-13; el cierre de sesión y la depuración técnica de intentos, cola o versiones del catálogo seguirán sus reglas específicas del inventario y no se considerarán solicitudes de eliminación de contenido.
- Un piloto futuro con datos personales reales requerirá una especificación separada y revisión previa de privacidad, amenazas, licitud y autorización institucional aplicable.

### RNF-02 — Seguridad

- Toda comunicación con Supabase deberá usar transporte cifrado.
- Las credenciales, sesiones y secretos no deberán almacenarse en texto plano ni incorporarse al repositorio.
- Cada perfil local, sus datos emocionales y su papelera deberán almacenarse mediante mecanismos cifrados o protegidos por Android y no podrán persistirse en archivos, cachés, respaldos o exportaciones en texto plano.
- El acceso remoto deberá restringirse al propietario de los datos mediante autenticación y políticas de acceso por fila.
- El acceso local deberá aplicar el UID del perfil activo en la capa de datos y dominio, sin depender únicamente de ocultar elementos en la interfaz.
- Los datos de perfiles inactivos, cerrados, bloqueados o en eliminación no deberán ser legibles ni modificables desde el perfil activo.
- Los registros técnicos no deberán contener respuestas emocionales, tokens, credenciales ni datos académicos sensibles.
- Las validaciones críticas de autorización y pertenencia no deberán depender solo de la interfaz.
- La contraseña será tratada exclusivamente por el límite de autenticación y nunca se conservará en la persistencia común de la aplicación.
- La decisión de producto de no exigir verificación previa del correo está cerrada en esta especificación y no podrá revertirse sin actualizarla; el plan técnico o ADR deberá ratificar cómo se configura, documentar su riesgo y definir los controles contra enumeración y abuso antes de implementar autenticación.
- La aplicación no deberá afirmar que el estudiante controla la dirección registrada ni interpretar como prueba de propiedad un estado que el proveedor marque como confirmado debido a la configuración sin verificación.
- El MVP confiará en el bloqueo del dispositivo Android; un PIN o mecanismo biométrico interno quedará fuera de alcance.
- Cuenta, sincronización, conflictos, papelera, restauración y eliminación deberán contar con revisión de amenazas y privacidad antes de implementarse.
- Los controles de autorización, aislamiento local y remoto entre perfiles, almacenamiento protegido, bloqueo tras cierre o baja y ausencia de datos sensibles en registros deberán producir evidencia de prueba.

### RNF-03 — Accesibilidad

- Los flujos críticos deberán cumplir las prácticas aplicables de WCAG 2.2 nivel AA y accesibilidad de Android.
- Los controles deberán contar con nombre accesible, orden de foco comprensible, áreas táctiles de al menos 48 por 48 dp y compatibilidad con texto ampliado sin pérdida de contenido o funcionalidad.
- La información no deberá depender exclusivamente del color, y los textos y controles deberán mantener contraste suficiente.
- Los mensajes de error deberán identificar el problema y la acción correctiva de manera perceptible para tecnologías de asistencia.
- Cada recorrido aplicable deberá especificar y verificar estados de carga, vacío, éxito, error, datos inválidos, consentimiento denegado, aviso de cuenta rechazado, registro requerido, sesión ausente o vencida, perfil bloqueado o en eliminación y conectividad ausente.
- Los mensajes de bienestar deberán ser claros, empáticos, no alarmistas y consistentes con el alcance no clínico.

### RNF-04 — Rendimiento

- Desde un inicio en frío, el portón de acceso o el contenido local del perfil activo, según corresponda, deberá mostrarse y aceptar interacción en un máximo de dos segundos en el percentil 95, sin esperar una validación remota.
- La navegación local hacia agenda, registro emocional, historial o biblioteca deberá mostrar contenido y aceptar interacción en un máximo de un segundo en el percentil 95.
- Una operación que cumpla RF-05 o RF-06 deberá confirmar su guardado local en un máximo de un segundo en el percentil 95, sin contar una sincronización remota.
- Los reintentos de sincronización no deberán bloquear la interacción con las funciones locales.
- La sincronización transferirá solo cambios y limitará cada solicitud a 100 operaciones o 512 KB, lo que ocurra primero.
- Después de recuperar conectividad o reanudar la aplicación, el primer reintento autorizado deberá comenzar dentro de cinco segundos.

La medición se realizará con al menos 30 muestras sobre un teléfono físico Android 10 con 4 GB de RAM y una carga local de 500 elementos académicos y 365 check-ins. Un emulador reproducible con Android 10, API 29, verificará compatibilidad y recorridos automatizados. Las cargas indicadas son el volumen mínimo garantizado para los presupuestos, no un límite de creación.

### RNF-05 — Persistencia y confiabilidad

- Una operación no podrá presentarse como guardada antes de que la persistencia local sea confirmada.
- Los datos confirmados localmente deberán sobrevivir al cierre del proceso, a una detención forzada posterior al guardado y al reinicio del dispositivo; no se exige conservarlos después de desinstalar o borrar los datos de la aplicación.
- Cerrar sesión deberá bloquear el acceso sin eliminar el perfil; volver a la misma cuenta deberá recuperar exclusivamente sus datos locales.
- El vencimiento de una sesión remota no deberá destruir ni bloquear los datos del perfil que permanezca autorizado localmente, pero impedirá sincronizarlos hasta renovar la sesión.
- Un estado confirmado de eliminación, su inicio y su vencimiento deberán sobrevivir a reinicios y evaluarse antes de exponer el perfil; si el estado final no puede verificarse con seguridad, el perfil conocido deberá permanecer bloqueado.
- La cola autorizada deberá sobrevivir a reinicios y no deberá producir duplicados ante reintentos.
- La pérdida de red, el vencimiento de sesión o un fallo remoto no deberán provocar pérdida de datos locales confirmados.
- El guardado de un check-in y la actualización de sus derivados deberán ser atómicos o reconstruibles desde el último estado fuente completo.
- Los lotes parciales y las confirmaciones remotas perdidas deberán resolverse por identidad de operación sin duplicar efectos.
- Toda migración local deberá estar versionada, probada y contar con una copia recuperable anterior a cualquier transformación.
- La corrupción o una migración interrumpida no deberán exponer datos parciales como válidos ni destruir la última copia recuperable.

### RNF-06 — Compatibilidad y simplicidad del stack

- El MVP tendrá como único destino Android 10, API 29, o superior.
- React Native con Expo, TypeScript estricto, npm y Supabase constituyen la base tecnológica propuesta y deberán ratificarse, junto con sus versiones, en el plan técnico o mediante ADR antes de crear el scaffold.
- Android 10 constituye una decisión de producto deliberadamente más restrictiva que el mínimo técnico indicado por la [documentación oficial vigente de Expo](https://docs.expo.dev/versions/latest/); se validará mediante el emulador y el teléfono de referencia de RNF-04, y la compatibilidad y las versiones se ratificarán en el plan o ADR.
- Supabase es el límite remoto previsto por esta especificación; antes de implementarlo, el plan técnico o ADR deberá ratificar sus versiones, SDK, contratos y configuración. Sustituir el proveedor requerirá actualizar y volver a aprobar esta especificación.
- La configuración de autenticación deberá materializar la decisión cerrada de registro inmediato sin verificación previa del correo y documentar sus riesgos en el plan técnico o ADR; esa ratificación técnica no podrá cambiar el comportamiento funcional. La [documentación oficial de Supabase](https://supabase.com/docs/guides/auth/general-configuration) indica que `Confirm Email` puede desactivarse, pero el plan no deberá asumir que la configuración predeterminada del proyecto alojado satisface esta especificación.
- Se evitarán dependencias o servicios que dupliquen capacidades ya cubiertas, y toda dependencia nueva requerirá la evaluación exigida por la constitución.
- La lógica de dominio y sincronización deberá mantenerse independiente de la interfaz; la interfaz no accederá directamente a Supabase.

### RNF-07 — Idioma

- La interfaz, validaciones, errores, alertas, recursos y textos de accesibilidad estarán en español.
- El código, los identificadores, los nombres de archivos, tipos, funciones, API y campos de datos estarán en inglés.
- Cuando existan, los comentarios técnicos, JSDoc y la documentación técnica deberán redactarse en español y aportar contexto no evidente.

### RNF-08 — Pruebas y trazabilidad

- Cada criterio de aceptación aprobado deberá estar vinculado al menos a una prueba identificable.
- La lógica del instrumento futuro, clasificación, secuencias, reglas de recursos, autorizaciones y papelera deberá cubrirse con pruebas unitarias, incluidos bordes y falsos positivos de alertas.
- La persistencia, migraciones, cola, Supabase, aislamiento, revocación, conflictos, eliminación, restauración y recuperación deberán cubrirse con pruebas de integración.
- Los flujos críticos de aviso y registro obligatorio inmediato, rechazo del aviso, portón de acceso obligatorio, primer acceso sin conexión, inicio y recuperación de sesión, aislamiento y cambio de perfiles, acceso local con sesión vencida, agenda, check-in, historial, alerta offline, biblioteca, permisos conservados, sincronización, conflicto manual, papelera y eliminación o cancelación de cuenta deberán cubrirse con pruebas de extremo a extremo.
- Las pruebas deberán ser deterministas, independientes y repetibles. Una prueba inestable deberá registrar responsable, tarea de corrección y plazo, y no podrá ignorarse indefinidamente.
- Toda corrección deberá incorporar primero una prueba que reproduzca el defecto y después demostrar que dejó de ocurrir.
- La matriz deberá permitir recorrer especificación, criterio, tarea, cambio, prueba y resultado en ambos sentidos.
- La integración continua deberá ejecutar, según el alcance, formato, análisis estático, verificación de tipos, pruebas automatizadas, compilación y controles de dependencias o seguridad desde un checkout limpio.
- Las pruebas deberán cubrir autorización por perfil y dispositivo, no sincronización de contenido sin consentimiento ni de derivados, separación de colas, prevención de acceso cruzado, timeout y reintentos, parcialidad, confirmación perdida, bloqueo y restauración remotos entre dispositivos, atomicidad, migraciones, corrupción, enlaces permitidos, accesibilidad y presupuestos de rendimiento.

### RNF-09 — Mantenibilidad y seguridad del contenido

- La solución deberá separar presentación, dominio o aplicación y acceso a datos.
- Las reglas de clasificación y alerta deberán ser deterministas, versionadas y explicables.
- Las reglas que seleccionen recursos deberán ser deterministas, transparentes, no clínicas y no usar IA ni personalización opaca.
- Todo recurso deberá registrar su fuente, versión, aprobación conjunta de Bienestar Estudiantil y el docente responsable, fecha de revisión y vigencia antes de publicarse.
- El catálogo será local y versionado; se revisará antes de cada entrega y como máximo cada seis meses.
- Ningún texto deberá presentar a DuocMind como herramienta clínica, canal de emergencia o sustituto de atención profesional.

## Casos límite

| Caso | Comportamiento esperado |
| --- | --- |
| Primer uso sin conexión o con Supabase no disponible | Se conservan en memoria mientras la pantalla siga activa los campos necesarios para reintentar, sin persistir la contraseña; se informa que la conexión es obligatoria y ninguna función del producto, incluida la biblioteca, atraviesa el portón. |
| Registro confirmado por Supabase | La cuenta y su perfil quedan activos inmediatamente con una sesión válida, sin esperar una verificación de correo y con ambas categorías opcionales desactivadas. |
| Correo ya registrado, credenciales inválidas o recuperación no disponible | Se muestra una orientación genérica que no permita inferir si una cuenta existe y no se activa ningún perfil sin confirmación de Supabase. |
| Actualización material del aviso de cuenta rechazada | El perfil autenticado previamente conserva el acceso a su contenido local, pero no puede iniciar una nueva sesión ni sincronizar hasta aceptar la nueva versión; una recuperación, eliminación o cancelación solo puede transmitir sus datos después de aceptar un aviso específico y limitado, que no habilita una sesión funcional. |
| Primera operación de cuenta en otro dispositivo | Antes de transmitir credenciales se exige aceptar en ese dispositivo el aviso vigente; la evidencia se vincula al UID solo después de que Supabase confirme la identidad. |
| Cambio de fecha mientras el formulario está abierto | Al confirmar se usan la fecha y zona actuales, se informa el cambio y se vuelve a validar la unicidad antes de guardar. |
| Cambio manual del reloj o viaje de zona horaria | El sistema confía en la fecha actual del dispositivo para el MVP, conserva fecha local, UTC y zona capturadas y abre el registro existente si la nueva fecha ya lo tiene. Una fecha saltada cuenta como omisión. |
| Segundo intento de check-in en el mismo día | Se abre el registro existente para consulta o corrección; no se crea un duplicado. |
| Día omitido | Se representa como día sin registro, nunca como resultado negativo, y reinicia la secuencia de alertas. |
| Horario de verano | Los horarios semanales se interpretan como hora local del campus o dispositivo y siguen la hora local vigente; una hora inválida se rechaza. |
| Horario que cruza medianoche | Se rechaza como bloque nocturno fuera del MVP. |
| Edición que crea un duplicado o solapamiento | Se aplican las mismas validaciones de RF-05 excluyendo el propio elemento editado. |
| Confirmación repetida o simultánea | Una identidad estable y una escritura atómica producen un solo elemento o check-in. |
| Cierre entre el check-in y sus derivados | Se recupera el último estado completo y los derivados se reconstruyen desde la fuente; no se muestra un estado parcial. |
| Cambio de versión del instrumento o regla | Cada registro conserva sus versiones y no se reinterpreta silenciosamente con otra versión; la política definitiva forma parte de DA-02 y DA-03. |
| Datos remotos que cambian una secuencia | Los derivados se recalculan localmente; solo aparece una alerta nueva si la secuencia vigente incluye la fecha local actual. |
| Corrección, papelera o restauración después de una alerta | Se recalculan resultado y secuencia; si deja de cumplirse la condición, se retira la alerta activa. |
| Cierre de la aplicación durante una sincronización | La identidad, contador y estado de toda operación sin confirmación persisten y se reconcilian sin duplicarse. |
| Sesión remota vencida durante el uso local | El perfil autenticado previamente permanece activo y utilizable sin conexión; la cola se pausa y solo se reanuda después de renovar la sesión en línea. |
| Cierre de sesión con operaciones pendientes | El perfil se bloquea inmediatamente, los envíos se pausan y las operaciones permanecen ligadas a su UID; no se eliminan ni se transfieren a otra cuenta. |
| Intento de cerrar sesión sin conexión | El acceso local al perfil se bloquea de inmediato y la cola se pausa; no se crea una operación remota no definida ni se habilita otro perfil por ese motivo. |
| Cambio de cuenta sin conexión o sin credenciales válidas | Se mantiene el portón de acceso y no se abre ningún perfil; el cambio solo se completa cuando Supabase confirma la nueva sesión. |
| Varios perfiles locales en la misma instalación | Solo el perfil activo puede leer, modificar, derivar o sincronizar su conjunto; los datos, colas, consentimientos y papeleras de los demás perfiles permanecen aislados. |
| Reingreso de una cuenta al mismo dispositivo | Con el aviso vigente aceptado y sin una eliminación bloqueante, se abre su perfil existente, se conservan sus consentimientos y se reanudan automáticamente solo las categorías autorizadas con anterioridad. |
| Cuenta usada por primera vez en otro dispositivo | Se crea un perfil local vacío con ambas categorías desactivadas; ningún contenido remoto opcional se descarga antes de una autorización expresa en ese dispositivo. |
| Contenido local nunca sincronizado consultado desde otro dispositivo | No se recupera ni se presenta como disponible, porque nunca salió del dispositivo propietario. |
| Revocación durante un envío | No se afirma una cancelación imposible; toda confirmación tardía se registra por su alcance real y una eliminación autorizada conserva precedencia. |
| Crear, editar y eliminar antes de sincronizar | La cola conserva el orden lógico y transmite solo el efecto final definido en CA-RF-12.18. |
| Lote parcialmente confirmado | Cada operación conserva su propio resultado y solo se reintentan las no confirmadas. |
| Confirmación remota perdida localmente | Se consulta la identidad de la operación antes de reenviar para impedir efectos duplicados. |
| Conflicto entre dos dispositivos | Se conservan y muestran ambas versiones; el estudiante elige una y la descartada pasa a la papelera. |
| Eliminación remota de categoría con otros dispositivos autorizados | El bloqueo remoto por UID impide nuevos envíos y descargas desde todos los dispositivos; sus autorizaciones se invalidan y solo podrán crearse nuevamente después de completar o restaurar la eliminación. |
| Eliminación con éxito en un solo alcance | Los estados local y remoto se muestran por separado y el alcance restante permanece pendiente o fallido. |
| Restauración antes de siete días | El dato vuelve al mismo alcance, recupera su estado activo y provoca el recálculo local que corresponda. |
| Restauración de una categoría eliminada de Supabase | El bloqueo remoto continúa hasta la confirmación de Supabase; después se restauran los datos remotos, pero las autorizaciones de todos los dispositivos permanecen desactivadas hasta una nueva decisión expresa. |
| Vencimiento de la papelera | Al cumplir 168 horas sin restauración se purga la copia recuperable del alcance correspondiente. |
| Eliminación remota solicitada sin conexión | Se informa que aún no fue programada y solo se conserva localmente con autorización explícita. |
| Desinstalación con eliminación remota | Una programación ya confirmada por Supabase continúa en el servidor; una solicitud que solo era local puede perderse y no se presenta como confirmada. |
| Solicitud de eliminación de cuenta sin conexión | No se envía ni se programa, el plazo no comienza y el perfil conserva su estado anterior; se informa que la conexión y la contraseña son obligatorias. |
| Programación de eliminación de cuenta confirmada | Se registra una sola ventana UTC de 168 horas y el perfil queda bloqueado, salvo para iniciar la cancelación; los demás perfiles permanecen disponibles. |
| Cancelación sin conexión, fallida o aún no confirmada | El perfil permanece bloqueado y la eliminación sigue programada hasta recibir una confirmación remota anterior al vencimiento. |
| Cancelación confirmada dentro del plazo | Se restaura el mismo perfil y ambas categorías de sincronización quedan desactivadas, sin afectar a otros perfiles. |
| Dispositivo que conocía el plazo y estaba apagado al vencer | Antes de cualquier acceso mantiene el perfil bloqueado y consulta el estado remoto; si la eliminación sigue vigente o terminó, lo purga, y si no hay conexión no lo expone ni lo purga hasta poder descartar una cancelación. |
| Otro dispositivo recibe la programación de cuenta | Antes de sincronizar bloquea el perfil del mismo UID, adopta el plazo UTC original y aplica el estado remoto confirmado sin iniciar una nueva ventana de retención. |
| Otro dispositivo nunca recibió la programación y continúa sin conexión | Conserva temporalmente el acceso local definido por RF-11; en su primera conexión deberá consultar el estado y bloquear, cancelar o purgar antes de cualquier otra operación remota. |
| Cuenta eliminada o deshabilitada externamente | El perfil se bloquea y solo se ofrece recuperar la misma cuenta o eliminar exclusivamente el perfil local mediante una papelera de 168 horas, sin afirmar que se eliminarán datos remotos. |
| Recuperación de perfil tras una baja externa | Solo se restaura desde la papelera local si la misma cuenta se recupera y autentica antes de vencer las 168 horas. |
| Eliminación de cuenta con fallo parcial | Antes del vencimiento, cada alcance conserva su resultado real y el perfil permanece bloqueado. Si el plazo confirmado exige una purga local, el contenido local se elimina y cualquier fallo remoto se trata como incidente sin conservar una copia local para representarlo como completado. |
| Reactivación con eliminación remota de categoría pendiente | La categoría permanece bloqueada hasta que su eliminación termine o se restaure; una eliminación de cuenta programada bloquea el perfil completo. |
| Catálogo sin recursos vigentes | Se muestra el estado vacío y no se promocionan recursos vencidos. |
| Enlace externo sin conexión, inválido o inseguro | Se conserva la información local, se impide la navegación y se explica el error en español. |
| Actualización del catálogo incompleta | Se conserva la última versión local completamente validada y no se publica una mezcla parcial. |
| Fallo, falta de espacio o corrupción local | No se informa éxito ni se muestran datos parciales; el formulario activo o la última copia recuperable se conservan según corresponda. |
| Migración interrumpida | Se restaura la copia anterior completa y la nueva versión no se considera aplicada. |
| Carga superior al benchmark | La creación y consulta siguen permitidas sin pérdida de datos, aunque los presupuestos de RNF-04 solo se garantizan hasta la carga declarada. |
| Recorrido sin datos o con operación pendiente | Se muestra el estado vacío, de carga, pendiente o de error correspondiente sin inventar contenido ni éxito. |

## Fuera de alcance

Quedan expresamente fuera del MVP:

- ingreso o importación académica automática;
- integración con sistemas, calendarios, plataformas o credenciales de Duoc UC;
- notificaciones push y recordatorios automáticos;
- diagnósticos, tratamientos, puntuaciones clínicas o evaluaciones automáticas de riesgo clínico; el eventual respaldo científico de un instrumento no autorizará usos clínicos;
- contacto, derivación o aviso automático a familiares, docentes, Duoc UC, profesionales o servicios de emergencia;
- inteligencia artificial, predicción emocional y personalización o recomendación opaca; las reglas deterministas y explicables de recursos sí forman parte del MVP;
- funciones sociales, mensajería, comparación, publicación o intercambio de estados;
- paneles para administración, docentes, Bienestar Estudiantil u otros terceros;
- aplicaciones para iOS o web;
- diario emocional con texto libre;
- coedición simultánea en tiempo real entre dispositivos; la resolución manual posterior sí forma parte del MVP;
- uso invitado, anónimo o de cualquier función antes de completar el registro o inicio de sesión;
- acceso a la biblioteca antes de atravesar el portón obligatorio;
- verificación previa de la propiedad del correo como condición para activar la cuenta, inicio con proveedores sociales, OAuth o inicio de sesión institucional; los enlaces necesarios para recuperar la contraseña sí forman parte de RF-02;
- PIN, contraseña local o biometría propios de DuocMind; se utilizará la protección del dispositivo Android;
- cambio de cuenta sin conexión, fusión de perfiles o transferencia de datos entre cuentas;
- recuperación en otro dispositivo de contenido que nunca fue autorizado para sincronización;
- borrado físico a distancia de una copia local en una instalación que permanece desconectada y nunca recibió la programación; esa instalación aplicará el bloqueo y la purga correspondientes al volver a conectarse;
- horarios académicos que atraviesan medianoche o abarcan varios días;
- actualización remota dinámica o panel de gestión del catálogo; el catálogo se entrega localmente y versionado;
- validación con experiencias emocionales reales durante la etapa académica inicial;
- integración con dispositivos vestibles o datos biométricos.

La investigación y posterior aprobación de un instrumento emocional con respaldo no están fuera de alcance: constituyen una puerta pendiente para aprobar esta misma especificación.

## Clasificación de defectos

- **Crítico:** exposición de datos entre estudiantes o categorías no autorizadas; pérdida irreversible antes de vencer la papelera; contacto automático con terceros; o información falsa de eliminación, sincronización o seguridad que comprometa el control de datos.
- **Alto:** indisponibilidad de un flujo central; omisión del consentimiento; cálculo o ciclo incorrecto de una alerta; imposibilidad de recuperar un dato dentro del plazo; duplicación remota; o fallo reproducible de accesibilidad, persistencia o recuperación que impida completar el flujo.
- **Medio o bajo:** defecto que no cumple las definiciones anteriores y cuyo impacto, frecuencia y alternativa de uso permiten continuar los recorridos centrales sin comprometer datos sensibles.

## Criterios de finalización

La especificación podrá pasar de BORRADOR a APROBADA únicamente cuando:

- DA-02 y DA-03 estén resueltas mediante evidencia sobre el instrumento, su uso permitido y su interpretación, y las decisiones resultantes estén reflejadas en los RF y RNF;
- cada RF y RNF sea claro, comprobable y trazable a historias de usuario y pruebas previstas;
- el inventario y las reglas de privacidad, amenazas, seguridad, contenido no clínico, consentimiento, papelera y eliminación hayan sido revisados;
- el alcance y las exclusiones hayan sido aprobados por el responsable del proyecto.

Mientras DA-02 o DA-03 permanezcan abiertas, esta especificación conservará el estado BORRADOR.

El MVP se considerará finalizado únicamente cuando:

- todos los RF y RNF aprobados tengan pruebas trazables y resultados satisfactorios;
- los flujos críticos de portón obligatorio, aviso de cuenta, registro inmediato sin verificación de correo, inicio y recuperación de sesión, rechazo de un aviso actualizado, cierre de sesión, cambio y aislamiento de perfiles, agenda, check-in, historial, alerta, recursos, sincronización, conflicto manual, papelera, revocación, propagación entre dispositivos, eliminación y cancelación de cuenta funcionen según esta especificación;
- agenda, check-in, historial, alertas, papelera y recursos funcionen localmente sin conexión para un perfil autenticado previamente, mientras el primer acceso sin conexión permanezca bloqueado;
- se hayan verificado accesibilidad, atomicidad, migraciones, persistencia, aislamiento local y remoto por UID, ausencia de sincronización sin consentimiento, sesión vencida, reingreso con permisos conservados, seguridad y objetivos de rendimiento;
- no existan defectos críticos o de severidad alta conocidos;
- la evidencia de pruebas y la matriz de trazabilidad estén disponibles para revisión;
- formato, análisis estático, tipos, pruebas, compilación y controles aplicables de dependencias o seguridad se ejecuten satisfactoriamente en CI;
- otra persona pueda instalar, compilar y ejecutar pruebas desde un checkout limpio mediante las instrucciones aprobadas en AGENTS.MD;
- la trazabilidad cubra especificación, criterio, tarea, cambio, prueba y resultado;
- la rama principal permanezca protegida y en estado integrable;
- cada cambio esté vinculado a esta especificación y sus tareas, tenga alcance pequeño y coherente, describa comportamiento, riesgos, pruebas y evidencia, identifique contratos, migraciones y reversión aplicables y sea aprobado por una persona distinta de su autor;
- el código, los contratos, la documentación, los ADR, las migraciones y las notas de versión relacionados se actualicen en el mismo cambio;
- las versiones del entorno y las dependencias directas estén fijadas mediante configuración y archivos de bloqueo, y las variables necesarias estén documentadas mediante ejemplos sin secretos;
- cada entrega tenga una versión identificable, artefactos trazables al cambio que los generó y un procedimiento de despliegue y reversión acorde con su riesgo;
- exista evidencia del protocolo de validación sintética y de la revisión de privacidad correspondiente.

## Decisiones cerradas en la versión 0.3.0

| Decisión | Resultado |
| --- | --- |
| DC-01 — Autenticación | Cuenta obligatoria con correo y contraseña, registro inmediato tras confirmación de cuenta y sesión por Supabase, sin verificación de correo y con recuperación de acceso. |
| DC-02 — Identidad por instalación | Varios perfiles locales aislados por UID, uno activo a la vez; cambiar de cuenta requiere conexión y credenciales y no fusiona ni transfiere datos. |
| DC-03 — Sincronización emocional | Solo respuestas fuente, fecha local, UTC, zona horaria y versión del instrumento; los derivados son locales. |
| DC-04 — Consentimiento de contenido | Separado por categoría, perfil y dispositivo; desactivado en perfiles nuevos, conservado al cerrar sesión y reanudado al reingresar solo si ya estaba autorizado. |
| DC-05 — Red y reintentos | Wi-Fi o datos móviles; timeout de 15 segundos y cinco intentos totales por ciclo, a los 5, 15, 30, 60 y 120 segundos según RF-12. |
| DC-06 — Conflictos | Elección manual entre ambas versiones; la descartada pasa a papelera. |
| DC-07 — Eliminación | Toda eliminación usa una papelera protegida de 168 horas. Para una categoría remota, restaurar no reactiva consentimientos; para la cuenta, el plazo comienza tras confirmación remota, bloquea los perfiles que reciben el estado, admite cancelación confirmada y termina con la purga remota y de cada copia local alcanzada. Una instalación que nunca recibió la programación la aplicará en su siguiente conexión. |
| DC-08 — Fecha y alerta | Fecha y zona al confirmar; alerta local hasta confirmación y archivo local sin repetición en la misma secuencia. |
| DC-09 — Recursos | Selección mediante reglas transparentes no clínicas; validación conjunta de Bienestar Estudiantil y docente responsable. |
| DC-10 — Compatibilidad | Android 10 o superior; emulador API 29 y teléfono físico con 4 GB de RAM. |
| DC-11 — Validación inicial | Solo escenarios sintéticos; no se registran experiencias emocionales reales. |
| DC-12 — Responsabilidad y protección local | Equipo DuocMind como responsable interno; DuocMind confía en el bloqueo del dispositivo Android y no incorpora PIN ni biometría internos. |
| DC-13 — Uso sin conexión | El primer acceso requiere conexión; un perfil autenticado previamente conserva el uso local aunque el token remoto venza, con la sincronización pausada hasta renovarlo. |
| DC-14 — Transferencias | Los datos mínimos de autenticación son indispensables; la sincronización de agenda y datos emocionales fuente es opcional y configurable por categoría. |
| DC-15 — Aviso de cuenta | La aceptación versionada por cuenta y dispositivo precede a la primera operación remota; una actualización material exige nueva aceptación y su rechazo conserva el acceso local, pero suspende nuevas sesiones y sincronización. Recuperación y eliminación podrán continuar solo con otro aviso aceptado, específico y limitado a esos fines. |
| DC-16 — Baja externa | Una cuenta eliminada o deshabilitada externamente bloquea su perfil y permite recuperación o eliminación exclusivamente local mediante papelera, sin atribuir a la aplicación una eliminación remota no confirmada. |

## Dudas abiertas

- **DA-02 — [NECESITA ACLARACIÓN]:** investigar y aprobar el instrumento estructurado: respaldo identificable, permiso o licencia de uso, versión validada en español, adecuación a estudiantes y al alcance no clínico, dimensiones, cantidad de ítems, redacción y opciones de respuesta.
- **DA-03 — [NECESITA ACLARACIÓN]:** definir y validar la interpretación del instrumento, incluyendo puntuación si corresponde, clasificaciones, umbral de resultado negativo, tratamiento entre versiones, pruebas de borde y falsos positivos y regla que relacionará resultados con categorías de recursos.

## Mapa inicial de trazabilidad

| Historia | Requisitos relacionados |
| --- | --- |
| HU-01 | RF-01, RF-02, RF-14 |
| HU-02 | RF-04, RF-05, RF-11 |
| HU-03 | RF-06, RF-08, RF-11 |
| HU-04 | RF-07, RF-08, RF-13 |
| HU-05 | RF-08, RF-09, RF-10 |
| HU-06 | RF-01, RF-10, RF-11 |
| HU-07 | RF-01, RF-02, RF-11, RF-14 |
| HU-08 | RF-03, RF-12, RF-13 |
| HU-09 | RF-01, RF-02, RF-11, RF-12, RF-14 |
| HU-10 | RF-02, RF-13, RF-14 |

Este mapa es inicial. Antes de pasar a APROBADA deberá describir las pruebas previstas; durante la planificación y la implementación se ampliará con tareas, cambios, identificadores de pruebas y resultados, y deberá estar completo antes de considerar finalizado el MVP.

## Comprobación explícita de los seis principios constitucionales

Esta comprobación corresponde al estado BORRADOR. La calificación conforme para borrador indica que la especificación incorpora el principio y sus puertas documentales; no autoriza avanzar a un estado posterior ni sustituye la evidencia de implementación, revisión o pruebas.

| Principio | RF relacionados | RNF relacionados | Contratos e interfaces relacionados | Puerta en criterios de finalización | Resultado en BORRADOR |
| --- | --- | --- | --- | --- | --- |
| I. Especificación primero y trazabilidad completa | RF-01 a RF-14 y todos sus criterios EARS definen comportamiento observable; DA-02 y DA-03 identifican decisiones aún no aprobadas. | RNF-08 exige recorrer criterio, tarea, cambio, prueba y resultado en ambos sentidos. | Cada límite declarado deberá versionarse y vincularse a requisitos, implementación y pruebas cuando corresponda. | Todos los RF y RNF deberán ser comprobables, contar con pruebas y conservar una matriz y evidencia trazables. | Conforme para BORRADOR; DA-02 y DA-03 impiden pasar a APROBADA. |
| II. Arquitectura modular y dependencias controladas | RF-02, RF-03, RF-08, RF-10, RF-11, RF-12 y RF-14 separan cuenta y perfil, consentimiento, reglas, catálogo, operación local, sincronización y recuperación. | RNF-06 y RNF-09 exigen un stack pequeño pendiente de ratificación, dependencias justificadas y separación entre presentación, dominio y datos. | Persistencia local por perfil, autenticación, sincronización opcional, catálogo y presentación o dominio son límites distintos cuyos contratos técnicos se definirán en el plan o ADR. | Los contratos afectados, las dependencias y las decisiones estructurales deberán estar documentados y verificados antes de cerrar el MVP. | Conforme para BORRADOR; la base tecnológica no se considera ratificada hasta el plan técnico o ADR. |
| III. Datos, privacidad y seguridad durante todo el ciclo de vida | RF-01 a RF-03 y RF-11 a RF-14 separan el tratamiento indispensable de autenticación de la sincronización opcional, y definen aislamiento por UID, recuperación, revocación y eliminación, incluida su propagación cuando una instalación vuelve a conectarse; RF-06 a RF-10 restringen el tratamiento emocional. | RNF-01, RNF-02, RNF-05 y RNF-09 exigen minimización, aceptación informada, categorías desactivadas, riesgo alto, protección local, aislamiento, migraciones recuperables y contenido no clínico. | El inventario asigna contenido, finalidad, clasificación, acceso, responsable, retención y eliminación a cuenta, marcador de eliminación, perfiles, avisos, consentimientos, contenido, cola, papelera y catálogo. | El inventario y las reglas de privacidad, amenazas, seguridad, consentimiento, aislamiento, papelera y eliminación deberán revisarse y aportar evidencia, incluidos los dispositivos temporalmente desconectados. | Conforme para BORRADOR; la implementación deberá demostrar la separación de transferencias, el aislamiento de perfiles, la propagación eventual de eliminaciones y el uso exclusivo de datos sintéticos en la validación inicial. |
| IV. Calidad verificable y pruebas automatizadas | RF-01 a RF-14 contienen criterios EARS observables y mantienen identificadores estables. | RNF-08 exige pruebas unitarias, de integración y de extremo a extremo deterministas, regresión primero fallida, bordes, falsos positivos, portón obligatorio, aislamiento de perfiles, trazabilidad y CI completa. | Persistencia por perfil, autenticación, sincronización, catálogo, reglas y presentación forman parte de los alcances de prueba definidos. | Todos los RF y RNF deberán superar pruebas trazables; la CI deberá aprobar y no podrán quedar defectos críticos o altos conocidos. | Conforme para BORRADOR; los identificadores y resultados de pruebas se incorporarán durante planificación e implementación. |
| V. UX, accesibilidad, rendimiento y resiliencia como requisitos técnicos | RF-01, RF-02, RF-05, RF-06 y RF-09 a RF-14 cubren portón de acceso, perfiles, validación, consentimiento, estados, alerta, recursos, operación local posterior a la autenticación, fallos y recuperación. | RNF-03 a RNF-05 fijan accesibilidad, estados de flujo, presupuestos medibles, dispositivo de referencia, atomicidad, persistencia y recuperación. | Presentación o dominio, autenticación, persistencia local por perfil y catálogo concentran los comportamientos perceptibles y resilientes. | Deberán verificarse el primer acceso sin conexión, los flujos locales posteriores, los estados alternativos, la sesión vencida, la accesibilidad, la persistencia, el aislamiento, la seguridad y el rendimiento en emulador API 29 y teléfono Android 10 con 4 GB de RAM. | Conforme para BORRADOR; la plataforma mínima y los entornos representativos quedaron definidos. |
| VI. Integración controlada y entrega reproducible | No aplica directamente: este principio regula el proceso de integración y entrega, no el comportamiento funcional del producto. | RNF-06 y RNF-08 exigen versiones ratificadas, CI completa, checkout limpio, pruebas reproducibles y controles de dependencias o seguridad. | Código, contratos, documentación, ADR, migraciones y notas de versión relacionados deberán actualizarse y versionarse en el mismo cambio. | Git deberá ser la fuente de verdad y la rama principal deberá permanecer protegida e integrable; cada cambio deberá vincular la spec y sus tareas, describir comportamiento, riesgos, pruebas y evidencia, identificar contratos, migraciones y reversión, actualizar juntos los artefactos relacionados, superar CI y recibir revisión independiente; las versiones, variables, artefactos, despliegue y reversión deberán ser reproducibles y trazables. | Condicionado a la futura implementación y entrega: deberá demostrarse instalación, compilación y pruebas reproducibles desde un checkout limpio. |

# Especificación 001 — DuocMind MVP

| Campo | Valor |
| --- | --- |
| Estado | BORRADOR |
| Versión | 0.2.0 |
| Fecha | 2026-09-03 |
| Plataforma del MVP | Android |
| Alcance | Especificación de producto; no incluye diseño técnico ni implementación |

La versión 0.2.0 incorpora la revisión QA del ciclo no clínico. Mantiene deliberadamente pendiente la elección y validación del instrumento emocional.

## Autoridad y trazabilidad

Esta especificación se rige por los principios innegociables de ../../docs/constitution.md y mantiene coherencia operativa con ../../AGENTS.MD. De la guía APT se utilizan únicamente el contexto, el problema, los objetivos y las respuestas del proyecto. Las instrucciones de llenado, evaluación o formato contenidas en esa guía no forman parte de esta solicitud ni se interpretan como órdenes de trabajo.

En caso de contradicción, prevalece la constitución. Cuando esta especificación sea aprobada, cada cambio de comportamiento deberá comenzar con una actualización de la especificación y conservar trazabilidad bidireccional entre requisito, implementación y prueba.

## Contratos e interfaces afectadas

Esta especificación define comportamiento para los siguientes límites. Sus estructuras técnicas se detallarán en el plan de implementación posterior, sin introducirlas en este documento:

- **Persistencia local:** lectura, escritura, actualización, papelera protegida y eliminación definitiva de agenda, check-ins, resultados derivados, alertas, catálogo y operaciones pendientes.
- **Autenticación Supabase:** registro e inicio de sesión mediante correo y contraseña, verificación del correo, recuperación de acceso, sesión, reautenticación, desvinculación y eliminación de cuenta, sin activar sincronización implícita.
- **Sincronización por categoría:** consentimiento por dispositivo, reconciliación bidireccional, conflicto manual, estados local, pendiente, sincronizado, fallido o en conflicto, reintentos y eliminaciones para agenda y datos emocionales fuente.
- **Catálogo local de recursos:** listado y detalle versionado de recursos aprobados conjuntamente por Bienestar Estudiantil y el docente responsable, con fuente, fecha de revisión y enlaces externos permitidos.
- **Presentación y dominio:** acciones de la interfaz en español y resultados de las reglas independientes de agenda, registro emocional, clasificación y alerta.

## Contexto y objetivo

DuocMind será una agenda universitaria para Android orientada a estudiantes de Duoc UC y validada inicialmente con estudiantes de la sede Puerto Montt. Su objetivo es combinar la organización académica manual con un seguimiento emocional cotidiano, privado y no clínico, para ayudar al estudiante a reconocer su carga y acceder oportunamente a recursos de apoyo.

El MVP deberá:

- permitir organizar horarios, tareas y evaluaciones sin depender de integraciones institucionales;
- ofrecer una instancia estructurada de registro emocional una vez por día mediante un instrumento pendiente de investigación y validación;
- conservar un historial personal y presentar una alerta temprana privada ante una secuencia definida de resultados negativos;
- ofrecer una biblioteca de recursos de apoyo;
- funcionar localmente sin registro y sin conexión;
- ofrecer una cuenta opcional para sincronizar, de manera separada y voluntaria, la agenda y los registros emocionales.

DuocMind no realizará diagnósticos, no reemplazará atención profesional ni servicios de emergencia y no contactará automáticamente a terceros.

La validación inicial con estudiantes utilizará exclusivamente escenarios y datos sintéticos. No se solicitarán ni conservarán experiencias emocionales reales durante esta etapa.

## Usuarios

### Usuario principal

Estudiante de Duoc UC que necesita organizar sus compromisos académicos y observar su bienestar emocional. La validación inicial se realizará con estudiantes de la sede Puerto Montt, sin restringir técnicamente el uso de la aplicación a esa sede.

### Modalidades de uso

- **Estudiante en modo local:** usa el núcleo del MVP sin crear una cuenta. Sus datos académicos y emocionales permanecen en el dispositivo.
- **Estudiante con cuenta opcional:** vincula mediante correo y contraseña una única cuenta de Supabase por instalación y decide, por separado y en cada dispositivo, si sincroniza la agenda, los registros emocionales, ambas categorías o ninguna.

El MVP presupone un dispositivo Android personal con un único usuario local. No existirán roles de docente, administrador, familiar, profesional de salud o personal institucional dentro de la aplicación.

## Historias de usuario

- **HU-01:** Como estudiante, quiero comenzar a usar DuocMind sin registrarme, para organizarme sin entregar datos personales.
- **HU-02:** Como estudiante, quiero registrar manualmente mis horarios, tareas y evaluaciones, para visualizar mis compromisos académicos.
- **HU-03:** Como estudiante, quiero aceptar un aviso de privacidad claro y completar un registro emocional estructurado una vez al día, para observar cómo me encuentro sin usar una herramienta diagnóstica.
- **HU-04:** Como estudiante, quiero consultar mi historial y corregir el registro del día, para mantener información personal fiel a mi experiencia.
- **HU-05:** Como estudiante, quiero recibir incluso sin conexión una alerta privada después de tres días negativos consecutivos, mantenerla hasta confirmarla y conocer su causa y recursos de apoyo.
- **HU-06:** Como estudiante, quiero consultar una biblioteca básica de recursos incluso sin conexión, para contar con orientación cuando la necesite.
- **HU-07:** Como estudiante, quiero registrar, verificar, iniciar sesión o recuperar una cuenta mediante correo y contraseña sin perder mis datos locales ni sincronizarlos implícitamente, para habilitar la sincronización solo si después la autorizo.
- **HU-08:** Como estudiante, quiero autorizar o revocar por dispositivo la sincronización académica y emocional, y eliminar datos locales o sincronizados, para controlar qué información se conserva y qué información sale de mi dispositivo.
- **HU-09:** Como estudiante, quiero que los errores y estados pendientes sean claros y recuperables, para no perder información ni creer que algo se sincronizó cuando no fue así.
- **HU-10:** Como estudiante, quiero recuperar elementos eliminados durante siete días y poder eliminar mi cuenta, para corregir errores sin perder el control final de mis datos.

## Convención de criterios de aceptación

Los criterios funcionales utilizan notación EARS en español:

- **Evento:** CUANDO ocurre un evento, EL SISTEMA DEBERÁ responder de una forma observable.
- **Estado:** MIENTRAS se mantiene una condición, EL SISTEMA DEBERÁ conservar un comportamiento.
- **Comportamiento no deseado:** SI ocurre un error o una condición excepcional, ENTONCES EL SISTEMA DEBERÁ responder de una forma segura y verificable.
- **Permanente:** EL SISTEMA DEBERÁ mantener una condición en todos los estados aplicables.

## Requisitos funcionales

### RF-01 — Uso local sin cuenta

La aplicación deberá permitir el uso del núcleo del MVP sin registro ni transmisión de datos personales, académicos o emocionales.

- **CA-RF-01.1:** CUANDO el estudiante abra la aplicación por primera vez, EL SISTEMA DEBERÁ ofrecer una opción visible para continuar sin cuenta.
- **CA-RF-01.2:** MIENTRAS el estudiante use el modo local, EL SISTEMA DEBERÁ conservar en el dispositivo los datos de agenda, check-ins, historial y derivados emocionales y no enviarlos a Supabase ni a terceros.
- **CA-RF-01.3:** SI el estudiante rechaza o abandona la creación de una cuenta, ENTONCES EL SISTEMA DEBERÁ mantener disponibles la agenda manual y la biblioteca y, sujeto a la aceptación del aviso de RF-06, el check-in, el historial y las alertas privadas.

### RF-02 — Cuenta opcional y vinculación posterior

La aplicación deberá permitir registrar, verificar, iniciar sesión, recuperar, vincular y desvincular una cuenta opcional de Supabase mediante correo y contraseña, sin perder los datos creados en modo local.

- **CA-RF-02.1:** CUANDO un estudiante en modo local solicite crear una cuenta, EL SISTEMA DEBERÁ permitir registrarla mediante correo y contraseña y conservar todos sus datos locales durante el proceso.
- **CA-RF-02.2:** CUANDO un estudiante solicite iniciar sesión en una cuenta existente, EL SISTEMA DEBERÁ autenticarla mediante correo y contraseña y conservar sin cambios el conjunto local durante el proceso.
- **CA-RF-02.3:** MIENTRAS el correo de la cuenta no esté verificado, EL SISTEMA DEBERÁ mantener disponible el modo local e impedir la sincronización.
- **CA-RF-02.4:** CUANDO el estudiante solicite recuperar su acceso, EL SISTEMA DEBERÁ iniciar un flujo de restablecimiento de contraseña mediante su correo sin comprometer sus datos locales.
- **CA-RF-02.5:** SI la autenticación, verificación o recuperación falla, se cancela o vence, ENTONCES EL SISTEMA DEBERÁ conservar los datos y el acceso local, mostrar un error genérico en español y no indicar que la cuenta quedó vinculada.
- **CA-RF-02.6:** CUANDO Supabase confirme el registro o el inicio de sesión de una cuenta con correo verificado, EL SISTEMA DEBERÁ vincularla y ofrecer las autorizaciones por dispositivo definidas en RF-03 sin activar ninguna ni enviar o descargar contenido automáticamente.
- **CA-RF-02.7:** MIENTRAS una instalación conserve datos activos o en la papelera asociados a una cuenta previamente vinculada, EL SISTEMA DEBERÁ impedir la vinculación de una cuenta diferente.
- **CA-RF-02.8:** CUANDO el estudiante desvincule la cuenta, EL SISTEMA DEBERÁ cerrar la sesión, desactivar ambas autorizaciones del dispositivo, pausar los envíos de contenido y conservar los datos locales sin interpretar que los datos remotos fueron eliminados.

### RF-03 — Autorización independiente de sincronización

La aplicación deberá administrar por separado y en cada dispositivo el consentimiento para sincronizar la agenda y los datos emocionales fuente.

- **CA-RF-03.1:** CUANDO se instale la aplicación o se vincule una cuenta en un dispositivo, EL SISTEMA DEBERÁ presentar desactivadas las autorizaciones de agenda y datos emocionales, aunque la cuenta las haya autorizado en otro dispositivo.
- **CA-RF-03.2:** CUANDO el estudiante active o reactive una categoría, EL SISTEMA DEBERÁ explicar que la autorización incluirá el envío de datos locales existentes y futuros y la descarga de datos remotos de esa categoría, y solicitar una confirmación explícita.
- **CA-RF-03.3:** MIENTRAS una categoría permanezca desactivada, EL SISTEMA DEBERÁ impedir que su contenido ingrese a la cola de sincronización, sea enviado o sea descargado; una eliminación remota autorizada bajo RF-13 seguirá siendo una operación de privacidad independiente.
- **CA-RF-03.4:** SI el estudiante autoriza solo una categoría, ENTONCES EL SISTEMA DEBERÁ sincronizar exclusivamente esa categoría y conservar la otra únicamente de forma local.
- **CA-RF-03.5:** CUANDO el estudiante confirme la activación o reactivación de una categoría, EL SISTEMA DEBERÁ incluir en la reconciliación sus datos locales existentes y sus cambios futuros, incluidos los creados mientras estuvo desactivada.
- **CA-RF-03.6:** MIENTRAS la agenda esté autorizada, EL SISTEMA DEBERÁ limitar su contenido sincronizable a horarios, tareas, evaluaciones y sus estados de eliminación.
- **CA-RF-03.7:** MIENTRAS los datos emocionales estén autorizados, EL SISTEMA DEBERÁ limitar su contenido sincronizable a las respuestas fuente, la fecha local, el instante UTC, la zona horaria y la versión del instrumento.
- **CA-RF-03.8:** MIENTRAS se use cualquier modalidad, EL SISTEMA DEBERÁ mantener resultados, clasificaciones, secuencias, alertas y su historial únicamente en el dispositivo y derivarlos de los datos fuente.
- **CA-RF-03.9:** MIENTRAS una categoría esté autorizada, EL SISTEMA DEBERÁ limitar los metadatos técnicos auxiliares a identificadores opacos de cuenta, entidad y operación, categoría, acción, versión, estado e idempotencia necesarios para autorizar, correlacionar y confirmar la transferencia, sin incorporar resultados emocionales derivados.

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
- **CA-RF-09.8:** MIENTRAS se use cualquier modalidad, EL SISTEMA DEBERÁ mantener la alerta activa y su historial archivado exclusivamente en el dispositivo.

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

Las funciones principales deberán permanecer disponibles localmente cuando no exista conexión.

- **CA-RF-11.1:** MIENTRAS el dispositivo no tenga conexión, EL SISTEMA DEBERÁ permitir consultar y gestionar la agenda, completar el check-in, consultar el historial, calcular y mostrar alertas, acceder a la biblioteca y gestionar la papelera local.
- **CA-RF-11.2:** CUANDO una operación local válida sea confirmada, EL SISTEMA DEBERÁ persistirla antes de mostrarla como guardada y conservarla después de un cierre y reapertura normales.
- **CA-RF-11.3:** SI falla la persistencia local, ENTONCES EL SISTEMA DEBERÁ informar que la operación no fue guardada, mantener íntegro el contenido mientras la pantalla y el proceso continúen activos y ofrecer reintentar.
- **CA-RF-11.4:** SI se interrumpe el guardado de un check-in o la actualización de sus derivados, ENTONCES EL SISTEMA DEBERÁ recuperar el último estado completo y no mostrar combinaciones parciales como válidas.
- **CA-RF-11.5:** SI se detecta almacenamiento corrupto o una migración incompleta, ENTONCES EL SISTEMA DEBERÁ impedir el uso de datos parciales, conservar la copia recuperable y mostrar el estado de recuperación en español.

La autenticación, la sincronización y la apertura de enlaces externos no se consideran funciones disponibles sin conexión.

### RF-12 — Reconciliación, cola y reintento de sincronización

La aplicación deberá sincronizar en ambos sentidos las categorías autorizadas por dispositivo usando Wi-Fi o datos móviles, conservar operaciones pendientes y resolver manualmente los conflictos.

- **CA-RF-12.1:** CUANDO una operación pertenezca a una categoría autorizada y no pueda sincronizarse, EL SISTEMA DEBERÁ conservarla localmente con estado pendiente.
- **CA-RF-12.2:** MIENTRAS existan operaciones pendientes, EL SISTEMA DEBERÁ mostrar su estado sin presentarlas como sincronizadas.
- **CA-RF-12.3:** CUANDO se recupere la conexión y la sesión siga vigente, EL SISTEMA DEBERÁ reintentar automáticamente las operaciones autorizadas cuyo ciclo de intentos no se haya agotado.
- **CA-RF-12.4:** SI la aplicación se cierra durante un envío, ENTONCES EL SISTEMA DEBERÁ conservar la identidad estable y el estado de la operación sin confirmación para reconciliarla sin crear duplicados.
- **CA-RF-12.5:** CUANDO Supabase confirme una operación, EL SISTEMA DEBERÁ marcarla como sincronizada una sola vez.
- **CA-RF-12.6:** MIENTRAS una solicitud remota autorizada espere confirmación, EL SISTEMA DEBERÁ cerrar cada intento como timeout después de 15 segundos sin respuesta.
- **CA-RF-12.7:** CUANDO una operación autorizada inicie un ciclo automático, EL SISTEMA DEBERÁ limitarlo a cinco intentos totales: el primero se ejecutará 5 segundos después del inicio del ciclo y, si cada intento falla por red, timeout, limitación temporal o indisponibilidad, los siguientes se ejecutarán respectivamente 15, 30, 60 y 120 segundos después del fallo anterior.
- **CA-RF-12.8:** MIENTRAS una operación esté pendiente o fallida, EL SISTEMA DEBERÁ persistir su contador, próximo intento y último resultado, sin reiniciarlos al cerrar o reabrir la aplicación.
- **CA-RF-12.9:** SI se agotan sin confirmación los cinco intentos automáticos del ciclo, ENTONCES EL SISTEMA DEBERÁ marcar la operación como fallida y exigir un reintento manual para iniciar un ciclo nuevo.
- **CA-RF-12.10:** SI Supabase rechaza una operación por autenticación, autorización o validación, ENTONCES EL SISTEMA DEBERÁ detener los reintentos automáticos, conservar el dato local y solicitar la acción correctiva correspondiente.
- **CA-RF-12.11:** CUANDO se active o reactive una categoría, o la aplicación se inicie o reanude con conexión, EL SISTEMA DEBERÁ recuperar primero el estado remoto de esa categoría autorizada y compararlo con el estado local antes de transferir cambios.
- **CA-RF-12.12:** CUANDO un dato exista solo en Supabase y no presente conflicto, EL SISTEMA DEBERÁ guardarlo localmente para que quede disponible sin conexión.
- **CA-RF-12.13:** MIENTRAS una categoría permanezca desactivada, EL SISTEMA DEBERÁ impedir tanto el envío de su contenido local como la descarga de su contenido remoto.
- **CA-RF-12.14:** SI un mismo dato presenta cambios locales y remotos incompatibles, ENTONCES EL SISTEMA DEBERÁ conservar ambas versiones, mostrar sus diferencias y solicitar al estudiante que elija cuál mantener.
- **CA-RF-12.15:** CUANDO el estudiante resuelva un conflicto, EL SISTEMA DEBERÁ conservar como activa la versión elegida, trasladar la descartada a la papelera y reanudar únicamente las operaciones dependientes de ese dato.
- **CA-RF-12.16:** SI un lote obtiene confirmaciones parciales, ENTONCES EL SISTEMA DEBERÁ actualizar cada operación por separado y reintentar solo las no confirmadas.
- **CA-RF-12.17:** SI se pierde localmente una confirmación remota, ENTONCES EL SISTEMA DEBERÁ consultar la identidad estable de la operación antes de reenviarla y evitar un efecto duplicado.
- **CA-RF-12.18:** MIENTRAS varias operaciones no confirmadas afecten el mismo dato, EL SISTEMA DEBERÁ conservar su orden lógico: crear y editar enviará la versión final, crear y eliminar antes del primer envío no transferirá contenido, y eliminar un dato ya remoto conservará la operación de eliminación.
- **CA-RF-12.19:** MIENTRAS los datos emocionales estén autorizados, EL SISTEMA DEBERÁ transferir exclusivamente los campos fuente enumerados en CA-RF-03.7 y los metadatos técnicos auxiliares limitados por CA-RF-03.9.

### RF-13 — Revocación, papelera y eliminación de cuenta

La aplicación deberá permitir revocar la sincronización, recuperar durante siete días todo dato eliminado y eliminar de forma autoservicio los datos y la cuenta con alcances diferenciados.

- **CA-RF-13.1:** CUANDO el estudiante desactive la sincronización de una categoría, EL SISTEMA DEBERÁ detener nuevos envíos y descargas de contenido y cancelar sus altas o cambios pendientes no confirmados, sin cancelar eliminaciones remotas ya autorizadas.
- **CA-RF-13.2:** MIENTRAS una categoría permanezca desactivada, EL SISTEMA DEBERÁ conservar sus nuevas operaciones solo de forma local.
- **CA-RF-13.3:** CUANDO el estudiante confirme la eliminación de un elemento, una categoría o su cuenta, EL SISTEMA DEBERÁ trasladar el alcance seleccionado a una papelera protegida durante 168 horas antes de su eliminación definitiva.
- **CA-RF-13.4:** MIENTRAS un dato esté en la papelera, EL SISTEMA DEBERÁ ocultarlo de los flujos activos, excluirlo de cálculos y permitir su restauración al mismo alcance.
- **CA-RF-13.5:** CUANDO transcurran 168 horas desde una eliminación confirmada sin restauración, EL SISTEMA DEBERÁ eliminar definitivamente el dato del alcance solicitado y retirar su copia recuperable.
- **CA-RF-13.6:** CUANDO el estudiante elimine datos desde los controles de privacidad, EL SISTEMA DEBERÁ permitir elegir agenda o datos emocionales y distinguir entre dispositivo, Supabase o ambos alcances.
- **CA-RF-13.7:** CUANDO el estudiante solicite eliminar una categoría completa del dispositivo, de Supabase o de ambos, o solicite eliminar su cuenta, EL SISTEMA DEBERÁ desactivar en ese dispositivo la sincronización de cada categoría afectada y, si el alcance incluye Supabase, mostrar la eliminación como programada únicamente después de la confirmación remota.
- **CA-RF-13.8:** MIENTRAS exista una eliminación remota de categoría o cuenta autorizada y pendiente o programada, EL SISTEMA DEBERÁ darle precedencia, conservarla aunque se revoque la categoría e impedir reactivar cada categoría afectada.
- **CA-RF-13.9:** SI la revocación ocurre mientras un envío ya está en tránsito, ENTONCES EL SISTEMA DEBERÁ registrar cualquier confirmación posterior por su alcance real y no afirmar que el envío fue cancelado.
- **CA-RF-13.10:** SI se solicita una eliminación remota sin conexión o sesión válida, ENTONCES EL SISTEMA DEBERÁ informar que aún no fue programada y conservar la solicitud local únicamente con autorización explícita.
- **CA-RF-13.11:** SI una eliminación solicitada para dispositivo y Supabase se completa solo en un alcance, ENTONCES EL SISTEMA DEBERÁ mostrar por separado el resultado local y remoto y mantener pendiente o fallido el alcance restante.
- **CA-RF-13.12:** CUANDO el estudiante solicite eliminar su cuenta, EL SISTEMA DEBERÁ requerir reautenticación, programar primero la eliminación de sus datos remotos y después la identidad de autenticación, ambas con el período recuperable de siete días.
- **CA-RF-13.13:** MIENTRAS la eliminación de cuenta esté programada, EL SISTEMA DEBERÁ mantener disponible el modo local y permitir cancelar la eliminación mediante reautenticación.
- **CA-RF-13.14:** CUANDO la eliminación definitiva de la cuenta sea confirmada, EL SISTEMA DEBERÁ conservar los datos del dispositivo como un conjunto exclusivamente local, sin permitir vincular otra cuenta mientras ese conjunto o su papelera no hayan sido eliminados definitivamente.
- **CA-RF-13.15:** SI el estudiante elige eliminar solo del dispositivo y conserva una copia remota, ENTONCES EL SISTEMA DEBERÁ advertir que esa copia podrá descargarse después de una nueva autorización.
- **CA-RF-13.16:** SI el estudiante elige eliminar solo de Supabase y conserva una copia local, ENTONCES EL SISTEMA DEBERÁ advertir que una autorización futura podrá volver a enviarla.
- **CA-RF-13.17:** SI Supabase no confirma una programación o eliminación remota, ENTONCES EL SISTEMA DEBERÁ conservar su estado como pendiente o fallido y nunca mostrarla como completada.
- **CA-RF-13.18:** CUANDO un elemento individual de agenda o un check-in pase a la papelera o sea restaurado y su categoría esté autorizada, EL SISTEMA DEBERÁ tratar ese estado como un cambio ordinario de la categoría sin desactivar su sincronización.

### RF-14 — Errores y recuperación

La aplicación deberá comunicar los errores en español, proteger el contenido ingresado y representar fielmente el estado de la sincronización.

- **CA-RF-14.1:** SI ocurre un error recuperable de red, timeout, indisponibilidad, sesión vencida o rechazo remoto temporal, ENTONCES EL SISTEMA DEBERÁ explicar la acción posible en español, conservar íntegro el contenido mientras la pantalla y el proceso sigan activos y permitir reintentar.
- **CA-RF-14.2:** SI la sesión vence con operaciones pendientes, ENTONCES EL SISTEMA DEBERÁ pausar sus envíos, conservarlos localmente y solicitar una nueva autenticación.
- **CA-RF-14.3:** MIENTRAS Supabase no haya confirmado una operación, EL SISTEMA DEBERÁ distinguir su estado local, remoto y de eliminación como pendiente o fallido, pero nunca como sincronizado, programado o eliminado.
- **CA-RF-14.4:** SI un error incluye detalles internos o datos sensibles, ENTONCES EL SISTEMA DEBERÁ ocultarlos al usuario y evitar registrarlos en trazas no protegidas.
- **CA-RF-14.5:** SI una migración, lectura o escritura local falla, ENTONCES EL SISTEMA DEBERÁ conservar el último estado completo recuperable y no presentar datos parciales como válidos.
- **CA-RF-14.6:** SI una confirmación remota se pierde o un lote termina parcialmente, ENTONCES EL SISTEMA DEBERÁ mostrar el resultado por operación y mantener sin confirmar solo los alcances pendientes.

## Inventario y ciclo de vida de datos

El equipo DuocMind será el responsable interno de definir y verificar los controles del MVP. El estudiante conservará el control funcional de sus datos. Bienestar Estudiantil y el docente responsable validarán únicamente el contenido de apoyo y no tendrán acceso a registros académicos o emocionales.

| Conjunto | Contenido y validación mínima | Finalidad | Clasificación | Acceso y sincronización | Responsable | Retención | Eliminación |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Agenda | Identidad estable, tipo, título, asignatura opcional, campos temporales, versión y marcas de tiempo; validaciones de RF-04 y RF-05. | Organizar compromisos académicos definidos manualmente por el estudiante. | Personal confidencial. | Estudiante en su dispositivo; Supabase solo con consentimiento de agenda vigente en ese dispositivo. | Equipo DuocMind como responsable interno; el estudiante controla el contenido y sus alcances. | Activa hasta que el estudiante solicite eliminarla. | Papelera protegida durante 168 horas y posterior purga del alcance elegido, salvo restauración. |
| Datos emocionales fuente | Respuestas estructuradas, fecha local, instante UTC, zona horaria y versión del instrumento; unicidad por fecha y validación del instrumento aprobado. | Registrar las respuestas elegidas por el estudiante y permitir cálculos locales no clínicos. | Información interna de riesgo alto y potencial dato personal sensible. | Estudiante en su dispositivo; Supabase solo con consentimiento emocional vigente en ese dispositivo. | Equipo DuocMind como responsable interno; el estudiante controla el contenido y sus alcances. | Activos hasta que el estudiante solicite eliminarlos. | Papelera protegida durante 168 horas y posterior purga del alcance elegido, salvo restauración. |
| Datos emocionales derivados | Resultado, clasificación, versión de la regla, secuencia, alerta activa y alertas archivadas; deberán corresponder a una fuente y versión válidas. | Explicar localmente el resultado no clínico, detectar la secuencia y sostener el ciclo de la alerta. | Información interna de riesgo alto y potencial dato personal sensible. | Exclusivamente local; nunca se enviarán a Supabase ni a terceros. | Equipo DuocMind como responsable interno; el estudiante controla su consulta y eliminación. | Se conservan mientras sus fuentes sigan activas o durante el plazo recuperable correspondiente. | Se recalculan o eliminan con sus fuentes; al pasar a papelera se excluyen de inmediato y se purgan a las 168 horas. |
| Cuenta y sesión | Correo, identificador remoto, verificación y referencia segura de sesión; correo válido y estados confirmados por Supabase. La contraseña y los tokens no formarán parte de la persistencia común. | Autenticar al estudiante y habilitar la sincronización voluntaria. | Dato personal y secreto de autenticación, según corresponda. | Estudiante y límite confiable de Supabase; referencia de sesión protegida localmente. | Equipo DuocMind como responsable interno de la integración; Supabase dentro del límite remoto definido. | Hasta la eliminación definitiva de la cuenta o el cierre de la sesión, según el dato. | La eliminación de cuenta se programa con recuperación durante 168 horas y luego se purgan identidad y datos remotos confirmados. |
| Consentimientos | Dispositivo, categoría, estado, instante y versión del aviso aceptado; ambas categorías comienzan desactivadas. | Demostrar y aplicar las decisiones del estudiante sobre aviso emocional y sincronización por categoría. | Metadato personal confidencial. | Local por dispositivo; solo se conserva evidencia remota mínima cuando sea necesaria para autorizar contenido transmitido. | Equipo DuocMind como responsable interno; el estudiante otorga, rechaza o revoca cada autorización. | Hasta revocación, sustitución por una decisión posterior o eliminación de cuenta. | La evidencia se purga junto con el alcance local o remoto asociado, respetando la papelera aplicable. |
| Cola y conflictos | Identificadores técnicos opacos de cuenta, entidad y operación, categoría, acción, versión, estado, idempotencia, intentos, próximo intento, último resultado y versiones en conflicto. | Ejecutar sincronización recuperable, autorizada, correlacionable, idempotente y con resolución manual. | Hereda la clasificación del contenido relacionado. | Local; Supabase recibe únicamente los metadatos técnicos mínimos delimitados en CA-RF-03.9 y el estado remoto necesario. | Equipo DuocMind como responsable interno; el estudiante decide la versión activa en un conflicto. | Hasta confirmación, cancelación, agotamiento resuelto o resolución del conflicto. | Las operaciones concluidas se depuran de forma segura; las versiones descartadas pasan a la papelera durante 168 horas. |
| Papelera protegida | Copia recuperable, alcance, instante de eliminación, fecha de purga y estado local o remoto. | Permitir reversión antes de una eliminación definitiva y hacer visible el estado real de cada alcance. | Hereda la clasificación del dato eliminado. | Solo el estudiante; local y/o Supabase según el alcance confirmado. | Equipo DuocMind como responsable interno; el estudiante puede restaurar dentro del plazo. | Exactamente 168 horas desde la confirmación de la eliminación. | Purga definitiva al vencer el plazo, salvo restauración previa; cada alcance requiere confirmación propia. |
| Catálogo de recursos | Nombre, propósito, tipo de apoyo, canal, fuente, dominio permitido, versión, validadores, fecha de revisión y vigencia. | Ofrecer orientación y acceso voluntario a apoyo sin personalización clínica. | Contenido público sin datos personales. | Incluido localmente para todos los usuarios; no forma parte de la sincronización de cuenta. | Equipo DuocMind mantiene el catálogo; Bienestar Estudiantil y el docente responsable lo validan conjuntamente. | Se conserva la versión íntegra vigente y la anterior necesaria para una actualización recuperable. | Un recurso vencido deja de publicarse como vigente; el catálogo se revisa antes de cada entrega y como máximo cada seis meses. |

El MVP no recopilará telemetría. Desarrollo, pruebas, demostraciones, evidencias y validación con estudiantes utilizarán datos sintéticos; esta última no admitirá narrativas ni experiencias emocionales reales.

## Requisitos no funcionales

### RNF-01 — Privacidad y minimización

- El almacenamiento local será el comportamiento predeterminado.
- La aplicación tratará únicamente los campos y finalidades declarados en el inventario de datos.
- Los datos emocionales fuente, resultados e inferencias se clasificarán internamente como información de riesgo alto y potenciales datos personales sensibles.
- No habrá telemetría en el MVP.
- Desarrollo, pruebas, demostraciones y evidencias deberán usar datos sintéticos o realmente anonimizados.
- La validación inicial con estudiantes usará exclusivamente escenarios sintéticos y no registrará experiencias emocionales reales.
- Cada dato sincronizado deberá corresponder a una categoría con autorización vigente y demostrable.
- Antes del primer check-in, la aplicación deberá obtener la aceptación del aviso definido en RF-06; rechazarlo bloqueará solo el módulo emocional.
- Toda eliminación seguirá la retención recuperable de 168 horas definida en RF-13 y en el inventario.
- Un piloto futuro con datos personales reales requerirá una especificación separada y revisión previa de privacidad, amenazas, licitud y autorización institucional aplicable.

### RNF-02 — Seguridad

- Toda comunicación con Supabase deberá usar transporte cifrado.
- Las credenciales, sesiones y secretos no deberán almacenarse en texto plano ni incorporarse al repositorio.
- Los datos emocionales y la papelera almacenados en el dispositivo deberán protegerse mediante almacenamiento cifrado o protegido por Android y no podrán persistirse en archivos, cachés, respaldos o exportaciones en texto plano.
- El acceso remoto deberá restringirse al propietario de los datos mediante autenticación y políticas de acceso por fila.
- Los registros técnicos no deberán contener respuestas emocionales, tokens, credenciales ni datos académicos sensibles.
- Las validaciones críticas de autorización y pertenencia no deberán depender solo de la interfaz.
- La contraseña será tratada exclusivamente por el límite de autenticación y nunca se conservará en la persistencia común de la aplicación.
- Cuenta, sincronización, conflictos, papelera, restauración y eliminación deberán contar con revisión de amenazas y privacidad antes de implementarse.
- Los controles de autorización, aislamiento entre cuentas, almacenamiento protegido y ausencia de datos sensibles en registros deberán producir evidencia de prueba.

### RNF-03 — Accesibilidad

- Los flujos críticos deberán cumplir las prácticas aplicables de WCAG 2.2 nivel AA y accesibilidad de Android.
- Los controles deberán contar con nombre accesible, orden de foco comprensible, áreas táctiles de al menos 48 por 48 dp y compatibilidad con texto ampliado sin pérdida de contenido o funcionalidad.
- La información no deberá depender exclusivamente del color, y los textos y controles deberán mantener contraste suficiente.
- Los mensajes de error deberán identificar el problema y la acción correctiva de manera perceptible para tecnologías de asistencia.
- Cada recorrido aplicable deberá especificar y verificar estados de carga, vacío, éxito, error, datos inválidos, consentimiento denegado y conectividad ausente.
- Los mensajes de bienestar deberán ser claros, empáticos, no alarmistas y consistentes con el alcance no clínico.

### RNF-04 — Rendimiento

- Desde un inicio en frío, la pantalla de inicio deberá mostrar su contenido local y aceptar interacción en un máximo de dos segundos en el percentil 95.
- La navegación local hacia agenda, registro emocional, historial o biblioteca deberá mostrar contenido y aceptar interacción en un máximo de un segundo en el percentil 95.
- Una operación que cumpla RF-05 o RF-06 deberá confirmar su guardado local en un máximo de un segundo en el percentil 95, sin contar una sincronización remota.
- Los reintentos de sincronización no deberán bloquear la interacción con las funciones locales.
- La sincronización transferirá solo cambios y limitará cada solicitud a 100 operaciones o 512 KB, lo que ocurra primero.
- Después de recuperar conectividad o reanudar la aplicación, el primer reintento autorizado deberá comenzar dentro de cinco segundos.

La medición se realizará con al menos 30 muestras sobre un teléfono físico Android 10 con 4 GB de RAM y una carga local de 500 elementos académicos y 365 check-ins. Un emulador reproducible con Android 10, API 29, verificará compatibilidad y recorridos automatizados. Las cargas indicadas son el volumen mínimo garantizado para los presupuestos, no un límite de creación.

### RNF-05 — Persistencia y confiabilidad

- Una operación no podrá presentarse como guardada antes de que la persistencia local sea confirmada.
- Los datos confirmados localmente deberán sobrevivir al cierre del proceso, a una detención forzada posterior al guardado y al reinicio del dispositivo; no se exige conservarlos después de desinstalar o borrar los datos de la aplicación.
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
- Si se ratifica, Supabase será el único servicio remoto para autenticación, sincronización y programación de eliminaciones del MVP.
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
- Los flujos críticos de modo local, aviso de privacidad, cuenta, agenda, check-in, historial, alerta offline, biblioteca, sincronización, conflicto manual, papelera y eliminación de cuenta deberán cubrirse con pruebas de extremo a extremo.
- Las pruebas deberán ser deterministas, independientes y repetibles. Una prueba inestable deberá registrar responsable, tarea de corrección y plazo, y no podrá ignorarse indefinidamente.
- Toda corrección deberá incorporar primero una prueba que reproduzca el defecto y después demostrar que dejó de ocurrir.
- La matriz deberá permitir recorrer especificación, criterio, tarea, cambio, prueba y resultado en ambos sentidos.
- La integración continua deberá ejecutar, según el alcance, formato, análisis estático, verificación de tipos, pruebas automatizadas, compilación y controles de dependencias o seguridad desde un checkout limpio.
- Las pruebas deberán cubrir autorización por dispositivo, no sincronización de derivados, timeout y reintentos, parcialidad, confirmación perdida, atomicidad, migraciones, corrupción, enlaces permitidos, accesibilidad y presupuestos de rendimiento.

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
| Sesión vencida con operaciones pendientes | Se pausa la cola, se mantienen los datos locales y se solicita autenticación antes de reanudar. |
| Desvinculación con operaciones pendientes | Se cierra la sesión, se pausan los envíos y las operaciones permanecen ligadas a la cuenta anterior; no pueden transferirse a otra cuenta. |
| Intento de vincular otra cuenta | Se bloquea mientras existan datos activos o en papelera ligados a la cuenta anterior. |
| Revocación durante un envío | No se afirma una cancelación imposible; toda confirmación tardía se registra por su alcance real y una eliminación autorizada conserva precedencia. |
| Crear, editar y eliminar antes de sincronizar | La cola conserva el orden lógico y transmite solo el efecto final definido en CA-RF-12.18. |
| Lote parcialmente confirmado | Cada operación conserva su propio resultado y solo se reintentan las no confirmadas. |
| Confirmación remota perdida localmente | Se consulta la identidad de la operación antes de reenviar para impedir efectos duplicados. |
| Conflicto entre dos dispositivos | Se conservan y muestran ambas versiones; el estudiante elige una y la descartada pasa a la papelera. |
| Eliminación con éxito en un solo alcance | Los estados local y remoto se muestran por separado y el alcance restante permanece pendiente o fallido. |
| Restauración antes de siete días | El dato vuelve al mismo alcance, recupera su estado activo y provoca el recálculo local que corresponda. |
| Vencimiento de la papelera | Al cumplir 168 horas sin restauración se purga la copia recuperable del alcance correspondiente. |
| Eliminación remota solicitada sin conexión | Se informa que aún no fue programada y solo se conserva localmente con autorización explícita. |
| Desinstalación con eliminación remota | Una programación ya confirmada por Supabase continúa en el servidor; una solicitud que solo era local puede perderse y no se presenta como confirmada. |
| Reactivación con eliminación remota integral pendiente | La categoría permanece bloqueada hasta que la eliminación completa de la categoría o de la cuenta termine o sea restaurada. |
| Eliminación de cuenta con fallo parcial | La identidad no se presenta como eliminada mientras los datos remotos o la cuenta no hayan recibido confirmación independiente. |
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
- perfiles múltiples, bloqueo interno o separación entre varias personas en un mismo dispositivo;
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
- los flujos críticos de uso sin cuenta, aviso de privacidad, cuenta, agenda, check-in, historial, alerta, recursos, sincronización, conflicto manual, papelera, revocación y eliminación de cuenta funcionen según esta especificación;
- agenda, check-in, historial, alertas, papelera y recursos funcionen localmente sin conexión;
- se hayan verificado accesibilidad, atomicidad, migraciones, persistencia, aislamiento, seguridad y objetivos de rendimiento;
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

## Decisiones cerradas en la versión 0.2.0

| Decisión | Resultado |
| --- | --- |
| DC-01 — Autenticación | Correo y contraseña, verificación de correo y recuperación de acceso. |
| DC-02 — Identidad por instalación | Una sola cuenta; otra cuenta requiere la eliminación definitiva previa del conjunto local y su papelera. |
| DC-03 — Sincronización emocional | Solo respuestas fuente, fecha local, UTC, zona horaria y versión del instrumento; los derivados son locales. |
| DC-04 — Consentimiento | Separado por categoría, por dispositivo y desactivado inicialmente. |
| DC-05 — Red y reintentos | Wi-Fi o datos móviles; timeout de 15 segundos y cinco intentos totales por ciclo, a los 5, 15, 30, 60 y 120 segundos según RF-12. |
| DC-06 — Conflictos | Elección manual entre ambas versiones; la descartada pasa a papelera. |
| DC-07 — Eliminación | Toda eliminación usa una papelera protegida de siete días; incluye eliminación autoservicio de cuenta. |
| DC-08 — Fecha y alerta | Fecha y zona al confirmar; alerta local hasta confirmación y archivo local sin repetición en la misma secuencia. |
| DC-09 — Recursos | Selección mediante reglas transparentes no clínicas; validación conjunta de Bienestar Estudiantil y docente responsable. |
| DC-10 — Compatibilidad | Android 10 o superior; emulador API 29 y teléfono físico con 4 GB de RAM. |
| DC-11 — Validación inicial | Solo escenarios sintéticos; no se registran experiencias emocionales reales. |
| DC-12 — Responsabilidad y dispositivo | Equipo DuocMind como responsable interno; dispositivo personal con un único usuario local. |

## Dudas abiertas

- **DA-02 — [NECESITA ACLARACIÓN]:** investigar y aprobar el instrumento estructurado: respaldo identificable, permiso o licencia de uso, versión validada en español, adecuación a estudiantes y al alcance no clínico, dimensiones, cantidad de ítems, redacción y opciones de respuesta.
- **DA-03 — [NECESITA ACLARACIÓN]:** definir y validar la interpretación del instrumento, incluyendo puntuación si corresponde, clasificaciones, umbral de resultado negativo, tratamiento entre versiones, pruebas de borde y falsos positivos y regla que relacionará resultados con categorías de recursos.

## Mapa inicial de trazabilidad

| Historia | Requisitos relacionados |
| --- | --- |
| HU-01 | RF-01, RF-11, RF-14 |
| HU-02 | RF-04, RF-05, RF-11 |
| HU-03 | RF-06, RF-08, RF-11 |
| HU-04 | RF-07, RF-08, RF-13 |
| HU-05 | RF-08, RF-09, RF-10 |
| HU-06 | RF-10, RF-11 |
| HU-07 | RF-02, RF-03, RF-12 |
| HU-08 | RF-03, RF-12, RF-13 |
| HU-09 | RF-05, RF-11, RF-12, RF-13, RF-14 |
| HU-10 | RF-02, RF-13, RF-14 |

Este mapa es inicial. Antes de pasar a APROBADA deberá describir las pruebas previstas; durante la planificación y la implementación se ampliará con tareas, cambios, identificadores de pruebas y resultados, y deberá estar completo antes de considerar finalizado el MVP.

## Comprobación explícita de los seis principios constitucionales

Esta comprobación corresponde al estado BORRADOR. La calificación conforme para borrador indica que la especificación incorpora el principio y sus puertas documentales; no autoriza avanzar a un estado posterior ni sustituye la evidencia de implementación, revisión o pruebas.

| Principio | RF relacionados | RNF relacionados | Contratos e interfaces relacionados | Puerta en criterios de finalización | Resultado en BORRADOR |
| --- | --- | --- | --- | --- | --- |
| I. Especificación primero y trazabilidad completa | RF-01 a RF-14 y todos sus criterios EARS definen comportamiento observable; DA-02 y DA-03 identifican decisiones aún no aprobadas. | RNF-08 exige recorrer criterio, tarea, cambio, prueba y resultado en ambos sentidos. | Cada límite declarado deberá versionarse y vincularse a requisitos, implementación y pruebas cuando corresponda. | Todos los RF y RNF deberán ser comprobables, contar con pruebas y conservar una matriz y evidencia trazables. | Conforme para BORRADOR; DA-02 y DA-03 impiden pasar a APROBADA. |
| II. Arquitectura modular y dependencias controladas | RF-02, RF-03, RF-08, RF-10, RF-11, RF-12 y RF-14 separan cuenta, consentimiento, reglas, catálogo, operación local, sincronización y recuperación. | RNF-06 y RNF-09 exigen un stack pequeño pendiente de ratificación, dependencias justificadas y separación entre presentación, dominio y datos. | Persistencia local, autenticación, sincronización, catálogo y presentación o dominio son límites distintos cuyos contratos técnicos se definirán en el plan o ADR. | Los contratos afectados, las dependencias y las decisiones estructurales deberán estar documentados y verificados antes de cerrar el MVP. | Conforme para BORRADOR; la base tecnológica no se considera ratificada hasta el plan técnico o ADR. |
| III. Datos, privacidad y seguridad durante todo el ciclo de vida | RF-01 a RF-03 y RF-11 a RF-14 definen privacidad por defecto, consentimiento, recuperación, revocación y eliminación; RF-06 a RF-10 restringen el tratamiento emocional. | RNF-01, RNF-02, RNF-05 y RNF-09 exigen minimización, riesgo alto, protección local, aislamiento, migraciones recuperables y contenido no clínico. | El inventario asigna contenido, finalidad, clasificación, acceso, responsable, retención y eliminación a cada conjunto tratado por persistencia, autenticación, sincronización, papelera y catálogo. | El inventario y las reglas de privacidad, amenazas, seguridad, consentimiento, papelera y eliminación deberán revisarse y aportar evidencia. | Conforme para BORRADOR; la implementación deberá demostrar los controles y usar solo datos sintéticos en la validación inicial. |
| IV. Calidad verificable y pruebas automatizadas | RF-01 a RF-14 contienen criterios EARS observables y mantienen identificadores estables. | RNF-08 exige pruebas unitarias, de integración y de extremo a extremo deterministas, regresión primero fallida, bordes, falsos positivos, trazabilidad y CI completa. | Persistencia, autenticación, sincronización, catálogo, reglas y presentación forman parte de los alcances de prueba definidos. | Todos los RF y RNF deberán superar pruebas trazables; la CI deberá aprobar y no podrán quedar defectos críticos o altos conocidos. | Conforme para BORRADOR; los identificadores y resultados de pruebas se incorporarán durante planificación e implementación. |
| V. UX, accesibilidad, rendimiento y resiliencia como requisitos técnicos | RF-05, RF-06 y RF-09 a RF-14 cubren validación, consentimiento, estados, alerta, recursos, operación local, fallos y recuperación. | RNF-03 a RNF-05 fijan accesibilidad, estados de flujo, presupuestos medibles, dispositivo de referencia, atomicidad, persistencia y recuperación. | Presentación o dominio, persistencia local y catálogo concentran los comportamientos perceptibles y resilientes. | Deberán verificarse flujos locales, estados alternativos, accesibilidad, persistencia, seguridad y rendimiento en emulador API 29 y teléfono Android 10 con 4 GB de RAM. | Conforme para BORRADOR; la plataforma mínima y los entornos representativos quedaron definidos. |
| VI. Integración controlada y entrega reproducible | No aplica directamente: este principio regula el proceso de integración y entrega, no el comportamiento funcional del producto. | RNF-06 y RNF-08 exigen versiones ratificadas, CI completa, checkout limpio, pruebas reproducibles y controles de dependencias o seguridad. | Código, contratos, documentación, ADR, migraciones y notas de versión relacionados deberán actualizarse y versionarse en el mismo cambio. | Git deberá ser la fuente de verdad y la rama principal deberá permanecer protegida e integrable; cada cambio deberá vincular la spec y sus tareas, describir comportamiento, riesgos, pruebas y evidencia, identificar contratos, migraciones y reversión, actualizar juntos los artefactos relacionados, superar CI y recibir revisión independiente; las versiones, variables, artefactos, despliegue y reversión deberán ser reproducibles y trazables. | Condicionado a la futura implementación y entrega: deberá demostrarse instalación, compilación y pruebas reproducibles desde un checkout limpio. |

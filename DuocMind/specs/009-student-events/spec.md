# Spec 009 — Eventos y agenda personal

| Campo | Valor |
| --- | --- |
| Versión | 0.1.2 |
| Estado | APROBADA |
| Fecha | 2026-10-11 |
| Incremento | 009-student-events |
| Constitución | 2.0.0 |
| Plataformas | Android, previsualización web, panel administrativo y backend local |
| Aprobación | Confirmada explícitamente por el usuario el 2026-10-11 |

## 1. Problema y resultado esperado

El estudiante necesita descubrir eventos institucionales, conocer su descripción,
ubicación, fechas y condiciones de inscripción, y agregar los que le interesan a
su horario personal para verlos en el día correspondiente.

El panel ya administra `evento_institucional` con descripción, ubicación, inicio,
término y estados de borrador, publicado y cancelado. No configura inscripción.
La app no consume ese catálogo. La pantalla «Mi agenda» guarda actividades
locales, asume bloques de una hora y todavía no integra eventos institucionales.
El horario de clases mostrado en el dashboard contiene datos de muestra.

Este incremento integra eventos reales en «Mi agenda». No acredita un horario
académico real ni importa clases desde sistemas institucionales.

## 2. Alcance propuesto

- Acceso «Eventos» con icono de calendario dentro de Bienestar y un segundo acceso
  discreto en la esquina superior derecha del inicio del estudiante (`/dashboard`),
  junto a los controles actuales del encabezado.
- Pantalla de eventos con lista cronológica, selección de fecha, detalle y acceso
  a eventos anteriores. Cada evento informa título, descripción, ubicación,
  fecha, inicio, término y condiciones de inscripción.
- Consumo del catálogo institucional administrado desde el panel existente,
  ocultando borradores y mostrando cancelaciones que fueron publicadas.
- Configuración administrativa de inscripción requerida, enlace HTTPS,
  fecha límite y cierre manual.
- Inscripción mediante el enlace externo configurado por Bienestar. La app no
  recibe ni almacena respuestas del formulario y no afirma inscripción exitosa.
- Agregar o quitar un evento de la agenda personal, conservando su identidad,
  fecha, intervalo real y ubicación, sin duplicados.
- Consulta y cambios de los eventos guardados sin conexión después del primer
  acceso válido, con aislamiento por cuenta y persistencia cifrada en Android.
- Migraciones y verificaciones reproducibles con backend local y datos sintéticos.

Fuera de alcance:

- Inscripción interna, cupos, listas de asistentes, pagos, asistencia y listas de espera.
- Calendarios del sistema, Google Calendar, notificaciones y recordatorios automáticos.
- Segmentación por sede o carrera, eventos recurrentes y recomendaciones por ánimo.
- Sincronización de intereses entre dispositivos y nuevas funciones del horario de clases.
- Despliegues y aplicación de migraciones remotas sin autorización específica.

## 3. Requisitos funcionales

### RF-001 — Navegación y catálogo

1. Bienestar y el inicio del estudiante ofrecen acceso a la misma pantalla de
   «Eventos». En el inicio se usa un icono de calendario de aproximadamente 20 px,
   arriba a la derecha, con estilo coherente con la campana y el perfil actuales.
   Su área táctil es de al menos 44 × 44 px y su etiqueta accesible es «Ver eventos».
   No incorpora animación permanente ni indicadores llamativos. En pantallas
   estrechas y con texto ampliado, los controles no se superponen ni ocultan el saludo.
   La pantalla de Eventos permite regresar al origen y abrir «Mi agenda».
2. La lista inicial presenta eventos no finalizados ordenados por inicio. El
   estudiante puede consultar fechas específicas y eventos anteriores.
3. Lista y detalle muestran información real del catálogo. Si falta descripción,
   se comunica su ausencia; no se inventa contenido.
4. Se distinguen los estados «Próximo», «En curso», «Finalizado» y «Cancelado».
   Una cancelación prevalece sobre el estado temporal.
5. Fechas y horas se presentan en `America/Santiago`, coherentes con el panel,
   indicando esa zona y conservando el instante cuando cambia el horario de verano.
6. Un evento que abarca varios días aparece en las fechas que ocupa. El término
   exacto marca su finalización y no genera una aparición adicional si coincide
   con la medianoche del día siguiente.
7. La pantalla ofrece «Próximos», «Por fecha» y «Anteriores». «Por fecha» muestra
   un calendario mensual con indicación de días con eventos y la lista del día
   elegido; elegir una fecha no cambia el filtro de la agenda personal.
8. Cada tarjeta permite abrir su detalle y distingue visualmente si el evento ya
   está en la agenda. Un día vacío informa «No hay eventos para esta fecha».

### RF-002 — Condiciones de inscripción

1. El panel permite elegir «No requiere inscripción» o «Requiere inscripción».
2. Cuando se requiere inscripción, publicar exige enlace HTTPS válido y fecha
   límite igual o anterior al inicio. Puede cerrarse manualmente antes del plazo.
3. La interfaz muestra «No requiere inscripción», «Inscripciones abiertas» o
   «Inscripciones cerradas» y, cuando corresponda, la fecha y hora límite.
4. La inscripción está cerrada si se alcanza el plazo, se cierra manualmente,
   comienza el evento o se cancela. En el instante exacto del plazo ya está cerrada.
5. Solo un evento publicado con inscripción abierta ofrece «Inscribirme».
   La acción informa que abre un sitio externo y no envía datos automáticamente.
6. Guardar el evento en la agenda no confirma inscripción ni reserva un cupo.
   El mensaje de guardado recuerda la inscripción cuando sigue siendo necesaria.
7. Los estados temporales se actualizan mientras la pantalla está abierta y al
   volver a primer plano, sin exigir que el estudiante recargue manualmente.
8. Los eventos existentes se conservan como «No requiere inscripción» hasta que
   el funcionario configure esa condición. Publicación, cancelación, revisión y
   manejo de conflictos administrativos conservan sus garantías actuales.
9. Un cierre manual informa «Cerrada por la organización»; un cierre por plazo
   informa «El plazo de inscripción terminó». Un evento iniciado o finalizado
   informa ese estado y no ofrece inscripción, aunque su configuración sea incorrecta.
10. El funcionario puede reabrir un cierre manual solo si el evento sigue publicado,
    no ha comenzado y su plazo es futuro. Ampliar un plazo requiere guardar una
    revisión válida; la app usa la información nuevamente confirmada por el backend.
11. Antes de abrir el enlace, la app consulta las condiciones vigentes. Si el
    evento cerró o fue cancelado, muestra el estado actualizado. Si no puede
    verificarlas, no abre el enlace y permite reintentar. No promete que un formulario
    externo mantenga cupos ni que siga abierto después de la verificación.

### RF-003 — Eventos en la agenda personal

1. Cada evento no finalizado ni cancelado permite «Agregar a mi agenda». Un cierre
   de inscripción no impide guardar el interés, pero su estado se muestra claramente.
2. Guardar persiste una referencia y la información mínima para mostrar el evento
   sin conexión. Solo se confirma éxito después de completar la escritura.
3. Repetir la acción no genera duplicados. Un evento guardado ofrece «En mi agenda»,
   «Ver en mi agenda» y «Quitar de mi agenda».
4. «Ver en mi agenda» abre el día del evento. La agenda combina actividades
   personales y eventos por hora, mostrando título, ubicación y duración real.
   Los eventos institucionales no se reducen a bloques de una hora.
5. Si un evento coincide con otra actividad, se muestran ambas. Agregarlo no
   sobrescribe la actividad ni cambia su horario.
6. Los eventos guardados permanecen consultables en su fecha una vez finalizados.
   La agenda debe permitir seleccionar esas fechas para consultar dichos eventos.
7. Al actualizar el catálogo, los eventos guardados reflejan modificaciones de
   contenido y cancelaciones. Una cancelación se señala en la agenda y no borra
   el interés silenciosamente; el estudiante puede quitarlo. Si cambian fecha,
   horario o ubicación, se informa «Este evento cambió» con los valores anteriores
   y nuevos, y se ofrecen «Actualizar en mi agenda» o «Quitar de mi agenda».
   Hasta decidir, la agenda conserva el intervalo guardado con «Cambio pendiente»;
   el detalle del catálogo muestra la versión vigente. No se mueve una actividad
   guardada silenciosamente.
8. Quitar un evento elimina únicamente el interés personal; no altera el catálogo
   institucional ni cancela una eventual inscripción externa.
9. Eliminar un interés o volver de Eventos a Agenda actualiza la pantalla sin
   reiniciar la app. Un fallo conserva el estado confirmado y permite reintentar.
10. Si una actualización válida deja de incluir un evento guardado, se conserva
    su copia con «Información no disponible» y opción de quitarlo. No se deduce
    que fue cancelado ni se elimina como consecuencia de un error de red.
11. Los eventos guardados se identifican como «Evento institucional». Su contenido
    se consulta desde el catálogo y no se edita con el formulario de actividades
    personales. Quitar desde cualquiera de las dos pantallas modifica el mismo interés.

### RF-004 — Offline, cuentas y conservación

1. Después de una descarga válida, el catálogo puede consultarse sin conexión.
   Se informa la última actualización y que los datos pueden haber cambiado.
2. Sin conexión se pueden agregar y quitar eventos del catálogo guardado. La
   inscripción externa requiere conexión; nunca se afirma un estado remoto vigente
   usando solamente la copia local.
3. Los intereses son privados de la cuenta autenticada: cambiar de cuenta no
   revela ni modifica intereses de otra persona. No se envían intereses al panel.
4. En Android, los intereses y sus copias se guardan cifrados; se conservan al cerrar
   sesión para el próximo acceso de su propietario y se eliminan al borrar la cuenta.
5. Se conserva solo identificador de evento, información para su presentación,
   revisión de origen y fecha de guardado; no se guarda contexto emocional ni
   información de inscripción externa. Se conserva hasta que el propietario lo
   quite o elimine su cuenta. Las claves permanecen en almacenamiento seguro.
6. Los fallos de descarga no reemplazan un catálogo válido por una lista vacía.
   Antes del primer acceso, la ausencia de conexión se informa con opción de reintento.
7. Las actividades personales existentes se conservan; cualquier ajuste de su
   almacenamiento necesario para integrar los eventos se define en el plan y se
   verifica sin asignar datos heredados a una cuenta arbitrariamente.
8. Un resultado de descarga iniciado con una cuenta no puede actualizar los
   intereses ni la pantalla de otra cuenta si la sesión cambia antes de completarse.
   Tampoco se permite que una escritura antigua reintroduzca un interés eliminado.

### RF-005 — Administración y validación

1. El editor existente incorpora las condiciones de inscripción en un apartado
   propio. Al elegir «No requiere inscripción», no se mantienen un enlace o plazo
   activos que puedan confundirse con una inscripción disponible.
2. Un borrador puede guardarse incompleto, pero publicar exige título, ubicación,
   fechas válidas y condiciones de inscripción completas cuando correspondan.
   El requisito se comprueba también en el backend, no solo en el formulario.
3. La fecha límite se edita e interpreta en la misma zona horaria que el evento.
   Una fecha u hora local inexistente o ambigua se resuelve antes de confirmar.
4. El editor explica que los eventos ya guardados pueden quedar con un cambio
   pendiente al modificar fecha, horario o ubicación. Guardar no informa que todos
   los dispositivos ya recibieron la actualización.
5. Un conflicto de revisión conserva el formulario y permite recargar el evento
   confirmado. Las nuevas condiciones no omiten las comprobaciones administrativas
   de actor, sesión, permiso e idempotencia existentes.

## 4. Recorridos y estados observables

### Descubrir y guardar

Inicio → calendario del encabezado → Eventos → detalle → «Agregar a mi agenda»
→ confirmación «Evento agregado a tu agenda» → «Ver en mi agenda» → fecha del evento.
Si requiere inscripción abierta, la confirmación añade «Recuerda inscribirte para
participar» y el detalle mantiene la acción «Inscribirme» por separado.

Bienestar → Eventos llega al mismo catálogo. Al volver, se regresa a la pantalla
desde la que se abrió. La selección de fecha se conserva al volver del detalle.

### Condiciones y acciones

| Condición confirmada | Información visible | Inscribirme | Agregar a mi agenda |
| --- | --- | --- | --- |
| Próximo, sin inscripción | No requiere inscripción | No se muestra | Disponible |
| Próximo, con inscripción y plazo futuro | Inscripciones abiertas · fecha límite | Disponible con conexión y verificación | Disponible |
| Próximo, cierre manual | Inscripciones cerradas · cerrada por la organización | No se muestra | Disponible, sin confirmar participación |
| Próximo, plazo alcanzado | Inscripciones cerradas · el plazo terminó | No se muestra | Disponible, sin confirmar participación |
| En curso | En curso; inscripción cerrada si la requiere | No se muestra | Disponible |
| Finalizado | Finalizado | No se muestra | No disponible para un nuevo interés |
| Cancelado después de publicarse | Cancelado | No se muestra | No disponible para un nuevo interés |
| Borrador o nunca publicado | No aparece en la app | No se muestra | No disponible |

Las filas describen eventos todavía no guardados. Si ya está guardado, se ofrecen
«Ver en mi agenda» y «Quitar de mi agenda», incluso si terminó o fue cancelado.
La condición de inscripción y el estado del evento se expresan con textos distintos.
Sin conexión, se identifica la información como última copia disponible y se
deshabilita la inscripción externa, conservando las acciones locales sobre la agenda.

### Cambio de horario o cancelación

Actualizar catálogo → detectar cambio de fecha, intervalo o lugar de un evento
guardado → mostrar datos anteriores y nuevos → aceptar actualización o quitar.
Aceptar mueve la única referencia existente y actualiza las fechas de la agenda;
no agrega una segunda actividad. Cancelar el evento conserva la tarjeta, marcada
«Cancelado», hasta que el estudiante decida quitarla.

### Recorrido administrativo

Panel → Eventos → crear o editar → configurar condiciones de inscripción → guardar
borrador → publicar → consultar el evento en la app. Cerrar o reabrir inscripción
actualiza una revisión confirmada. Los mensajes del panel diferencian el guardado
del borrador, la publicación y el cierre de inscripción.

## 5. Calidad y acceso

- RLS y permisos conservan ocultos los borradores y las escrituras administrativas
  siguen exigiendo autorización vigente. La app usa únicamente configuración publicable.
- Se validan contratos externos, fechas, estados y URLs. No se incluyen secretos,
  sesiones, intereses personales ni datos emocionales en logs.
- La arquitectura respeta rutas mínimas y separación de presentación, casos de
  uso e infraestructura; lo utilizado por Eventos y Agenda vive en una capa compartida.
- Se presentan estados de carga, vacío, error y offline, con acciones accesibles,
  texto legible, objetivos táctiles y movimiento reducido conforme a la guía.
- Se prueban reloj, zona horaria, almacenamiento, errores y cambio de cuenta con
  datos sintéticos. La prueba Android es obligatoria antes de cerrar el incremento.

## 6. Criterios de aceptación

| Criterio | Resultado observable | Comprobación prevista |
| --- | --- | --- |
| CA-001 | Bienestar y el calendario del encabezado del inicio abren Eventos; lista y detalle muestran contenido publicado y sus fechas, ubicación y descripción. El calendario es discreto, accesible y no se superpone a los controles ni al saludo. | Recorrido Android/web con pantalla estrecha, texto ampliado y lector de pantalla; contratos con catálogo sintético y borradores ocultos. |
| CA-002 | El panel guarda borradores y publica condiciones de inscripción válidas sin perder eventos existentes; permite cierre manual y reapertura antes del plazo. | Backend local, contratos y recorrido administrativo con enlace/plazo inválidos, reloj controlado, revisión y conflicto; llamada directa sin permisos. |
| CA-003 | Estados de inscripción y evento cambian correctamente en límites temporales, cierre manual y cancelación. | Dominio con reloj controlado y comprobación de primer plano. |
| CA-004 | Inscribirme verifica condiciones vigentes y solo abre un enlace externo válido cuando corresponde; guardar interés no confirma inscripción. | Recorrido sintético con evento abierto, cerrado, libre, iniciado y cancelado; cierre entre carga y pulsación y fallo de verificación. |
| CA-005 | Agregar dos veces crea un único interés; aparece en su fecha con duración real y ubicación. | Persistencia y recorrido Eventos → Agenda, reinicio y coincidencia con actividad existente. |
| CA-006 | Quitar actualiza ambas pantallas; fallos no afirman éxito ni pierden actividades. | Fallos de almacenamiento y reintentos, regreso a Agenda y datos heredados. |
| CA-007 | Eventos de varios días y finalizados se presentan en las fechas correctas. Reprogramaciones requieren decisión; cancelaciones y eventos no disponibles conservan la copia identificada en la agenda. | Reloj controlado, medianoche, horario de verano, aceptar/quitar cambios y actualización del catálogo sin duplicados ni pérdida del interés. |
| CA-008 | Catálogo e intereses funcionan offline en Android y conservan datos confirmados. | Development build sin red, reinicio, descarga fallida y lectura de la última actualización. |
| CA-009 | Dos cuentas no comparten intereses, incluso con descargas en curso; eliminar una cuenta borra su información y claves locales. | Dos cuentas sintéticas, cierre/cambio de sesión durante descarga/escritura, eliminación y verificación del cifrado Android. |
| CA-010 | Navegación, accesibilidad y funcionalidades actuales conservan su comportamiento. | Typecheck, pruebas aplicables de app/panel/backend, build/E2E administrativos y recorrido Android. |
| CA-011 | El calendario de Eventos permite elegir fechas, indica días con eventos y distingue fechas vacías; el detalle conserva la selección al volver. | Recorrido Android/web con meses consecutivos, fecha vacía, eventos de varios días y regreso al listado. |

## 7. Decisiones propuestas y aprobación

Se propone mantener el acceso en Bienestar y añadir el calendario discreto arriba
a la derecha del inicio, solicitado por el usuario. Se usa «Mi agenda» como horario
personal y se inscribe mediante el enlace externo del evento. La solicitud no especifica
inscripción interna ni cupos: esos mecanismos requerirían otro alcance.

Esta spec fue aprobada explícitamente por el usuario el 2026-10-11. Conforme a la
constitución y a `AGENTS.md`, el plan se redacta después de esta aprobación; las
tareas se redactan después de aprobar el plan y la implementación comienza
después de aprobarlas.
No se presume una excepción al orden ni autorización para cambios remotos.

### Revisión 0.1.2 — 2026-10-11

Se incorpora el calendario discreto del inicio solicitado por el usuario y se
completan selección de fechas, recorridos, estados de inscripción, revalidación
del enlace, administración y manejo de reprogramaciones. Esta versión se aprobó
explícitamente el 2026-10-11, sin excepciones al orden de desarrollo.

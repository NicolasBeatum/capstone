# Spec 013 — Horario por semestre y actividades locales

| Campo | Valor |
| --- | --- |
| Versión | 0.1.2 |
| Estado | APROBADA |
| Fecha | 2026-10-18 |
| Constitución | 2.0.0 |
| Plataformas | Android y previsualización web |
| Rama | `feature/agenda-semestres` |
| Base | `origin/dev`, commit `0c6246501c34fc8430bc034b11affb01970092b4`, actualizado el 2026-10-18 |
| Aprobación | Confirmada explícitamente por el usuario el 2026-10-18: «apruebo la spec entonces con ehste cambio», incluida la sala independiente por bloque. |

## 1. Problema y resultado esperado

La agenda guarda actividades en el dispositivo, pero no tiene un horario de
clases real. El inicio muestra una clase, próximas evaluaciones y una sugerencia
de carga semanal escritos como datos de muestra. La lista de asignaturas de la
spec 011 depende de inscripciones en un catálogo institucional que no cubre
necesariamente las distintas mallas del estudiante.

La persona necesita escribir sus ramos, distribuirlos en bloques semanales y
conservar varios horarios agrupados por semestre. Debe poder elegir qué semestre
está activo sin perder los anteriores. El horario se sincroniza con su cuenta;
pruebas, tareas y actividades personales permanecen locales.

La solicitud adicional permite copiar o mover actividades entre semestres como
una opción de organización local. El usuario aclaró expresamente que no solicita
sincronizarlas entre dispositivos.

Ejemplo: «Semestre 1 — 2026» contiene un ramo escrito manualmente, con clases los
lunes de 08:30 a 10:00 y los miércoles de 11:00 a 12:30. Al activar «Semestre 2 —
2026», esas clases dejan de alimentar el horario activo y el inicio; el semestre
anterior sigue disponible. Una actividad general conserva su fecha y puede
asociarse, copiarse o moverse a otro semestre mediante una acción explícita.

## 2. Alcance

- Crear, renombrar, consultar y editar semestres propios, con uno activo como
  máximo por cuenta. Activar otro es una acción explícita.
- Crear, editar y eliminar ramos personales dentro de un semestre, sin depender
  de los catálogos institucionales de carrera o asignatura.
- Registrar varios bloques semanales por ramo, con inicio y término libres.
- Guardar semestres, ramos, bloques y elección del semestre activo en Supabase,
  con copia local y cambios pendientes para Android sin conexión.
- Mostrar las clases reales del semestre activo en la agenda y el inicio.
- Conservar pruebas, tareas y actividades personales en el dispositivo, con
  aislamiento por cuenta y organización opcional por semestre.
- Ofrecer copia o traslado de actividades entre semestres, sin sincronización
  remota de su contenido y sin cambios de fecha implícitos.
- Retirar los datos académicos de muestra del inicio y mantener los eventos
  institucionales existentes.
- Entregar migraciones versionadas y verificaciones locales con datos sintéticos.

Fuera de alcance: importar mallas o datos desde Duoc UC; modificar el catálogo
institucional; compartir horarios con otras personas; notificaciones; calendarios
externos; sincronizar actividades personales; duplicar semestres completos;
gestionar asistencia o notas; excepciones por feriados, cancelaciones de una clase
concreta y recurrencias más complejas que la semanal; desplegar o aplicar cambios
remotos sin autorización específica.

## 3. Requisitos funcionales

### RF-001 — Semestres y elección del horario activo

1. La persona puede crear un semestre con nombre obligatorio y editable, por
   ejemplo «Semestre 1 — 2026». El nombre no obliga a un año ni a una malla.
2. Crear el primer semestre lo deja activo. Crear uno posterior no cambia el
   activo sin una elección explícita de la persona.
3. Puede haber como máximo un semestre activo por cuenta. Su elección se
   sincroniza y cambiarla no borra ni modifica el contenido de otros semestres.
4. Cada semestre puede tener fechas opcionales de inicio y término. Si ambas
   existen, el término no puede ser anterior al inicio. Las clases se repiten
   solo dentro de los límites indicados, inclusive; sin límites se repiten
   mientras ese horario sea el elegido para la agenda.
5. Llegar al término no elimina ni cambia automáticamente el semestre activo.
   Fuera de su vigencia no aparecen clases y se ofrece gestionar los semestres.
6. Un semestre anterior se puede consultar y editar sin activarlo. La interfaz
   distingue claramente el semestre que se consulta del activo.
7. Este incremento no incorpora eliminación completa de semestres. Así se evita
   borrar por accidente horarios anteriores y referencias de actividades locales.

### RF-002 — Ramos escritos manualmente

1. Un ramo pertenece a un semestre del propietario y exige únicamente un nombre
   no vacío. Sigla y sección son campos separados y opcionales.
2. La sigla es el código del ramo y la sección identifica el grupo. No se exige
   una lista institucional ni se obliga a completar códigos para guardar.
3. Los ramos creados son privados; no se insertan en el catálogo público
   `asignatura` ni se interpretan como inscripciones oficiales.
4. Se permite repetir un nombre en semestres distintos y tener secciones
   distintas del mismo ramo. La selección distingue los ramos por sus datos.
5. Eliminar un ramo explica que elimina también sus bloques. Exige confirmación
   y no elimina pruebas, tareas ni actividades asociadas, que conservan su nombre
   de ramo como texto.

### RF-003 — Bloques semanales

1. Cada ramo admite cero o más bloques. Cada bloque exige día de la semana,
   hora de inicio y hora de término, con precisión de minutos.
2. El término debe ser posterior al inicio dentro del mismo día. No se impone
   una duración de una hora ni una cuadrícula de bloques institucionales.
3. Se pueden tener varios bloques el mismo día y en días diferentes.
4. Sala y docente son opcionales por bloque, para admitir diferencias entre
   clases del mismo ramo. Por ejemplo, un ramo puede tener el bloque del lunes
   en la sala 301 y el del miércoles en el laboratorio 402. Editar la sala de
   un bloque no modifica las salas de los demás bloques del ramo. La interfaz
   omite los datos ausentes.
5. Los bloques se pueden crear, editar y eliminar. No se aceptan duplicados
   exactos del mismo ramo, día e intervalo.
6. Un solapamiento con otro bloque muestra una advertencia con ambos intervalos;
   la persona puede conservarlo mediante confirmación. Dos bloques consecutivos
   que comparten solo el límite de término/inicio no se solapan.
7. La repetición usa día y hora civil de `America/Santiago`; un cambio de horario
   de verano no desplaza una clase de 08:30 a otra hora local.

### RF-004 — Agenda e inicio con datos reales

1. La agenda combina, para la fecha elegida, clases del semestre activo,
   actividades locales y eventos institucionales guardados. Se distinguen sus
   tipos y se ordenan por hora con un criterio estable para empates.
2. Las clases muestran su intervalo real, ramo y los datos opcionales disponibles.
   Una clase terminada se puede consultar en el día correspondiente.
3. El inicio calcula clase en curso, avance, tiempo restante y próxima clase con
   los bloques reales y la vigencia del semestre activo. En un solapamiento se
   informa que hay más de una clase en curso, sin presentar una como única.
4. Sin horario, sin clases hoy o entre clases se muestran estados reales y una
   acción útil para configurar o consultar el horario; nunca una clase ficticia.
5. Los próximos pendientes y cualquier texto sobre carga académica se basan en
   las actividades locales existentes. Si no hay datos suficientes, se usa un
   estado vacío o se omite la sugerencia; no se inventan pruebas ni entregas.
6. Los estados temporales se recalculan al volver a primer plano y mientras la
   pantalla permanece abierta. El inicio exacto incluye la clase y su término
   exacto la considera finalizada.
7. Al crear una prueba o tarea, el formulario usa el semestre activo y exige
   elegir uno de sus ramos manuales. No ofrece otros semestres ni una opción de
   organización. Las actividades personales ofrecen ramo opcional del semestre activo y se
   crean generales. La actividad conserva el nombre usado al guardarla; editar
   o eliminar un ramo no reescribe su contenido histórico.

### RF-005 — Actividades locales y traslado opcional

1. Pruebas, tareas y actividades personales se guardan localmente por cuenta.
   Se distinguen mediante un tipo y no se envían a Supabase. El formulario ofrece
   hora de inicio y hora de término, con término posterior dentro del mismo día.
   Las actividades anteriores sin término explícito conservan su duración de una hora.
   El intervalo elegido se conserva al editar, recargar, copiar, mover o cambiar
   de semestre y determina su visualización y estado temporal en agenda/inicio.
2. Una actividad nueva de tipo personal es general y ofrece un ramo opcional del semestre activo o «Sin ramo».
   Una prueba o tarea nueva se asocia al semestre activo y a un ramo de él.
   El formulario no permite elegir otros semestres. Editar una actividad
   académica anterior conserva su semestre y nombre de ramo históricos; el
   traslado sigue siendo una acción explícita en la gestión de actividades.
   Cambiar de tipo académico a personal retira su asociación al semestre; puede conservar un ramo del activo como texto opcional.
   Las asociaciones hechas mediante copia/traslado se conservan al editar,
   sin reasignar datos guardados automáticamente.
3. Cambiar el semestre activo no borra, copia ni cambia las fechas, tipos o ramos
   guardados de las actividades, incluso al alternar de ida y vuelta por error.
   La agenda por fecha sigue mostrando las actividades locales del día; su
   asociación a un semestre permite organizarlas y seleccionarlas para traslado.
4. La persona puede seleccionar actividades y elegir «Mover» o «Copiar», con un
   semestre de destino propio. También puede dejarlas como generales.
5. Mover cambia la asociación local y conserva la identidad, tipo, título, ramo
   e intervalo. Copiar crea actividades con identidades nuevas en el destino y
   conserva los originales. Copiar requiere un destino distinto de la asociación
   de origen.
6. Antes de confirmar se muestran las actividades seleccionadas, destino y
   fechas. Las fechas originales se conservan por defecto; pueden editarse de
   forma explícita antes de guardar. No se calcula un desfase automático entre
   semestres.
7. Un fallo de persistencia no pierde originales ni deja un traslado parcial.
   Un reintento de la misma operación no crea copias adicionales.
8. La interfaz informa que esas actividades pertenecen a ese dispositivo: abrir
   la cuenta en otro recupera los horarios, pero no sus actividades locales.
9. Las actividades heredadas del almacén compartido no tienen propietario
   verificable. No se asignan automáticamente a la primera cuenta que entra ni
   se exponen al cambiar de cuenta. El plan debe definir una recuperación
   explícita con advertencia sobre el origen incierto, sin destruir el almacén
   anterior ni incorporarlo silenciosamente a otra cuenta.

### RF-006 — Persistencia y sincronización del horario

1. Guardar confirma primero la persistencia local del cambio. La interfaz
   distingue «Guardado en este dispositivo», «Pendiente de sincronizar»,
   «Sincronizado», error y conflicto cuando corresponda.
2. Tras un primer acceso válido, Android permite leer y editar semestres, ramos,
   bloques y la elección del horario activo sin conexión. Los cambios pendientes
   sobreviven al cierre y reinicio de la app.
3. Al recuperar conexión o volver a primer plano se reintenta la sincronización.
   La misma operación no duplica semestres, ramos ni bloques.
4. La misma cuenta en otro dispositivo recupera los datos confirmados en
   Supabase. Una descarga fallida no borra la última copia local válida.
5. Si dos dispositivos modifican una misma versión de un dato, no se sobrescribe
   silenciosamente ninguna edición. Se muestran el conflicto y opciones claras
   para conservar la versión local o recuperar la remota.
6. La activación de un semestre mantiene la unicidad incluso con cambios
   concurrentes. Un fallo no deja activaciones parciales.
7. Respuestas o reintentos iniciados por una cuenta no pueden actualizar la
   información de otra después de cerrar sesión o cambiar de cuenta.

## 4. Privacidad, arquitectura y compatibilidad

- Horarios y actividades son datos personales privados. Las lecturas y
  escrituras remotas aplican sesión y RLS por propietario, también en las
  relaciones entre semestre, ramo y bloque. No se usan claves privilegiadas en
  la app ni decisiones de autorización basadas en metadatos editables.
- La copia operativa de Android y las actividades locales quedan cifradas y
  aisladas por cuenta. Cerrar sesión impide su acceso desde otra cuenta; eliminar
  la cuenta limpia los datos correspondientes. El plan detalla conservación,
  borrado remoto, amenazas, recuperación y límites de las copias offline.
- La previsualización web usa únicamente datos sintéticos y no acredita cifrado
  nativo, funcionamiento offline Android ni sincronización entre dispositivos.
- No se registran en logs nombres de ramos, docentes, actividades, credenciales
  ni sesiones. Los contratos y sus relaciones se validan en sus límites.
- Pantallas y componentes usan casos de uso; no consultan directamente Supabase
  ni SQLite. La información común de agenda e inicio vive en una capa compartida
  conforme a `AGENTS.md`, sin imports internos entre funcionalidades.
- Los catálogos e inscripciones existentes se conservan. Este incremento cambia
  el origen del selector de ramos de la spec 011 para las actividades de agenda,
  sin reinterpretar los ramos personales como inscripciones institucionales.
- Los eventos institucionales mantienen sus condiciones de inscripción, estados,
  copia local e integración. Sus intereses no se trasladan entre semestres.
- Toda interfaz nueva usa español, etiquetas accesibles, objetivos táctiles de
  al menos 44 px, `ScalePress`, `GotaLoader` y movimiento reducido existentes.
- Las migraciones son nuevas, versionadas y verificables. No se editan
  retrospectivamente las migraciones ya aplicadas.

## 5. Criterios de aceptación

| ID | Resultado observable | Verificación prevista |
| --- | --- | --- |
| CA-001 | Crear dos semestres y alternar el activo conserva ambos horarios y como máximo uno activo. | Dominio, persistencia, SQL y recorrido de interfaz. |
| CA-002 | Un ramo se guarda solo con nombre; sigla, sección, sala y docente pueden omitirse. | Validación de contratos y formulario. |
| CA-003 | Un ramo acepta lunes 08:30–10:00 en sala 301 y miércoles 11:00–12:30 en laboratorio 402; la agenda recupera ambos intervalos y sus salas tras reiniciar. Editar una sala no cambia la del otro bloque. | Dominio, almacenamiento y Android. |
| CA-004 | Fechas opcionales, término exacto, bloques consecutivos y hora Santiago se resuelven correctamente. | Pruebas con reloj controlado, incluidos cambios de horario de verano. |
| CA-005 | Duplicados e intervalos inválidos se rechazan; solapamientos se advierten y requieren confirmación. | Dominio y recorrido del formulario. |
| CA-006 | Dos cuentas no leen ni modifican horarios, referencias o actividades de la otra. | SQL de RLS con cuentas sintéticas y pruebas locales de cambio de cuenta. |
| CA-007 | Sin red se guardan cambios que sobreviven a reinicio; al reconectar se sincronizan sin duplicados y se recuperan en otro cliente. | Pruebas de servicio con fallos y recorrido Android con backend de prueba. |
| CA-008 | Cambios concurrentes conservan ambas versiones hasta resolver el conflicto; la elección activa sigue siendo única. | Integración SQL/servicio con dos clientes. |
| CA-009 | Inicio y agenda muestran datos reales, intervalos y vacíos; desaparecen las clases y pendientes ficticios. | Pruebas de proyección, revisión de código y recorrido de interfaz. |
| CA-010 | Cambiar semestre de ida y vuelta conserva actividades completas, fechas, intervalos y ramos guardados. | Almacenamiento local y regresión. |
| CA-011 | Mover conserva la actividad; copiar conserva el original y crea una copia con nuevo identificador; reintentos y fallos no duplican ni dejan cambios parciales. | Pruebas de operación local y recorrido con confirmación. |
| CA-012 | Ninguna prueba, tarea o actividad personal se envía al backend, tampoco al copiarla o moverla. | Pruebas del límite de sincronización y revisión de las solicitudes. |
| CA-013 | Datos heredados no se atribuyen ni se borran automáticamente; cerrar sesión, cambiar cuenta y eliminarla cumplen el aislamiento y la limpieza definidos. | Regresión de almacenamiento y autenticación con datos sintéticos. |
| CA-014 | Los eventos institucionales guardados conservan su comportamiento y coexisten con clases y actividades locales. | Suite existente y regresión de composición. |
| CA-015 | Las comprobaciones aplicables del repositorio pasan y el recorrido nativo se verifica sin conexión y tras reinicio. | Typecheck, pruebas del proyecto, backend local y validación Android antes de cerrar. |
| CA-016 | Crear y editar una actividad con inicio/fin variables persiste el intervalo tras recarga y copia/traslado; rechaza término inválido y mantiene una hora para registros anteriores. Agenda e inicio respetan su término exacto. | Persistencia, estado temporal y recorrido de formulario. |

## 6. Decisiones recogidas de la conversación

- El 2026-10-18, el usuario confirmó sigla y sección opcionales, ramos escritos
  manualmente, varios bloques por ramo y sala/docente opcionales.
- Aclaró que cada bloque semanal puede tener una sala diferente, incluso dentro
  del mismo ramo. La sala se guarda y edita de forma independiente por bloque.
- Propuso agrupar horarios en semestres y elegir el activo. Este borrador concreta
  la conservación de los anteriores, las fechas opcionales y la ausencia de
  eliminación o cambios automáticos.
- Solicitó sincronizar el horario y conservar pruebas y demás actividades en
  local. Luego aclaró que «migrar actividades personales» significa copiarlas o
  moverlas entre semestres, sin sincronizarlas entre dispositivos.
- Autorizó una rama nueva desde los últimos cambios de `dev`. Se actualizó
  `origin/dev` y se creó `feature/agenda-semestres` en el commit indicado arriba.
- Las reglas sobre advertencias de solapamiento, fechas opcionales, organización
  de actividades y recuperación de datos heredados quedaron aprobadas junto con
  este documento el 2026-10-18.

## 7. Aprobación y pasos posteriores

La spec 0.1.0 está aprobada explícitamente desde el 2026-10-18, incluida la
aclaración de RF-003.4 y CA-003 sobre salas diferentes por bloque. Conforme a la
constitución, sección III, y `DuocMind/AGENTS.md`, el siguiente paso es redactar
y aprobar el plan; después, redactar y aprobar las tareas antes de implementar.

La aplicación de migraciones remotas, despliegues, commits y push no están
autorizados por esta aprobación. El plan posterior detallará interfaces, esquema,
estrategia de conflictos, migración local, pruebas y reversión.

## Ajuste aprobado del formulario de actividades — 2026-10-18

La versión 0.1.2 recoge la solicitud explícita del usuario de eliminar la selección
de organización al agregar actividades, usar el semestre activo para pruebas y
tareas y hacer opcional el ramo de las personales. Esta solicitud sustituye
la elección opcional de semestre/ramo en el formulario nuevo. Se conserva el
historial existente y la copia/traslado aprobados; no hay migración destructiva.

## Ajuste aprobado de duración — 2026-10-18

El usuario solicitó configurar hora de inicio y fin en el formulario de
actividades. La versión 0.1.2 incorpora intervalos variables sin cambiar los
datos anteriores ni sincronizar las actividades. Sustituye la duración fija
del plan inicial para las actividades nuevas o editadas explícitamente.

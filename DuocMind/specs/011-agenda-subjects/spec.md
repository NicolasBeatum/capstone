# Spec 011 — Asignaturas reales en la agenda

| Campo | Valor |
| --- | --- |
| Versión | 0.2.0 |
| Estado | APROBADA |
| Fecha | 2026-10-15 |
| Incremento | 011-agenda-subjects |
| Constitución | 2.0.0 |
| Plataformas | Android y previsualización web |
| Aprobación | 0.2.0: confirmada explícitamente por el usuario el 2026-10-15 («si apruebo y crea el plan e implementalo»). Las decisiones de la sección 7 se aprobaron con lo propuesto, salvo la 1, resuelta como se indica allí |

## 1. Problema y resultado esperado

Al crear una actividad en la agenda, la persona puede asociarla a una
asignatura. Hoy esa lista está escrita a mano en la pantalla (`SUBJECTS` en
`AgendaScreen`): cuatro nombres fijos, iguales para todos, que no dependen de la
carrera ni de lo que la persona cursa. Una estudiante que no tiene «Ética
Profesional» la ve igualmente, y una que cursa otras asignaturas no puede
elegirlas.

El modelo de datos ya registra qué cursa cada estudiante
(`estudiante` → `estudiante_carrera` → `estudiante_asignatura` →
`carrera_asignatura` → `asignatura`). Este incremento hace que el formulario de
«Nueva actividad» ofrezca las asignaturas que la estudiante con sesión cursa
según esa información, en lugar de la lista fija.

Resultado observable: al abrir «Nueva actividad», las opciones de asignatura son
las de la cuenta con sesión. Dos cuentas con inscripciones distintas ven listas
distintas. Sin conexión se ve la última lista descargada de esa cuenta.

## 2. Alcance propuesto

- Obtener desde el backend las asignaturas en las que la estudiante con sesión
  está inscrita en su carrera vigente.
- Mostrar esa lista en el formulario de «Nueva actividad», conservando la opción
  «Sin asignatura» y el carácter opcional del campo.
- Conservar localmente la última lista descargada, aislada por cuenta, para
  usarla sin conexión.
- Estados comprensibles de carga, vacío y error en la selección de asignatura.
- Retirar la lista fija `SUBJECTS` de la pantalla.
- Verificaciones reproducibles con cuentas y datos sintéticos, incluida la
  prueba de aislamiento entre cuentas.

Fuera de alcance:

- Inscribir o desinscribir asignaturas desde la app. Las inscripciones se
  gestionan fuera de este incremento; la app solo las lee.
- Horarios de clases, salas, docentes y la clase en curso del inicio (hoy datos de
  muestra en el dashboard).
- Cambiar cómo se guarda la actividad, su formato o su cifrado local, y el
  aislamiento por cuenta de las actividades ya guardadas (ver hallazgo 1 en la
  sección 5).
- Migrar o reescribir el texto de asignatura de actividades ya creadas.
- Despliegues y migraciones remotas sin autorización explícita para ese fin.

## 3. Requisitos funcionales

### RF-001 — Origen de la lista

1. Las opciones de asignatura provienen de las inscripciones de la estudiante con
   sesión en su carrera vigente (`estudiante_carrera.fecha_fin` nula), no de una
   lista escrita en la app.
2. Cada opción muestra el nombre de la asignatura. Dos asignaturas con el mismo
   nombre se distinguen con su código.
3. La lista se ordena alfabéticamente por nombre.
4. Una persona no puede ver ni elegir asignaturas de otra cuenta.

### RF-002 — Formulario de nueva actividad

1. «Sin asignatura» sigue disponible y es la opción por defecto; elegir una
   asignatura sigue siendo opcional.
2. Mientras la lista carga se indica que está cargando, sin bloquear el resto del
   formulario ni impedir guardar con «Sin asignatura».
3. Si la cuenta no tiene asignaturas inscritas, el formulario lo dice en español
   claro y deja solo «Sin asignatura».
4. Si la lista no pudo obtenerse y no hay copia local, se informa el problema y la
   persona puede guardar la actividad sin asignatura.
5. Elegir una asignatura guarda su nombre en la actividad, tal como hoy; la
   actividad no depende de que la asignatura siga existiendo.

### RF-003 — Offline

1. Tras una descarga exitosa, la lista queda disponible sin conexión en ese
   dispositivo para esa cuenta.
2. Sin conexión se usa la última lista descargada y se indica que puede no estar
   al día.
3. Con conexión se actualiza la copia local sin que la persona deba pedirlo.
4. Cerrar sesión o eliminar la cuenta no deja la lista de una cuenta disponible
   para otra.
5. Un fallo de red no borra la última copia válida.

### RF-004 — Actividades existentes

1. Las actividades creadas antes de este incremento conservan el texto de
   asignatura que tenían y se siguen mostrando igual.
2. La asignatura mostrada en una actividad no se recalcula con la lista actual.

## 4. Requisitos no funcionales

- **Privacidad y seguridad.** Las asignaturas inscritas se tratan como datos
  personales. Se leen con la sesión de la persona y las reglas de acceso
  existentes (RLS de `estudiante_asignatura`); no se usan claves privilegiadas en
  el cliente. La copia local se aísla por cuenta. No se registran en logs ni
  errores.
- **Arquitectura.** La pantalla no consulta el backend ni el almacenamiento
  directamente; usa un caso de uso con gateways, como el resto de la app.
- **Accesibilidad.** Las opciones y los estados de carga, vacío y error tienen
  etiquetas en español y objetivos táctiles de al menos 44 px.
- **Movimiento.** Cualquier indicador de carga usa `GotaLoader`.
- **Proporcionalidad.** Solo lectura; sin tablas nuevas salvo que el plan
  justifique que la consulta actual no basta.

## 5. Hallazgos que condicionan el plan

1. **Las actividades personales no están aisladas por cuenta.** La base local de
   la agenda (`duocmind-agenda.db`) es una sola por dispositivo, sin cifrado y sin
   identificar al propietario, a diferencia de eventos y check-in. Dos cuentas en
   el mismo dispositivo ven las mismas actividades. No se corrige aquí, pero la
   copia de asignaturas de este incremento sí debe quedar aislada por cuenta, y
   conviene abrir una spec aparte para las actividades.
2. **No hay datos de ejemplo de inscripciones.** Ni `supabase/seed.sql` ni las
   herramientas de fixtures crean filas en `estudiante_asignatura`. Para verificar
   se necesitan cuentas sintéticas con inscripciones.
3. **La app no puede inscribir.** Existe una política de inserción en
   `estudiante_asignatura`, pero la app no tiene pantalla para ello y este
   incremento no la agrega. Una cuenta sin inscripciones verá la lista vacía.

## 6. Criterios de aceptación

| ID | Criterio | Verificación prevista |
| --- | --- | --- |
| CA-001 | Con una cuenta inscrita en tres asignaturas, el formulario ofrece esas tres y «Sin asignatura», ordenadas por nombre. | Prueba de caso de uso con gateway simulado. |
| CA-002 | Dos cuentas con inscripciones distintas obtienen listas distintas; ninguna ve las asignaturas de la otra. | Prueba SQL sintética de aislamiento (RLS). |
| CA-003 | Dos asignaturas con el mismo nombre se distinguen por código. | Prueba de dominio. |
| CA-004 | Una cuenta sin inscripciones ve un mensaje claro y puede guardar con «Sin asignatura». | Prueba de caso de uso y comprobación en pantalla. |
| CA-005 | Sin conexión, tras una descarga previa, se ofrece la última lista y se indica que puede estar desactualizada. | Prueba de almacenamiento simulado y prueba en Android. |
| CA-006 | Un fallo de red no borra la última copia válida. | Prueba de almacenamiento. |
| CA-007 | Cambiar de cuenta no muestra la lista de la cuenta anterior. | Prueba de almacenamiento por cuenta. |
| CA-008 | Las actividades anteriores conservan su asignatura. | Prueba de regresión. |
| CA-009 | Ya no existe la lista fija `SUBJECTS` en la pantalla. | Revisión del código. |
| CA-010 | El flujo funciona en Android, incluida la lectura offline. | Validación manual en Android antes de cerrar. |

## 7. Decisiones

1. **Dónde se guarda la copia local.** Propuesta: seguir el patrón de eventos
   (almacenamiento cifrado por cuenta en Android; `localStorage` solo en la
   previsualización web con datos sintéticos). Alternativa más simple: una clave
   en `SecureStore` por cuenta, válida porque la lista es pequeña.
2. **Qué se guarda en la actividad.** Propuesta: el nombre, como hoy (RF-002.5).
   Alternativa: guardar el identificador de la asignatura, lo que exige cambiar
   el formato de las actividades y queda fuera de este incremento.
3. **Cuenta sin inscripciones.** Propuesta: mostrar solo «Sin asignatura» con un
   mensaje. Alternativa: permitir escribir una asignatura libre; se descarta por
   reintroducir texto sin validar.
4. **Mostrar el código.** Propuesta: solo cuando hay nombres repetidos. Alternativa:
   mostrarlo siempre.

## 8. Referencias

- Esquema: `supabase/migrations/20260927224730_bienestar_schema.sql`
  (`asignatura`, `carrera_asignatura`, `estudiante_carrera`, `estudiante_asignatura`
  y sus políticas RLS).
- Pantalla actual: `src/features/agenda/screens/AgendaScreen.tsx`.
- Patrón de datos por cuenta con copia local: spec 009 (eventos estudiantiles).

La spec es un borrador. Conforme a la constitución y a `AGENTS.md`, el plan y las
tareas se redactan solo después de su aprobación explícita. Este documento no
autoriza migraciones remotas ni despliegues.

### Historial de revisiones

- **0.1.0 — 2026-10-15:** borrador inicial.
- **0.2.0 — 2026-10-15:** aprobada por el usuario. Decisiones 2, 3 y 4 según lo
  propuesto. **Decisión 1 resuelta con la alternativa simple:** la copia local usa
  `platformSecureKeyValueStorage` con una clave por cuenta, como el tutorial. La
  lista es pequeña, el nombre de una asignatura no es un dato emocional y la
  constitución pide la solución más simple que cumpla los criterios; el almacén
  cifrado de eventos se justifica por catálogos y datos más grandes. La
  autorización del usuario cubre redactar el plan y las tareas e implementar en
  la misma solicitud; ambos documentos quedan registrados como aprobados por esa
  instrucción, sin otra aprobación intermedia.

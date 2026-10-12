# Plan 009 — Eventos y agenda personal

| Campo | Valor |
| --- | --- |
| Versión | 0.1.0 |
| Estado | APROBADO |
| Fecha | 2026-10-11 |
| Spec | `spec.md` 0.1.2, APROBADA el 2026-10-11 |
| Constitución | 2.0.0 |
| Rama | `feature/eventos-horario`, creada desde `dev` |
| Aprobación del plan | Conformidad del usuario el 2026-10-11 al responder «buen plan» a su revisión |

## 1. Decisiones y límites

Se reutiliza `evento_institucional` y el editor administrativo existente. La app
incorpora `/events` y `/events/[id]`, un calendario en el encabezado del dashboard
y un acceso dentro de Bienestar. «Mi agenda» combina sus actividades actuales con
los eventos guardados, conservando almacenamiento y reglas de las primeras.

Los intereses se guardan únicamente en el dispositivo y por cuenta. Android usa
una base SQLCipher independiente; la previsualización web usa almacenamiento por
cuenta con datos sintéticos. No se añade inscripción interna, Realtime, importación
de clases ni integración con calendarios externos. Se usan las dependencias fijadas
en los lockfiles: Expo 57, SQLite/SecureStore/Crypto, Supabase JS y React Native.

Este plan no autoriza despliegues, migraciones remotas, commits ni push. Aprobado
el plan, se redacta `tasks.md`; la implementación comienza después de aprobar esas
tareas y sigue una tarea por vez, sin delegación.

## 2. Estado observado y compatibilidad

- El catálogo remoto ya contiene UUID, título, descripción, lugar, instantes UTC,
  estado, publicación y revisión. No contiene condiciones de inscripción.
- Su política de lectura exige `published_at is not null`; estudiantes y cuentas
  públicas no escriben. La app nueva exige sesión para guardar intereses.
- `admin-api` valida campos y delega en procedimientos con permisos, sesión,
  revisión e idempotencia. Se ampliarán sus contratos sin omitir estas garantías.
- La agenda nativa actual usa `duocmind-agenda.db`, sin propietario; la web usa
  `duocmind.agenda.activities.v1`. No se importan esos datos a una cuenta elegida
  automáticamente. Su corrección global de propiedad queda fuera del incremento.
  Los eventos nuevos no se guardan en esos almacenes ni heredan su aislamiento.
- La agenda hoy oculta bloques finalizados e impide seleccionar días pasados.
  Se habilita consultar días anteriores para los eventos guardados; crear una
  actividad personal conserva la validación de fecha futura y bloques actuales.
- SQLCipher está habilitado en `app.json`. La funcionalidad emocional ya verifica
  `cipher_version` y conserva una clave por cuenta en SecureStore. Se comparte
  únicamente el helper de generación/lectura de claves si ambas funcionalidades
  lo necesitan; no se consulta la base emocional para guardar eventos.

## 3. Organización e interfaces

| Ubicación | Responsabilidad |
| --- | --- |
| `src/shared/events/domain/` | Tipos de evento e interés, validación y cálculos puros de fechas, estados y cambios. |
| `src/shared/events/application/` | Interfaces de gateways y casos de uso compartidos: catálogo, intereses, reconciliación, inscripción y consulta para la agenda. |
| `src/shared/events/infrastructure/` | Adaptador Supabase, almacenamiento por plataforma, coordinación de sesión, apertura de enlaces y composición de gateways. |
| `src/features/events/screens/` | Listado/calendario y detalle, con estilos junto a cada pantalla. |
| `src/features/events/components/` | Tarjeta y selector mensual usados únicamente en Eventos. |
| `src/features/agenda/application/` | Carga de actividades e intereses y composición de los elementos del día, mediante gateways. |
| `src/features/agenda/screens/` | Presentación conjunta, selección de fecha y acciones de los eventos guardados. |
| `src/features/dashboard/screens/` | Calendario del encabezado que abre `/events`. |
| `src/features/wellness/screens/` | Acceso al mismo catálogo. |
| `src/app/(app)/events/` | Rutas que solo reexportan las pantallas. |

Las pantallas consumen casos de uso; no acceden a Supabase, SecureStore ni SQLite.
Los gateways reciben interfaces inyectadas para permitir pruebas deterministas.
Las funcionalidades no importan archivos internos de Eventos o Agenda entre sí;
su contrato común vive en `shared/events`. Los hooks de presentación reciben los
servicios construidos por la composición de infraestructura, sin invertir la
dependencia de las reglas de aplicación hacia los adaptadores.

Interfaces mínimas previstas:

- `EventCatalogGateway.load(eventId?)`: devuelve catálogo validado y hora del
  servidor; con identificador consulta solo ese evento para revalidar inscripción.
- `EventInterestStore`: leer catálogo confirmado, reemplazarlo de forma atómica,
  listar intereses, agregar de forma idempotente, quitar, aceptar actualización
  y eliminar los datos de una cuenta. Nunca crea intereses al refrescar catálogo.
- `EventSessionGateway`: obtener la identidad local de la sesión y observar su
  cambio. La identidad sirve para seleccionar el almacén local; no concede permisos
  de servidor ni se obtiene de metadatos editables.
- `EventLinkGateway.open(url)`: abrir HTTPS mediante Linking después de validar
  las condiciones y confirmar que la sesión sigue siendo la misma.
- `Clock.now()`: reloj inyectable para dominio, pruebas y límites de inscripción.

## 4. Esquema y contrato de backend

### Condiciones de inscripción

Añadir a `evento_institucional`:

| Campo SQL | Tipo/default | Contrato JSON |
| --- | --- | --- |
| `requires_registration` | boolean NOT NULL, false | `requiresRegistration` |
| `registration_url` | text nullable, máximo 2048 caracteres | `registrationUrl` |
| `registration_deadline` | timestamptz nullable | `registrationDeadline` |
| `registration_closed` | boolean NOT NULL, false | `registrationClosed` |

Los eventos actuales reciben `false`, URL/plazo nulos y cierre manual desactivado.
Se preservan UUID, contenido, estado, revisión y publicación originales.

Para «No requiere inscripción», URL y plazo deben ser nulos y el cierre manual
false. El editor normaliza esos valores y el backend rechaza combinaciones distintas.
Para «Requiere inscripción», un borrador puede omitir URL o plazo, pero los valores
presentes deben ser válidos. Publicar o editar un evento publicado exige ambos,
con plazo no posterior al inicio. Se conservan los mínimos actuales de título,
lugar e instantes: el borrador incompleto corresponde a las nuevas condiciones
de inscripción, no a eliminar restricciones existentes de datos básicos.

La URL debe ser HTTPS, tener hostname y no contener credenciales ni caracteres
de control. La validación de Edge Function usa `URL`; SQL aplica las restricciones
equivalentes sobre el esquema, estructura y longitud. La app vuelve a validar
antes de abrir. No se solicitan datos ni se visita el enlace desde el backend.

Guardar contenido y condiciones incrementa `revision` una sola vez. Cerrar o
reabrir se realiza mediante la edición existente y su `expectedRevision`; al
pasar de cierre manual a abierto en un evento publicado, SQL exige plazo futuro,
inicio futuro y estado publicado. Publicar con condiciones vencidas no habilita
la inscripción: la disponibilidad siempre se deriva del reloj.

Actualizar consultas y escrituras administrativas mediante una migración nueva,
incluyendo su lista de campos admitidos, validación, JSON y publicación. No editar
migraciones ya aplicadas ni copiar privilegios sin comprobar los grants resultantes.
Conservar el trigger que impide editar cancelados o borrar una publicación previa.

### Lectura de catálogo

Crear una RPC `get_student_events(p_event_id uuid DEFAULT NULL)` de lectura,
`SECURITY INVOKER`, `search_path` fijo y referencias SQL calificadas. Ejecuta una
única consulta que devuelve `{ serverTime, events }`, agregando los registros
publicados y cancelados que fueron publicados, ordenados por inicio e ID.

La respuesta completa se obtiene como un solo objeto JSON para evitar el límite
de filas de PostgREST y una falsa eliminación al combinar páginas incompletas.
Con `p_event_id`, devuelve como máximo un evento y no reemplaza el catálogo local
completo. Validar la respuesta entera antes de persistirla; un error no equivale
a un catálogo vacío. La hora del servidor se usa para verificar disponibilidad
al pulsar «Inscribirme».

Revocar EXECUTE de PUBLIC y anon y concederlo a authenticated. RLS sigue filtrando
las filas; no se añade `SECURITY DEFINER` para leer el catálogo. Los permisos de
lectura pública anteriores de la tabla se conservan para compatibilidad; los
intereses privados no tienen tabla remota ni aparecen en esta respuesta.

## 5. Persistencia local y concurrencia

### Android

Base `duocmind-events-<authUserId>.db` con clave de 256 bits independiente en
SecureStore, bajo `duocmind.events.sqlcipher.key.v1.<authUserId>`. Validar el UUID
antes de construir nombre o clave; validar el hexadecimal de la clave leída y
generada antes de usar PRAGMA. Verificar `cipher_version` antes de leer/escribir,
usar parámetros para contenido y fallar explícitamente si el build no soporta
cifrado; no abrir un almacén alternativo sin cifrar.

Tablas locales:

- `event_catalog`: ID PK y JSON validado de la última versión confirmada.
- `event_catalog_meta`: fecha de descarga y hora del servidor de la última
  respuesta completa; el reemplazo de catálogo/meta ocurre en la misma transacción.
- `event_interests`: ID de evento PK, JSON de la versión aceptada, fecha de
  guardado y versión local de modificación. La cuenta propietaria viene dada
  por el archivo, no por un campo editable de pantalla.

El JSON contiene solo los campos del catálogo necesarios para representar el
evento y sus condiciones. Estados derivados no se persisten; se recalculan.
La versión vigente se obtiene del catálogo. Un interés cuya fila no esté en el
catálogo completo se presenta como no disponible, conservando su copia.

Serializar mutaciones por cuenta y usar transacciones exclusivas mediante el
objeto de transacción. Agregar usa inserción ignorando el conflicto del mismo ID;
aceptar cambio usa UPDATE condicionado a la versión local leída y nunca UPSERT.
Así un resultado tardío no recrea una fila que el estudiante acaba de quitar.
La actualización del catálogo no escribe ni elimina filas de intereses.

### Web

Adaptador `sessionStorage` por UUID bajo una clave versionada que contiene catálogo,
meta e intereses en un solo documento validado. Las mutaciones se serializan en
la sesión. Se conserva al recargar la misma pestaña y cada pestaña tiene su propia
copia: la previsualización no sincroniza intereses entre pestañas ni conserva
sus datos al cerrar la sesión del navegador.
Se usan solo datos sintéticos: no se atribuye a la web el cifrado ni la validación
offline Android. Un fallo de cuota o acceso conserva el estado confirmado.

### Sesión, cierre y eliminación

Capturar identidad y generación de sesión al iniciar cada operación. Antes de
publicar el resultado o abrir un enlace, comprobar que ambas siguen vigentes.
Al cambiar/cerrar sesión, cancelar suscripciones, vaciar el estado en memoria
y bloquear nuevos comandos de esa generación. Una operación ya iniciada trabaja
únicamente con el almacén de la identidad capturada; nunca resuelve una cuenta nueva.

Cerrar sesión conserva el archivo cifrado para su propietario. Para eliminar
cuenta, ampliar la limpieza local existente con la eliminación de eventos, sin
importar la funcionalidad Eventos desde Auth: usar el contrato compartido de
limpieza. Bloquear operaciones, esperar las mutaciones pendientes, cerrar SQLite,
eliminar archivo y clave y limpiar cachés antes de completar la eliminación.
Una limpieza fallida no confirma eliminación completa; reintentar es idempotente.

## 6. Estados, tiempo y reconciliación

El dominio recibe instantes ISO y un reloj, sin React ni red. Usa `Intl` con
`America/Santiago` para fecha/horas; no infiere instantes concatenando una hora
local con `Z` ni presupone que todos los días tienen 24 horas. El calendario
calcula días gregorianos con claves `YYYY-MM-DD`, independientes de la zona del equipo.

Estado temporal: cancelado prevalece; `now >= endsAt` finaliza; `now >= startsAt`
indica en curso; el resto es próximo. Los eventos heredados de duración cero
se conservan: aparecen como actividad puntual en su fecha y finalizan al alcanzar
su instante. Para eventos con duración, el intervalo ocupa `[inicio, término)`;
terminar a medianoche no añade el día posterior.

Inscripción: libre si no la requiere; cerrada si fue cancelado, empezó, alcanzó
el plazo o existe cierre manual. Los motivos se calculan con precedencia
cancelación → inicio/finalización → plazo → cierre manual. La interfaz actualiza
el reloj cada 30 segundos mientras está enfocada y al volver a primer plano;
cada pulsación vuelve a calcular con el reloj actual.

Refrescar catálogo al enfocar, volver a primer plano, recuperar conexión y pulsar
«Actualizar». Mientras Eventos esté enfocado y conectado, actualizar cada minuto;
liberar temporizadores al salir. La consulta para inscripción es independiente
y siempre usa la hora del servidor y el evento recién confirmado. No se declara
que un catálogo guardado describe el estado remoto actual.

Reconciliación de intereses:

- Texto y condiciones vigentes se muestran desde el catálogo confirmado.
- Comparar inicio, término y ubicación con la versión aceptada. Si cambian,
  mantener el intervalo aceptado en Agenda y mostrar «Cambio pendiente», ambos
  valores y las acciones actualizar/quitar. La cancelación prevalece.
- Aceptar comprueba versión local y usa la versión vigente del evento; un cambio
  adicional exige volver a mostrar la diferencia. Quitar es idempotente.
- No disponible conserva su copia; descargar una lista parcial, revalidar un solo
  evento o fallar no provoca la desaparición de los demás intereses.

## 7. Pantallas e integración

### Inicio y Bienestar

Calendario de 20 px con botón mínimo de 44 × 44 px a la derecha del dashboard,
junto a campana y perfil. Usar `CalendarIcon` y `ScalePress`, sin badge ni bucle.
Agrupar controles con espacio contenido; en anchuras estrechas o texto ampliado,
el encabezado permite distribuir saludo y controles en dos filas, sin superponerlos.
Preservar la referencia del saludo utilizada por `WelcomeIntro` y comprobar la
bienvenida tras login. Bienestar incorpora una tarjeta «Eventos» con el mismo destino.

### Eventos

Listado con filtros Próximos/Por fecha/Anteriores, calendario mensual y detalle.
Próximos incluye los cancelados cuyo término aún no pasó; Anteriores incluye los
que terminaron, también cancelados. Por fecha usa los días ocupados del intervalo.
El calendario indica presencia de eventos y conserva la fecha al volver del detalle.
Las tarjetas muestran estado temporal, inscripción e interés guardado sin usar
el color como único indicador. La zona horaria y última actualización se presentan
en textos visibles; carga con `GotaLoader`, entradas con `Reveal` y movimiento reducido.

Detalle con descripción, ubicación, intervalo, plazo/motivo de cierre y acciones
según la tabla de la spec. Mensajes de éxito solo después de persistir. Una acción
pendiente deshabilita su botón para impedir múltiples comandos; los errores permiten
reintentar. Volver conserva el origen y la selección; el acceso directo a detalle
sin historial regresa al listado. Un ID inválido o no publicado informa indisponibilidad.

### Agenda

Leer `date` de parámetros para «Ver en mi agenda», validarlo y seleccionar ese día;
si es anterior a hoy, permitir su consulta. Para eventos de varios días se abre
el día inicial; las demás fechas se consultan normalmente.

Separar la proyección de actividades actuales y eventos: no convertir un evento
a `AgendaActivity` ni guardar su duración como una hora. Una unión discriminada
identifica el tipo de tarjeta. Comparar horas de inicio en la fecha representada
y desempatar por ID; mantener los cálculos locales actuales de las actividades
personales. Las tarjetas institucionales usan Santiago y lo indican. Una fecha
es una clave de calendario compartida, sin reinterpretar horas heredadas.

En un día intermedio, indicar continuación y el intervalo real completo. Mantener
eventos finalizados visibles en su fecha, sin cambiar el filtrado de actividades
personales finalizadas. Las coincidencias muestran ambas tarjetas sin desplazarlas.
Al volver a Agenda se recargan los intereses; sus cambios confirmados actualizan
las pantallas consumidoras. La pantalla conserva estado de carga/error independiente
si falla uno de los almacenes y no convierte el fallo en una lista vacía confirmada.

### Panel administrativo

Ampliar `EventContent`, `InstitutionalEvent`, parser, gateway, `useEvents` y editor.
Usar la conversión actual `eventTime.ts` para el plazo y sus horas ambiguas.
Agregar sección «Inscripción», ayuda sobre guardar interés y aviso de cambio de
fecha/lugar. Cierre/reapertura utilizan guardar revisión y mensajes específicos.
El panel no consulta intereses ni registra asistentes.

## 8. Modelo de amenazas y riesgos

| Riesgo | Mitigación y comprobación |
| --- | --- |
| Borradores expuestos por RPC | SECURITY INVOKER, RLS, grants explícitos y pruebas directas con anon/estudiante/funcionario. |
| Inscripción manipulada o vencida | Validar SQL/API/cliente y reconsultar evento/hora del servidor antes de abrir HTTPS. |
| Intereses de otra cuenta | Archivo/clave por UUID, generación de sesión y pruebas con operaciones diferidas. |
| Respuesta tardía revive interés quitado | Separar catálogo de intereses; actualizar condicionado a versión local, nunca insertar desde reconciliación. |
| Archivo o clave ausente/corrupto | Error explícito; no regenerar una clave para abrir datos existentes ni sobrescribir el archivo; recuperación no destruye datos confirmados. |
| Reprogramación mueve agenda sin consentimiento | Comparación de intervalos/lugar y decisión actualizar/quitar. |
| Calendario reducido a día de 24 horas | Derivar partes de calendario/instantes y cubrir cambios de horario y medianoche. |
| Controles saturan encabezado | Distribución adaptable, texto ampliado y prueba de bienvenida y lector de pantalla. |
| Cambio administrativo rompe seguridad o recuperación | Regresión de suites existentes; preservar funciones/grants/contratos no relacionados. |
| Datos personales heredados sin propietario | No migrarlos al almacén nuevo; documentar limitación existente sin atribuirle aislamiento. |

La finalidad de intereses es el horario elegido por el estudiante. Su propietario
es la cuenta autenticada; su ubicación es el almacén del dispositivo; la conservación
termina al quitar el interés o borrar la cuenta. No se vincula el interés con ánimo,
resultados ni inscripciones externas. Sin secretos ni contenido personal en logs.

## 9. Verificación y trazabilidad

Usar reloj/red/almacenamiento/enlaces simulados para pruebas de reglas y cuentas
sintéticas para backend y recorridos. Registrar comandos, versiones, resultados
y limitaciones en `verification.md` al implementar. No marcar pruebas nativas
como superadas usando la previsualización web.

| Criterios | Pruebas previstas |
| --- | --- |
| CA-001, CA-010, CA-011 | Recorridos Android/web de accesos, pantalla estrecha/texto ampliado, bienvenida, lector de pantalla y navegación calendario/detalle. |
| CA-002 | Pruebas SQL/HTTP y E2E administrativas de condiciones, publicación, cierres, reapertura y conflictos; regresión de consultas y permisos. |
| CA-003 | Pruebas de dominio para límites exactos, prioridades de cierre, cancelados y primer plano; reloj controlado. |
| CA-004 | Caso de uso con gateway simulado: cierre entre carga/pulsación, fallo de consulta/apertura, URL inválida y sesión cambiada. |
| CA-005, CA-006 | Persistencia/casos de uso: duplicados, coincidencias, quitar desde ambas vistas, cuota/error, datos heredados conservados. |
| CA-007 | Reconciliación, aceptar/quitar, versiones concurrentes, catálogo ausente, varios días, duración cero, medianoche y horario de verano. |
| CA-008 | Android: descargar, desconectar, agregar/quitar, reiniciar, volver a entrar y verificar conservación y estado de última copia. |
| CA-009 | Dos cuentas, operaciones diferidas, archivo cifrado sin clave, cierre/cambio de sesión y eliminación repetida de archivo/clave. |

Pruebas nuevas en `DuocMind/tests/` con `node:test`, siguiendo los imports de TS
actuales; comprobar casos de uso mediante interfaces inyectadas, no solo mocks de
la misma implementación. Añadir casos a las suites de backend existentes y a
`admin-web/e2e/events.spec.ts`, manteniendo el resto de recorridos.

Validaciones completas aplicables después de implementar:

```bash
npm --prefix DuocMind run typecheck
npm --prefix DuocMind test
node DuocMind/tools/scripts/backend-tests.mjs
DuocMind/tools/node_modules/.bin/deno check --frozen --config DuocMind/supabase/functions/admin-api/deno.json DuocMind/supabase/functions/admin-api/index.ts
DuocMind/tools/node_modules/.bin/deno test --frozen --config DuocMind/supabase/functions/admin-api/deno.json DuocMind/supabase/functions/admin-api/recovery_test.ts
DuocMind/tools/node_modules/.bin/supabase db advisors --local --workdir DuocMind --type all --level warn --fail-on error
npm --prefix admin-web run typecheck
npm --prefix admin-web test
npm --prefix admin-web run build
npm --prefix admin-web run test:e2e
```

Preparar previamente backend local, fixtures y API con los scripts versionados.
Descubrir opciones mediante `--help` antes de usar CLI. Generar nombre de migración
con `supabase migration new`; iterar y verificar SQL exclusivamente en local,
ejecutar advisors y comprobar aplicación limpia desde las migraciones. Si falta
runtime, Docker o dispositivo, registrar el bloqueo y mantener abiertas las
verificaciones respectivas; no instalar dependencias globales ni usar datos remotos.

## 10. Reversión y recuperación

- Revertir pantallas/gateways de este incremento conserva la agenda anterior y
  no borra los almacenes locales nuevos. No eliminar archivos al arrancar ni
  regenerar claves existentes como solución a errores.
- Las columnas nuevas son aditivas. Para volver al cliente anterior, conservarlas
  y restaurar en una migración nueva los contratos administrativos anteriores;
  revocar EXECUTE de la RPC nueva si deja de utilizarse. No eliminar eventos ni
  condiciones de inscripción para revertir una pantalla.
- Comprobar que el panel anterior sigue operando y que siguen ocultos los
  borradores tras cualquier reversión. Respaldar contenido sintético afectado
  antes de ensayar la recuperación local.
- Una operación remota futura requiere autorización, revisión del inventario,
  respaldo proporcional y verificación posterior. La aprobación de esta spec/plan
  no sustituye esa autorización.

## 11. Fuentes y estado de la entrega

Base de decisiones: `AGENTS.md`, constitución 2.0.0, Spec 009 aprobada, migraciones
de administración y archivos actuales citados en las secciones anteriores.
Documentación oficial consultada el 2026-10-11:

- [Supabase: RLS y privilegios](https://supabase.com/docs/guides/database/postgres/row-level-security).
- [Expo SQLite: SQLCipher y transacciones](https://docs.expo.dev/versions/latest/sdk/sqlite/).
- [Supabase: changelog](https://supabase.com/changelog). El endpoint markdown no
  fue legible desde el visor web; se abrió el índice HTML. Antes de implementar
  se comprobarán los cambios relevantes y las APIs de las versiones instaladas.

Este documento define implementación y verificación previstas; no acredita
código terminado, migraciones aplicadas ni pruebas ejecutadas. La conformidad
del usuario el 2026-10-11 aprueba el plan y habilita redactar `tasks.md`. La
aprobación de las tareas se registra por separado antes de comenzar a implementarlas.

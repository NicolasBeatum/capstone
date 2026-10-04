# Plan 005 — Administración de Bienestar y Salud

| Campo | Valor |
| --- | --- |
| Versión | 0.2.0 |
| Estado | APROBADO |
| Fecha | 2026-10-04 |
| Spec | `spec.md`, versión 0.2.0, APROBADA |
| Constitución | 2.0.0 |
| Aprobación del plan | Aprobado el 2026-10-04 |

## 1. Entrega y orden de trabajo

Este plan y `tasks.md` concretan la revisión administrativa de la spec 0.2.0.
La ejecución y sus comprobaciones se documentan en `verification.md`. No se
modifican servicios remotos ni se despliegan aplicaciones.

### Entrega administrativa

El incremento comprende panel web y backend: permisos, registro de alumnos,
recuperación web, tests, eventos y tips con reglas. «Enviar tests» significa
publicarlos y habilitarlos en el catálogo del backend, sin destinatarios individuales.

La futura integración Android queda fuera de la Spec 005. No implementar
`get_wellness_content`, snapshot público, adaptadores Android, selección privada,
descarga, almacenamiento offline ni cambios a su gateway de recuperación. Tampoco
crear la nueva spec en esta entrega. La comprobación Android inicialmente prevista
en T023 se omite por decisión del usuario; no se añaden capacidades.

La spec, el plan y las tareas 0.2.0 fueron aprobados el 2026-10-04.
La implementación sigue `tasks.md`. El 2026-10-04 se acordó omitir la regresión
nativa T023 de esta entrega administrativa; no se acredita esa comprobación.

## 2. Estado actual y arquitectura elegida

- La app existente usa Expo 57, React 19.2.3, TypeScript 5.9.3 y
  `@supabase/supabase-js` 2.116.0. Node 24 y npm 11 son los entornos declarados.
- `estudiante` tiene RUT y teléfono además de los campos aprobados. Su RLS actual
  permite consultar solo el perfil propio. No se ampliará esa lectura a funcionarios.
- No existe actualmente una tabla de funcionarios ni un modelo de autorización
  administrativa. `private.admin_staff` es una tabla nueva propuesta para este
  incremento; las cuentas usan Supabase Auth y no necesitan un perfil de alumno.
- Los catálogos de tests y materiales tienen lectura pública sin distinguir
  borradores; se reemplazarán esas políticas al introducir publicación.
- WHO-5, PHQ-9, GAD-7 y sondeo están en código. PSS-10 se consulta por nombre y
  `.single()`, con puntuación y rutas en el cliente; no hay una persistencia de
  resultados implementada que deba añadirse para este incremento.
- La pantalla de Bienestar tiene tips fijos. Existe historial de check-ins con
  almacenamiento SQLCipher por usuario; la validación Android de la Spec 004
  sigue pendiente y no se considerará acreditada por estos documentos.

### Componentes

1. **`admin-web/`:** SPA React + TypeScript + Vite, React Router y CSS propio,
   con diseño coherente con DuocMind. Proyecto npm independiente, sin convertir
   el repositorio a workspaces ni compartir componentes React Native.
2. **Backend:** una Edge Function `admin-api` para las operaciones administrativas,
   procedimientos PostgreSQL transaccionales y RLS para la lectura de contenidos
   publicados. Las operaciones del panel no consultan directamente tablas personales.
3. **Contratos:** documentar el JSON de la API y validar datos externos en cada
   adaptador. No introducir un paquete compartido ni un sistema de plugins.

El panel toma la identidad visual de `DuocMind/src/shared/theme.ts`,
`shared/styles/dashboard.styles.ts`, `shared/styles/login.styles.ts` y
`shared/components/glass.tsx`: azul marino `#1a2b44`, crema `#f3ecda`, amarillo
`#f3e7a0`, superficies claras translúcidas y tarjetas redondeadas. CSS mantiene
estos valores en variables propias; usa tipografía del sistema, foco visible y
controles de al menos 44 px. El diseño claro sigue el modo actualmente fijado en
la app. No comparte componentes React Native ni requiere fuentes externas.

En el panel reutilizar las versiones exactas actuales de React, TypeScript y
Supabase. Resolver versiones estables compatibles de Vite, React Router y Playwright
al preparar el proyecto, fijarlas sin rangos y versionar el lockfile. Usar Node
`--test` para reglas puras y Playwright para recorridos web; mantener las pruebas
Node existentes de Android. No añadir un framework visual ni SSR.

## 3. Modelo de datos, publicación y compatibilidad

Crear migraciones nuevas después de descubrir la CLI con `--help`; no reescribir
las migraciones existentes. Usar la base Supabase local para iterar y comprobar
restricciones antes de cerrar el SQL versionado.

### Permisos y operaciones internas

- Crear `private.admin_staff`: `auth_user_id` UUID PK/FK a Auth con borrado en cascada,
  `enabled` boolean NOT NULL con valor inicial `false` y `created_at` timestamptz
  NOT NULL con valor inicial `now()`. Sin datos de perfil ni funciones para conceder permisos
  desde el panel. El operador autorizado vincula una cuenta de funcionario en Auth
  al nuevo registro para habilitarla, y deshabilita ese permiso para revocarlo.
  No reutilizar `estudiante` como registro administrativo ni almacenar contraseñas
  en esta tabla.
- `private.admin_requests`: UUID de petición, funcionario, acción, recurso,
  huella del payload, estado y resultado mínimo. No guardar correos, respuestas,
  contraseñas, tokens ni copias de contenido. Usar para idempotencia de escrituras.
- `private.password_reset_limits`: funcionario, identificador interno de alumno
  y tiempos de solicitudes; nunca el correo o el enlace. Ambas tablas incluyen
  `expires_at`, fijado a 24 horas de la creación del registro. Las consultas de
  idempotencia y límites excluyen registros vencidos aunque todavía no se hayan borrado.
- Programar con PostgreSQL Cron una rutina privada de limpieza cada cinco minutos,
  independiente de solicitudes al panel. Eliminar registros con `expires_at <= now()`.
  En funcionamiento normal, la eliminación física ocurre antes de 24 horas y cinco
  minutos; no prometer eliminación exacta a las 24 horas. Si la ejecución falla,
  los registros siguen vencidos y se eliminan en la próxima ejecución satisfactoria.
  Comprobar el estado y las últimas ejecuciones del trabajo en el entorno local,
  documentar reactivación y limpieza manual de recuperación y depurar su historial
  técnico a siete días. El historial técnico no incluye datos de solicitudes.
  Esta etapa solo documenta esa preparación y sus pruebas locales; no crea ni
  programa trabajos en el proyecto remoto.
- Mantener `private` fuera de los esquemas expuestos. Activar RLS como defensa
  adicional y revocar acceso a `anon` y `authenticated`.

### Cuentas de alumnos y funcionarios

La autorización administrativa se representa mediante pertenencia habilitada a
`private.admin_staff`. No añadir una columna `rol` a `estudiante`, modificar la
estructura gestionada de `auth.users` ni crear roles PostgreSQL por persona.
Bienestar y Salud comparte las mismas capacidades en esta versión.

| Tabla | Responsabilidad | Vínculo |
| --- | --- | --- |
| `auth.users` | Identidad y credenciales de alumnos y funcionarios, gestionadas por Supabase Auth. | UUID `id`. |
| `public.estudiante` | Perfil académico y acceso estudiantil existente. | `auth_user_id` apunta a `auth.users.id`. |
| Nueva: `private.admin_staff` | Autorización administrativa, sin datos académicos ni contraseñas. | `auth_user_id` es PK y FK a `auth.users.id`, con `ON DELETE CASCADE`. |

Flujos previstos:

1. **Registro normal:** conservar el registro Auth y el perfil de alumno existentes.
   No insertar ni habilitar registros administrativos al registrarse o editar el
   perfil. Los alumnos actuales mantienen sus permisos y no requieren un backfill
   de roles. Una cuenta Auth sin perfil de alumno ni autorización administrativa
   no obtiene acceso por el solo hecho de estar autenticada.
2. **Alta de funcionario:** el operador autorizado crea o invita una cuenta usando
   Supabase Auth desde un entorno de servidor y vincula su UUID verificado a
   `private.admin_staff`. Habilitarla exige establecer `enabled = true`
   explícitamente. No crear un perfil de alumno para ese funcionario.
3. **Primer administrador:** usar el mismo procedimiento del operador, sin depender
   de otro administrador ni de acceso previo al panel. Versionar instrucciones y
   operaciones de provisión para ejecutarlas y probarlas en el entorno local;
   no incluir UUID reales, credenciales ni secretos en los artefactos.
4. **Cada operación administrativa:** verificar identidad y sesión y consultar el
   registro vigente de autorización. Fila ausente o `enabled = false` implica
   acceso denegado. El navegador no elige ni envía un rol que conceda permisos;
   `user_metadata` y las etiquetas de interfaz no son fuentes de autorización.
5. **Revocación:** el operador establece `enabled = false`. Una vez confirmada la
   actualización, la siguiente operación administrativa se rechaza aunque la
   sesión del navegador siga abierta; no esperar a renovar el JWT.

La habilitación y revocación se realizan fuera del panel con operaciones de servidor
documentadas. Los clientes no leen ni escriben directamente `private.admin_staff`.
Si una cuenta autorizada también tiene perfil de alumno, conserva únicamente el
acceso a sus propios datos personales; el permiso administrativo no amplía la
lectura de historial emocional, resultados ni derivaciones.

### Instrumentos

- Añadir `test_catalogo` con UUID estable, `code` único, `kind` (`protected` o
  `custom`) y referencia a la versión vigente. Vincular `test_bienestar` mediante
  `catalog_id`; mantener sus IDs, versiones y FK actuales.
- Añadir a cada versión `publication_status` (`draft`/`published`),
  `scoring_kind`, `revision`, `published_at` y etiqueta de presentación.
  `is_active` conserva su función de disponibilidad. Solo una versión por catálogo
  puede estar activa y publicada; cambiarla se realiza en una transacción.
  Los nuevos borradores y clones se crean con `is_active = false`; publicar
  conserva ese estado y la versión activa anterior hasta una activación explícita.
- Completar metadatos de presentación: helper por pregunta y etiqueta e
  interpretación por nivel. Mantener IDs bigint como cadenas en la API;
  la vista previa web usa el orden de pregunta como clave local, sin convertir
  IDs de base de datos a números JavaScript ni modificar el ejecutor Android.
- Una versión publicada congela preguntas, opciones, puntajes, rangos, textos,
  identidad y metadatos de contenido mediante triggers, incluso si está inactiva.
  Después de publicar solo admite cambiar `is_active` e incrementar `revision`
  atómicamente; la revisión es metadato operativo, no contenido editable.
  `publication_status` y `published_at` se establecen en la transacción de
  publicación y luego quedan fijos: no se permite volver a borrador.
  Clonar una versión crea un borrador con nuevos IDs y número de versión siguiente,
  sin cambiar referencias de aplicaciones o reglas de tips antiguas.
- Un cuestionario propio utiliza suma de puntajes enteros no negativos. La publicación
  exige preguntas ordenadas, al menos dos opciones por pregunta y rangos de resultado
  sin huecos ni solapamientos que cubran la suma mínima/máxima posible. Los rangos
  tienen clave estable, etiqueta y orientación no diagnóstica.
- Proteger WHO-5, PHQ-9, GAD-7, sondeo y PSS-10; no permitir cambiar su tipo, código,
  textos, opciones, niveles, cálculo o rutas desde la API administrativa. El sondeo
  conserva sus subescalas y WHO-5 su porcentaje; no tratarlos como cuestionarios
  propios aunque compartan el ejecutor visual.
- Versionar un manifiesto con las definiciones actuales de los instrumentos locales
  y sus claves (`who5`, `phq9`, `gad7`, `sondeo`, `pss10`). La migración inserta las
  definiciones faltantes y vincula versiones existentes sin renumerarlas ni cambiarlas.
  El PSS-10 existente conserva su nombre exacto, preguntas, orden de opciones,
  puntajes e IDs para las consultas actuales de Android. Reservar los nombres
  protegidos: la API y las operaciones SQL rechazan cuestionarios propios con
  esos nombres, evitando resultados múltiples en la consulta antigua por nombre.
- Antes de aplicar el SQL, el inventario de compatibilidad debe detectar nombres
  ambiguos, varias versiones activas o contenido incompatible. No clasificar ni
  sobrescribir esos casos silenciosamente: la aplicación del SQL falla y el
  inventario se revisa antes de cualquier autorización remota.

### Eventos institucionales

- `evento_institucional`: UUID, título, descripción, lugar, inicio y término
  `timestamptz`, estado (`draft`/`published`/`cancelled`), `published_at` y `revision`.
  La restricción exige término mayor o igual al inicio. Sin FK a alumno o inscripción.
- Publicar establece `published_at`; cancelar conserva fecha, contenido y evidencia
  de publicación anterior. Solo eventos que alguna vez se publicaron son legibles
  por alumnos. El panel confirma esos estados; no hay borrado físico ni vista Android.
- El panel interpreta las fechas en `America/Santiago`, convierte a UTC al guardar
  y rechaza horas locales inexistentes o ambiguas hasta que se elija un instante válido.
  El panel ordena por inicio y muestra el estado administrativo de cada actividad.

### Tips

- Añadir `publication_status`, `published_at` y `revision` a `material_apoyo`;
  `is_active` controla disponibilidad. Aprovechar sus relaciones actuales con
  emoción general y con test/versión/nivel.
- Un tip sin relaciones es general; las relaciones son condiciones OR. Guardar
  contenido y reglas en una transacción. Los tips publicados se editan con revisión
  optimista, sin introducir historial de versiones que la spec no requiere.
- Solo reglas a niveles publicados y emociones del catálogo. No ofrecer estudiantes
  como destinatarios. No persistir asociaciones alumno–tip ni métricas de coincidencias.
- Registrar los tres tips actuales como recursos generales publicados sin alterar
  los tips fijos del cliente Android. Tratar el contenido como texto plano, sin
  HTML, ejecución o cargas de archivos. No empaquetar recursos nuevos en Android.

### Lectura y conservación

- Mantener lectura pública exclusivamente de versiones publicadas y materiales
  publicados/activos; las políticas de preguntas, opciones, niveles y relaciones
  consultan el estado del padre. Las relaciones de tips verifican también el test
  publicado. Conceder explícitamente `SELECT` y `EXECUTE` donde corresponda.
- No ampliar RLS ni grants de perfiles, check-ins, resultados o derivaciones.
  El panel no recibe esos recursos aunque el funcionario tenga un perfil estudiante.
- Versiones publicadas se conservan mientras estén referenciadas; no se añaden
  operaciones de borrado. Eventos y tips se cancelan/desactivan y conservan como
  contenido institucional sin identificadores de autor persistidos.
- El panel no almacena listados en disco. La sesión dura la pestaña y se limpia al
  cerrar sesión; las tablas de permisos se eliminan con Auth. La spec no introduce
  retención nueva de información emocional ni de resultados individuales.

## 4. Autorización y contratos de backend

### Límite de confianza

`admin-api` valida el JWT con Supabase Auth, extrae `sub` y `session_id` del token
ya verificado y comprueba que la sesión siga en `auth.sessions` y que el funcionario
esté habilitado. Ni el cuerpo ni `user_metadata` determinan el actor o sus permisos.
Repetir esa comprobación dentro de cada operación SQL antes de usar privilegios
de servidor. La revocación afecta a la siguiente operación, sin esperar un refresh.

Implementar rutinas `private` con `SECURITY INVOKER` y permisos mínimos del servicio;
exponer solo wrappers RPC explícitos ejecutables por `service_role`, revocando
`PUBLIC`, `anon` y `authenticated`. La lectura de sesiones requiere únicamente
sus columnas de identificación y vigencia. No dar grants sobre Auth a los clientes.
No usar `SECURITY DEFINER` para resolver errores de RLS.

Las lecturas de alumnos usan proyección SQL explícita y joins opcionales a carrera
vigente, sede y cuenta Auth, devolviendo solo los campos aprobados. El listado,
la búsqueda por correo y la recuperación usan el correo vigente de Auth; no usar
`estudiante.correo` como fallback porque podría estar desactualizado. Si falta la
cuenta vinculada o un correo recuperable, devolver `email: null` y deshabilitar la
acción. Para enviar, resolver nuevamente el vínculo y el correo desde Auth;
no aceptar correo o redirect aportados por el navegador. Rechazar solicitudes
para perfiles desvinculados o sin correo recuperable.

### API administrativa

Base: `/functions/v1/admin-api`. Las peticiones llevan JWT; las mutaciones llevan
`requestId` UUID y las ediciones `expectedRevision`. Actor y sesión se agregan
exclusivamente en el servidor. El servidor valida campos permitidos y rechaza extras.

| Método y ruta | Entrada y salida mínima |
| --- | --- |
| `GET /session` | Devuelve solo acceso permitido y capacidades del panel. |
| `GET /students` | `search`, `careerId`, `campusId`, `page`, `pageSize`; devuelve IDs internos, nombre, correo vigente de Auth (`email: null` si no es recuperable), carrera/sede disponibles y total. |
| `POST /students/:id/password-reset` | Solo `requestId`; devuelve solicitud aceptada, sin correo de destino, enlace ni token. |
| `GET /catalogs` | Carreras, sedes, emociones y versiones/niveles de tests para formularios. |
| `GET /tests` | Lista de catálogos publicados o en borrador, con su versión activa y estado administrativo. |
| `GET /tests/catalogs/:catalogId` | Detalle de un catálogo UUID y resumen de sus versiones, revisiones, publicación y disponibilidad. |
| `GET /tests/versions/:versionId` | Detalle de una versión bigint, con preguntas, opciones, niveles y permisos de edición. |
| `POST /tests` | Crea catálogo propio y borrador; no permite `kind=protected`. |
| `POST /tests/versions/:versionId/clone` | Crea siguiente borrador de un cuestionario propio. |
| `PUT /tests/versions/:versionId/draft` | Sustituye borrador completo y relaciones de forma transaccional. |
| `POST /tests/versions/:versionId/publish` y `/tests/versions/:versionId/activation` | Publica o cambia disponibilidad; activación recibe `active` booleano. |
| `GET /events`, `POST /events`, `PUT /events/:id` | Consulta o guarda datos del evento y revisión. |
| `POST /events/:id/publish` y `/cancel` | Cambia estado y devuelve recurso actualizado. |
| `GET /tips`, `POST /tips`, `PUT /tips/:id` | Consulta o guarda título, contenido, reglas y revisión. |
| `POST /tips/:id/publish` y `/activation` | Publica o cambia disponibilidad del tip. |

`catalogId` es UUID; `versionId` es la cadena decimal del bigint de la versión;
`version` es su número entero positivo, no un identificador. Estos nombres se
mantienen en lecturas, escrituras y respuestas; no aceptar un ID de catálogo como
ID de versión. IDs bigint se representan como cadenas decimales; UUID como cadenas. Búsqueda
literal parametrizada, sin interpolar filtros PostgREST. Página inicial 1, tamaño
25 y máximo 100, orden estable por nombre/ID. Límite de búsqueda: 100 caracteres.
Definir longitudes de título 1–160 y cuerpo 1–5000; descripción de evento opcional.
No aceptar payloads mayores a 256 KiB.

Respuestas sanitizadas: `401` sesión inválida, `403` sin permisos, `404` recurso no
disponible, `409` revisión o petición en conflicto, `422` validación, `429` límite
de solicitudes y `503` servicio no disponible. No devolver SQL, payloads sensibles
ni mensajes crudos de Auth. Las escrituras reintentadas con UUID y payload iguales
devuelven el resultado anterior dentro de la ventana de 24 horas; otro payload
con el mismo UUID vigente genera `409`. Después de vencer el registro no se
garantiza deduplicación: el cliente no debe reintentar una petición vencida como
si conservara su protección y debe consultar el estado actual del recurso primero.
Revisionar también publicación y activación. Ante conflicto, conservar el formulario
local y ofrecer recargar; no sobrescribir automáticamente.

### Contrato administrativo de reglas de tips

Las reglas son una unión discriminada y describen contenido, sin contexto personal:

- Ánimo: `{ kind: 'mood', mood: string }`, limitado a `Muy mal`, `Mal`, `Neutro`,
  `Bien` o `Muy bien`; el servidor resuelve su relación con el catálogo emocional.
- Resultado: `{ kind: 'result', catalogId: string, versionId: string,
  version: number, level: string }`, usando catálogo UUID, ID bigint decimal,
  número entero de versión y clave de nivel.

`rules: []` significa consejo general; varias reglas expresan alternativas OR.
Validar que catálogo, versión y nivel corresponden entre sí y que la versión está
publicada. Admitir niveles históricos publicados aunque la versión esté inactiva,
sin reactivar el test ni copiar resultados de alumnos. Este contrato sirve al
editor y a la API administrativa; no define un snapshot de distribución.

### Recuperación

- Limitar en el servidor a una solicitud por alumno por minuto y diez por funcionario
  por hora. Los contadores se actualizan atómicamente antes del envío.
- Usar `resetPasswordForEmail` desde un cliente servidor sin sesión persistida,
  con redirect fijo a `ADMIN_WEB_ORIGIN/recover`. No usar `generateLink` ni enviar
  secretos al funcionario. Un timeout del proveedor queda como estado de envío
  incierto; no reenviar automáticamente con el mismo UUID.
- Versionar la plantilla de correo de recuperación para dirigir a
  `{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=recovery` únicamente cuando
  `.RedirectTo` coincide exactamente con `ADMIN_WEB_ORIGIN/recover`. Usar una
  condición de plantilla Go con esa URL literal configurada para el entorno;
  no elegir el recorrido por metadatos del usuario. Para las solicitudes existentes
  sin ese redirect, conservar el enlace `{{ .ConfirmationURL }}` y la configuración
  de Site URL, para no alterar la recuperación actual de Android. La URL web se
  añade a la allowlist local de Auth. Probar ambos correos con el buzón local.
- `/recover` es accesible sin rol administrativo. Extrae el hash a memoria y limpia
  la URL antes de renderizar. Solo después de una acción del alumno ejecuta
  `verifyOtp` con `type: 'recovery'` y luego `updateUser({ password })`.
- Usar un cliente de recuperación separado, sin persistencia ni mezcla con la
  sesión del funcionario. Exigir confirmación de contraseña y la política de Auth;
  limpiar el contexto al terminar y mostrar confirmación del cambio en web.
  Recargar la página después de consumir el token requiere solicitar otro enlace.
  El gateway y los redirects existentes de Android no se modifican; su adecuación
  al recorrido nuevo corresponde a la futura spec de integración.

### Sesión web y amenazas

La sesión del funcionario se guarda en `sessionStorage`, no se recuerda entre
sesiones del navegador. Datos de alumnos solo en memoria y respuestas
`Cache-Control: no-store`. En `401/403`, limpiar sesión/listados y conservar solo
borradores no personales en memoria. Revalidar acceso al restaurar la pestaña.

| Amenaza | Control y prueba |
| --- | --- |
| Escalada por metadatos o manipulación del cliente | Tabla privada de permisos, identidad del JWT verificado y pruebas negativas de API/RPC. |
| Lectura de RUT, teléfono o datos emocionales | Proyección en servidor y ausencia de rutas; probar selección directa y manipulación de IDs. |
| Acceso a borradores mediante tablas hijas | RLS por estado del padre, grants explícitos y pruebas por cada tabla. |
| Reutilización de sesión revocada | Consultar sesión y permiso vigente antes de cada operación sensible. |
| XSS y filtración de recuperación | Texto plano, sin HTML inyectado; hash solo en memoria, sin analytics ni recursos externos en `/recover`. |
| Ediciones concurrentes o reintentos duplicados | Revisión optimista, transacciones e idempotencia, con pruebas de respuesta perdida. |
| Abuso de correos o cambio de destinatario | Límites atómicos, correo canónico de Auth y redirect controlado por servidor. |
| Filtración de información emocional | Guardar solo reglas de contenido, sin contexto personal, destinatarios ni asignaciones; inspeccionar contratos, tablas y logs administrativos. |

CORS restringido al origen configurado del panel, incluido localhost explícito en
desarrollo; CORS no sustituye autorización. Registrar solo código de operación,
estado y duración. Nunca registrar URL de recuperación, headers de sesión,
datos de alumnos, filtros de búsqueda ni cuerpos de solicitudes.

## 5. Experiencia del panel y configuración

Rutas `/login`, `/students`, `/tests`, `/events`, `/tips` y `/recover`, con navegación
lateral y formularios accesibles. La entrada autorizada dirige a `/students`;
no añadir un dashboard estadístico fuera de alcance. Detalles y editores viven
bajo cada módulo. Las escalas protegidas muestran contenido de solo lectura y
control de activación; los cuestionarios propios permiten editar/clonar/publicar.
Los editores de tips muestran «General» o sus reglas, sin destinatarios individuales.

### Administración y publicación de tests

1. **Catálogo:** listar instrumentos protegidos y cuestionarios propios, indicando
   versiones, revisión, estado de publicación y versión activa. «Publicado» y
   «Activo» se muestran por separado.
2. **Crear un cuestionario propio:** generar catálogo y versión en borrador;
   editar título, descripción, preguntas, opciones, puntajes y niveles de resultado.
   Guardar usa `PUT /tests/versions/:versionId/draft` y control de revisión.
3. **Revisar:** mostrar una vista previa del cuestionario y sus niveles antes de
   publicar. El backend valida preguntas, opciones, suma y rangos completos sin
   huecos ni solapamientos; un borrador inválido no se publica.
4. **Publicar:** `POST /tests/versions/:versionId/publish` congela contenido,
   identidad y fecha de publicación. Publicar no activa automáticamente la versión
   ni reemplaza la versión activa anterior. La interfaz confirma la publicación
   y muestra el control separado para habilitarla.
5. **Habilitar en el catálogo:** `POST /tests/versions/:versionId/activation`
   con `active: true` hace disponible la versión publicada y desactiva la anterior
   del mismo catálogo en una transacción. Con `active: false` deja de ofrecerla para
   nuevas ejecuciones, conservando contenido y referencias. Cada cambio incrementa
   la revisión; un borrador no puede activarse.
6. **Cambiar contenido publicado:** clonar con
   `POST /tests/versions/:versionId/clone`, editar el nuevo borrador, publicar y
   activar esa nueva versión. Las anteriores permanecen de solo lectura.

En los instrumentos validados, el panel permite consultar sus versiones y cambiar
disponibilidad; sus preguntas, escalas, puntajes y reglas siguen protegidos.

El recorrido incluido es **panel → API administrativa → catálogo publicado y
activo en Supabase**. Se comprueban persistencia, publicación, activación y permisos
de lectura con consumidores sintéticos locales. No se envían correos, notificaciones
ni tests asignados a una persona. La respuesta confirma el estado del backend,
sin confirmar recepción desde dispositivos. El contrato de distribución y su
consumo por Android se definirán en la futura spec.

El panel distingue vacío, carga, guardado, conflicto, sin conexión y acceso denegado.
Confirmar publicación/cancelación y solicitud de recuperación con lenguaje claro.
Conservar formularios en memoria ante error de red; deshabilitar reenvíos mientras
hay una petición pendiente. No escribir borradores ni alumnos en almacenamiento web.

Variables públicas: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` y
`VITE_ADMIN_API_URL`. La función usa secretos de Supabase para servidor y
`ADMIN_WEB_ORIGIN`; ningún secreto se añade a variables `VITE_*`/`EXPO_PUBLIC_*`.
Versionar solo ejemplos ficticios, exclusiones de Git y documentación.

Para una futura operación remota se deberá verificar la disponibilidad de edición
de plantilla y la configuración SMTP en el proyecto concreto. No configurar ni
contratar servicios en este incremento. La prueba con buzón local no acredita
entrega remota; plantilla y origen deberán revisarse antes de una autorización remota.

## 6. Pruebas, trazabilidad y compatibilidad

| Requisito y criterio | Verificación prevista | Tareas |
| --- | --- | --- |
| RF-001 → CA-001 | Registro sin privilegios, primer funcionario sin perfil de alumno, permiso deshabilitado, revocación sin refresh, JWT/sesión y llamadas directas. | T003, T004, T010, T013, T020, T021, T024 |
| RF-002 → CA-002 | Proyección mínima, correo vigente de Auth, cuenta desvinculada, búsqueda, paginación y filtros. | T011, T014, T020, T021 |
| RF-003 → CA-003 | Buzón local, destinatario resuelto en servidor, límites, enlace inválido/vencido/usado y sesión web separada. | T012, T014, T015, T020, T021 |
| RF-004 → CA-004 | Vista previa, rangos, congelación, publicación sin activación, reemplazo atómico y clonación con referencias conservadas. | T006, T009, T016, T020, T021 |
| RF-004 → CA-005 | Manifiesto protegido, rechazo de edición y control de disponibilidad. | T001, T006, T017, T020, T021 |
| RF-004, RF-005, RF-006 → CA-006 | SELECT y joins directos de padres e hijos, ocultamiento de borradores y aislamiento personal. | T007, T008, T009, T020 |
| RF-005 → CA-007 | Guardado, revisión, publicación/cancelación y fechas/zona horaria en web y base de datos. | T007, T009, T018, T020, T021 |
| RF-006 → CA-008 | Tips generales, reglas alternativas por ánimo o versión/nivel, relaciones inválidas, edición, publicación y desactivación. | T007, T009, T011, T019, T020, T021 |
| RF-002, RF-006 → CA-009 | Ausencia de contexto emocional, resultados, destinatarios o asignaciones en contratos, tablas operativas y logs. | T005, T008, T010, T011, T019, T020, T022, T024 |
| Compatibilidad → CA-010 | Consultas actuales, PSS-10 por nombre/activo, IDs/FK y regresión de recorridos existentes en Android. | T001, T006, T008, T023 |
| Calidad → CA-011 | Estados accesibles, conflictos, reintentos, idempotencia, vencimiento y limpieza sin tráfico. | T002, T005, T009, T010, T013, T020, T021, T022, T024 |

### Validaciones al implementar

- `admin-web/`: `npm ci`, `npm run typecheck`, `npm test`, `npm run build` y
  `npm run test:e2e`; Node `--test` para reglas puras y Playwright para recorridos.
- Backend: Supabase local con Auth, PostgreSQL, Edge Functions y buzón; SQL para
  permisos, constraints, transacciones, reloj, Cron y referencias; HTTP para
  autorización, proyección, recuperación y errores. Comprobar fallo de limpieza,
  vencimiento lógico y eliminación posterior sin tráfico del panel.
- CI: conservar validaciones existentes y añadir panel/backend local, desde
  lockfiles; ningún job usa credenciales reales ni modifica el proyecto remoto.
- `DuocMind/`: ejecutar comprobación de tipos y pruebas existentes de regresión;
  no añadir selección de tips, snapshot, descarga ni nuevas capacidades Android.
- Registrar comandos, versiones, resultados y limitaciones en `verification.md`.
  Ninguna comprobación pendiente permite cerrar su tarea ni el criterio asociado.

### Compatibilidad con Android existente — T023 omitida

La verificación siguiente describe el alcance previsto, omitido por decisión del
usuario el 2026-10-04. Se conserva como límite de evidencia, no como tarea
completada ni como requisito pendiente para esta entrega administrativa.


T001 inventaría las consultas y definiciones en el repositorio; T003 prepara las
fixtures locales y T006/T008 preservan su comportamiento al migrar. En T023
reproducir la consulta actual PSS-10 con `nombre_test`, `is_active = true` y
`.single()`, incluidas preguntas/opciones: un instrumento activo debe devolver
una única definición compatible. Desactivarlo conserva su contenido y deja de
ofrecerlo a esa consulta; no exigir adaptar las rutas del cliente en este incremento.

Conservar nombres protegidos, IDs, versiones, orden de opciones, puntuaciones y
FK existentes; no resolver incompatibilidades renombrando, borrando o sobrescribiendo
instrumentos. Los tests locales de Android no pasan a consumir disponibilidad
remota por esta spec: esa integración se definirá posteriormente.

Probar en un development build Android los recorridos actuales de acceso,
recuperación ya existente, consulta PSS-10, instrumentos locales y rutas de ayuda
con cuentas sintéticas y backend local. Confirmar que el perfil propio y el
historial mantienen su aislamiento. Registrar diferencias previas sin atribuirles
una corrección en esta spec; no modificar la entrada diaria ni incorporar tests,
tips o eventos nuevos. La verificación protege lo existente y no acredita
pendientes de la Spec 004. Si faltan SDK/dispositivo o una prueba falla, mantener
T023 abierta; la web no sustituye la regresión nativa.

CLI, Deno y Docker se prepararon para las pruebas locales del backend y panel.
No se instaló un SDK ni se ejecutaron recorridos nativos. La evidencia real se
registra en `verification.md`.

## 7. Riesgos, cambios remotos y recuperación

1. **Catálogos existentes:** reproducir las FK y probar la clasificación antes del
   cambio de RLS. Si el inventario es ambiguo, detener la aplicación del SQL, no
   modificar datos clínicos ni renumerar versiones para forzar compatibilidad.
2. **Publicación incompleta:** preguntas/opciones/reglas se guardan y publican en
   transacción. Respuesta perdida permite reintento idempotente, no duplicación.
3. **Sesiones y permisos:** repetir checks de servidor; secretos limitados a la
   función. Revocar permisos para detener acceso aunque el navegador siga abierto.
4. **SMTP y redirects:** probar recuperación web con buzón local; no alterar
   configuración ni gateway Android y no acreditar entrega remota con pruebas locales.
5. **Compatibilidad del catálogo:** preservar PSS-10 y consultas actuales. Un
   consumidor que todavía no incorpora el nuevo catálogo no se considera integrado
   por publicar contenidos. Verificar regresión nativa antes de cerrar la spec.
6. **Limpieza operativa detenida:** los registros vencidos no se utilizan aunque
   Cron falle. Revisar estado e historial del trabajo, ejecutar la limpieza privada
   de recuperación y restablecer el trabajo en el entorno local. Documentar el
   retraso de eliminación física; no confundirlo con una extensión de vigencia.

Este incremento prepara migraciones, función, plantilla y documentación local;
no autoriza aplicarlos ni desplegarlos remotamente. Una futura aplicación remota
requiere autorización específica, inventario, respaldo, revisión de permisos,
allowlist/plantilla y pruebas posteriores con cuentas sintéticas.

Recuperación: detener escrituras administrativas y deshabilitar funcionarios;
conservar versiones históricas y datos existentes. Revertir frontend a una versión
compatible y corregir esquema con migración nueva. No restaurar las políticas
de lectura pública irrestricta para resolver un fallo ni eliminar versiones
referenciadas. La recuperación no modifica los recursos ni el almacenamiento de
la app Android. Mantener respaldos bajo el mismo control de acceso y retención
institucional que los datos originales.

## 8. Referencias verificadas

Consultadas y revisadas el 2026-10-04 para el plan y la implementación local:

- [Supabase: RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)
  y [seguridad de Edge Functions](https://supabase.com/docs/guides/functions/auth).
- [Supabase: sesiones](https://supabase.com/docs/guides/auth/sessions),
  [recuperación](https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail)
  y [plantillas de correo](https://supabase.com/docs/guides/auth/auth-email-templates).
- [Supabase: gestión de usuarios](https://supabase.com/docs/guides/auth/managing-user-data)
  para vincular tablas propias a la identidad de Auth.
- [Vite: guía oficial](https://vite.dev/guide/) para el proyecto React independiente.
- [Changelog Supabase](https://supabase.com/changelog): contempla grants explícitos
  de Data API y las restricciones de personalización de correo. No incorpora
  funciones experimentales mencionadas en el changelog.
- [Supabase Cron: guía de uso](https://supabase.com/docs/guides/cron/quickstart)
  para limpieza periódica, comprobación de ejecuciones y depuración del historial.

## 9. Aprobación y estado de implementación

La revisión 0.2.0 de la spec, el plan y las tareas fue aprobada el 2026-10-04.
El panel y backend administrativos están implementados y verificados en local.
Consultar `tasks.md` y `verification.md` para el estado y la evidencia de cada tarea.
T023 se omite por decisión del usuario del 2026-10-04.

La integración Android corresponderá a una futura spec independiente. La implementación incluye aplicación web, migraciones, API y Cron locales; no
modifica servicios remotos ni despliega aplicaciones.

## 10. Operación remota de prueba autorizada — 2026-10-04

El usuario autorizó posteriormente aplicar las migraciones administrativas,
Cron y la API en el Supabase existente de DuocMind y crear una cuenta Auth de
prueba habilitada en `private.admin_staff`. La web se ejecuta localmente contra
ese backend. Esta autorización sustituye el límite de ejecución local para
esta operación concreta; no convierte el entorno en producción.

Antes de aplicar SQL: comprobar migraciones/esquema reales, conservar una copia
privada de definiciones del instrumento y metadatos de esquema/políticas,
y registrar conteos agregados sin copiar perfiles ni historial emocional.
Aplicar únicamente las migraciones aprobadas en orden, verificando su registro.
Conservar PSS-10 y sus IDs, opciones y puntajes. Revalidar RLS y asesores después.

Desplegar `admin-api` con autenticación propia verificada por Auth y comprobación
SQL de sesión/permiso; el gateway no valida JWT legacy porque las cuentas usan
los JWT actuales de Auth. El origen de prueba fijo es `http://127.0.0.1:5173`;
`ADMIN_WEB_ORIGIN` permite cambiarlo mediante configuración de servidor.
Solo la URL y clave publicable pasan a la web. Mantener las pruebas automatizadas
conectadas a la instancia local y separar la comprobación remota de lectura.

Provisionar con `auth.admin.createUser`, confirmación de correo para la cuenta
de prueba y habilitación mediante operador. No enviar correo ni crear perfil
estudiantil. Usar la sesión CLI del operador y una clave de servidor únicamente
en memoria; no persistirla ni crear un endpoint de provisión. La revisión
automática rechazó el endpoint temporal y la extracción persistente de claves;
el usuario aprobó después el uso en memoria. El procedimiento directo creó la
cuenta y se verificaron el permiso, el acceso y el cierre de sesión.
No insertar hashes de contraseña directamente en tablas internas de Auth.

Verificación remota: acceso/cierre con la cuenta solicitada, permiso vigente,
lecturas administrativas mínimas sin guardar datos personales, borradores/RPC
protegidos y compatibilidad de PSS-10. No enviar recuperaciones a alumnos reales
ni ejecutar fixtures o suites de mutación locales contra el proyecto remoto.
La configuración de recuperación requiere comprobar allowlist, plantilla y SMTP
con acceso a los ajustes de Auth; si falta, registrar el límite expresamente.

Recuperación: revocar la cuenta de prueba y detener escrituras/API; conservar
contenido y versiones. Corregir con migración nueva a partir de la copia de
metadatos/contenido afectado, sin reabrir borradores ni borrar datos personales.
Ver `remote.md` para el resultado real y las diferencias respecto de la entrega
inicial local.

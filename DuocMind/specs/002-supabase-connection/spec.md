# Spec 002 — Conexión básica con Supabase

| Campo | Valor |
| --- | --- |
| Versión | 0.1.0 |
| Estado | APROBADA — implementación abierta |
| Fecha | 2026-09-20 |
| Aprobación | 2026-09-20, solicitud explícita de implementar la Spec 002 vigente |
| Constitución | 2.0.0 |
| Plataforma | Android; previsualización web de desarrollo |

## 1. Propósito

Permitir que el equipo configure DuocMind para comunicarse con el proyecto Supabase de desarrollo existente, `Duocmind` (`ashgvanzjeaeekpygqgy`), y compruebe desde la pantalla inicial si la conexión funciona. La comprobación debe ser real y no basarse únicamente en haber creado un cliente.

El proyecto remoto se observó en estado **INACTIVE** al redactar este borrador. Antes de verificar una conexión real será necesario reactivar ese mismo proyecto durante la implementación aprobada. Esta spec no autoriza crear otro proyecto ni modificar ahora el backend.

## 2. Usuario y resultado esperado

Como integrante del equipo, quiero abrir la app y ver si puede comunicarse con el backend de desarrollo, si falta configuración o si se perdió la red, para distinguir problemas de entorno antes de construir funcionalidades que dependan de Supabase.

## 3. Alcance

### Incluido

- Configuración del cliente con `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- Archivo `.env.example` con valores ficticios e instrucciones breves para configurar el entorno local.
- Comprobación remota de solo lectura que no dependa de tablas, identidades ni datos de usuario.
- Estado comprensible en la pantalla inicial durante la comprobación, al conectar, al faltar configuración y al perder la red. Si el servicio no responde pese a tener red, se mostrará como backend no disponible.
- Acceso a la comprobación desde la pantalla por medio de un contrato/caso de uso y un adaptador de infraestructura; la pantalla no importa ni usa el cliente Supabase.
- Validación en Android y en la previsualización web del mismo proyecto Expo.

### Fuera de esta spec

- Autenticación, sesiones, cuentas y recuperación de credenciales.
- Tablas, esquemas, RLS, migraciones, consultas de datos y almacenamiento de información personal o emocional.
- SQLite, persistencia local, outbox, sincronización y garantías offline de funcionalidades futuras.
- CI, despliegue, publicación de Android o web y nuevos proyectos Supabase.

## 4. Requisitos

### RF-001 — Configuración pública

1. El cliente DEBE tomar URL y clave publicable únicamente de `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
2. Si falta o es inválido alguno de los valores, la app DEBE indicar que falta configuración sin intentar la comprobación remota ni fallar al iniciar.
3. `.env.example` DEBE usar marcadores ficticios. Ninguna clave `secret`, `service_role`, contraseña, token administrativo o archivo de entorno real DEBE versionarse ni aparecer en el bundle, errores o logs.

### RF-002 — Comprobación de conexión

1. La app DEBE realizar una solicitud no mutante al proyecto Supabase configurado para comprobar que responde; construir el cliente por sí solo no cuenta como conexión.
2. La comprobación NO DEBE requerir autenticación, tablas ni datos de usuario.
3. Ante pérdida de red, la pantalla DEBE mostrar un estado de falta de conexión y permitir repetir la comprobación. Si hay red pero el backend no responde, DEBE evitar afirmar que está conectado o que el dispositivo está sin red.
4. Las fallas DEBEN presentarse con mensajes técnicos sanitizados, sin exponer URL completa, claves ni respuestas sensibles.

### RF-003 — Límite de arquitectura y plataformas

1. La pantalla inicial DEBE consumir un resultado de comprobación provisto por la capa de aplicación e infraestructura, sin importar ni consultar directamente el cliente Supabase.
2. La misma experiencia de estados DEBE poder observarse en Android y en la previsualización web. La web no acredita comportamiento nativo ni garantías offline del producto.
3. Esta conexión no DEBE introducir persistencia o sincronización antes de contar con sus specs aprobadas.

## 5. Criterios de aceptación y comprobación

| Criterio | Resultado observable | Comprobación prevista |
| --- | --- | --- |
| CA-001 | Sin variables, con una variable ausente o con valores inválidos, la pantalla indica «Falta configuración» y la app sigue abierta sin emitir una solicitud remota. | Arranque con cada variante y verificación de estado y ausencia de solicitud. |
| CA-002 | Con el proyecto existente reactivado y los valores públicos correctos, una respuesta remota de solo lectura cambia el estado de comprobación a «Conectado». | Prueba de integración contra el proyecto de desarrollo y apertura de la pantalla. |
| CA-003 | Al quitar la red, la pantalla informa «Sin red»; al recuperarla y reintentar, vuelve a comprobar la conexión. Una falla del servicio con red no se presenta como conexión exitosa. | Prueba controlada de red y respuesta fallida; comprobación manual de reintento. |
| CA-004 | Los estados y el reintento son visibles y comprensibles en Android y en la previsualización web. | Prueba de humo en dispositivo o emulador Android y revisión en navegador, con resultados registrados. |
| CA-005 | La pantalla no importa Supabase ni hace consultas directas; la comprobación atraviesa un contrato/caso de uso y un adaptador de infraestructura. | Inspección de dependencias/importaciones y prueba del comportamiento con resultado controlado. |
| CA-006 | `.env.example` solo contiene valores ficticios; no hay secretos ni archivos de entorno reales versionados o expuestos en errores y logs. | Inspección de archivos versionados, reglas de exclusión y mensajes de error. |

## 6. Casos límite y cierre

- Mientras `Duocmind` permanezca **INACTIVE**, CA-002 no puede darse por cumplido. La reactivación se hará después de aprobar spec, plan y tareas, antes de la prueba real.
- Una URL válida con un proyecto inaccesible o una clave publicable incorrecta no debe mostrar «Conectado»; el resultado debe orientar al equipo sin revelar credenciales.
- La pérdida de red de esta comprobación no representa la futura capacidad offline de agenda o emociones.

La Spec 002 fue aprobada por la solicitud explícita del usuario de implementar el plan que sigue su contenido vigente. `plan.md` y `tasks.md` se redactan en ese orden antes de implementar. La spec permanece abierta hasta verificar todos sus criterios, incluida la conexión real y la ejecución Android.

# Plan — Check-in emocional con historial personal

**Spec:** `spec.md` (aprobada) · **Estado:** APROBADO
**Aprobación:** confirmada por el usuario el 2026-09-27.

## Arquitectura propuesta

- `src/shared/backend/infrastructure/`: crear un único cliente Supabase configurado con la URL y publishable key existentes y un adaptador de sesión de `expo-secure-store`. No se guardan credenciales ni datos emocionales en logs.
- `src/features/auth/`: separar casos de uso y gateway de Auth/perfil. Registro crea la cuenta Auth; tras confirmar el correo e iniciar sesión, se consulta el perfil por `auth.uid()`. Si no existe, se presenta onboarding con RUT, nombre y apellido. No guardar esos datos en `user_metadata`.
- `src/features/emotional-checkin/`: caso de uso para resolver el ID de `emocion_general` por valor de escala, seleccionar su fila `Sin especificar`, persistir el check-in y consultar el historial. La pantalla solo orquesta estados y presentación; no llama directamente a Supabase ni SQLite.
- Persistencia Android: SQLite con SQLCipher habilitado mediante configuración Expo; guardar su clave en SecureStore. Guardar un check-in confirmado en una outbox cifrada antes de informar éxito. Mantener la outbox y una copia mínima del historial para lectura offline.
- Sincronización: al recuperar conectividad, enviar cada UUID idempotente a Supabase. La migración añade `client_request_id` único a `registro_emocional`; la operación remota ignora reintentos ya aceptados y luego marca la fila local sincronizada. El historial combina remoto y pendientes locales por `fecha_hora` descendente.
- Borrado de cuenta: tras la confirmación explícita, el cliente elimina primero la base cifrada y su clave del dispositivo; luego la función Supabase Edge autentica el JWT, anonimiza el perfil y elimina datos emocionales/test/derivación, y elimina el usuario Auth mediante Admin API. La clave privilegiada solo existe como secreto de función. Si falla la red, los datos locales ya no permanecen en el dispositivo, la sesión se conserva y se permite reintentar la eliminación remota.

## Cambios de esquema

Crear una migración forward-only que:

1. Inserte idempotentemente `Sin especificar` asociado a cada una de las cinco emociones generales.
2. Añada `client_request_id uuid unique` nullable a `registro_emocional` para respetar filas históricas y hacer idempotente la sincronización.
3. Restrinja `DELETE` de registros emocionales al propietario con grant y política RLS; mantener `SELECT`/`INSERT` por propietario.
4. Añada una función de servidor para anonimizar RUT, nombres, correo y teléfono, desvincular Auth y eliminar filas personales emocionales, aplicaciones de test y alertas, manteniendo las relaciones académicas no identificables.
5. Revise el orden de operaciones de borrado contra todas las FK y asegure atomicidad de la limpieza de datos dentro de PostgreSQL.

No aplicar la migración al proyecto remoto como parte de la implementación local. La revisión y despliegue remoto requieren una autorización separada y verificación posterior.

## Sesión y perfil

- El inicio de sesión real sustituye la navegación simulada actual.
- El registro puede quedar sin sesión si Supabase exige confirmar correo; no se guardan en disco RUT/nombre/apellido antes de autenticarse. Después de confirmar y entrar, un onboarding protegido crea el perfil.
- Toda lectura/escritura personal usa la sesión restaurada y el `id_estudiante` obtenido consultando el perfil propio. No confiar en IDs entregados por rutas o controles.
- La baja de cuenta es una acción destructiva explícita que limpia local primero y usa una Edge Function autenticada; Admin API y service role nunca se importan en el bundle móvil.

## Flujos y estados

- Confirmación online: insertar en SQLite cifrada, sincronizar, refrescar historial y mostrar éxito solo cuando la copia local esté comprometida. Un fallo de red deja el elemento como pendiente, visible en el historial con estado de sincronización.
- Confirmación offline: guardar en outbox y mostrar pendiente; sincronizar al recuperar conexión. UUID estable evita duplicados tras cierre/reinicio o respuesta perdida.
- Error de Auth/perfil: no permitir guardar y mostrar el paso faltante sin exponer detalles internos.
- Eliminar un registro pendiente: quitarlo de la outbox local. Eliminar uno sincronizado: solicitud remota bajo RLS y actualización de la copia local solo tras éxito.
- El historial se muestra debajo del selector en la pantalla de check-in, con ánimo general y fecha/hora localizados.

## Riesgos y mitigaciones

- Expo Go puede no incluir SQLCipher/configuración nativa; validar en un development build Android y no acreditar cifrado con previsualización web.
- Confirmación de correo puede devolver `session: null`; el onboarding debe ocurrir después del siguiente inicio de sesión, sin almacenar PII pendiente.
- Un fallo entre anonimización y borrado de Auth puede dejar la cuenta autenticable sin perfil. Hacer la función repetible y presentar estado de cierre; verificar/reintentar hasta que la cuenta Auth quede eliminada.
- La solicitud limpia la copia local antes de la llamada remota para que una respuesta perdida no deje datos sensibles en el dispositivo; ante fallo remoto se conserva la sesión y se ofrece reintento, aunque la eliminación del servidor puede quedar pendiente.
- El valor `Sin especificar` es compatibilidad temporal con el esquema actual, no una emoción elegida. No se mostrará como sentimiento del usuario en UI.
- Las pruebas y cuentas serán sintéticas; no habilitar uso de información real hasta validar cifrado, RLS, retención y eliminación.

## Pruebas y verificación

- Unitarias: mapeo ánimo/catálogo; cola local; orden y combinación de historial; UUID/reintento.
- Integración Supabase local: Auth/perfil, inserción, lectura, borrado propio y rechazo de acceso cruzado entre dos usuarios.
- Offline Android: guardar sin red, cerrar/reabrir, recuperar conexión, sincronizar una sola fila y conservar orden/fecha original.
- Cierre de cuenta: limpieza repetida, invariantes FK, datos personales anonimizados y usuario Auth eliminado; fallo/reintento entre fases.
- `npm run typecheck` y `npm test` desde el contenedor que contiene las dependencias.
- Verificación manual en Android development build; web no acredita SQLCipher ni comportamiento offline.

## Reversión y recuperación

- No reescribir migraciones ya aplicadas. Antes de despliegue remoto, respaldar y revisar el SQL; no borrar filas históricas durante una reversión.
- Revertir catálogo solo si no hay registros que lo referencien. Retirar `client_request_id` solo después de detener clientes que dependan de idempotencia.
- Mantener la migración de `DELETE` y la función de anonimización versionadas; su reversión requiere restaurar políticas revisadas, no reabrir acceso global.
- Antes de distribuir la app, definir copia/restauración de la SQLite cifrada y comportamiento si SecureStore pierde la clave; la pérdida de clave no debe llevar a guardar la base en claro.

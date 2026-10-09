# Tareas — Check-in emocional con historial personal

**Plan:** `plan.md` (aprobado) · **Estado:** APROBADO
**Aprobación:** confirmada por el usuario el 2026-09-27.

- [x] T001 Configurar cliente Supabase compartido con sesión persistida en SecureStore, fragmentación de valores grandes y pruebas de restauración/cierre/interrupción (typecheck y 6 pruebas unitarias aprobados).
- [x] T002 Implementar registro, inicio de sesión y onboarding de perfil (RUT, nombre y apellido), con manejo de confirmación de correo y acceso solo al perfil propio (typecheck y 3 pruebas de casos de uso aprobados).
- [x] T003 Crear migración versionada para catálogo idempotente `Sin especificar`, `client_request_id`, políticas/grants RLS de borrado propio y rutina transaccional de anonimización; smoke test PostgreSQL pasó con dos estudiantes sintéticos (lectura, inserción cruzada rechazada, UUID idempotente, borrado y privilegios de servidor).
- [x] T004 Configurar SQLite con SQLCipher y clave en SecureStore; implementar outbox, cache mínima, estados de sincronización y pruebas de persistencia tras reinicio (config Expo resuelta y 4 pruebas SQLite/clave aprobadas; build cifrado Android queda en T008).
- [x] T005 Implementar casos de uso/gateway de check-in: resolver ánimo y catálogo, confirmar en almacenamiento local cifrado, sincronizar idempotentemente y consultar historial propio (typecheck y 6 pruebas de aplicación aprobados).
- [x] T006 Integrar en la pantalla de check-in la confirmación con estados loading/error/no disponible y el historial cronológico debajo del selector; no mostrar el valor técnico `Sin especificar` (typecheck y pruebas del flujo de aplicación aprobados).
- [x] T007 Implementar eliminación de un registro propio y Edge Function de cierre de cuenta con limpieza y anonimización repetibles; probar fallos y reintentos sin exponer service role al cliente (smoke test SQL y 2 pruebas de orquestación de borrado aprobados; función aún no desplegada).
- [ ] T008 Ejecutar pruebas de unidad e integración de Auth, aislamiento, sincronización, borrado y errores; validar typecheck/tests en el contenedor y el flujo offline en Android development build. Pendiente: no hay `adb`/Android SDK disponible en este host y no se han aplicado la migración ni desplegado la Edge Function en Supabase remoto.
- [x] T009 Documentar variables, configuración Supabase, procedimiento de migración/Edge Function, recuperación local y verificaciones pendientes de despliegue; no se aplicaron cambios remotos.
- [x] T010 Aplicar la enmienda 2026-10-07: migración `20261007120000_registro_emocion_general.sql`, gateway con `emocion_general`, smoke test SQL, `tools/tests/security.mjs` y `ENDPOINTS.md` actualizados (smoke test PostgreSQL 17 aprobado, incluida la conservación de una fila heredada; typecheck y 47 pruebas aprobados). La migración no se aplicó al proyecto remoto.

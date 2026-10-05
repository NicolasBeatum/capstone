# Operación remota de prueba — 2026-10-04

El usuario autorizó posteriormente aplicar el backend administrativo al proyecto
DuocMind `ashgvanzjeaeekpygqgy`, crear una cuenta de prueba y ejecutar ambas webs
localmente contra ese proyecto. Esta operación no despliega el frontend ni
incorpora el consumo Android de nuevos cuestionarios, eventos o tips.

## Cambios aplicados

- Aplicadas las nueve migraciones administrativas posteriores a las cuatro
  migraciones existentes. El conector asignó timestamps distintos; se normalizó
  únicamente el registro de esas nueve migraciones a los identificadores del
  repositorio, comprobando nombres únicos. El historial remoto contiene las
  trece migraciones correspondientes al código local.
- `admin-api` desplegada y activa. El gateway delega la verificación del token a
  la función, que consulta Auth y comprueba sesión y autorización por operación.
  El origen de prueba es exactamente `http://127.0.0.1:5173`.
- Cron `duocmind_admin_cleanup` activo cada cinco minutos; se observó una
  ejecución satisfactoria. La expiración lógica sigue siendo de 24 horas.
- Cuenta Auth de prueba `admin@admin.com`, confirmada sin enviar correo,
  habilitada por operador en `private.admin_staff`. Credenciales solo en archivo
  privado ignorado; ninguna clave de servidor guardada o expuesta al cliente.
- Auth admite `http://127.0.0.1:5173/recover`. La configuración mínima versionada
  está en `tools/remote-config/supabase/config.toml`; nueve propiedades no
  declaradas permanecieron sin cambios.

La revisión automática rechazó un endpoint temporal de provisión y una propuesta
de persistir claves privilegiadas. Ninguno se ejecutó. El usuario autorizó
después el uso de la clave únicamente en memoria con su sesión CLI; la cuenta
se creó directamente mediante `auth.admin.createUser`, sin endpoint adicional.

## Comprobaciones

Antes de migrar se guardó una copia privada de definiciones de esquema/políticas,
contenido del PSS-10 y conteos agregados. No se copiaron perfiles ni historial
emocional. El PSS-10 conserva ID 1, textos, orden, puntajes, diez preguntas y
cincuenta opciones. Tras migrar se conservaron los conteos de cuentas, alumnos
y registros emocionales; la creación posterior añade únicamente la cuenta de
prueba solicitada.

La comprobación remota de lectura verifica API sin sesión (401), token inválido
(401), origen ajeno (403), preflight (204), RPC administrativa anónima denegada
(42501) y consulta pública existente del PSS-10. Se verificó el inicio de sesión
administrativo y el rechazo del token después del cierre (401).

RLS está activa, incluido `evento_institucional`; roles cliente sin uso del
esquema privado ni ejecución de las seis funciones administrativas. Las
funciones administrativas son invoker y ejecutables por el servidor. Los
asesores no añadieron WARN/ERROR: permaneció el aviso previo sobre protección
de contraseñas filtradas deshabilitada. Las tablas privadas con RLS sin políticas
impiden acceso cliente deliberadamente. Se registraron recomendaciones
informativas de índices, sin eliminar índices por falta de uso en este entorno.

DuocMind responde en `http://localhost:8081` y muestra «Backend conectado» tras
consultar Auth del proyecto real. El panel responde en
`http://127.0.0.1:5173/login`; acceso y cierre comprobados en navegador sin guardar
capturas ni datos personales. Esta previsualización no acredita pruebas Android.

Las lecturas `/tests`, `/events` y `/tips` del panel respondieron 200 sin alertas
visibles. La revisión final del config mínimo no presenta cambios declarados
pendientes; solo muestra las nueve propiedades remotas conservadas. Pasaron
`deno check --frozen`, `node --check` de los tres scripts remotos y `git diff --check`.

## Recuperación de contraseña pendiente

Supabase rechazó con 400 la actualización de la plantilla: el proveedor de
correo predeterminado del plan gratuito no permite personalizarla. Se aplicó
por separado únicamente la URL permitida. No se configuró SMTP, se cambió de
plan ni se enviaron recuperaciones a alumnos reales.

La página web implementada requiere el `token_hash` de la plantilla aprobada;
la plantilla remota predeterminada no completa ese recorrido. Antes de usar
recuperación real, configurar SMTP propio o un plan compatible, revisar y
aplicar `supabase/templates/recovery.html`, y verificar entrega y cambio de
contraseña con una cuenta sintética con buzón controlado. No se acredita entrega
remota de correos ni recuperación web completa.

## Ejecución y recuperación operativa

Desde la raíz del repositorio, en dos terminales:

```bash
npm --prefix admin-web run dev:remote -- --port 5173 --strictPort
```

```bash
npm --prefix DuocMind run web -- --port 8081 --localhost
```

`predev:remote` copia únicamente URL y clave publicable del `.env` de DuocMind
a `.env.remote.local`, ignorado y privado. El modo habitual `dev` y las suites
automatizadas mantienen Supabase local. La comprobación remota de lectura es:

```bash
node DuocMind/tools/scripts/remote-check.mjs
```

Para revisar la configuración remota mínima, sin cambios:

```bash
DuocMind/tools/node_modules/.bin/supabase config diff --workdir DuocMind/tools/remote-config --project-ref ashgvanzjeaeekpygqgy
```

Antes de volver a aplicar, conservar cualquier URL permitida añadida después
de esta operación. No ejecutar fixtures, reset local ni suites de mutación
contra el proyecto real. Detener las webs con Ctrl+C. Para retirar el acceso de
prueba, el operador deshabilita su registro `private.admin_staff`; la API vuelve
a comprobarlo incluso con sesión abierta. Conservar contenido/versiones y
corregir esquema con migraciones nuevas, usando la copia privada de metadatos.

Compartir Supabase permite administrar el backend existente. La descarga y
presentación de contenido nuevo en Android continúa pendiente de otra spec.

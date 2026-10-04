# Administración de DuocMind

Panel React + TypeScript de la Spec 005, en la rama `feature/admin-dashboard-implementation`. Administra alumnos, recuperación de contraseña, cuestionarios propios, disponibilidad de instrumentos protegidos, eventos y tips. Publicar/activar confirma el estado del backend; el consumo de contenido nuevo en Android corresponde a otra spec.

## Ejecutar en local

Desde la raíz del repositorio, con Node 24, npm 11.13.0 y Docker en ejecución:

```bash
npm ci --prefix DuocMind/tools
npm ci --prefix admin-web
node DuocMind/tools/scripts/local-start.mjs
node DuocMind/tools/scripts/fixtures.mjs
node DuocMind/tools/scripts/staff.mjs staff enable
```

En una terminal para el backend:

```bash
node DuocMind/tools/scripts/local-serve.mjs
```

En otra terminal:

```bash
npm --prefix admin-web run dev
```

Abrir `http://127.0.0.1:5173`. Las credenciales aleatorias de prueba están únicamente en `DuocMind/tools/.local/fixtures.json`, ignorado por Git y con permisos privados: usar los campos `staff.email` y `staff.password`. No compartir ese archivo. Volver a ejecutar fixtures cambia las contraseñas sintéticas.

El buzón local está en `http://127.0.0.1:54324`. La cuenta `student` tiene un correo de perfil deliberadamente diferente del correo Auth; `unlinked` no tiene cuenta recuperable; `unassigned` no tiene permiso; `dual` permite comprobar aislamiento de una cuenta con perfil. `staff` no tiene perfil de alumno.

`local-start` aplica las migraciones al crear la base local. Para reconstruir **solo esa base sintética**, primero detener escrituras y ejecutar:

```bash
DuocMind/tools/node_modules/.bin/supabase db reset --local --workdir DuocMind
node DuocMind/tools/scripts/fixtures.mjs
node DuocMind/tools/scripts/staff.mjs staff enable
```

Para detener los servicios locales:

```bash
DuocMind/tools/node_modules/.bin/supabase stop --workdir DuocMind
```

## Configuración

`local-start` genera `admin-web/.env.local` con URL y clave publicable de la instancia local. La API usa las credenciales de servidor proporcionadas por el runtime y `ADMIN_WEB_ORIGIN`, en `DuocMind/tools/.local/functions.env`. La sesión administrativa se guarda en `sessionStorage`; los listados y formularios permanecen en memoria.

El `.env` existente de `DuocMind/` se conserva. Su URL corresponde al proyecto remoto: no se usó para migraciones, cuentas ni pruebas. Nunca copiar claves privilegiadas a variables `VITE_*` o `EXPO_PUBLIC_*`. Los scripts de prueba rechazan URLs remotas y no imprimen claves, contraseñas ni tokens.

## Validación

Con el backend local en ejecución:

```bash
node DuocMind/tools/scripts/local-ready.mjs
node DuocMind/tools/scripts/backend-tests.mjs
DuocMind/tools/node_modules/.bin/deno check --frozen --config DuocMind/supabase/functions/admin-api/deno.json DuocMind/supabase/functions/admin-api/index.ts
DuocMind/tools/node_modules/.bin/deno test --frozen --config DuocMind/supabase/functions/admin-api/deno.json DuocMind/supabase/functions/admin-api/recovery_test.ts
npm --prefix admin-web run typecheck
npm --prefix admin-web test
npm --prefix admin-web run build
npm --prefix admin-web run test:e2e
npm --prefix DuocMind run typecheck
npm --prefix DuocMind test
```

La primera ejecución de Playwright requiere `admin-web/node_modules/.bin/playwright install chromium`. CI usa `install --with-deps chromium` en Ubuntu. Los recorridos usan fixtures locales, no guardan trazas ni vídeos y restauran las contraseñas sintéticas que modifican. La imagen del listado contiene únicamente registros de prueba y permanece ignorada.

Ver [operación](../DuocMind/specs/005-admin-dashboard/operations.md), [contratos](../DuocMind/specs/005-admin-dashboard/contracts.md) y [evidencia](../DuocMind/specs/005-admin-dashboard/verification.md). La regresión nativa T023 fue omitida por decisión del usuario; no se acredita validación Android ni entrega remota de correos.

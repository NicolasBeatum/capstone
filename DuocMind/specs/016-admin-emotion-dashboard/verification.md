# Verificación 016 — Dashboard emocional agregado y alineación del panel

| Campo | Valor |
| --- | --- |
| Fecha | 2026-11-06 |
| Entorno | Supabase local `duocmind-admin-local` (API 55321, base 55322), cuentas sintéticas. Sin acceso al proyecto remoto. |

## Resultados

| Comprobación | Resultado |
| --- | --- |
| `supabase db reset --db-url` (local) | 26 migraciones aplicadas |
| `npm --prefix tools run test:backend` | Suite completa, exit 0 |
| `deno test` en `admin-api` | 5 de 5 |
| Panel: `npm run typecheck` | Sin errores |
| Panel: `npm test` | 10 de 10 |
| Panel: `npm run build` | Correcto |
| Panel: `npm run test:e2e` | 33 de 33 |
| App: `npm run typecheck` | Sin errores |
| App: `npm test` | 319 de 319 |
| Búsqueda de sede y Tips en `admin-web/src` | 0 coincidencias |

## Criterios

| Id | Estado | Evidencia |
| --- | --- | --- |
| CA-001 | Cumplido | e2e de Dashboard y Alumnos |
| CA-002 | Cumplido | Búsqueda y typecheck |
| CA-003 | Cumplido | Reset local |
| CA-004 a CA-011 | Cumplidos | `tools/tests/emotions.mjs` |
| CA-012, CA-013 | Cumplidos | `tests/consentSettings.test.mjs`, `tests/registrationConsents.test.mjs`, `tools/tests/consents.mjs` |
| CA-014 | Cumplido | `e2e/emotions.spec.ts` y recorrido en navegador contra el backend local con 23 estudiantes sintéticos: 20 contados y 3 excluidos (solo `contacto`, revocado, sin consentimiento) |
| CA-015 | Pendiente | Sin `adb` ni dispositivo en este entorno |

## Limitaciones

- `sync_remote_schema` tenía encoding mixto: 16 líneas en Latin-1. La base local también aplicaba el archivo original, así que la conversión es de higiene y no corrigió un fallo observado. El texto decodificado es idéntico.
- Las pantallas de la app no se probaron renderizadas ni en dispositivo; la red caída solo se cubrió con fakes.
- Nada se aplicó al proyecto remoto. Antes de un `db push` hay que revisar los riesgos de idempotencia del plan, sección 5.
- `supabase/config.toml` declara los puertos 54321 y 54322, pero el stack local usa 55321 y 55322. Un `supabase db reset` sin `--db-url` falla y elimina contenedores del stack local.

## Alineación con producción (2026-11-06)

Producción es la referencia del esquema. Una comparación de catálogos mostró que `estudiante_consentimiento_actual` no expone `codigo` allá, por lo que el dashboard y la app resuelven el código con `consentimiento`.

`20261106130000_production_alignment.sql` aplica lo que faltaba: `admin_mutate` sin el tipo eliminado `material_apoyo`, borrado de consentimientos en `erase_student_personal_data`, `registro_emocional` en Realtime y permisos `UPDATE`/`DELETE` de agenda y ramos.

## Historial de migraciones reconciliado (2026-11-06)

Las 2 versiones solo remotas se recuperaron desde `supabase_migrations.schema_migrations`. Las 10 locales sin registrar se marcaron como aplicadas después de confirmar el esquema contra producción, y `20261106140000_match_production_schema.sql` cierra las diferencias.

Una base local creada desde cero coincide con producción en columnas, constraints, índices, funciones, policies, triggers, vistas, RLS y permisos. Los datos de `carrera` y `asignatura` no van en migraciones.

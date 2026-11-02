# Verificación 014 — Datos académicos y consentimientos en el registro

| Campo | Valor |
| --- | --- |
| Fecha | 2026-10-30 |
| Entorno | Windows 11, Node v26.10.0 (el proyecto pide >=24 <25), npm 11.19.1 |

## Resultados

| Comando | Resultado |
| --- | --- |
| `npm run typecheck` | Sin errores. |
| `npm test` | 261 pruebas, 261 correctas, 0 fallos (incluye `registration.test.mjs` y `registrationCatalog.test.mjs`). |
| `npx expo export --platform web` | Exporta sin errores y el bundle incluye `privacy-consents.pdf` (CA-008, parte web). |

## Criterios

| ID | Estado |
| --- | --- |
| CA-001 a CA-007 | Cubiertos por pruebas automáticas. |
| CA-009 | Revisión del código: no hay escrituras ni logs de los valores; `registerAccount` no cambió. |
| CA-008 | Pendiente en Android (T008). |

## Limitaciones

- No se probó la pantalla en un dispositivo ni contra un Supabase con catálogos cargados.
- `npm ci` falló por `engine-strict` con Node 26; se instaló con `--engine-strict=false`.
- `expo install` re-resolvió el lockfile (dependencias anidadas deduplicadas); conviene revisarlo en el PR.
- Apertura del PDF en Android con `expo-sharing`: sin verificar en dispositivo; si el selector no ofrece un visor, el plan prevé revisar el mecanismo.

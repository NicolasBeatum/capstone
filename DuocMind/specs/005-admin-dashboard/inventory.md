# Inventario de compatibilidad — Spec 005

Fuentes: migraciones y código versionados; no se consultó el backend remoto.
Reproducir: `node DuocMind/scripts/admin-inventory.mjs`.

## Esquema

- `20260927224730_bienestar_schema.sql`
- `20260927224846_secure_and_index_schema.sql`
- `20260927230000_emotional_checkin_history.sql`
- `20260928010000_grant_checkin_timestamp.sql`

24 tablas públicas. No existe autorización administrativa.
`estudiante.auth_user_id` enlaza Auth; el perfil propio conserva RLS. Las tablas de catálogos permiten lectura sin publicación. Las relaciones `material_emocion` y `material_test` ya existen.

## Instrumentos

WHO-5, PHQ-9, GAD-7 y sondeo están definidos en código. Sus definiciones y cálculos no se modifican.
PSS-10 consulta el nombre exacto «Escala de Estrés Percibido (PSS-10)», filtra `is_active=true` y requiere una única fila, con preguntas y opciones. **No hay seed versionado de PSS-10**: no inventar preguntas; si falta en la base local, probar compatibilidad con una fixture sintética identificada, sin presentarla como instrumento validado.

| Archivo | SHA-256 |
| --- | --- |
| `src/features/emotional-checkin/data/who5.ts` | `526546640bb7c3436c7f6ff203741e593c90577b991502f9c3f2f11f671c7b27` |
| `src/features/emotional-checkin/data/phq9.ts` | `7bf6b483510ee4790c378267b80c67faf7588e5157eeb9607f05982c1177fb23` |
| `src/features/emotional-checkin/data/gad7.ts` | `cc2a04d044132815c9dac72b0361409e1142557399ba0d3e2a28842a6413e89e` |
| `src/features/emotional-checkin/data/sondeoInicial.ts` | `ff0a7da0ad311f8c89c7446d6a6a86e80d6689d00372aeca69677e4e4bb75e60` |

## Reglas para migrar

- Conservar IDs, números de versión, FK, nombres protegidos y orden de opciones.
- Rechazar nombres protegidos en cuestionarios propios, contenido incompatible y varios activos por catálogo.
- El perfil incluye RUT/teléfono: la API administrativa proyectará únicamente campos autorizados y resolverá correo desde Auth.
- Los tips actuales son tres recursos fijos en Bienestar; no existe consumo Android del catálogo nuevo.
- La recuperación Android invoca Auth sin redirect explícito; la plantilla debe conservar ese recorrido.
- La validación nativa de Spec 004 sigue pendiente. Las pruebas de este incremento no acreditan esa spec.

Los casos SQL y la fixture PSS-10 se verifican en entorno local en T003/T006/T023; no se infiere estado del proyecto remoto.

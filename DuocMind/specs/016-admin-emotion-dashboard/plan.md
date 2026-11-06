# Plan 016 — Dashboard emocional agregado y alineación del panel

| Campo | Valor |
| --- | --- |
| Versión | 0.1.0 |
| Estado | APROBADO |
| Fecha | 2026-11-06 |
| Spec | 016 0.1.0 |
| Aprobación | Nicolás Hernández, 2026-11-06 |

## 1. Arquitectura

| Capa | Archivo | Cambio |
| --- | --- | --- |
| Migración | `supabase/migrations/20261104120000_sync_remote_schema.sql` | Solo encoding a UTF-8 |
| Migración | `supabase/migrations/20261106120000_admin_emotion_dashboard.sql` | `private.emotion_dashboard`, `admin_read`, `admin_access`, grants |
| Edge | `supabase/functions/admin-api/` | Retira `/tips`, admite `/emotions` |
| Panel | `admin-web/src/{domain,infrastructure,application,pages,components}` | Sin sede ni Tips; contrato, hook y página de Emociones |
| App | `src/shared/consents/` | Gateway remoto, reglas de sincronización |
| App | `src/features/settings`, `src/features/auth` | Usan la sincronización |
| Herramientas | `tools/scripts/fixtures.mjs`, `tools/tests/` | Esquema vigente y `emotions.mjs` |

## 2. Datos y seguridad

Nueva función `private.emotion_dashboard(p_days int) returns jsonb`, `security invoker`, `search_path = ''`, ejecutable solo por `service_role`. `admin_read` la llama tras `assert_admin`, en la ruta `/emotions`, con `check_fields` limitado a `days`.

Base de la consulta:

```sql
from public.registro_emocional re
join public.estudiante_consentimiento_actual eca
  on eca.estudiante_id_estudiante = re.estudiante_id_estudiante
 and eca.codigo = 'analitica_anonima'
 and eca.otorgado
 and re.fecha_hora >= eca.registrado_en
join public.emocion_general eg on eg.id_emocion = re.emocion_general_id_emocion
left join public.estudiante_carrera ec
  on ec.estudiante_id_estudiante = re.estudiante_id_estudiante and ec.fecha_fin is null
left join public.carrera c on c.id_carrera = ec.carrera_id_carrera
```

La carrera se toma del vínculo vigente porque la app no envía `estudiante_carrera_id`. La nueva migración redefine `admin_read` a partir de su versión vigente y concede explícitamente a `service_role` el `select` que necesite.

Contrato con datos suficientes:

```json
{
  "days": 30, "from": "2026-10-08", "to": "2026-11-06", "minGroupSize": 5,
  "sufficient": true, "participants": 12, "checkins": 58, "average": 3.4,
  "distribution": [{ "value": 1, "label": "Muy mal", "checkins": 3 }],
  "weekly": [{ "weekStart": "2026-10-05", "participants": 7, "average": 3.2 }],
  "careers": [{ "name": "Otras carreras", "participants": 6, "average": 3.5 }]
}
```

Con datos insuficientes: `sufficient: false`; `participants`, `checkins` y `average` en `null`; listas vacías. No se informa cuántos participantes faltan. En `weekly`, una semana bajo el mínimo trae `participants` y `average` en `null`.

Sincronización en la app: `changeConsent` inserta primero en remoto y después escribe local. `loadConsents` lee `estudiante_consentimiento_actual`, actualiza el local y usa el local si no hay conexión. Códigos: `shareAnonymousData` → `analitica_anonima`, `allowEmergencyContact` → `contacto`. Versión del texto: constante `CONSENT_TEXT_VERSION = 'v1'`.

## 3. Interfaz

Ruta protegida `/emotions`, entrada «Emociones» en la navegación y capacidad `emotions` en `admin_access`. Selector de 7, 30 y 90 días, métricas, distribución, tendencia y carreras con gráficos SVG o CSS propios y tablas accesibles. El bloque «Pendiente de habilitar» del Dashboard pasa a enlazar esta página.

## 4. Pruebas

- Backend: `tools/tests/emotions.mjs`, registrada en `backend-tests.mjs`, cubre CA-004 a CA-011.
- Panel: `npm run typecheck`, `npm test`, `npm run build`, `npm run test:e2e`.
- App: `npm run typecheck`, `npm test`.

## 5. Riesgos y reversión

- El remoto puede diferir de las migraciones. `sync_remote_schema` y `student_profile_edit` tienen riesgos de idempotencia que deben revisarse antes de cualquier `db push`, con autorización explícita.
- Al inicio el dashboard estará en estado insuficiente: se necesitan 5 estudiantes con consentimiento registrado y check-ins posteriores.
- Reversión: revertir la rama y crear una migración que restaure `admin_read` y `admin_access`. Las filas de consentimiento se conservan.

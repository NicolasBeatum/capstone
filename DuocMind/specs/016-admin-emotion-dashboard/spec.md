# Spec 016 — Dashboard emocional agregado y alineación del panel

| Campo | Valor |
| --- | --- |
| Versión | 0.1.1 |
| Estado | APROBADA |
| Fecha | 2026-11-06 |
| Incremento | 016-admin-emotion-dashboard |
| Plataformas | Panel web, Android, Supabase |
| Aprobación | Nicolás Hernández, 2026-11-06 |

## 1. Problema

El panel dejó de funcionar tras `20261104120000_sync_remote_schema.sql`: la base ya no tiene sede ni consejos, pero `admin-web` aún los exige, por lo que Dashboard, Alumnos y Tips fallan.

Bienestar tampoco tiene una vista agregada del ánimo estudiantil. La spec 005 dejó las estadísticas emocionales fuera de alcance hasta aprobar su alcance y consentimiento por separado. Esta spec es esa ampliación y prevalece sobre las exclusiones de la 005 únicamente para lo descrito aquí.

Además, los consentimientos solo viven en el dispositivo, por lo que el servidor no puede comprobarlos.

## 2. Alcance

Incluido:

- Alinear panel, Edge Function, fixtures y pruebas con el esquema sin sede ni consejos.
- Convertir a UTF-8 `20261104120000_sync_remote_schema.sql`, sin cambiar su SQL. Excepción puntual a «no editar migraciones aplicadas», aprobada por la persona responsable.
- Registrar los consentimientos de la app en `estudiante_consentimiento`.
- Consulta agregada `/emotions` y página «Emociones» en el panel.

Fuera de alcance:

- Filas individuales, identificadores, exportaciones, alertas o contacto a partir del dashboard.
- Motivos y resultados de tests.
- Filtros por carrera, fecha libre o combinaciones de dimensiones.
- Aplicar migraciones o desplegar funciones en el proyecto remoto.

## 3. Requisitos

### Alineación del panel

- RF-001: Alumnos y Dashboard funcionan con el contrato vigente de `/students` y `/catalogs`, sin sede.
- RF-002: Se retiran del panel y de la Edge Function la ruta, pantalla y llamadas de Tips.
- RF-003: `admin_access` deja de anunciar `tips`.
- RF-004: Fixtures y suite de backend funcionan contra el esquema vigente.

### Consentimientos

- RF-005: Activar o desactivar un consentimiento en Mi perfil inserta una fila en `estudiante_consentimiento`. Si la inserción falla, el cambio no se aplica y se informa a la persona.
- RF-006: Lo aceptado en el registro se envía al completar el perfil, sin impedir el registro si falla.
- RF-007: El estado remoto vigente prevalece sobre el local. Si no hay filas remotas y el dispositivo tiene un consentimiento activo, se registra ese consentimiento, porque la persona ya lo aceptó con el mismo texto.
- RF-008: Sin conexión se muestra el último estado local y no se permite cambiarlo.

### Dashboard

- RF-009: `/emotions` incluye solo estudiantes con `analitica_anonima` vigente en `otorgado = true`, identificado por `codigo`, mediante JOIN con `estudiante_consentimiento_actual`.
- RF-010: Solo cuentan registros con `fecha_hora` igual o posterior al `registrado_en` del consentimiento vigente. Revocar excluye de inmediato todos los registros de esa persona.
- RF-011: El periodo admite solo 7, 30 o 90 días, en zona `America/Santiago`.
- RF-012: El tamaño mínimo de grupo es 5 estudiantes distintos y se aplica en el servidor. Con menos de 5 en total, la respuesta no incluye ningún agregado.
- RF-013: La respuesta entrega participantes, registros, promedio, distribución por emoción, tendencia semanal y promedio por carrera vigente.
- RF-014: Una semana con menos de 5 estudiantes se devuelve sin valores.
- RF-015: Las carreras con menos de 5 estudiantes, y quienes no tengan carrera vigente, se agrupan en «Otras carreras». Si ese grupo queda entre 1 y 4, se le suma la carrera visible más pequeña, para que no pueda deducirse por diferencia. Si no se alcanza 5, se omite el desglose por carrera.
- RF-016: La página indica cuando los datos son insuficientes, sin mostrar valores parciales, y aclara que son datos agregados y voluntarios, sin valor diagnóstico.

- RF-017: Los promedios se presentan como el estado más cercano de la escala, con el número como apoyo. Las etiquetas provienen del servidor.

## 4. Requisitos no funcionales

- La respuesta no contiene id de estudiante, nombre, RUT, correo ni otro identificador.
- Los controles viven en el servidor. El panel solo presenta lo recibido.
- No se registran en logs consentimientos ni datos emocionales.
- Los datos solo se mantienen en memoria del panel.
- Sin dependencias nuevas para gráficos.
- Los gráficos tienen alternativa en texto o tabla accesible.

## 5. Criterios de aceptación

| Id | Criterio | Verificación |
| --- | --- | --- |
| CA-001 | Dashboard y Alumnos cargan contra Supabase local | e2e |
| CA-002 | No quedan referencias a sede ni Tips en `admin-web/src` | búsqueda y typecheck |
| CA-003 | `supabase db reset` aplica todas las migraciones | comando local |
| CA-004 | Solo con `contacto`, o sin filas, un estudiante no cuenta | prueba backend |
| CA-005 | Una revocación excluye sus registros en la siguiente lectura | prueba backend |
| CA-006 | Registros previos al consentimiento no cuentan | prueba backend |
| CA-007 | Con 4 estudiantes no hay agregados; con 5 sí | prueba backend |
| CA-008 | Carrera de 3 estudiantes no aparece por separado ni se deduce por diferencia | prueba backend |
| CA-009 | Semana con menos de 5 estudiantes no entrega valores | prueba backend |
| CA-010 | La respuesta no contiene identificadores | prueba backend |
| CA-011 | Sin sesión de administrador, `/emotions` se rechaza | prueba backend |
| CA-012 | Mi perfil inserta una fila al cambiar y no cambia si la inserción falla | prueba unitaria |
| CA-013 | El registro y la reconciliación envían lo aceptado | prueba unitaria |
| CA-014 | La página muestra datos y el estado insuficiente | e2e |
| CA-015 | Flujo de consentimiento verificado en Android | manual, pendiente del equipo |

## 6. Decisiones

- `consentimiento 2` del pedido original se resolvió como `analitica_anonima`; el id 2 por orden de seed es `contacto`. Se filtra por `codigo`, nunca por id.
- El mínimo de 5 sigue el ejemplo de `AGENTS.md`.
- Riesgo residual aceptado: comparar periodos o lecturas de días distintos puede revelar cambios pequeños. Si Bienestar requiere más protección, se evaluará limitar la vista a semanas completas.
- La Política de Privacidad indica «carrera y año»; el año de ingreso no existe en el esquema y no se usa.

## 7. Referencias

- `specs/005-admin-dashboard/spec.md` y `sharing-discovery.md`
- `specs/014-register-academic-consents/` y `specs/015-profile-settings-consents/`
- `docs/Política de Privacidad y Consentimientos – App de Bienestar Emocional.docx`

## Historial

| Versión | Fecha | Cambio |
| --- | --- | --- |
| 0.1.0 | 2026-11-06 | Versión inicial aprobada |
| 0.1.1 | 2026-11-06 | RF-017, pedido por Nicolás Hernández: mostrar el estado además del número |

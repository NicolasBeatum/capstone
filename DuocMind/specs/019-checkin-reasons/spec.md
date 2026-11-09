# Spec 019 — Motivos del check-in emocional

| Campo | Valor |
| --- | --- |
| Versión | 0.5.0 |
| Estado | APROBADA |
| Fecha | 2026-11-09 |
| Incremento | 019-checkin-reasons |
| Rama | `feature/motivo-emocion-general` |
| Constitución | 2.0.0 |
| Plataformas | Android y previsualización web |
| Aprobación | Confirmada explícitamente por el usuario el 2026-11-09 |

## 1. Problema y resultado esperado

El check-in diario (pantalla del Brote) registra solo la emoción general en
`registro_emocional`. La base ya tiene el catálogo `motivo` (con `orden` y
`activo`) y la relación `registro_emocional_motivo`, con políticas para que la persona
inserte, lea y borre los motivos de sus propios registros. Pero la aplicación no
los ofrece ni los guarda.

Resultado observable: en el check-in, al elegir una emoción en la barra, aparecen
bajo el Brote burbujas con los motivos activos. La persona debe tocar al menos
uno y puede tocar varios. Al tocar «Registrar», el registro y los motivos elegidos se guardan
juntos, también sin conexión, y se suben a `registro_emocional_motivo`.

## 2. Alcance

- Burbujas de motivos en `CheckinScreen`, bajo el Brote y sobre «Registrar».
- Lectura del catálogo `motivo` (solo `activo`, por `orden` y nombre) y copia
  local para usarlo sin conexión.
- Selección múltiple y obligatoria (al menos un motivo).
- Guardado local cifrado de los motivos junto al check-in pendiente.
- Sincronización: insertar en `registro_emocional_motivo` los motivos del
  registro, de forma idempotente.
- Borrar un check-in también borra sus motivos (ya ocurre en cascada en el
  servidor; se replica en local).
- Un segundo más de lectura en el agradecimiento tras guardar (RF-006).

Fuera de alcance:

- Motivos distintos según la emoción (el catálogo es independiente de la emoción).
- Editar los motivos de un registro ya guardado.
- Mostrar motivos en el historial, el dashboard semanal o el panel de
  administración.
- Migraciones nuevas, cambios de esquema remoto y despliegues (salvo quitar la
  semilla de «Otro», decisión 4).

## 3. Requisitos funcionales

### RF-001 — Aparición de las burbujas

1. Las burbujas no se muestran al abrir la pantalla. Aparecen con fundido
   (`Reveal` y tokens de movimiento) la primera vez que la persona suelta la
   barra o la mueve con teclado o lector de pantalla.
2. Después siguen visibles al cambiar de emoción, y la selección se conserva.
3. Sobre ellas hay un texto breve: «¿Qué influye hoy? Elige al menos uno».
4. Con movimiento reducido aparecen sin desplazamiento.

### RF-002 — Selección

1. Cada burbuja es un botón alternable con `ScalePress`, de al menos 44 px de
   alto, con rol de botón y estado `selected` para lectores de pantalla.
2. Hay que elegir al menos un motivo y se pueden elegir varios. Si se toca
   «Registrar» sin motivo, no se guarda: se muestran las burbujas (si aún no
   estaban) y el aviso «Elige al menos un motivo para registrar.».
3. Excepción: si no hay catálogo disponible (RF-003.3), se registra sin motivos
   para no bloquear el check-in.
4. Las burbujas son de vidrio (`glassTokens`). La elegida se eleva con vidrio más
   opaco, sombra marcada y letra más gruesa; no lleva check ni cambia de color.
5. Las burbujas se acomodan en varias líneas y se mantienen legibles con texto
   ampliado sin empujar «Registrar» fuera de la pantalla.

### RF-003 — Catálogo

1. Se muestran únicamente los motivos de la tabla `motivo` con `activo`
   verdadero, ordenados por `orden` y, a igualdad, por nombre. La aplicación no
   tiene motivos escritos en el código ni agrega opciones propias (como «Otro»).
2. Tras una descarga válida se guarda una copia local; sin conexión se usa la
   última copia. Un fallo de red o una respuesta malformada no borra la copia.
3. Si no hay catálogo (primera vez y sin conexión), no se muestran burbujas y el
   check-in funciona igual que hoy.

### RF-004 — Guardado y sincronización

1. Al registrar, los IDs de los motivos elegidos se guardan en el almacenamiento
   local cifrado en la misma operación que el check-in pendiente.
2. Al sincronizar, se sube el registro, se obtiene su `id_registro` por
   `client_request_id` y se insertan sus motivos en `registro_emocional_motivo`.
   El check-in se marca como sincronizado solo si ambos pasos terminan.
3. Repetir la sincronización no duplica filas ni falla si los motivos ya existen.
4. Un motivo que ya no está activo en el servidor no impide subir el registro:
   el plan define si se descarta o se sube igual.

### RF-005 — Privacidad

1. Los motivos son datos emocionales sensibles: no se registran en logs, errores
   ni analítica, y en el dispositivo solo viven en la base cifrada.
2. Solo se usa la clave publicable y las políticas existentes.

### RF-006 — Tiempo del agradecimiento

1. Tras guardar, el agradecimiento se muestra un segundo más que hoy antes de
   llevar al inicio: 7200 ms para «Muy mal» y «Mal», 6200 ms para el resto.
2. El botón «Ir al inicio» sigue permitiendo salir antes.

## 4. Requisitos no funcionales

- **Arquitectura.** Dentro de `features/emotional-checkin/`. La pantalla usa casos
  de uso; las consultas a Supabase y SQLite viven en `infrastructure`.
- **Validación.** La respuesta del catálogo se valida antes de usarse.
- **Movimiento y tono.** Calmado, sin rebotes; textos no clínicos.
- **Compatibilidad.** Los check-ins pendientes creados antes de este cambio (sin
  motivos) siguen sincronizándose.

## 5. Hallazgos que condicionan el plan

1. **El `upsert` actual no devuelve el ID.** Usa `ignoreDuplicates`, así que en un
   reintento no devuelve fila. El plan debe leer `id_registro` por
   `client_request_id` (o usar una RPC) antes de insertar motivos.
2. **Esquema local.** La tabla `emotional_checkins` no tiene motivos. Hace falta
   una tabla local nueva o una columna, con una migración local segura para
   bases ya existentes.
3. **No hay permiso de UPDATE** en `registro_emocional_motivo`; la idempotencia se
   logra con `upsert` sobre la clave primaria compuesta con `ignoreDuplicates`.
4. **La pantalla tiene poco espacio vertical.** Con 8 motivos, el plan debe
   reducir el Brote cuando aparecen las burbujas o permitir scroll.

## 6. Criterios de aceptación

| ID | Resultado observable | Verificación prevista |
| --- | --- | --- |
| CA-001 | Al abrir no hay burbujas; al soltar la barra aparecen bajo el Brote. | Recorrido web y Android. |
| CA-002 | Se muestran solo motivos activos, en orden de `orden` y nombre. | Prueba de dominio con datos sintéticos. |
| CA-003 | Se pueden elegir varios; registrar sin motivo muestra el aviso y no guarda. | Prueba de caso de uso y recorrido. |
| CA-004 | Con conexión, el registro y sus motivos quedan en `registro_emocional` y `registro_emocional_motivo`. | Prueba con gateway falso y verificación en Supabase de desarrollo. |
| CA-005 | Sin conexión, los motivos quedan en la base cifrada y se suben al reconectar. | Prueba de almacenamiento y recorrido Android en modo avión. |
| CA-006 | Reintentar la sincronización no duplica motivos ni falla. | Prueba de caso de uso. |
| CA-007 | Un check-in pendiente antiguo sin motivos se sincroniza igual. | Prueba de migración local. |
| CA-008 | Sin catálogo no hay burbujas y el check-in se registra sin motivos. | Prueba de caso de uso. |
| CA-009 | Lector de pantalla anuncia cada burbuja y su estado; texto ampliado no oculta «Registrar». | Recorrido Android. |
| CA-010 | Ningún motivo aparece en logs ni en solicitudes ajenas a Supabase. | Revisión de código y de solicitudes del recorrido web. |
| CA-011 | El agradecimiento dura 7,2 s con «Muy mal» o «Mal» y 6,2 s con el resto. | Revisión de código y recorrido. |

## 7. Decisiones

Decididas por el usuario el 2026-11-09:

1. Las burbujas aparecen **bajo el Brote al elegir la emoción**, en la misma
   pantalla.
2. **Selección múltiple y obligatoria**: al menos un motivo (cambiado por el
   usuario el 2026-11-09; antes era opcional). Sin catálogo no se bloquea.
3. **Los mismos motivos para todas las emociones**, usando `motivo` tal como está.
4. **Solo los motivos de la base**, sin «Otro» ni opciones agregadas por la app.
5. **Un segundo más** en el agradecimiento tras guardar, para leer mejor el texto.

El usuario también pidió quitar la semilla de «Otro» de
`20261106140000_match_production_schema.sql`, ya que lo borró de la base remota.

Esta spec fue aprobada explícitamente por el usuario el 2026-11-09. El plan se
redacta después de esta aprobación. No autoriza migraciones remotas, despliegues, commits ni push.

## 8. Referencias

- Esquema: `supabase/migrations/20261105130000_motivos_consentimientos.sql` y
  `20261106140000_match_production_schema.sql` (catálogo, `orden`, `activo` y
  políticas de borrado).
- Pantalla: `src/features/emotional-checkin/screens/CheckinScreen.tsx`.
- Guardado: `application/checkinHistory.ts`, `application/localCheckinStore.ts`,
  `infrastructure/supabaseCheckinGateway.ts`.

### Historial de revisiones

- **0.1.0 — 2026-11-09:** borrador inicial.
- **0.2.0 — 2026-11-09:** sin «Otro» ni motivos fijos en la app; +1 s al agradecimiento.
- **0.3.0 — 2026-11-09:** aprobada; se quita «Otro» de la semilla de motivos.
- **0.4.0 — 2026-11-09:** elegir al menos un motivo es obligatorio, salvo sin catálogo.
- **0.5.0 — 2026-11-09:** burbujas de vidrio; la selección se indica con sombra, sin check.

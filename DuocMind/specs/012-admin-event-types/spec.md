# Spec 012 — Tipos de eventos institucionales en administración

| Campo | Valor |
| --- | --- |
| Versión | 0.1.0 |
| Estado | APROBADA |
| Fecha | 2026-10-15 |
| Constitución | 2.0.0 |
| Plataforma | Panel web administrativo y backend Supabase local |

## Problema y base existente

El commit de Hans `2741c6e`, integrado en `dev`, incorpora
`tipo_evento_institucional` y la referencia nullable `evento_institucional.tipo_id`.
El catálogo inicial contiene Charla, Taller y Actividad. La consulta estudiantil
ya devuelve `type: { code, name } | null`; los códigos conocidos tienen estilos
propios y los nuevos usan el estilo neutro existente.

El panel administra eventos, pero su API no devuelve ni escribe `tipo_id`, y no
ofrece gestión del catálogo. La solicitud del usuario del 2026-10-15 confirma
dos necesidades: crear y editar tipos, y asignarlos al crear o editar eventos.

## Alcance

- Listar, crear y editar tipos desde la sección Eventos del panel.
- Elegir un tipo o «Sin tipo» en el editor de eventos y mostrarlo en el listado.
- Ampliar la API administrativa conservando autorización, revisiones,
  idempotencia y protección de formularios.
- Verificar mediante Supabase local y cuentas sintéticas.

No incluye eliminación ni desactivación de tipos, personalización de colores,
cambios de Android, despliegues ni migraciones remotas. Los eventos y tipos
existentes se conservan.

## Requisitos funcionales

### RF-001 — Catálogo administrable

1. Un funcionario autorizado puede abrir el catálogo desde Eventos, listar sus
   tipos y crear uno con código, nombre y orden de presentación.
2. El nombre se guarda sin espacios exteriores, con entre 1 y 40 caracteres.
   El código cumple `^[a-z][a-z0-9_]{1,31}$` y es único.
3. El orden es un entero entre 0 y 32767; el listado se ordena por orden, nombre
   e identificador para resolver empates de forma estable.
4. Se pueden editar nombre y orden. El código permanece fijo tras la creación
   para conservar las referencias visuales existentes de la aplicación.
5. Editar un nombre actualiza la etiqueta de todos los eventos que usan ese tipo.
   El editor explica este efecto antes de guardar.
6. Las escrituras usan revisión e idempotencia. Un conflicto o fallo conserva el
   formulario; una respuesta incierta no se presenta como guardado confirmado.

### RF-002 — Asignación en eventos

1. Crear y editar eventos permite seleccionar un tipo del catálogo o «Sin tipo».
   El selector representa la asignación actual al abrir el evento.
2. Guardar persiste la referencia y recargar recupera la misma selección.
   Cambiar o quitar el tipo incrementa la revisión del evento.
3. Los eventos anteriores sin tipo siguen siendo válidos; no se les asigna una
   categoría automáticamente ni se exige tipo para publicar.
4. El listado muestra el nombre del tipo o «Sin tipo». Los eventos cancelados
   conservan su tipo y permanecen de solo lectura.
5. Una referencia inexistente o inválida se rechaza sin guardar parcialmente el
   evento. Un cliente anterior que omita el campo conserva la referencia al
   editar; solo un valor null explícito la elimina.
6. El contrato estudiantil existente sigue devolviendo el código y nombre del
   tipo asignado o null. Publicación, inscripción y cancelación mantienen sus
   reglas actuales.

### RF-003 — Acceso y compatibilidad

1. Cada lectura y escritura administrativa verifica sesión y autorización en
   servidor. El navegador no escribe directamente en las tablas del catálogo.
2. La lectura pública del catálogo existente se conserva; alumnos y cuentas
   anónimas no pueden crear, editar ni eliminar tipos o asignaciones.
3. Los cambios de base de datos se entregan en una migración nueva, sin editar
   la migración de Hans ni alterar intereses privados de estudiantes.
4. Los contratos externos se validan en sus límites. El panel distingue carga,
   vacío, error y conflicto, con formularios y controles accesibles en español.

## Criterios de aceptación

| Criterio | Resultado observable | Verificación |
| --- | --- | --- |
| CA-001 | El catálogo muestra los tipos iniciales y permite crear un tipo válido y editar su nombre/orden. | API local y recorrido Playwright con recarga. |
| CA-002 | Códigos duplicados o inválidos, nombres vacíos/largos y orden inválido se rechazan; el código creado no se modifica. | Pruebas de validación y SQL/HTTP local. |
| CA-003 | Un evento se crea con tipo, cambia a otro y vuelve a «Sin tipo», conservando la selección tras recarga. | Playwright y consulta local de referencia/revisión. |
| CA-004 | Eventos anteriores y clientes que omiten tipo conservan compatibilidad; el contrato estudiantil refleja el tipo y su nombre actualizado. | Pruebas de contratos, SQL y consulta estudiantil local. |
| CA-005 | Sesiones no autorizadas y escrituras directas de anon/alumnos se rechazan; borradores siguen privados. | Pruebas de autorización/RLS locales con cuentas sintéticas. |
| CA-006 | Ediciones concurrentes y reintentos no duplican tipos ni pierden formularios o asignaciones. | SQL/HTTP de revisión/idempotencia y Playwright de conflicto. |
| CA-007 | Cancelación, inscripción, horarios Santiago y gestión administrativa existente conservan comportamiento. | Typecheck, pruebas, build y suite E2E del panel; regresión backend pertinente. |

## Aprobación y límites de ejecución

El usuario aprobó esta spec explícitamente el 2026-10-15 y solicitó una rama
propia y un PR posterior hacia `dev`. La rama de trabajo es
`feat/admin-event-types`, conforme a la preferencia posterior del usuario. Después se redacta y aprueba el plan, luego las tareas,
conforme a la sección III de la constitución. No se presume una excepción al
orden ni autorización para cambios remotos. La aprobación no acredita
implementación ni verificaciones del comportamiento propuesto.

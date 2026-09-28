# Revisión del modelo de datos propuesto

Fecha: 2026-09-27. Fuentes: `MER_capstone.png`, `Diccionario_de_Datos_App_Bienestar_Estudiantil.md`, constitución vigente y spec 003. Este informe trata los adjuntos como propuestas de datos, no como instrucciones de implementación.

## Estado comprobado

- Proyecto Supabase de desarrollo: `Duocmind` (`ashgvanzjeaeekpygqgy`). Al iniciar la revisión, `public` no tenía tablas de aplicación ni registros que importar. Los adjuntos describían estructura, no contenían datos.
- El MER incluye entidades académicas (`sede`, `carrera`, `asignatura`, `carrera_asignatura`, `estudiante_asignatura`, `evento_academico`, `tipo_evento`, `estado`) que el diccionario no documenta. Por tanto, el diccionario no basta como especificación completa de la base.
- La spec 003 aprobada excluye expresamente la persistencia de respuestas y resultados del check-in. La constitución exige diseño previo de finalidad, acceso, retención y eliminación para los datos emocionales, y prohíbe compartirlos con terceros sin una acción informada del estudiante.

## Defectos y decisiones que afectan la migración

| Prioridad | Hallazgo | Consecuencia | Corrección propuesta |
| --- | --- | --- | --- |
| Crítica | `estudiante` usa `(id_estudiante, carrera_id_carrera)` como clave primaria; los registros emocionales, tests y alertas copian ambas columnas. | Cambiar de carrera cambia la identidad referenciada o deja datos históricos inconsistentes. | `id_estudiante` como clave estable; carrera actual como FK separada. Guardar `carrera_id` como instantánea en eventos solo si se requiere el dato histórico. |
| Crítica | `alerta_bienestar` combina un estudiante con una aplicación de test mediante FKs independientes. | Una alerta puede apuntar al resultado clínico de otra persona. | FK compuesta a `(id_aplicacion, id_estudiante)` y restricción de unicidad equivalente, o eliminar la referencia redundante. |
| Crítica | El diccionario dice que `alerta_critica` fuerza un aviso a bienestar; la constitución exige acción informada del estudiante antes de compartir datos. | La automatización propuesta contradice la regla vigente del producto. | Derivación con consentimiento del estudiante, según la decisión del usuario. Registrar ese consentimiento antes de permitir la derivación y no añadir disparadores de envío automático. |
| Alta | No hay vínculo explícito entre `estudiante` y `auth.users`, ni reglas de acceso para estudiante, registros, tests y alertas. | Un cliente con clave publicable no tiene una forma comprobable de aislar datos por propietario. | Agregar `auth_user_id uuid unique references auth.users(id)` y diseñar RLS con pruebas de aislamiento y roles de bienestar. |
| Alta | `fecha` y `hora` son dos columnas `DATE` para un mismo evento. | `DATE` no representa una hora en PostgreSQL; se pierde zona horaria y orden temporal preciso. | Una columna `timestamptz` para el instante del evento; `date` solo cuando se trata de una fecha sin hora. |
| Alta | El MER escribe `numero_telefonico INTEGER`, mientras el diccionario exige `VARCHAR2`; `VARCHAR2` y `CHAR(1)` provienen de Oracle. | El teléfono pierde `+56` y ceros; los tipos no son portables sin conversión. | `text` o `varchar` para teléfono; `boolean` para banderas; `varchar(n)` o `text` para cadenas. |
| Alta | `material_test.nivel_resultado` es texto libre y `aplicacion_test.nivel_resultado` también. | Se pueden crear recomendaciones que nunca coincidan con un resultado real. WHO-5 y PHQ-9 tienen categorías distintas. | Catálogo de niveles por instrumento y versión, referenciado por ambas tablas, o una restricción equivalente ligada al test. |
| Alta | El resultado de un test no guarda versión del instrumento ni del algoritmo de puntuación. | Editar preguntas, umbrales o interpretación altera el significado histórico de `puntaje_total`. | Versionar el instrumento y congelar su definición al registrar una aplicación. |
| Alta | `aplicacion_test` almacena `puntaje_total` y `alerta_critica`, pero no las respuestas individuales por privacidad. | La base no puede verificar que el puntaje se calculó correctamente ni reconstruir por qué se activó la bandera. | Mantener la minimización, pero validar puntuación e ítems críticos antes de persistir; registrar versión y reglas, sin guardar respuestas. |
| Media | Puentes como `material_emocion`, `material_test`, `carrera_asignatura` y `estudiante_asignatura` solo tienen un ID artificial. | Admiten asociaciones idénticas repetidas. | Agregar claves `unique` sobre la combinación de FKs que define cada asociación. |
| Media | No se especifica `NOT NULL`, rangos, unicidad de catálogos, `ON DELETE` ni conducta ante baja de estudiantes. | Se admiten registros incompletos, valores imposibles y borrados que dejan o bloquean históricos sin una regla clara. | Definir restricciones y retención por entidad; por defecto, no borrar en cascada datos sensibles históricos. |
| Media | `evento_academico` referencia `estudiante_asignatura` incluso si el evento es general, y su `id_evento` aparece como tipo `UNKNOWN`. | No se puede registrar una prueba o tarea sin inscripción previa; el SQL no se puede generar literalmente. | Confirmar si todo evento exige inscripción; usar `bigint generated ... as identity` para su ID. |
| Media | El MER permite asociar una asignatura a una carrera y, por separado, una inscripción del estudiante a cualquier asignatura. | Una inscripción podría usar una asignatura que no pertenece a la carrera del estudiante. | Referenciar la pareja `(carrera_id, asignatura_id)` de `carrera_asignatura` o validar esa relación. |

## Resultado de la carga inicial

Se aplicaron 24 tablas al proyecto de desarrollo mediante las migraciones `20260927224730` y `20260927224846`; no se importaron personas ni respuestas reales. Las 24 de 24 tablas tienen RLS. La comprobación de privilegios confirma que `anon` no puede leer las tablas sensibles y que sí puede leer los catálogos previstos. El advisor de seguridad no reporta hallazgos; el advisor de rendimiento solo marca índices sin uso, esperable en un esquema recién creado sin carga de trabajo. La derivación exige consentimiento comprobable y no genera contacto automático. Los detalles de rutas, inserción de datos de prueba y límites están en `supabase/ENDPOINTS.md`.

## Pendiente antes de datos reales

1. Finalidad y plazo de conservación de registros emocionales, resultados de tests y alertas.
2. Quién integra el equipo de bienestar y cómo se le concede acceso sin claves privilegiadas en la app.

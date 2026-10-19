# Verificación 011 — Asignaturas reales en la agenda

| Campo | Valor |
| --- | --- |
| Fecha | 2026-10-15 |
| Spec | `spec.md` 0.2.0 |
| Estado | PARCIAL: pendiente T008 (Supabase de desarrollo y Android) |

## Comandos ejecutados

| Comando | Resultado |
| --- | --- |
| `npm run typecheck` | Sin errores. |
| `npm test` | 208 de 208 pruebas pasan (19 nuevas: `subject`, `subjectCache`, `subjectCatalog`). |
| `grep -rn "SUBJECTS" src` | Solo la constante `MAX_SUBJECTS` del dominio; la lista fija ya no existe. |
| `psql -f tests/sql/agenda-subjects-rls-smoke.sql` en un contenedor `postgres:17` temporal | `agenda-subjects-rls-smoke: OK`. El contenedor se eliminó después. Sin conexión a Supabase. |

## Criterios

| Criterio | Estado | Evidencia |
| --- | --- | --- |
| CA-001 | Verificado | `tests/subjectCatalog.test.mjs`, `tests/subject.test.mjs`. |
| CA-002 | Verificado en esquema sintético | Prueba SQL: cada cuenta ve solo sus inscripciones; la carrera cerrada no aparece; sin sesión y `anon` no ven nada. Replica las tablas y políticas de la migración, no ejecuta contra el proyecto real. |
| CA-003 | Verificado | `tests/subject.test.mjs`. |
| CA-004 | Parcial | Caso de uso verificado; el mensaje en pantalla sin comprobar visualmente. |
| CA-005 | Parcial | Caso de uso con copia verificado; falta Android. |
| CA-006 | Verificado | `tests/subjectCatalog.test.mjs`. |
| CA-007 | Verificado | `tests/subjectCache.test.mjs`. |
| CA-008 | Verificado por no modificación | No se tocó `agendaStorage` ni el formato de actividades; la suite existente sigue en verde. |
| CA-009 | Verificado | Búsqueda de `SUBJECTS`. |
| CA-010 | Pendiente | Requiere Android (T008). |

## Pendiente (T008)

1. **La consulta embebida de PostgREST no se probó contra Supabase.** El gateway usa
   `estudiante_carrera!inner(...)` y `carrera_asignatura!inner(asignatura!inner(...))`
   sobre claves foráneas compuestas. La prueba SQL valida las políticas, no la sintaxis
   de PostgREST. Con una cuenta sintética inscrita, comprobar que la lista aparece; si
   falla, el plan prevé reemplazarla por una función SQL en una migración.
2. Cuenta sintética con inscripciones: ni `seed.sql` ni las fixtures las crean.
3. Recorrido en Android: crear una actividad con asignatura, cortar la red y abrir
   «Nueva actividad» (debe verse el aviso de lista guardada), y cambiar de cuenta.
4. Comprobación visual de los mensajes de carga, vacío y error en el formulario.

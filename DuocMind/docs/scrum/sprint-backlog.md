# Sprint Backlog — DuocMind

| Campo | Valor |
| --- | --- |
| Versión | 1.0.0 |
| Fecha | 2026-11-01 |
| Responsable | Scrum Master: Hans Mancilla (según la Fase 1) |
| Fuentes | `specs/*/tasks.md` y `verification.md`, historial Git y pull requests |

> **Cómo se adaptó Scrum.** En DuocMind cada **incremento** (`specs/<número>-<nombre>/`) cumple el rol de un sprint: se planifica con su `spec.md` y `plan.md`, se descompone en tareas (`tasks.md`) y se cierra con su `verification.md`. Los sprints de abajo agrupan los incrementos por periodo, tomando las fechas del historial de commits y pull requests. Las tareas se leen en cada `tasks.md`; aquí se resume su avance.

## Resumen por sprint

| Sprint | Periodo | Meta | Incrementos | PR integrados |
| --- | --- | --- | --- | --- |
| 0 | 17-08 al 13-09 | Definir el proyecto y las reglas de trabajo | Fase 1, constitución, spec 001 | — |
| 1 | 14-09 al 20-09 | Base técnica y conexión con el backend | 001 (regularizada), 002 | #1, #2 |
| 2 | 21-09 al 28-09 | Check-in, test emocional, datos y autenticación | 003, 004; esquema de 24 tablas | #3 a #9 |
| 3 | 29-09 al 04-10 | Rediseño por funcionalidad, panel de administración y agenda | 005; rediseño; agenda | #11 a #14 |
| 4 | 05-10 al 10-10 | PSS-10, entornos Docker, APK automático y gráfico semanal | 006, 007, 008 | #15 a #20 |
| 5 | 11-10 al 16-10 | Eventos, tutorial, asignaturas reales y tipos de evento | 009, 010, 011, 012 | #21 a #23 |
| 6 | 17-10 al 01-11 | Horario por semestre, documentación de la Fase 2, política de privacidad y rediseño del test y del inicio | 013; informes y presentación APT | #24 a #26 |

## Detalle por sprint

### Sprint 0 — Definición (17-08 al 13-09)

- [x] Definición del proyecto APT (objetivos, competencias, plan de trabajo) — Fase 1.
- [x] Constitución de desarrollo y guía de agentes.
- [x] Proyecto Expo vacío con Docker (base de la spec 001).

### Sprint 1 — Base técnica (14-09 al 20-09)

- [x] Regularizar la spec 001 y dejarla aprobada.
- [x] Spec 002: configuración pública de Supabase y comprobación remota (4 de 5 tareas).
- [ ] Verificar la pantalla inicial y la conexión en Android (T006 de la spec 001, T005 de la spec 002).

### Sprint 2 — Emociones y datos (21-09 al 28-09)

- [x] Integrar agenda y test emocional (PR #3 a #6).
- [x] Spec 003: instrumentos y reglas de ruteo (14 de 14 tareas).
- [x] Revisión del modelo de datos y migración de 24 tablas con RLS (27-09).
- [x] Spec 004: autenticación, perfil, historial y almacenamiento cifrado (9 de 10 tareas).
- [ ] Validar el flujo offline en un build de desarrollo Android (T008 de la spec 004).

### Sprint 3 — Panel y reorganización (29-09 al 04-10)

- [x] Rediseño general y reorganización por funcionalidad (PR #11 y #12).
- [x] Spec 005: panel de administración (23 de 24 tareas; T023 omitida por decisión del equipo el 04-10).
- [x] Vista de agenda y creación de actividades (PR #14).

### Sprint 4 — Entrega continua (05-10 al 10-10)

- [x] Restricciones y niveles del test PSS-10 (PR #15).
- [x] Spec 006: servicios Docker independientes (7 de 8 tareas).
- [x] Spec 007: APK release firmado en cada merge a `dev` (7 de 8 tareas).
- [x] Spec 008: gráfico semanal con datos reales y Realtime (6 de 8 tareas).
- [ ] Aplicar la migración de Realtime en Supabase remoto (T007 de la spec 008).
- [ ] Prueba funcional en Android (T008 de las specs 006, 007 y 008).

### Sprint 5 — Eventos y onboarding (11-10 al 16-10)

- [x] Spec 009: eventos institucionales y agenda personal (12 de 16 tareas).
- [x] Spec 010: tutorial de bienvenida (11 de 12 tareas).
- [x] Spec 011: asignaturas reales en la agenda (7 de 8 tareas).
- [x] Spec 012: tipos de evento institucionales en el panel (12 de 12 tareas).
- [ ] Verificación integrada en Android de las specs 009, 010 y 011.

### Sprint 6 — Documentación y validación (17-10 al 01-11)

- [x] Spec 013: horario por semestre y actividades locales (19 de 20 tareas; PR #24 integrado el 19-10). Reemplaza los datos de muestra del inicio y el selector de ramos de la spec 011 por ramos escritos por la persona.
- [x] Migración del horario aplicada y verificada en Supabase cloud (19-10).
- [x] Corrección de la pestaña de eventos (21-10).
- [x] Guía de la Fase 2, informe final (capítulo 1) y diarios reflexivos.
- [x] Presentación del proyecto APT.
- [x] Política de privacidad y consentimientos (22-10).
- [x] Rediseño del test de estrés percibido, del aviso de los 30 días y del inicio (23-10, PR #26).
- [ ] Validar en Android el horario por semestre (T020 de la spec 013).
- [ ] Probar el APK de `dev` en dispositivos Android y registrar resultados.
- [ ] Validar con estudiantes y recoger retroalimentación.
- [ ] Redactar el manual de usuario.

## Tareas abiertas al 2026-11-01

| Origen | Tarea pendiente | Motivo |
| --- | --- | --- |
| Specs 001, 002, 004, 006, 007, 008, 009, 010, 011, 013 | Verificación en Android | En un equipo no hay `adb` ni Android SDK; en otro el build nativo falla (Gradle: «Unable to establish loopback connection», spec 010 T008) |
| Spec 009, T007, T008 y T015 | Almacén nativo cifrado, coordinación de sesión y verificación integrada | Su comprobación nativa depende de Android |
| Spec 008, T007 | Migración Realtime en Supabase remoto | Requiere autorización explícita |
| Spec 009, T012 | Calendario discreto en el encabezado del inicio | Pendiente de cerrar con su verificación |
| Spec 005, T023 | Compatibilidad de consulta PSS-10 con Android | Omitida por decisión del equipo (04-10) |

## Tablero de seguimiento

El estado de cada tarea vive en su `tasks.md` con casillas `[ ]` y `[x]`. Una tarea se marca `[x]` solo con el cambio completo, su prueba aprobada y el repositorio válido (constitución, principio III).

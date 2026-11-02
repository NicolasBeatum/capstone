# Product Backlog — DuocMind

| Campo | Valor |
| --- | --- |
| Versión | 1.0.0 |
| Fecha | 2026-11-01 |
| Responsable | Gustavo Roldán (Product Owner) |
| Fuentes | `specs/001` a `specs/013` (specs y `tasks.md`), historial Git |

> **Cómo leerlo.** El equipo trabaja con Spec-Driven Development: cada ítem del backlog se especifica en `specs/<incremento>/spec.md`, se divide en tareas en `tasks.md` y se verifica en `verification.md`. Este documento reúne esos ítems como historias de usuario priorizadas. Prioridad con MoSCoW: **M** (debe), **S** (debería), **C** (podría).
>
> Estados: **Hecho** (implementado y con pruebas aprobadas), **Parcial** (implementado, con verificación Android u otro paso pendiente), **Pendiente**.

## Historias de usuario

### Cuenta y acceso

| ID | Historia de usuario | Prioridad | Incremento | Estado |
| --- | --- | --- | --- | --- |
| PB-01 | Como estudiante, quiero registrarme e iniciar sesión con correo y contraseña para tener mi cuenta personal. | M | 004 | Parcial (falta prueba Android) |
| PB-02 | Como estudiante, quiero eliminar mi cuenta y todos mis registros emocionales para ejercer mi derecho a eliminación. | M | 004 | Parcial (falta prueba Android) |
| PB-03 | Como estudiante nuevo, quiero un tutorial de bienvenida para saber para qué sirve cada sección. | S | 010 | Parcial (falta recorrido Android) |

### Bienestar emocional

| ID | Historia de usuario | Prioridad | Incremento | Estado |
| --- | --- | --- | --- | --- |
| PB-04 | Como estudiante, quiero registrar mi ánimo diario con confirmación explícita para reflexionar sobre cómo me siento. | M | 003, 004 | Hecho |
| PB-05 | Como estudiante, quiero ver y borrar mi historial de check-ins para tener control de mis datos. | M | 004 | Hecho |
| PB-06 | Como estudiante, quiero registrar check-ins sin conexión y que se sincronicen al volver la red, sin perder datos. | M | 004 | Parcial (falta prueba Android) |
| PB-07 | Como estudiante, quiero responder el test de estrés percibido (PSS-10) y recibir un recordatorio pasados 30 días. | M | 005 | Hecho |
| PB-08 | Como estudiante, quiero acceder a recursos de crisis sin conexión para saber a dónde acudir. | M | 003 | Hecho |
| PB-09 | Como estudiante, quiero ver un gráfico semanal de mi ánimo con datos reales, actualizado en tiempo real. | S | 008 | Parcial (falta migración remota y prueba Android) |
| PB-10 | Como estudiante, quiero consejos privados y prudentes ante rachas de ánimo bajo, sin que se avise a terceros. | S | — | Pendiente |

### Organización académica

| ID | Historia de usuario | Prioridad | Incremento | Estado |
| --- | --- | --- | --- | --- |
| PB-11 | Como estudiante, quiero registrar pruebas, tareas y actividades en mi agenda. | M | agenda (PR #14) | Hecho |
| PB-12 | Como estudiante, quiero asociar una actividad a un ramo de mi horario. | S | 011, 013 | Parcial (la spec 013 reemplazó el catálogo de la spec 011 por ramos escritos por la persona; falta Android) |
| PB-29 | Como estudiante, quiero armar mi horario de clases por semestre (ramos, bloques semanales y salas) y ver mi clase en curso en el inicio. | M | 013 | Parcial (migración cloud aplicada; falta T020 en Android) |
| PB-30 | Como estudiante, quiero copiar o mover mis actividades personales entre semestres, y que se queden solo en mi dispositivo. | S | 013 | Parcial (falta Android) |
| PB-13 | Como estudiante, quiero ver eventos institucionales, inscribirme mediante enlace externo y agregarlos a mi agenda. | S | 009, 012 | Parcial (falta verificación Android) |

### Panel de administración (Bienestar y Salud)

| ID | Historia de usuario | Prioridad | Incremento | Estado |
| --- | --- | --- | --- | --- |
| PB-14 | Como funcionario, quiero iniciar sesión con permisos administrativos comprobados en el backend. | M | 005 | Hecho |
| PB-15 | Como funcionario, quiero consultar alumnos con búsqueda y filtros, y enviarles un enlace de recuperación de contraseña. | M | 005 | Hecho |
| PB-16 | Como funcionario, quiero crear y versionar cuestionarios, y activar instrumentos validados protegidos. | S | 005 | Hecho |
| PB-17 | Como funcionario, quiero crear, publicar y cancelar eventos, con inscripción y tipos administrables. | S | 005, 009, 012 | Hecho |
| PB-18 | Como funcionario, quiero publicar consejos generales o según ánimo o resultado de test. | S | 005 | Hecho |
| PB-19 | Como estudiante, quiero ver en la app los cuestionarios y consejos publicados desde el panel. | S | futura | Pendiente (fuera del alcance actual) |

### Infraestructura y calidad

| ID | Historia de usuario | Prioridad | Incremento | Estado |
| --- | --- | --- | --- | --- |
| PB-20 | Como desarrollador, quiero levantar la app y el panel con Docker de forma reproducible. | S | 001, 006 | Hecho |
| PB-21 | Como desarrollador, quiero un APK firmado en cada merge a `dev` para probar sin compilar a mano. | S | 007 | Hecho |
| PB-22 | Como equipo, quiero CI que ejecute tipos, pruebas, backend y E2E antes de integrar. | M | 005, 007 | Hecho |

### Validación y cierre

| ID | Historia / tarea | Prioridad | Estado |
| --- | --- | --- | --- |
| PB-23 | Validar la app en un dispositivo Android y registrar cada recorrido en los `verification.md`. | M | Pendiente |
| PB-24 | Validar la app con estudiantes (consentimiento informado, datos anonimizados). | M | Pendiente |
| PB-25 | Entrevista con Bienestar Estudiantil para validar contenidos. | S | Pendiente (sin disponibilidad del entrevistado). La entrevista con un psicólogo sí se realizó; ver `Fase 2/Evidencias Proyecto/Entrevistas/` |
| PB-26 | Aplicar al Supabase remoto la migración de Realtime (T007 de la spec 008). | S | Pendiente (requiere autorización) |
| PB-27 | Definir finalidad y plazo de conservación de los datos emocionales antes de usar datos reales. | M | Pendiente |
| PB-28 | Elaborar el manual de usuario. | S | Pendiente |
| PB-33 | Como estudiante, quiero que la app me pregunte si una recomendación me sirvió, para que mis consejos se ajusten a lo que me funciona. | C | Propuesta de la entrevista con el psicólogo; sin spec |
| PB-34 | Como estudiante, quiero que las preguntas de registro usen un lenguaje abierto («¿cómo te has sentido hoy?») y permitan matices más allá de «bien» o «mal». | C | Propuesta de la entrevista con el psicólogo; sin spec |
| PB-31 | Resolver el bloqueo de compilación nativa en el equipo de desarrollo (Gradle no inicia su daemon: «Unable to establish loopback connection») y definir `ANDROID_HOME` y `adb`. | M | Pendiente |
| PB-32 | Revisar las dependencias de Expo: el build Docker informó 33 avisos de `npm audit` (1 crítico, 22 altos, 10 moderados). | S | Pendiente (requiere su propio incremento) |

## Priorización

1. **Primero (M):** cuenta, check-in, historial, offline, PSS-10, recursos de crisis, agenda, panel base, CI y validación Android.
2. **Después (S):** gráfico semanal, eventos, tutorial, asignaturas reales, tests y tips del panel, Docker y APK.
3. **Más adelante (C):** integración de los contenidos del panel en Android (PB-19) y consejos ante rachas (PB-10).

## Gestión del backlog

- El Product Owner prioriza y mantiene este documento; los ítems se refinan en una spec antes de implementarse.
- Una historia solo pasa a **Hecho** cuando sus tareas están marcadas `[x]` con su prueba aprobada (ver [`definition-of-done.md`](definition-of-done.md)).
- El avance por incremento está en [`sprint-backlog.md`](sprint-backlog.md).

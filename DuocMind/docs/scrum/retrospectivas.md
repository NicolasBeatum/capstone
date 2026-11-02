# Retrospectivas — DuocMind

| Campo | Valor |
| --- | --- |
| Versión | 1.0.0 |
| Fecha | 2026-11-01 |
| Sprints cubiertos | 1 al 6 (ver [`sprint-backlog.md`](sprint-backlog.md)) |
| Fuentes | `verification.md` y `plan.md` de las specs, historial Git y pull requests |

> **Aviso.** Estas retrospectivas son un borrador reconstruido; no son actas de una reunión de retrospectiva. La entrevista con el psicólogo fue una validación del producto, no una retrospectiva del equipo. Si el equipo realiza una retrospectiva, debe registrar su fecha, asistentes y acuerdos aquí.
>
> **Cómo se elaboraron.** Las observaciones salen de lo que quedó registrado en los `verification.md`, en los planes y en el historial del repositorio. Son un punto de partida: el equipo debe complementarlas y confirmarlas en sus reuniones de retrospectiva, y registrar ahí la fecha y los asistentes.

## Formato de cada retrospectiva

Qué salió bien · Qué mejorar · Acciones propuestas · Estado de las acciones.

## Sprint 1 — Base técnica (hasta 20-09)

**Qué salió bien**
- La conexión con Supabase quedó verificada con una comprobación real y no solo con la creación del cliente.
- El entorno reproducible (Node 24, npm 11, lockfile, Docker) quedó versionado.

**Qué mejorar**
- El código del scaffold precedió a su spec, por lo que la spec 001 hubo que regularizarla y registrarla como excepción histórica.

**Acciones propuestas**
- Respetar el orden `spec → plan → tareas → implementación` desde la spec 002. *(Cumplida desde la spec 002.)*

## Sprint 2 — Emociones y datos (21-09 al 28-09)

**Qué salió bien**
- La revisión del modelo de datos (27-09) detectó 12 defectos antes de migrar, entre ellos claves compuestas inestables y un envío automático a Bienestar que contradecía la constitución.
- Se aplicó RLS en las 24 tablas desde la primera migración.

**Qué mejorar**
- El módulo del test emocional se reorganizó varias veces el 22-09 (rutas, enlaces simbólicos y depuración), lo que consumió tiempo y dejó historial confuso.
- La spec 003 definía instrumentos (WHO-5, PHQ-9, GAD-7) que luego se reemplazaron por el PSS-10 como test vigente.

**Acciones propuestas**
- Acordar la estructura de carpetas y rutas antes de mover archivos. *(Cumplida: reorganización por funcionalidad en PR #12.)*
- Cerrar la definición del instrumento antes de implementarlo. *(En curso.)*

## Sprint 3 — Panel y reorganización (29-09 al 04-10)

**Qué salió bien**
- El panel completo quedó con autorización en el backend, pruebas de backend y E2E.
- La arquitectura por funcionalidad y capas ordenó el código de la app.

**Qué mejorar**
- El diseño de la app se rehízo varias veces entre el 23 y el 29-09, con conflictos de diseño al integrar (30-09).

**Acciones propuestas**
- Fijar la guía de diseño en `AGENTS.md` y en el tema compartido antes de iterar pantallas. *(Cumplida parcialmente.)*

## Sprint 4 — Entrega continua (05-10 al 10-10)

**Qué salió bien**
- Cada merge a `dev` genera un APK firmado, inspeccionado con `apksigner` y `aapt2`.
- El gráfico semanal usa datos reales y Realtime, con pruebas de los límites de semana y de la combinación local y remota.

**Qué mejorar**
- Las pruebas fallaron al ejecutarse dentro del sandbox (`spawnSync EPERM`) y hubo que repetirlas con permisos.
- La prueba funcional en Android sigue abierta: en el equipo donde se preparó el build no hay `adb` ni Android SDK accesibles.
- El build Docker de Expo informó 33 avisos de `npm audit` (1 crítico, 22 altos, 10 moderados) sobre un lockfile anterior; no se corrigieron porque exigen un incremento propio.
- Otro proyecto ocupaba los puertos 8081 y 543xx, por lo que hubo que usar puertos alternativos en las verificaciones.
- La primera ejecución del APK en CI tardó unos 22 minutos; un segundo merge no cancela el run anterior.

**Acciones propuestas**
- Corregir la clave de caché de Gradle para que no cambie al subir el `versionCode`. *(Cumplida en el PR #17.)*
- Instalar el APK de CI en un dispositivo físico y registrar los recorridos. *(Pendiente.)*
- Documentar el requisito de permisos de procesos para ejecutar `npm test`. *(Pendiente.)*

## Sprint 5 — Eventos y onboarding (11-10 al 16-10)

**Qué salió bien**
- Cuatro incrementos (009 a 012) con spec, plan, tareas y verificación.
- Las migraciones de eventos (11-10) y de tipos de evento (16-10) se aplicaron en Supabase cloud con respaldo previo, verificación posterior y estrategia de recuperación documentadas.
- El panel pasó a 33 recorridos Playwright aprobados.
- Las pruebas de aislamiento entre cuentas y de funcionamiento offline cubren eventos, tutorial y asignaturas.
- 208 pruebas unitarias de la app aprobadas en la ejecución del 18-10 (252 tras la spec 013).

**Qué mejorar**
- Varias tareas quedaron abiertas por la verificación Android (009, 010 y 011).
- En la spec 010 el emulador estaba listo, pero el build nativo falló en el equipo: Gradle no pudo iniciar su daemon («Unable to establish loopback connection»), un problema del JDK en Windows y no del proyecto.
- Los scripts de `tools/` no ejecutan el CLI de Supabase con la extensión `.cmd`, por lo que no funcionan directamente en Windows. Hubo que lanzar los comandos a mano.
- En el tutorial, la verificación web detectó dos defectos (`findNodeHandle` inexistente en web y un temporizador de respaldo que pisaba la medición), corregidos antes de integrar.
- La spec 009 encontró migraciones locales numeradas distinto a las remotas; hubo que alinear los nombres de los archivos con el historial.
- La validación con una cuenta inscrita en asignaturas depende de datos sintéticos que hay que preparar.

**Acciones propuestas**
- Agendar una sesión única de pruebas en Android que cubra los recorridos pendientes. *(Pendiente.)*

## Sprint 6 — Documentación y validación (17-10 al 01-11)

**Qué salió bien**
- Se realizó una entrevista de validación con un psicólogo, cuyo resumen y transcripción están en `Fase 2/Evidencias Proyecto/Entrevistas/`. Sus recomendaciones (acotar el alcance al estrés académico, lenguaje abierto en las preguntas, evitar consejos genéricos, derivar cuando el problema excede lo académico y no presentar resultados como diagnóstico) coinciden con el enfoque no clínico de la constitución.
- La spec 013 (horario por semestre) entró por el PR #24: 19 de 20 tareas verificadas, migración aplicada y comprobada en cloud con una prueba de humo dentro de una transacción con rollback, y 252 pruebas unitarias de la app aprobadas.
- Se retiraron los datos de muestra del inicio (clase, próximas evaluaciones y sugerencia de carga) y se reemplazaron por datos reales.
- La documentación de la Fase 2 se redactó con apoyo en las specs y en la información de la Fase 1.

**Qué mejorar**
- La spec 013 reemplazó el selector de asignaturas de la spec 011, de modo que parte del trabajo de ese incremento quedó superada.
- La entrevista con Bienestar Estudiantil no se pudo coordinar por falta de disponibilidad del entrevistado.
- Falta validar la app con estudiantes ajenos al equipo.

**Acciones propuestas**
- Contactar a otra persona de Bienestar o apoyarse en los resultados de la encuesta (14 respuestas). *(Pendiente.)*
- Convocar compañeros de curso para probar el APK, con consentimiento informado y datos anonimizados. *(Pendiente.)*

## Lecciones transversales

1. **Especificar antes de programar** reduce el retrabajo y da trazabilidad.
2. **Dejar la validación nativa para el final** acumula tareas abiertas; conviene validar en Android al cerrar cada incremento.
3. **Depender de terceros** (Bienestar Estudiantil) exige un plan alternativo desde el inicio.
4. **Tratar los datos emocionales como sensibles** condicionó el alcance, por ejemplo al acotar las alertas tempranas.

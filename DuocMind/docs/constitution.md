# Constitución de desarrollo de DuocMind

| Campo | Valor |
| --- | --- |
| Versión | 1.2.0 |
| Estado | Activa |
| Adoptada | 2026-09-09 |
| Última enmienda | 2026-09-20 |
| Enfoque | Spec-Driven Development |
| Alcance | Todo el proyecto `DuocMind/` |

## Propósito y autoridad

Esta constitución fija los límites éticos, técnicos y operativos de DuocMind. Toda spec, plan, lista de tareas, implementación, migración y entrega DEBE cumplirla. En caso de conflicto, prevalece sobre cualquier otro artefacto del proyecto.

Los términos DEBE, NO DEBE y PUEDE expresan requisitos obligatorios, prohibiciones y opciones respectivamente.

## I. Bienestar emocional no clínico

DuocMind apoya la organización académica y la reflexión emocional del estudiante; no presta atención clínica.

- Una emoción sugerida DEBE presentarse como una orientación editable, nunca como diagnóstico, evaluación médica o verdad definitiva.
- El estudiante DEBE conservar el control sobre la emoción registrada y poder corregir la sugerencia.
- Los consejos, rachas y alertas DEBEN ser privados, prudentes y formulados en español claro y empático.
- La aplicación NO DEBE prometer tratamiento, sustituir ayuda profesional ni contactar automáticamente a docentes, familiares, autoridades o servicios de emergencia.
- Los recursos de bienestar DEBEN distinguir con claridad la orientación general de la ayuda profesional o de emergencia.
- Toda funcionalidad emocional DEBE evaluarse también por el riesgo de culpa, alarma, estigma o dependencia que pueda producir.

**Puerta de cumplimiento:** ninguna funcionalidad de bienestar se aprueba si presenta inferencias como diagnósticos, elimina la capacidad de corrección o comparte información sin una acción informada del estudiante.

## II. Privacidad y protección de datos emocionales

Los datos emocionales se consideran sensibles aunque la normativa aplicable no los clasifique expresamente de ese modo.

- Se DEBE recolectar y conservar solo la información necesaria para un requisito aprobado.
- Cada dato sensible DEBE tener finalidad, propietario, ubicación, periodo de conservación y mecanismo de eliminación definidos antes de persistirse.
- Hasta completar las revisiones de seguridad correspondientes solo se usarán cuentas y datos sintéticos.
- Los datos personales o emocionales locales DEBEN cifrarse con SQLCipher antes de realizar pruebas con información real.
- Expo SecureStore se reserva para sesiones y secretos pequeños; no sustituye el almacenamiento estructurado de SQLite.
- En el cliente solo se permiten `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Las claves `secret`, `service_role`, contraseñas y tokens administrativos NO DEBEN incluirse en el bundle, el repositorio, los logs ni CI.
- Toda tabla remota expuesta DEBE usar RLS, grants mínimos explícitos, políticas separadas por operación y aislamiento basado en `auth.uid()`.
- Los logs, errores, métricas y datos de prueba NO DEBEN revelar respuestas emocionales, sesiones ni credenciales.
- Todo cambio remoto DEBE realizarse mediante una migración versionada, revisable y verificable.

**Puerta de cumplimiento:** una funcionalidad que maneje datos sensibles no avanza sin modelo de amenazas proporcional, reglas de acceso, pruebas de aislamiento y estrategia de recuperación o eliminación.

## III. Desarrollo Spec-Driven

Cada incremento vive en `specs/NNN-feature-name/` y sigue, sin saltos, el flujo:

`spec.md → plan.md → tasks.md → implementación`

- `spec.md` define problema, alcance, requisitos, casos límite y criterios de aceptación observables.
- `plan.md` se crea después de aprobar la spec y define arquitectura, interfaces, datos, seguridad, migraciones, riesgos y pruebas.
- `tasks.md` se crea después de aprobar el plan y lo divide en tareas atómicas, ordenadas y trazables con el formato `- [ ] T001 Descripción`.
- La implementación solo comienza después de aprobar la spec, el plan y las tareas.
- Se implementa una tarea por vez. Una tarea parcial o bloqueada permanece `[ ]` y documenta el motivo.
- Una tarea solo cambia a `[x]` después de completar el cambio, ejecutar su prueba específica y confirmar que no dejó errores.
- El código y la actualización del checkbox DEBEN entregarse juntos.
- La trazabilidad mínima es: requisito → criterio de aceptación → decisión de plan → tarea → cambio → prueba → resultado.

**Puerta de cumplimiento:** no se acepta código retrospectivamente justificado con una spec, un plan o tareas creados después de la implementación.

## IV. Arquitectura modular y offline-first

El sistema se diseña para conservar su utilidad esencial durante conexiones inestables y para aislar el dominio de la infraestructura.

- Toda solución DEBE ser proporcional al requisito aprobado: preferir la implementación más simple que cumpla sus criterios y no anticipar abstracciones, dependencias o infraestructura sin una necesidad concreta. Esto no reduce los controles exigidos de privacidad, seguridad, accesibilidad y verificación.
- El código DEBE organizarse por funcionalidades: `auth`, `agenda`, `emotions`, `resources` y `sync`, más capacidades realmente compartidas en `shared`.
- Las pantallas NO DEBEN consultar Supabase ni SQLite directamente; acceden a casos de uso y contratos de repositorio.
- Android es la única plataforma distribuible del MVP. Web PUEDE utilizarse como previsualización online del mismo proyecto Expo, pero no acredita garantías offline ni comportamiento nativo.
- Los contratos y casos de uso DEBEN compartirse entre plataformas. En web, los repositorios pueden usar Supabase de desarrollo con datos sintéticos; en Android, deben usar persistencia local y sincronización.
- La sesión web DEBE quedar separada del almacenamiento nativo en SecureStore.
- Agenda y emociones DEBEN permitir lectura y escritura sin conexión después de un primer acceso válido en línea.
- La biblioteca básica de bienestar DEBE distribuirse con la aplicación y funcionar offline.
- Una escritura offline DEBE guardar el dato local y su operación de salida dentro de la misma transacción SQLite.
- Las operaciones sincronizables usan los estados `pending`, `syncing`, `synced`, `failed` y `conflict`; un fallo de red nunca elimina información local confirmada.
- Una modificación concurrente NO DEBE sobrescribirse silenciosamente: ambas versiones se conservan hasta que el estudiante elija y esa decisión genera una nueva operación.
- Solo puede existir un check-in emocional activo por usuario y fecha local.
- La sincronización se intenta al abrir la aplicación, volver al primer plano, recuperar conexión o solicitar reintento manual. No se promete ejecución si Android cerró la app.
- Los esquemas local y remoto, la outbox, el versionado y la resolución de conflictos se especificarán en la Spec 002.

**Puerta de cumplimiento:** un recorrido offline no se aprueba si puede perder datos, depender de una pantalla conectada directamente al backend o ocultar un conflicto.

## V. Calidad, accesibilidad y pruebas automatizadas

La calidad es una propiedad verificable del producto, no una fase posterior.

- TypeScript DEBE operar en modo estricto y los datos no confiables se validan en los límites del sistema.
- Todo criterio de aceptación DEBE tener al menos una prueba automatizada o una comprobación reproducible identificada.
- La lógica de dominio se cubre con pruebas unitarias; persistencia, migraciones, sincronización, RLS y conflictos con pruebas de integración; la interfaz con pruebas de comportamiento y accesibilidad; los recorridos críticos aprobados con pruebas E2E.
- Toda corrección DEBE incluir una prueba que reproduzca el defecto y evite su regresión.
- La interfaz DEBE contemplar lectores de pantalla, contraste, escalado de texto, objetivos táctiles adecuados y estados comprensibles de carga, error, vacío, offline y conflicto.
- Las pruebas DEBEN controlar reloj, red, cuentas y datos, y no depender de información personal real.
- Un cambio de infraestructura nativa DEBE verificarse en Android, y cada spec DEBE incluir una validación Android antes de cerrarse. La previsualización web no sustituye esas pruebas.
- Una verificación fallida NO DEBE ocultarse deshabilitando pruebas, relajando tipos o actualizando snapshots sin revisar el comportamiento.

**Puerta de cumplimiento:** ninguna tarea se marca completada y ningún PR se integra mientras falle su prueba específica o la validación obligatoria aplicable.

## VI. Entregas reproducibles mediante GitHub y migraciones

El repositorio y su historial son la fuente auditable de cada entrega.

- `main` representa entregas estables y `dev` la integración. Las ramas de trabajo siguen `feature/*`, `fix/*`, `docs/*` o `chore/*` y parten de `dev`.
- Los cambios llegan a `dev` y luego a `main` mediante pull requests; `main` requiere CI verde y al menos una aprobación.
- `dev` y `main` DEBEN bloquear force-push.
- CI DEBE usar Node 24, `npm ci` y `npm run validate` sin acceder a datos reales ni modificar Supabase.
- `package-lock.json`, configuración, migraciones y documentación necesaria DEBEN versionarse para reproducir el resultado.
- Las dependencias se actualizan manualmente en cambios pequeños y revisados. No se configura Dependabot.
- Todo cambio remoto se entrega como migración versionada con verificación posterior y estrategia de reversión o recuperación documentada en el plan.
- El entorno cloud actual de Supabase es solo de desarrollo hasta que una spec aprobada defina la promoción a otro entorno.

**Puerta de cumplimiento:** no se considera reproducible una entrega que dependa de cambios manuales no versionados, herramientas globales no declaradas o secretos personales.

## Ciclo de aprobación

1. La spec parte en estado `BORRADOR`; se revisa y se aprueba explícitamente.
2. Con la spec aprobada se redacta y aprueba `plan.md`.
3. Con el plan aprobado se redacta y aprueba `tasks.md`.
4. La implementación avanza tarea por tarea y registra la verificación antes de cada `[x]`.
5. El incremento se considera verificado cuando cumple sus criterios, pruebas, controles de seguridad, documentación y validación de CI aplicables.

La aprobación de un artefacto no aprueba automáticamente el siguiente ni autoriza trabajo fuera de su alcance.

## Gobierno y enmiendas

- Una modificación de esta constitución requiere una propuesta explícita, impacto sobre specs activas, aprobación y registro de fecha y versión.
- Se usa versionado semántico: MAJOR para cambios incompatibles de principios o gobierno; MINOR para nuevos principios o ampliaciones normativas; PATCH para aclaraciones sin cambio de intención.
- Toda revisión de una spec o plan DEBE comprobar conformidad con la versión vigente de esta constitución.
- Una excepción temporal debe identificar alcance, riesgo, responsable, mitigación y fecha de expiración; no puede debilitar privacidad, consentimiento ni aislamiento entre usuarios.

**Versión vigente:** 1.2.0 — enmendada el 2026-09-20 para exigir soluciones proporcionales al requisito aprobado. Aplica a la Spec 001 y a incrementos posteriores; no cambia los criterios de aceptación de la Spec 001.

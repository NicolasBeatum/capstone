# Constitución de desarrollo de DuocMind

| Campo | Valor |
| --- | --- |
| Versión | 2.0.0 |
| Estado | Activa |
| Adoptada | 2026-09-09 |
| Última enmienda | 2026-09-20 |
| Enfoque | Spec-Driven Development |
| Alcance | Todo el proyecto `DuocMind/` |

## Propósito y autoridad

Esta constitución establece las garantías y reglas de gobierno duraderas de DuocMind. Prevalece sobre las specs, planes, tareas e implementación. Los términos DEBE, NO DEBE y PUEDE expresan requisitos obligatorios, prohibiciones y opciones.

El alcance y los mecanismos de cada incremento pertenecen a su spec y plan. Una nueva spec no requiere enmendar esta constitución salvo que cambie un principio o una regla de gobierno.

## I. Bienestar emocional no clínico

DuocMind apoya la organización académica y la reflexión emocional; no presta atención clínica.

- Una emoción sugerida DEBE presentarse como orientación editable, nunca como diagnóstico ni verdad definitiva. El estudiante conserva la decisión final y puede corregirla.
- Los consejos, rachas y alertas DEBEN ser privados, prudentes y formulados en español claro y empático.
- La aplicación NO DEBE prometer tratamiento, sustituir ayuda profesional ni contactar automáticamente a terceros.
- Los recursos de bienestar DEBEN distinguir la orientación general de la ayuda profesional o de emergencia.
- Toda funcionalidad emocional DEBE evaluarse por el riesgo de culpa, alarma, estigma o dependencia.

**Puerta de cumplimiento:** ninguna funcionalidad de bienestar se aprueba si presenta inferencias como diagnósticos, elimina la capacidad de corrección o comparte información sin una acción informada del estudiante.

## II. Privacidad y seguridad

Los datos emocionales se tratan como sensibles, aunque la normativa aplicable no los clasifique expresamente de ese modo.

- Se DEBE recolectar y conservar solo lo necesario para un requisito aprobado. Cada dato sensible DEBE tener finalidad, propietario, ubicación, periodo de conservación y mecanismo de eliminación definidos antes de persistirse.
- Hasta completar las revisiones de seguridad correspondientes solo se usarán cuentas y datos sintéticos. Antes de probar con datos personales o emocionales reales, el almacenamiento local DEBE estar cifrado y verificado.
- El cliente, el repositorio, los logs y CI NO DEBEN contener claves privilegiadas, contraseñas, tokens administrativos ni otros secretos. La configuración pública permitida se define en la spec que la utilice.
- Todo acceso a datos de usuarios DEBE aplicar privilegios mínimos y aislamiento por propietario, con pruebas que demuestren que una persona no puede leer ni modificar datos de otra.
- Logs, errores, métricas y pruebas NO DEBEN revelar respuestas emocionales, sesiones ni credenciales.
- Todo cambio de esquema o configuración remota DEBE ser versionado, revisable y verificable. Su mecanismo, reglas de acceso y recuperación se definen en el plan del incremento correspondiente.

**Puerta de cumplimiento:** una funcionalidad que maneje datos sensibles no avanza sin un modelo de amenazas proporcional, reglas de acceso, pruebas de aislamiento y estrategia de recuperación o eliminación.

## III. Desarrollo Spec-Driven

Cada incremento sigue el orden `spec.md → plan.md → tasks.md → implementación` dentro de su carpeta en `specs/`.

- La spec define problema, alcance y criterios observables; parte como `BORRADOR` y requiere aprobación explícita.
- El plan se crea y aprueba después de la spec; define las decisiones técnicas necesarias, riesgos, verificaciones y reversión.
- Las tareas se crean y aprueban después del plan; son pequeñas, ordenadas y trazables. Se implementa una por vez.
- Una tarea permanece `[ ]` si está parcial, bloqueada o sin verificación. Solo cambia a `[x]` con el cambio completo, su prueba específica aprobada y el repositorio válido; código y checkbox se entregan juntos.
- La trazabilidad mínima es requisito → criterio → decisión de plan → tarea → cambio → prueba → resultado.
- Una excepción al orden requiere autorización explícita, alcance, riesgo, responsable, mitigación y fecha de expiración. No puede debilitar privacidad, consentimiento ni aislamiento.

**Puerta de cumplimiento:** no se acepta una implementación justificada retrospectivamente por artefactos creados después, salvo una excepción expresamente registrada.

## IV. Arquitectura y funcionamiento offline

- Toda solución DEBE ser proporcional al requisito aprobado: usar la implementación más simple que cumpla sus criterios sin anticipar abstracciones, dependencias o infraestructura. Esto no reduce los controles de privacidad, seguridad, accesibilidad y verificación.
- El código DEBE separar la presentación, las reglas de negocio y el acceso a infraestructura. Las pantallas NO DEBEN consultar directamente servicios remotos ni almacenamiento; las capacidades compartidas solo se extraen cuando existe una necesidad real.
- Android es la plataforma distribuible del MVP. La previsualización web PUEDE usarse para desarrollo, pero no acredita comportamiento nativo ni garantías offline.
- En Android, agenda y emociones DEBEN permitir lectura y escritura sin conexión después de un primer acceso válido. Los recursos básicos de bienestar DEBEN distribuirse con la app y funcionar offline. Su alcance y mecanismos se definen en las specs correspondientes.
- Los recorridos offline DEBEN conservar los datos confirmados ante fallos de red. Un conflicto NO DEBE sobrescribir silenciosamente una versión; la persona afectada conserva el control de su resolución.
- Los mecanismos de persistencia, sincronización y resolución de conflictos se deciden y verifican en las specs que introduzcan esas capacidades.

**Puerta de cumplimiento:** ningún recorrido offline se aprueba si puede perder datos confirmados, ocultar un conflicto o depender de una pantalla conectada directamente al backend.

## V. Calidad, accesibilidad y verificación

- TypeScript DEBE operar en modo estricto y los datos no confiables se validan en los límites del sistema.
- Cada criterio de aceptación DEBE tener una prueba automatizada o una comprobación reproducible identificada. El tipo y alcance de las pruebas serán proporcionales al riesgo: dominio, integración, interfaz o recorrido completo según corresponda.
- Toda corrección DEBE incluir una prueba que reproduzca el defecto y evite su regresión.
- La interfaz DEBE contemplar lectores de pantalla, contraste, escalado de texto, objetivos táctiles adecuados y estados comprensibles de carga, error, vacío, offline y conflicto cuando apliquen.
- Las pruebas DEBEN controlar reloj, red, cuentas y datos; no pueden depender de información personal real.
- Los cambios de comportamiento nativo DEBEN probarse en Android y cada spec DEBE incluir validación Android antes de cerrarse. La previsualización web no la sustituye.
- Una verificación fallida NO DEBE ocultarse deshabilitando pruebas, relajando tipos o actualizando resultados sin revisar el comportamiento.

**Puerta de cumplimiento:** ninguna tarea se marca completada ni se integra mientras falle su verificación específica o una validación obligatoria aplicable.

## VI. Entregas reproducibles

- `main` representa entregas estables y `dev` la integración. Las ramas de trabajo parten de `dev` y los cambios llegan mediante pull requests. `main` requiere CI verde y al menos una aprobación; `main` y `dev` DEBEN bloquear force-push.
- El proyecto DEBE declarar una validación completa y CI DEBE ejecutarla tras instalar desde el lockfile con las versiones declaradas en el repositorio, sin datos reales ni modificaciones remotas.
- Dependencias, configuración, migraciones y documentación necesarias DEBEN versionarse para reproducir el resultado. Las dependencias se actualizan en cambios pequeños y revisados.
- Todo cambio remoto DEBE tener verificación posterior y una estrategia de reversión o recuperación documentada en su plan.
- Un entorno de desarrollo NO DEBE tratarse como producción sin una spec aprobada que defina esa transición.

**Puerta de cumplimiento:** una entrega no se considera reproducible si depende de cambios manuales no versionados, herramientas globales no declaradas o secretos personales.

## Gobierno y enmiendas

- Una modificación de esta constitución requiere propuesta explícita, evaluación de impacto sobre specs activas, aprobación y registro de fecha y versión.
- Se usa versionado semántico: MAJOR para cambios incompatibles de principios o gobierno; MINOR para nuevos principios o ampliaciones normativas; PATCH para aclaraciones sin cambio de intención.
- Toda revisión de una spec o plan DEBE comprobar conformidad con la versión vigente. Una nueva spec, por sí sola, no constituye motivo de enmienda.

**Enmienda 2.0.0 (2026-09-20):** aprobada por la solicitud del usuario de estabilizar la constitución y la guía de agentes. Sustituye prescripciones técnicas de capacidades futuras por garantías y deja sus mecanismos a las specs correspondientes. La especificación aprobada del inicio del proyecto conserva sus criterios y evidencia histórica; los borradores se revisan contra esta versión. No altera implementaciones ni acredita verificaciones pendientes.

# Constitución de desarrollo de DuocMind

| Campo | Valor |
| --- | --- |
| Versión | 2.2.0 |
| Estado | Activa |
| Enfoque | Spec-Driven Development (SDD) |
| Adoptada | 2026-09-03 |
| Última enmienda | 2026-09-04 |

## Propósito

Esta constitución gobierna cómo se especifica, diseña, implementa, prueba, integra y entrega el software de DuocMind. Sus reglas aplican a código, arquitectura, modelos y migraciones de datos, interfaces, automatizaciones, documentación técnica y configuración de entornos.

El problema, los usuarios, el alcance funcional, la planificación académica y las evidencias del proyecto se documentan en sus respectivas especificaciones y planes. No son principios de ingeniería y, por lo tanto, no se duplican aquí.

La guía APT se utiliza como contexto del producto. Sus instrucciones de formulario no son requisitos de desarrollo, y las tecnologías allí mencionadas —como React Native y Supabase— son selecciones iniciales que deberán confirmarse en el plan técnico o mediante una decisión de arquitectura.

Los términos **DEBE**, **NO DEBE** y **SOLO PUEDE** expresan obligaciones. Un cambio que incumpla cualquiera de los seis principios siguientes NO DEBE integrarse en la rama principal ni considerarse terminado.

## Principios innegociables

### I. Especificación primero y trazabilidad completa

Ningún comportamiento DEBE implementarse sin una especificación revisada y aprobada. La especificación es la fuente de verdad sobre qué debe hacer el software; el código demuestra su implementación, pero no sustituye su definición.

Cada especificación DEBE incluir, como mínimo:

- identificador estable, versión y estado;
- objetivo, actores y escenarios de uso;
- comportamiento esperado, reglas de negocio y exclusiones;
- criterios de aceptación observables;
- estados normales, alternativos, límite y de error;
- datos tratados, permisos y restricciones de seguridad o privacidad;
- requisitos de accesibilidad, rendimiento, compatibilidad y operación;
- contratos o interfaces afectados;
- estrategia de pruebas y evidencia esperada.

Todo requisito DEBE mantener trazabilidad bidireccional:

`especificación → criterio de aceptación → tarea → cambio → prueba → resultado`

Si durante la implementación se descubre una diferencia, el trabajo DEBE detenerse y la especificación DEBE actualizarse y aprobarse antes de continuar. Para una corrección urgente se admite una especificación abreviada, pero esta también DEBE existir y aprobarse antes de integrar el cambio.

**Puerta de cumplimiento:** una tarea no pasa a desarrollo sin especificación aprobada; un cambio no se integra si no identifica la especificación, los criterios satisfechos y las pruebas que los demuestran.

### II. Arquitectura modular y dependencias controladas

El software DEBE separar presentación, lógica de aplicación o dominio y acceso a datos o servicios externos. Las dependencias DEBEN seguir límites explícitos y permitir que la lógica de negocio se pruebe sin iniciar la interfaz, la red ni la base de datos.

En particular:

- las pantallas y componentes visuales NO DEBEN contener reglas de negocio ni acceder directamente a la base de datos;
- las reglas sensibles, como la detección de patrones para alertas, DEBEN residir en módulos aislados, deterministas y comprobables;
- cada módulo DEBE tener una responsabilidad clara y contratos de entrada, salida y error definidos;
- NO DEBEN existir dependencias circulares ni acceso a detalles internos de otro módulo;
- los contratos entre aplicación, backend, base de datos y proveedores DEBEN versionarse y probarse;
- las decisiones estructurales relevantes DEBEN registrarse mediante una decisión de arquitectura (ADR);
- una dependencia externa nueva SOLO PUEDE incorporarse tras evaluar necesidad, mantenimiento, licencia, seguridad, tamaño e impacto operativo.

La arquitectura DEBE favorecer cambios locales y reversibles. No se aceptan abstracciones, servicios o infraestructura anticipada sin un caso de uso especificado que los necesite.

El stack DEBE mantenerse tan pequeño como permita la especificación. Antes de agregar una biblioteca, servicio, framework adicional o segundo mecanismo para una capacidad ya existente, se DEBE demostrar que el stack aprobado no resuelve la necesidad. Se prefieren las capacidades de la plataforma y las dependencias ya adoptadas; dos herramientas con la misma responsabilidad requieren una justificación técnica explícita.

El código fuente, los identificadores y los nombres de archivos, módulos, tipos, funciones, APIs y campos de datos DEBEN escribirse en inglés. Los comentarios técnicos dentro del código y la documentación técnica del proyecto DEBEN escribirse en español. Los nombres impuestos por protocolos, bibliotecas o servicios externos conservan su forma oficial.

**Puerta de cumplimiento:** todo cambio arquitectónico incluye diagrama o descripción de límites, ADR cuando corresponda y pruebas de los contratos afectados; ninguna dependencia nueva se integra sin justificación documentada.

### III. Datos, privacidad y seguridad durante todo el ciclo de vida

Todo dato DEBE contar con esquema, validación, finalidad, clasificación, responsable, política de acceso, retención y eliminación definidas antes de persistirse. Los registros emocionales y las inferencias relacionadas DEBEN clasificarse internamente como información de riesgo alto y tratarse como potenciales datos personales sensibles aunque el producto no sea clínico.

Cuando una especificación aprobada establezca autenticación obligatoria, esta DEBE identificar y minimizar los datos de identidad, credenciales, sesión y seguridad estrictamente indispensables para autenticar y proteger el acceso, junto con la evidencia mínima indispensable para demostrar la aceptación del aviso aplicable. Antes de transmitirlos o crear la cuenta, la persona usuaria DEBE recibir un aviso claro y aceptar expresamente ese tratamiento. La evidencia de esa aceptación DEBE limitarse a su versión, alcance, finalidad, decisión, instante e identificadores técnicos mínimos, y NO autoriza ningún tratamiento de contenido. Esta regla regula el tratamiento de esos datos y NO convierte la autenticación obligatoria en un requisito general del producto; esa decisión pertenece a la especificación correspondiente.

Los datos que no sean indispensables para la autenticación, su seguridad, la evidencia mínima del aviso o una solicitud de privacidad iniciada expresamente por la persona usuaria DEBEN organizarse en categorías opcionales de tratamiento o sincronización. Cada categoría de contenido DEBE comenzar desactivada y requerir una autorización independiente, explícita y revocable; crear una cuenta o iniciar sesión NO DEBE activar por sí solo ninguna categoría opcional. Los datos locales y remotos DEBEN aislarse según la identidad autenticada, y el acceso a cada categoría autorizada DEBE verificarse en el límite confiable.

El desarrollo DEBE aplicar, como mínimo:

- minimización de datos y privacidad por defecto;
- autenticación y autorización aplicadas en el límite confiable, nunca solo en la interfaz cliente;
- mínimo privilegio y aislamiento entre usuarios;
- validación y normalización de toda entrada en los límites del sistema;
- cifrado en tránsito y protección adecuada de datos persistidos;
- mensajes de error que no revelen información interna o sensible;
- secretos fuera del código, repositorio, compilaciones y registros;
- registros técnicos sin contenido emocional ni otros datos sensibles;
- datos sintéticos o realmente anonimizados en desarrollo, pruebas, demostraciones y evidencias.

Las migraciones DEBEN estar versionadas, probadas y acompañadas por una estrategia de recuperación cuando puedan perder o transformar datos. Una operación destructiva sobre datos NO DEBE ejecutarse sin validación del objetivo y un mecanismo de reversión o recuperación aprobado durante el plazo de recuperación aplicable. Cuando una política aprobada exija la eliminación definitiva, la purga SOLO PUEDE ejecutarse después de vencer el plazo de recuperación aprobado; desde ese momento DEBE ser irreversible y NO DEBE conservar copias ni respaldos fuera de la política de retención aplicable.

En sistemas con clientes desconectados, la especificación DEBE distinguir entre una orden todavía no recibida y una purga ya confirmada. Una copia que conozca una eliminación vencida pero no pueda descartar de forma confiable una cancelación DEBE permanecer inaccesible y aislada hasta verificar el estado; después DEBE purgarse o restaurarse sin extender el acceso. Un cliente que nunca recibió la orden DEBE consultarla y aplicarla antes de su siguiente operación remota. SOLO PUEDE conservarse después de la purga un marcador mínimo no reversible, sin contenido, cuando sea indispensable para propagar el estado a instalaciones conocidas; su finalidad, acceso, retención y eliminación DEBEN estar definidos.

Las alertas de bienestar DEBEN basarse en reglas especificadas, explicables y comprobables mediante pruebas de borde y falsos positivos. NO DEBEN producir diagnósticos, puntajes clínicos ni decisiones automáticas de alto impacto.

Un piloto con datos personales reales SOLO PUEDE habilitarse después de una revisión de privacidad, amenazas, base de licitud y autorización institucional aplicable. Estos controles DEBEN mantenerse en una especificación de seguridad y privacidad actualizada conforme a la normativa vigente.

**Puerta de cumplimiento:** todo cambio que lea, escriba, derive, comparta o elimine datos incluye revisión de amenazas y privacidad, pruebas de autorización y aislamiento, y verificación de migraciones y registros.

### IV. Calidad verificable y pruebas automatizadas

Cada criterio de aceptación DEBE corresponder a una o más pruebas. La estrategia mínima es:

- pruebas unitarias para reglas de dominio, transformaciones y validaciones;
- pruebas de integración para persistencia, migraciones, APIs y servicios externos;
- pruebas de extremo a extremo para los recorridos críticos del usuario;
- pruebas específicas de seguridad, accesibilidad, rendimiento y recuperación cuando el riesgo o la especificación lo exijan.

Toda corrección de defecto DEBE incluir primero una prueba que reproduzca la falla y luego demostrar que dejó de ocurrir. Las pruebas DEBEN ser deterministas, independientes y repetibles; una prueba inestable no puede ignorarse indefinidamente y requiere responsable, tarea de corrección y plazo.

La integración continua DEBE ejecutar, según el alcance del cambio, formato, análisis estático, verificación de tipos, pruebas automatizadas, compilación y controles de dependencias o seguridad. Un porcentaje de cobertura por sí solo NO DEBE utilizarse como evidencia suficiente de calidad.

La Definición de Terminado exige código revisado, criterios satisfechos, CI aprobada, documentación sincronizada y ausencia de defectos críticos o altos conocidos. La escala de severidad y los umbrales medibles se definen en el plan de calidad.

**Puerta de cumplimiento:** una prueba obligatoria o un control de CI SOLO PUEDE omitirse temporalmente mediante una excepción técnica documentada que identifique responsable, riesgo aceptado y fecha de corrección; sin esa excepción, el cambio NO DEBE integrarse.

### V. UX, accesibilidad, rendimiento y resiliencia como requisitos técnicos

La interfaz DEBE implementarse desde un flujo y criterios de interacción aprobados. Cada recorrido DEBE especificar y construir sus estados de carga, vacío, éxito, error, permisos denegados, datos inválidos y conectividad limitada o ausente cuando aplique.

Cada componente interactivo DEBE ofrecer semántica y etiquetas para tecnologías de asistencia, orden de foco comprensible, texto escalable, contraste suficiente y objetivos táctiles adecuados. La información NO DEBE depender solo del color, el movimiento o el sonido. Los textos de interfaz, validaciones, errores visibles, etiquetas de accesibilidad y mensajes al usuario DEBEN escribirse en español, salvo que una especificación aprobada incorpore otro idioma. Los mensajes relacionados con bienestar DEBEN ser claros, empáticos, no alarmistas y consistentes con los límites no clínicos.

Cada especificación DEBE definir presupuestos medibles para los aspectos relevantes de rendimiento y resiliencia, como inicio, respuesta de interacción, consumo de red, reintentos, tiempos de espera y recuperación ante fallos. La validación DEBE realizarse en dispositivos y condiciones representativas del entorno Android objetivo.

La telemetría SOLO PUEDE recopilar información necesaria, documentada y compatible con el principio de privacidad; nunca debe incluir contenido emocional ni datos sensibles.

**Puerta de cumplimiento:** un recorrido crítico no se considera terminado sin revisión de accesibilidad, mediciones de rendimiento, pruebas de estados alternativos y evidencia de recuperación frente a los fallos especificados.

### VI. Integración controlada y entrega reproducible

Git DEBE ser la fuente de verdad de todos los artefactos técnicos versionables. La rama principal DEBE mantenerse protegida y en estado integrable. Todo cambio DEBE ingresar mediante una revisión que:

- esté vinculada a su especificación y tareas;
- tenga un alcance pequeño y coherente;
- describa comportamiento, riesgos, pruebas y evidencia;
- identifique migraciones, cambios de contrato y estrategia de reversión;
- sea aprobada por al menos una persona distinta de su autor;
- complete satisfactoriamente los controles automáticos requeridos.

Un checkout limpio DEBE poder instalar dependencias, compilar y ejecutar las pruebas mediante instrucciones versionadas. Las versiones del entorno y las dependencias directas DEBEN fijarse mediante archivos de configuración y bloqueo; las variables necesarias DEBEN documentarse con ejemplos sin secretos.

Código, contratos, documentación, ADR, migraciones y notas de versión DEBEN actualizarse en el mismo cambio cuando estén relacionados. Toda entrega DEBE poseer una versión identificable, artefactos trazables al cambio que los generó y un procedimiento de despliegue y reversión acorde con su riesgo.

**Puerta de cumplimiento:** otra persona del equipo debe poder reproducir la compilación y las pruebas desde un entorno limpio usando únicamente el repositorio y las instrucciones aprobadas.

## Flujo obligatorio de Spec-Driven Development

Todo cambio seguirá este orden:

1. **Especificación:** definir comportamiento, límites, criterios y requisitos no funcionales.
2. **Aclaración:** resolver contradicciones, decisiones abiertas y casos límite.
3. **Plan técnico:** definir arquitectura, contratos, datos, riesgos y estrategia de pruebas.
4. **Tareas:** descomponer el plan en unidades pequeñas, ordenadas y trazables.
5. **Implementación:** construir cada tarea junto con sus pruebas y documentación.
6. **Verificación e integración:** comprobar criterios, revisar el cambio, aprobar CI y conservar evidencia.

Los documentos pueden usar los estados `BORRADOR`, `EN REVISIÓN`, `APROBADA`, `IMPLEMENTADA` y `VERIFICADA`. No se permite declarar un estado posterior si la puerta anterior no se ha satisfecho.

La documentación retrospectiva no corrige una omisión del proceso. Si el código y la especificación difieren, el cambio permanece incompleto hasta resolver la discrepancia.

## Gobernanza de ingeniería

- Esta constitución prevalece sobre especificaciones, planes, tareas y decisiones técnicas. La normativa aplicable prevalece sobre esta constitución.
- Cada especificación y revisión de cambio DEBE incluir una comprobación explícita de los seis principios.
- Una enmienda DEBE realizarse mediante revisión versionada, explicar motivo e impacto y definir la migración del trabajo existente. Requiere aprobación explícita de todo el equipo y no puede ser revisada solo por quien la propone.
- El versionado sigue SemVer: `MAJOR` elimina o redefine un principio; `MINOR` agrega una obligación material; `PATCH` aclara sin cambiar el sentido.
- Una desviación informal no constituye una excepción. Si una regla necesita cambiar, primero se enmienda esta constitución.
- El alcance del producto, los hitos académicos, el backlog, las herramientas de gestión y las responsabilidades del proyecto pertenecen a sus especificaciones y planes, no a esta constitución.

## Registro de enmiendas

| Versión | Fecha | Aprobación | Motivo | Impacto | Migración |
| --- | --- | --- | --- | --- | --- |
| 2.2.0 | 2026-09-04 | Equipo DuocMind, mediante aprobación explícita | Distinguir los datos indispensables de autenticación de las categorías opcionales y precisar el carácter irreversible y la propagación de una purga definitiva. | Refuerza privacidad por defecto, consentimiento granular, aislamiento por identidad y reglas de retención y eliminación, incluidos clientes desconectados y marcadores mínimos, sin imponer autenticación como requisito general del producto. | No requiere migración de código ni de datos; las especificaciones y planes posteriores deberán aplicar la regla antes de implementar. |

## Referencia de contexto

- [Guía de definición del Proyecto APT](<../../Fase 1/Evidencias Grupales/1.5_GuiaEstudiante_Fase 1_Definicion Proyecto APT (Español).docx>)

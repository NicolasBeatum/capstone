# AGENTS.md — Guía de trabajo de DuocMind

## Alcance y fuentes de verdad

Esta guía aplica a todo `DuocMind/`. Antes de trabajar, leer `docs/constitution.md` y los artefactos existentes del incremento pertinente en `specs/<incremento>/`, en orden: `spec.md`, `plan.md`, `tasks.md`. La constitución prevalece sobre la spec; la spec sobre el plan; el plan sobre las tareas; y todos ellos sobre la implementación. Corregir y aprobar el artefacto de mayor autoridad si existe un conflicto.

`package.json`, el lockfile y los archivos de configuración son la fuente de verdad para versiones, dependencias, scripts y plataforma configurada. `README.md` explica cómo ejecutar el estado actual del proyecto. Las specs describen capacidades aprobadas o propuestas; no se infiere que una capacidad esté implementada por aparecer en una spec.

## Producto y límites funcionales

DuocMind es una aplicación Android para estudiantes de Duoc UC. Su alcance de producto incluye horario académico, registro de pruebas y tareas, check-in emocional diario no clínico, recursos locales de bienestar y consejos privados ante rachas de resultados emocionales negativos. La persona conserva el control de la emoción registrada; la aplicación no diagnostica ni sustituye atención profesional.

`auth`, `agenda`, `emotions`, `resources` y `sync` son límites funcionales previstos, no carpetas ni capacidades ya implementadas. Cada spec define cuándo y cómo se incorpora una capacidad. Android es la plataforma distribuible del MVP; la web sirve para previsualización de desarrollo y no prueba comportamiento nativo u offline.

## Stack de referencia aprobado

- Expo administrado, React Native, Expo Router y TypeScript estricto para la aplicación Android; React Native Web para su previsualización.
- Node.js, npm y lockfile versionado para el entorno y las dependencias.
- Supabase cloud como backend de desarrollo; SQLite para datos operativos locales, SecureStore para sesiones y secretos pequeños, y SQLCipher para cifrado local cuando corresponda.
- Jest, `jest-expo` y React Native Testing Library para pruebas; ESLint, Prettier y comprobación de tipos para calidad.
- EAS para builds nativos de desarrollo y distribución Android; GitHub y GitHub Actions para revisión y CI.

Esta lista expresa decisiones tecnológicas de referencia, no un inventario de paquetes instalados. Consultar `package.json`, el lockfile y la configuración para versiones y capacidades disponibles; cada tecnología se incorpora mediante una spec, un plan y tareas aprobados. Agregar una dependencia ya prevista no exige actualizar esta guía.

## Flujo obligatorio de Spec-Driven Development

Cada incremento vive en `specs/<incremento>/` y sigue el orden `spec.md → plan.md → tasks.md → implementación`.

1. Redactar y obtener aprobación explícita de `spec.md`, que comienza en `BORRADOR` y define problema, alcance y resultados observables.
2. Redactar y aprobar `plan.md` solo después de aprobar la spec; documentar arquitectura, interfaces, datos, seguridad, riesgos, pruebas y reversión aplicables.
3. Redactar y aprobar `tasks.md` solo después de aprobar el plan, con tareas ordenadas y verificables en formato `- [ ] T001 Descripción`.
4. Implementar una tarea por vez. Marcar `[x]` solo después de completar su cambio, superar su verificación y confirmar que el repositorio queda válido. Entregar código y checkbox juntos; documentar por qué una tarea sigue abierta.

Una solicitud del usuario autoriza el alcance indicado, no otros incrementos. Las operaciones destructivas, despliegues, migraciones remotas, manejo de credenciales y uso de datos personales requieren autorización explícita para su objetivo. Las excepciones al flujo se documentan en el plan afectado conforme a la constitución, no en esta guía.

## Implementación y convenciones

- Preferir la solución más simple que cumpla la spec aprobada; justificar dependencias nuevas en el plan por necesidad e impacto. No crear capas, carpetas ni infraestructura para funciones futuras.
- Mantener separadas presentación, reglas de negocio y acceso a infraestructura. Las pantallas no consultan directamente el backend ni el almacenamiento.
- Usar TypeScript estricto; evitar `any` y validar datos externos en sus límites.
- Usar `PascalCase` para componentes y tipos, `camelCase` para funciones y variables, y `UPPER_SNAKE_CASE` solo para constantes globales.
- Escribir código, nombres de archivos e identificadores en inglés. Escribir documentación, comentarios, textos de interfaz y etiquetas de accesibilidad en español.
- Mantener componentes pequeños y accesibles. Los comentarios explican decisiones, no repiten el código. Evitar dependencias circulares y acceso a detalles internos de otra funcionalidad.
- No registrar secretos, sesiones, datos personales ni respuestas emocionales. No incluir claves privilegiadas en el cliente ni versionar archivos de entorno reales.

## Verificación y entrega

- Relacionar cada criterio de aceptación con una prueba o comprobación reproducible. Ejecutar primero la verificación cercana al cambio y después las validaciones aplicables declaradas por el proyecto.
- Probar en Android los cambios nativos y antes de cerrar una spec. La previsualización web no sustituye esa prueba.
- Informar comandos ejecutados, resultados reales y verificaciones pendientes. No deshabilitar pruebas ni relajar tipos para obtener un resultado verde.

## Git y GitHub

- `main` contiene entregas estables y `dev` integra los cambios. Las ramas `feature/*`, `fix/*`, `docs/*` y `chore/*` parten de `dev`; los cambios llegan a `dev` y luego a `main` mediante pull requests.
- `main` requiere CI verde y al menos una aprobación. `main` y `dev` deben bloquear force-push.
- Los commits usan `tipo: descripción en español`, con tipos `feat`, `fix`, `docs`, `refactor`, `test`, `build`, `ci`, `chore` o `revert`.
- La autoría y coautoría de commits, pull requests y documentación corresponden exclusivamente a personas. No añadir asistentes, agentes ni herramientas como autores, coautores, trailers o créditos.
- Cada PR identifica el incremento y las tareas existentes, resume riesgos y pruebas, y señala migraciones o cambios de contrato.
- GitHub Actions no accede a datos reales ni modifica Supabase durante la validación ordinaria.
- Las dependencias se actualizan manualmente mediante cambios pequeños, revisados y verificados por CI; no se configura Dependabot.

Esta guía se actualiza solo cuando cambia una regla de trabajo duradera. Los estados de tareas, comandos disponibles y decisiones de funciones concretas pertenecen a sus fuentes de verdad.

# AGENTS.md — Guía de desarrollo de DuocMind

## Alcance y autoridad

Este archivo aplica a todo el árbol de `DuocMind/`. Antes de modificar el proyecto, todo agente o integrante del equipo DEBE leer, en este orden:

1. `docs/constitution.md`;
2. `specs/NNN-feature-name/spec.md`;
3. `specs/NNN-feature-name/plan.md`;
4. `specs/NNN-feature-name/tasks.md`.

La autoridad desciende en ese mismo orden: la constitución prevalece sobre la spec; la spec sobre el plan; el plan sobre las tareas; y todos ellos prevalecen sobre una implementación existente. Si dos artefactos se contradicen, el trabajo se detiene hasta corregir y aprobar el artefacto de mayor nivel.

Una solicitud explícita del usuario autoriza únicamente el alcance descrito. Las operaciones destructivas, despliegues, migraciones remotas, manejo de credenciales y uso de datos personales requieren una autorización explícita que identifique su objetivo.

## Producto

DuocMind es una aplicación Android para estudiantes de Duoc UC que combina:

- horario académico;
- registro de pruebas y tareas;
- un check-in emocional diario no clínico;
- una biblioteca local de recursos de bienestar;
- consejos privados ante rachas de resultados emocionales negativos.

El test emocional sugiere una emoción a partir de respuestas estructuradas. El estudiante conserva la decisión final y puede corregir la emoción sugerida. DuocMind NO diagnostica, NO trata, NO sustituye atención profesional o de emergencia y NO contacta automáticamente a terceros.

El primer registro o inicio de sesión en un dispositivo requiere conexión. Después de una autenticación válida, agenda, emociones y biblioteca deben continuar disponibles sin conexión para ese perfil. Los cambios se guardan primero en el dispositivo y se sincronizan con Supabase cuando vuelve a ser posible.

Android es la única plataforma distribuible del MVP. El navegador es una superficie de previsualización y desarrollo online del mismo proyecto Expo: permite revisar interfaz, navegación y recorridos con Supabase de desarrollo, pero no demuestra persistencia offline, SecureStore, SQLCipher, sincronización ni comportamiento nativo Android.

## Stack aprobado

- React Native mediante Expo SDK 57.
- Expo es el flujo administrado del proyecto; no se migrará a React Native CLI.
- Expo Router.
- TypeScript en modo estricto.
- Android como única plataforma del MVP.
- React Native Web como superficie de previsualización, no como producto ni despliegue web.
- Node.js 24 LTS.
- npm y `package-lock.json` versionado.
- Supabase cloud como backend remoto de desarrollo.
- SQLite como almacenamiento operativo local.
- Expo SecureStore para sesiones y valores secretos pequeños.
- SQLCipher antes de admitir datos personales o emocionales reales.
- Jest, `jest-expo` y React Native Testing Library.
- ESLint, Prettier y verificación de tipos.
- GitHub y GitHub Actions.
- EAS Development Builds cuando se requiera código nativo no disponible en Expo Go.
- EAS genera APK instalables para desarrollo y preview; una publicación futura en Google Play utilizará AAB.

No se incorpora una dependencia adicional si Expo, React Native, TypeScript, SQLite o Supabase ya cubren la necesidad. Toda dependencia nueva debe justificarse en el plan por necesidad, mantenimiento, licencia, seguridad, tamaño e impacto operativo. Las versiones estables se fijan en `package.json` y `package-lock.json`; no se usan versiones beta, canary o rangos sin justificación.

## Flujo obligatorio de Spec-Driven Development

Cada incremento vive en una carpeta independiente:

```text
specs/NNN-feature-name/
├── spec.md
├── plan.md
└── tasks.md
```

El orden obligatorio es:

`spec.md → plan.md → tasks.md → implementación`

### `spec.md`

Define el problema, los usuarios, el alcance, los requisitos, los casos límite, los requisitos no funcionales y los criterios de aceptación observables. Explica **qué** debe lograrse sin sustituir el diseño técnico.

Una spec comienza como `BORRADOR`. Solo puede pasar a `APROBADA` cuando no conserva decisiones necesarias abiertas y el usuario acepta expresamente su contenido.

### `plan.md`

Se crea únicamente después de aprobar la spec. Define **cómo** se implementará: arquitectura, límites entre módulos, contratos, datos, migraciones, seguridad, riesgos, compatibilidad, pruebas y estrategia de reversión.

El plan debe ser ejecutable sin que la persona implementadora tenga que inventar decisiones técnicas relevantes. Se aprueba antes de crear las tareas.

### `tasks.md`

Se crea únicamente después de aprobar el plan. Traduce el plan en unidades pequeñas, ordenadas y trazables:

```markdown
- [ ] T001 Descripción verificable de la tarea
```

Las tareas deben indicar dependencias y verificación cuando no sean evidentes. Se implementa una tarea por vez. Una tarea solo cambia a `[x]` después de completar su cambio, ejecutar su verificación específica y confirmar que el repositorio queda en un estado válido. Una tarea parcial o bloqueada permanece `[ ]` y registra el motivo.

El cambio de implementación y la actualización de su checkbox se entregan juntos. No se empieza una tarea dependiente mientras la anterior continúe incompleta. No se crean `plan.md` y `tasks.md` como formalidad retrospectiva después de escribir el código.

La regularización histórica del commit `6043772` es una excepción autorizada y acotada, registrada en el plan de la Spec 001. No modifica el orden exigido para los incrementos siguientes ni acredita aprobaciones previas inexistentes.

## Organización del código

El commit inicial de la Spec 001 contiene únicamente rutas en `src/app/`. La organización objetivo para incrementos posteriores es:

```text
src/
├── app/
├── features/
│   ├── auth/
│   ├── agenda/
│   ├── emotions/
│   ├── resources/
│   └── sync/
└── shared/
    ├── components/
    ├── domain/
    ├── infrastructure/
    └── utils/
```

- `app/` contiene rutas y composición de pantallas, no reglas de negocio.
- Cada feature encapsula presentación, casos de uso, dominio y contratos propios.
- `shared/` contiene solo capacidades realmente compartidas.
- Las pantallas y componentes NO acceden directamente a Supabase o SQLite.
- Los casos de uso dependen de contratos de repositorio; los adaptadores implementan acceso local y remoto.
- En web, los adaptadores de infraestructura pueden consultar Supabase de desarrollo con cuentas y datos sintéticos; la sesión web usa un adaptador separado de SecureStore.
- En Android, los adaptadores de infraestructura guardan primero en SQLite y sincronizan mediante la outbox.
- Los contratos y casos de uso compartidos no deben depender de la plataforma; las diferencias se resuelven en adaptadores o módulos con extensión de plataforma.
- La lógica de emociones, rachas y conflictos debe ser determinista y comprobable sin UI ni red.
- No se permiten dependencias circulares ni importaciones hacia detalles internos de otra feature.

## Convenciones de código e idioma

- Usar `strict: true` y evitar `any`; para datos no confiables, usar `unknown` y validación explícita.
- Usar `PascalCase` para componentes y tipos, `camelCase` para funciones y variables, y `UPPER_SNAKE_CASE` solo para constantes globales.
- Escribir en inglés el código, nombres de archivos, rutas, módulos, tipos, funciones, APIs y campos de datos.
- Escribir en español la documentación, comentarios técnicos, JSDoc, textos de interfaz, errores y etiquetas de accesibilidad.
- Mantener componentes funcionales, pequeños y accesibles.
- Los comentarios explican decisiones o restricciones; no repiten el código.
- No dispersar reglas de negocio, textos repetidos, URLs de entorno ni secretos como literales.
- Centralizar los logs de desarrollo y registrar solo eventos técnicos sanitizados. No registrar tokens, correos, respuestas emocionales, contenido sensible ni payloads completos.

## Persistencia offline y sincronización

- Las garantías offline siguientes corresponden al producto Android; la previsualización web opera online y no las acredita.
- Agenda y emociones son offline-first: una operación válida se confirma primero en SQLite.
- La escritura del dato y de su operación de salida debe ser atómica.
- La cola persistente usa estados `pending`, `syncing`, `synced`, `failed` y `conflict`.
- Los fallos de red nunca eliminan un dato confirmado localmente.
- La sincronización se intenta al abrir o reanudar la app, recuperar conexión o solicitar reintento manual.
- No se promete trabajo en segundo plano después de que Android cierre la aplicación.
- Toda operación remota debe ser idempotente y estar ligada al UID propietario.
- Los conflictos conservan ambas versiones y requieren elección explícita; nunca se sobrescribe silenciosamente una versión incompatible.
- Solo existe un check-in emocional activo por UID y fecha local; el estudiante puede corregirlo.
- Los detalles de esquema, versiones, outbox, reconciliación y resolución pertenecen a la Spec 002.

## Supabase y seguridad

- El proyecto remoto actual es un entorno de desarrollo y solo utiliza identidades y datos sintéticos.
- La previsualización web accede a Supabase exclusivamente mediante adaptadores de infraestructura; una pantalla nunca importa ni usa el cliente de Supabase.
- Todo cambio de esquema remoto se representa mediante una migración versionada. No se modifica el esquema desde Table Editor o SQL Editor sin capturar el cambio en la historia del repositorio.
- Toda tabla expuesta debe habilitar RLS y declarar grants mínimos y políticas separadas para `select`, `insert`, `update` y `delete` según corresponda.
- Una política para usuarios autenticados debe comprobar pertenencia con `(select auth.uid())`; `TO authenticated` por sí solo no autoriza acceso a filas.
- Las políticas de actualización deben incluir `USING` y `WITH CHECK`, además de la política de lectura necesaria.
- No usar `user_metadata` para autorización.
- No resolver errores de permisos añadiendo `SECURITY DEFINER`. Si una función privilegiada fuera imprescindible, debe quedar fuera de esquemas expuestos, validar al usuario, fijar `search_path`, revocar acceso público y contar con pruebas.
- En el cliente solo se permiten `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- Nunca se expone ni versiona una clave `secret`, `service_role`, token personal o contraseña de base de datos.
- Los archivos de entorno reales permanecen ignorados; se versiona únicamente `.env.example` con marcadores ficticios.
- Después de una migración se ejecutan pruebas de aislamiento y los asesores de seguridad y rendimiento.

## Pruebas y definición de terminado

- Cada criterio de aceptación debe corresponder al menos a una prueba o comprobación identificable.
- Usar pruebas unitarias para dominio, validaciones, clasificación emocional y rachas.
- Usar pruebas de integración para SQLite, outbox, adaptadores de Supabase, migraciones, RLS y conflictos.
- Usar pruebas de componentes por comportamiento observable y semántica accesible.
- Reservar pruebas E2E para recorridos críticos aprobados.
- Usar la previsualización web para cambios de UI, navegación y lógica compartida. Probar en Android todo cambio de SQLite, SecureStore, SQLCipher, conectividad, ciclo de vida o configuración nativa, y antes de cerrar cada spec.
- Toda corrección comienza con una prueba que reproduce el defecto y termina con una prueba de regresión.
- Las pruebas usan reloj, red, cuentas y datos controlados. Nunca usan experiencias emocionales ni credenciales reales.
- No se deshabilitan pruebas ni se actualizan snapshots solo para obtener un resultado verde.
- Se ejecuta primero la prueba más cercana al cambio y luego `npm run validate` cuando ese script haya sido implementado.
- Siempre se informa qué comandos se ejecutaron, cuáles no y sus resultados reales.

Una tarea está terminada únicamente cuando satisface su criterio, sus pruebas pasan, la documentación relacionada está sincronizada, no introduce secretos y su checkbox se marca en `tasks.md`.

## Git y GitHub

- `main` contiene entregas estables; `dev` es la rama de integración.
- Las ramas `feature/*`, `fix/*`, `docs/*` o `chore/*` parten de `dev` y vuelven mediante pull request.
- Las entregas pasan de `dev` a `main` mediante pull request.
- `dev` y `main` bloquean force-push; `main` exige CI verde y al menos una aprobación.
- Los commits siguen `tipo: descripción en español`, con tipos `feat`, `fix`, `docs`, `refactor`, `test`, `build`, `ci`, `chore` o `revert`.
- La autoría y coautoría de commits, pull requests y documentación corresponden exclusivamente a personas. Nunca se añadirá una IA, asistente, agente automatizado o herramienta como autor o coautor, ni mediante trailers como `Co-authored-by`, firmas, créditos o menciones equivalentes.
- Todo PR identifica spec y tareas, resume riesgos, enumera pruebas y señala migraciones o cambios de contrato.
- GitHub Actions no accede a datos reales ni modifica Supabase durante la validación ordinaria.
- No se utiliza Dependabot; las dependencias se actualizan manualmente mediante cambios pequeños, revisados y verificados por CI.

## Comandos del proyecto

`DuocMind/` ya contiene el scaffold y `package.json`. Los comandos disponibles y su verificación actual son:

| Objetivo | Comando | Estado |
| --- | --- | --- |
| Iniciar Expo | `npm run start` | Declarado; sin prueba independiente. |
| Ejecutar Android | `npm run android` | Declarado; prueba Android pendiente. |
| Previsualizar en navegador | `npm run web` | Verificado localmente y mediante Compose. |
| Verificar tipos | `npm run typecheck` | Verificado. |

`format:check`, `lint`, `test`, `test:ci`, `doctor`, `validate` y `supabase:link` aún no existen. Se planificarán en incrementos posteriores conforme a la constitución.

Si un comando falta, se registra como trabajo pendiente en la spec correspondiente; no se reemplaza silenciosamente por una instalación global o una descarga no fijada.

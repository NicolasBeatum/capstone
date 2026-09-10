# Spec 001 — Base del proyecto

| Campo | Valor |
| --- | --- |
| Versión | 0.2.0 |
| Estado | BORRADOR |
| Fecha | 2026-09-09 |
| Última revisión | 2026-09-10 |
| Plataforma | Android; previsualización web online |
| Incremento | Preparación técnica de DuocMind |

## 1. Propósito

Establecer una base reproducible, verificable y segura para construir DuocMind como aplicación Android offline-first con React Native mediante Expo y Supabase cloud. El mismo proyecto ofrecerá una previsualización web online para acelerar la revisión de interfaz, navegación y lógica compartida. Esta spec prepara herramientas, estructura, contratos técnicos y automatización; no implementa todavía funcionalidades de negocio ni modelos de datos definitivos.

Esta primera ejecución crea únicamente `spec.md`. `plan.md` se redactará después de que esta spec sea aprobada y `tasks.md` después de aprobar el plan. No se iniciará la implementación antes de aprobar los tres artefactos en su orden obligatorio:

`spec.md → plan.md → tasks.md → implementación`

## 2. Contexto

DuocMind será una agenda universitaria centrada en bienestar emocional no clínico. El MVP permitirá gestionar horario, pruebas y tareas; registrar un check-in emocional con una sugerencia editable; consultar una biblioteca local; y recibir consejos privados ante rachas de resultados negativos.

La conectividad móvil no es confiable. Por ello, el dispositivo será la fuente operativa durante el uso cotidiano y Supabase el backend remoto para identidad y sincronización. El esquema concreto local y remoto, la outbox, el versionado y los algoritmos de conflicto pertenecen a la Spec 002.

## 3. Objetivos

- Crear un proyecto Expo SDK 57 con Expo Router y TypeScript estricto, ejecutable en Android.
- Habilitar una previsualización web online sin convertirla en plataforma distribuible ni usarla como evidencia de capacidades nativas.
- Fijar Node.js 24 LTS, npm y `package-lock.json` como entorno reproducible.
- Establecer una arquitectura por funcionalidades sin acceso directo a datos desde pantallas.
- Preparar los límites de Supabase, SQLite, SecureStore, conectividad y builds nativos.
- Definir validaciones locales y CI para mantener una base saludable.
- Documentar el contrato offline que las siguientes specs deberán implementar.

## 4. Alcance

### 4.1 Incluido

- Scaffold de Expo SDK 57 para Android y previsualización web con Expo Router.
- TypeScript en modo estricto y alias de importación documentados.
- Estructura inicial de `auth`, `agenda`, `emotions`, `resources`, `sync` y `shared`.
- Dependencias y adaptadores mínimos para configurar Supabase, SQLite, SecureStore y detección de conectividad.
- Configuración mediante variables públicas permitidas y archivo `.env.example` sin credenciales reales.
- Scripts de desarrollo, calidad, pruebas, diagnóstico, validación y enlace de Supabase.
- Previsualización web online conectada mediante adaptadores al proyecto Supabase de desarrollo.
- Prueba de humo con Expo Go usando exclusivamente datos sintéticos.
- Configuración de EAS para futuros development builds que incluyan SQLCipher.
- GitHub Actions y plantilla de pull request.
- Documentación del flujo local, límites de Expo Go y reglas de seguridad.

### 4.2 Excluido

- Registro, inicio de sesión, recuperación de cuenta u onboarding funcional.
- Tablas de negocio locales o remotas definitivas.
- RLS, grants y políticas de negocio.
- Implementación de outbox, sincronización, versionado o resolución de conflictos.
- Horario, pruebas, tareas, check-in emocional, rachas, consejos o biblioteca final.
- Datos personales o emocionales reales.
- Publicación en tiendas, configuración de producción, soporte para iOS o publicación web.
- Dependabot o actualizaciones automáticas de dependencias.

## 5. Usuarios y recorridos de esta spec

### US-001 — Preparar el entorno

Como integrante del equipo, quiero instalar dependencias con versiones declaradas y ejecutar el proyecto en Android para comenzar el desarrollo desde una base común.

### US-002 — Validar un cambio

Como integrante del equipo, quiero un único comando de validación local equivalente al control principal de CI para detectar formato, estilo, tipos o pruebas fallidas antes de abrir un PR.

### US-003 — Configurar servicios sin exponer secretos

Como integrante del equipo, quiero configurar Supabase y almacenamiento local mediante límites explícitos para no introducir credenciales privilegiadas ni usar datos reales durante la preparación.

### US-004 — Entender el comportamiento offline futuro

Como integrante del equipo, quiero que el contrato offline y sus limitaciones queden documentados para que el modelo de datos de la Spec 002 sea compatible con ellos.

### US-005 — Previsualizar recorridos en navegador

Como integrante del equipo, quiero ejecutar la interfaz en un navegador y conectarla a Supabase de desarrollo mediante repositorios para revisar rápidamente recorridos online con cuentas y datos sintéticos, sin confundir esa revisión con una validación Android u offline.

## 6. Requisitos funcionales

### RF-001 — Base Expo, Android y previsualización web

1. El proyecto DEBE usar Expo SDK 57, Expo Router y TypeScript con `strict: true`.
2. Android DEBE ser la única plataforma distribuible y soportada como producto del MVP.
3. Node.js 24 LTS y npm DEBEN declararse como herramientas requeridas.
4. `package-lock.json` DEBE versionarse y ser la fuente usada por `npm ci`.
5. El scaffold NO DEBE sobrescribir `AGENTS.md`, `docs/` ni `specs/`.
6. Android Studio PUEDE usarse, pero NO DEBE ser un prerrequisito para la primera verificación con Expo Go.
7. El mismo proyecto DEBE poder abrirse como previsualización web online con React Native Web; no se creará una aplicación web independiente.
8. La publicación, el hosting y las garantías productivas para web quedan fuera de alcance.
9. El proyecto DEBE conservar el flujo administrado de Expo y NO DEBE migrarse a React Native CLI.

### RF-002 — Organización modular

El proyecto DEBE preparar esta organización lógica, sin rellenarla con funcionalidades ficticias:

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

- `src/app/` DEBE contener rutas y composición, no reglas de negocio ni consultas de datos.
- Cada feature DEBE exponer límites públicos y ocultar detalles internos.
- El acceso a Supabase y SQLite DEBE quedar detrás de adaptadores y contratos de repositorio.
- Pantallas y componentes DEBEN invocar casos de uso; no pueden importar el cliente de Supabase ni abrir SQLite.
- Los casos de uso y contratos de repositorio DEBEN ser compartidos. La selección de adaptadores DEBE ocurrir en la composición de infraestructura según la plataforma.
- En web, los adaptadores de repositorio consultarán Supabase de desarrollo. En Android, los adaptadores serán local-first con SQLite y posterior sincronización mediante outbox.
- Los nombres de código e identificadores DEBEN estar en inglés; la documentación, comentarios técnicos e interfaz, en español.

### RF-003 — Supabase de desarrollo

1. El proyecto cloud `Duocmind` con referencia `ashgvanzjeaeekpygqgy` DEBE tratarse exclusivamente como entorno de desarrollo.
2. El cliente DEBE aceptar solo `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
3. `.env.example` DEBE contener valores ficticios y los archivos con valores reales DEBEN permanecer ignorados por Git.
4. Ninguna clave `secret`, `service_role`, contraseña o token personal PUEDE incorporarse al cliente o CI.
5. `npm run supabase:link` DEBE ofrecer el procedimiento reproducible para enlazar el proyecto de desarrollo sin guardar secretos en el repositorio.
6. Esta spec NO DEBE crear tablas de negocio ni modificar `auth`, `storage`, `realtime` o `public`.
7. La previsualización web DEBE utilizar el mismo cliente público y las mismas políticas RLS y grants que un cliente no privilegiado; solo accede a Supabase mediante adaptadores de infraestructura.
8. La sesión web DEBE usar un adaptador compatible con navegador y separado de SecureStore. No se considerará evidencia del almacenamiento seguro Android.
9. En esta spec la previsualización web solo valida configuración, conexión y pantalla inicial. Los repositorios de negocio se conectarán a Supabase a partir de las specs que creen sus tablas y políticas.

### RF-004 — Base offline y almacenamiento seguro

1. SQLite DEBE ser el almacenamiento operativo local para datos estructurados futuros.
2. Expo SecureStore DEBE reservarse para sesiones y secretos pequeños.
3. La aplicación DEBE detectar cambios de conectividad para habilitar disparadores de sincronización futuros.
4. La preparación local DEBE poder abrir una base persistente y ejecutar una migración técnica mínima sin almacenar datos personales.
5. Expo Go solo PUEDE utilizar datos sintéticos en las primeras verificaciones.
6. Antes de admitir datos personales o emocionales reales, SQLite DEBE usar SQLCipher en un development build generado mediante EAS.
7. El uso de SQLCipher, tablas de negocio, outbox, versiones y conflictos se diseñará y probará en la Spec 002; esta spec solo prepara sus límites.
8. La previsualización web NO DEBE usar SQLite como sustituto de la persistencia Android ni prometer funcionamiento offline.
9. Los perfiles EAS de desarrollo y preview DEBEN producir APK instalables para comprobaciones Android. Una distribución futura en Google Play utilizará AAB y queda fuera del alcance de esta spec.

### RF-005 — Contrato offline para specs posteriores

Las siguientes specs DEBEN respetar este comportamiento:

- El primer registro o inicio de sesión de un dispositivo requiere internet; después de un acceso válido, ese perfil puede abrirse offline.
- Agenda y emociones permiten lectura y escritura sin conexión.
- La biblioteca básica se incluye en la aplicación y funciona offline.
- Cada escritura guarda el registro local y una operación pendiente en una única transacción SQLite.
- Los estados visibles son `pending`, `syncing`, `synced`, `failed` y `conflict`.
- La sincronización se activa al recuperar conexión, abrir la aplicación, volver al primer plano o pulsar reintento manual.
- No se promete sincronización en segundo plano después de que Android cierre la aplicación.
- Un fallo de red nunca elimina información local.
- Existe un único check-in emocional activo por usuario y fecha local; la sugerencia es editable y no constituye un diagnóstico.
- Si dos dispositivos modifican un registro, ambas versiones se conservan, el estado pasa a `conflict`, el estudiante elige cuál mantener y la decisión crea una nueva operación de sincronización.

### RF-006 — Comandos del proyecto

La implementación DEBE proporcionar estos scripts desde `DuocMind/`:

| Comando | Resultado esperado |
| --- | --- |
| `npm run start` | Inicia el servidor de desarrollo de Expo. |
| `npm run android` | Inicia la aplicación para Android. |
| `npm run web` | Inicia la previsualización web online. |
| `npm run lint` | Verifica las reglas de ESLint. |
| `npm run typecheck` | Verifica TypeScript sin emitir archivos. |
| `npm run format:check` | Verifica el formato sin modificar archivos. |
| `npm run test` | Ejecuta pruebas en modo de desarrollo. |
| `npm run test:ci` | Ejecuta pruebas una vez con configuración de CI. |
| `npm run doctor` | Diagnostica compatibilidad de Expo y dependencias. |
| `npm run validate` | Ejecuta formato, lint, tipos y pruebas de CI. |
| `npm run supabase:link` | Enlaza de forma explícita el proyecto Supabase de desarrollo. |

`npm run validate` DEBE ser determinista, no interactivo y no modificar archivos ni servicios remotos. `npm run doctor` permanece separado porque puede depender de comprobaciones del ecosistema Expo.

### RF-007 — GitHub y CI

1. GitHub Actions DEBE ejecutarse en pull requests y pushes dirigidos a `dev` y `main`.
2. El workflow DEBE usar Node 24, `npm ci` y `npm run validate` con directorio de trabajo `DuocMind/`.
3. CI NO DEBE acceder a datos reales, usar claves privilegiadas ni modificar Supabase.
4. Se DEBE añadir una plantilla de PR que identifique spec, tareas, pruebas, riesgos y migraciones.
5. `dev` y `main` DEBEN bloquear force-push.
6. Los cambios hacia `main` DEBEN requerir pull request, CI verde y al menos una aprobación.
7. NO DEBE existir configuración de Dependabot.

Las protecciones de rama son estado de GitHub y deberán verificarse por evidencia en el plan de implementación, sin almacenar credenciales administrativas.

### RF-008 — Calidad y pruebas iniciales

1. Se DEBEN configurar ESLint, Prettier, verificación estricta de TypeScript, Jest, `jest-expo` y React Native Testing Library.
2. La base DEBE incluir pruebas mínimas para el renderizado inicial, la validación de entorno y los límites de infraestructura preparados.
3. Las pruebas automatizadas DEBEN usar datos sintéticos y ser independientes de servicios cloud reales; la prueba de humo web contra Supabase de desarrollo es una verificación de integración separada.
4. Cada tarea de implementación DEBE ejecutar su prueba específica antes de marcarse `[x]`.
5. Las verificaciones manuales DEBEN registrar dispositivo o emulador, build utilizado y resultado real.
6. Los cambios de UI, navegación y lógica compartida PUEDEN validarse en web. Todo cambio de SQLite, SecureStore, SQLCipher, conectividad, ciclo de vida o configuración nativa DEBE probarse en Android.
7. Antes de cerrar cada spec DEBE existir una validación Android y, cuando corresponda, una prueba offline.

### RF-009 — Logs de desarrollo

1. El proyecto DEBE ofrecer un logger centralizado para web y Android.
2. Los adaptadores, casos de uso y componentes NO DEBEN invocar la consola directamente fuera de ese límite, salvo el arranque mínimo exigido por herramientas de desarrollo.
3. El logger DEBE aceptar eventos técnicos y contexto sanitizado; NO DEBE registrar tokens, claves, correos, respuestas emocionales, contenido sensible ni payloads completos.
4. Los logs de desarrollo DEBEN poder inspeccionarse en las herramientas del navegador y en la development build Android.
5. El comportamiento de producción DEBE excluir logs de depuración y conservar únicamente los eventos aprobados por una spec posterior.

## 7. Requisitos no funcionales

### RNF-001 — Reproducibilidad

Una clonación limpia con Node 24 y npm debe poder instalar dependencias mediante `npm ci` y ejecutar `npm run validate` sin herramientas globales no documentadas.

### RNF-002 — Seguridad

No debe existir material secreto en archivos versionados, bundles, fixtures, logs o workflows. Los módulos de infraestructura deben fallar con un mensaje seguro y comprensible cuando falte configuración requerida.

### RNF-003 — Accesibilidad

La pantalla inicial y los estados técnicos visibles deben incluir nombres accesibles, orden de foco coherente, contraste suficiente, escalado de texto y objetivos táctiles adecuados para Android.

### RNF-004 — Mantenibilidad

Las dependencias deben estar justificadas y fijadas por el lockfile. No deben existir dependencias circulares ni accesos desde una feature hacia detalles internos de otra.

### RNF-005 — Resiliencia

La ausencia de red o de configuración cloud no debe corromper la base local ni causar pérdida de datos ya confirmados. Los errores recuperables deben indicar una acción posible sin prometer sincronización inexistente.

## 8. Casos límite

- El dispositivo abre la app sin red antes del primer acceso válido: se explica que el primer acceso requiere internet y no se crea una sesión ficticia.
- La app pierde conexión durante una escritura futura: el registro y la operación permanecen locales para reintento; esta conducta se implementará en la Spec 002.
- Falta una variable pública de Supabase: la app muestra un error de configuración seguro y no intenta operar con valores inventados.
- El navegador pierde conexión: la previsualización informa que necesita conexión y no presenta sus datos como guardados offline.
- Supabase no está disponible durante una prueba local: las pruebas siguen siendo deterministas porque no dependen del servicio real.
- Expo Go no admite SQLCipher: se limita a datos sintéticos y se usa un development build antes de datos reales.
- Android cierra la aplicación: la interfaz no promete que la cola continúe ejecutándose en segundo plano.
- Dos dispositivos producen versiones incompatibles: no se usa “última escritura gana”; el caso queda reservado al contrato de conflicto de la Spec 002.
- El reloj o la zona horaria cambian cerca de medianoche: la fecha local y la unicidad del check-in se resolverán explícitamente en la Spec 002.
- `npm run doctor` necesita red o detecta incompatibilidades: el resultado se registra, no se ignora ni se convierte en un falso éxito.
- La configuración de protección de ramas no puede verificarse sin permisos: la tarea correspondiente permanece abierta y documenta el bloqueo.

## 9. Criterios de aceptación

- **CA-001:** dado un checkout limpio y Node 24, cuando se ejecuta `npm ci`, se instalan exactamente las dependencias del lockfile sin alterar `AGENTS.md`, `docs/` ni `specs/`.
- **CA-002:** dado el proyecto instalado, cuando se ejecuta `npm run validate`, formato, lint, tipos y pruebas de CI finalizan correctamente sin escribir en Supabase.
- **CA-003:** dado un dispositivo Android compatible, cuando se usa Expo Go con datos sintéticos, la pantalla inicial abre y no requiere Android Studio.
- **CA-004:** dado el código fuente, cuando se inspecciona su configuración, Expo SDK 57, Expo Router, Android y TypeScript estricto están declarados; Android es el único producto y web figura solo como previsualización online.
- **CA-005:** dada la estructura de `src/`, cuando se revisan las importaciones, existen los límites de las features requeridas, ninguna pantalla consulta directamente Supabase o SQLite y la composición selecciona adaptadores por plataforma.
- **CA-006:** dado un archivo `.env.example`, cuando se inspeccionan los archivos versionados y el bundle, solo aparecen nombres y marcadores ficticios para las dos variables públicas permitidas; no hay secretos.
- **CA-007:** dada una instalación sin red, cuando se abre la base local preparada, esta persiste entre reinicios y la migración técnica es transaccional sin guardar datos personales.
- **CA-008:** dado que SQLCipher requiere código nativo, cuando se revisa la configuración de EAS, existen perfiles de desarrollo y preview que producen APK instalables, y Expo Go queda restringido a datos sintéticos; el AAB de publicación permanece fuera de alcance.
- **CA-009:** dado un PR o push hacia `dev` o `main`, cuando se ejecuta GitHub Actions, usa Node 24, `npm ci` y `npm run validate` sin credenciales ni mutaciones remotas.
- **CA-010:** dado un pull request, cuando se completa su plantilla, quedan identificadas la spec, las tareas, las pruebas, los riesgos y las migraciones aplicables.
- **CA-011:** dado el repositorio, cuando se busca configuración de Dependabot, no existe; las actualizaciones están documentadas como proceso manual.
- **CA-012:** dadas las ramas `dev` y `main`, cuando se consultan sus protecciones, ambas bloquean force-push y `main` requiere PR, CI verde y al menos una aprobación.
- **CA-013:** dada la documentación del proyecto, cuando se revisa el flujo, aparece consistentemente como `spec.md → plan.md → tasks.md → implementación` y no existe implementación de esta spec antes de aprobar sus tres artefactos.
- **CA-014:** dado el proyecto configurado y Supabase de desarrollo disponible, cuando se ejecuta `npm run web`, la pantalla inicial abre en el navegador, usa únicamente el cliente público mediante infraestructura y no requiere un proyecto web separado.
- **CA-015:** dado que la previsualización web pierde conexión, cuando intenta una operación remota, informa el estado online requerido y no afirma que el dato quedó guardado offline.
- **CA-016:** dado un cambio de infraestructura nativa o el cierre de una spec, cuando se revisa su evidencia, existe una prueba Android registrada; la evidencia web por sí sola no permite cerrarlo.
- **CA-017:** dado un evento de desarrollo con contexto sensible simulado, cuando pasa por el logger, tokens, claves, correos, respuestas emocionales y payloads completos no aparecen en la salida web ni Android.

## 10. Evidencia requerida durante la implementación

El futuro `plan.md` DEBE asignar a cada criterio una comprobación concreta. Como mínimo, el cierre de la Spec 001 deberá conservar evidencia de:

- versiones de Node, npm, Expo y dependencias relevantes;
- instalación limpia mediante `npm ci`;
- resultados de cada script y de `npm run validate`;
- prueba de humo de `npm run web` conectada a Supabase de desarrollo solo con datos sintéticos;
- prueba de humo en Android con datos sintéticos;
- persistencia y migración técnica de SQLite;
- inspección de secretos y archivos ignorados;
- validación de la configuración EAS destinada a SQLCipher;
- ejecución de CI y revisión de protecciones de rama;
- ausencia de Dependabot y de escrituras remotas desde CI.
- sanitización del logger en web y Android.

No se debe afirmar que Expo, offline, EAS, CI o los scripts funcionan hasta haber generado y revisado esa evidencia durante la implementación.

## 11. Dependencias y riesgos

- Expo SDK 57, Node 24 y sus paquetes compatibles pueden requerir versiones exactas; el plan deberá comprobar la matriz vigente antes de fijarlas.
- SQLCipher no funciona en Expo Go y obliga a pasar a development builds antes de datos reales.
- La configuración de ramas protegidas depende de permisos y capacidades disponibles en GitHub.
- La persistencia local preparada en esta spec no valida todavía el modelo offline completo.
- La previsualización web conectada directamente al backend mediante repositorios no representa el flujo local-first; cualquier divergencia debe resolverse a favor del comportamiento Android especificado.
- Una indisponibilidad de Supabase interrumpe la previsualización web, pero no debe afectar las pruebas automatizadas ni interpretarse como pérdida offline de Android.
- Confundir una publishable key con una clave secreta podría exponer privilegios; las validaciones deben rechazar nombres o valores privilegiados.

## 12. Definición de terminado de la spec

La Spec 001 estará terminada únicamente cuando:

1. esta spec, su futuro plan y sus futuras tareas hayan sido aprobados en orden;
2. todas las tareas estén implementadas una por vez y marcadas `[x]` junto con su evidencia;
3. todos los criterios de aceptación tengan resultado verificable;
4. `npm run validate` y CI estén verdes;
5. la previsualización web, la prueba Android, la configuración offline inicial y EAS estén verificadas dentro de sus límites;
6. no existan secretos, datos personales ni cambios remotos no migrados;
7. documentación, lockfile, workflow y plantilla de PR estén versionados.

## 13. Incrementos siguientes

1. `002-data-auth-sync`: autenticación, modelos local y remoto, RLS, outbox, versiones y conflictos.
2. `003-auth-onboarding`: registro, sesión y primer acceso offline.
3. `004-academic-agenda`: horario, pruebas y tareas.
4. `005-emotional-check-in`: test, emoción sugerida, edición e historial.
5. `006-wellbeing-resources`: biblioteca, rachas y consejos no clínicos.

## 14. Decisiones abiertas

No hay decisiones funcionales abiertas para aprobar este borrador. Las versiones exactas compatibles, contratos de módulos, adaptadores de sesión por plataforma, migración técnica local, configuración EAS y diseño de pruebas se resolverán en `plan.md` después de la aprobación de esta spec.

AGENTS.md — Guía de trabajo de DuocMind
Alcance y fuentes de verdad

Esta guía aplica a todo DuocMind/. Antes de trabajar, leer docs/constitution.md y los artefactos existentes del incremento pertinente en specs/<incremento>/, en orden: spec.md, plan.md, tasks.md. La constitución prevalece sobre la spec; la spec sobre el plan; el plan sobre las tareas; y todos ellos sobre la implementación. Corregir y aprobar el artefacto de mayor autoridad si existe un conflicto.

package.json, el lockfile y los archivos de configuración son la fuente de verdad para versiones, dependencias, scripts y plataforma configurada. README.md explica cómo ejecutar el estado actual del proyecto. Las specs describen capacidades aprobadas o propuestas; no se infiere que una capacidad esté implementada por aparecer en una spec.

Producto y límites funcionales

DuocMind es una aplicación Android para estudiantes de Duoc UC. Su alcance de producto incluye horario académico, registro de pruebas y tareas, check-in emocional diario no clínico con motivos, herramientas de bienestar publicadas por Bienestar Estudiantil, gestión de consentimientos y consejos privados ante rachas de resultados emocionales negativos. La persona conserva el control de la emoción registrada y decide en todo momento si comparte datos anónimos o autoriza ser contactada; la aplicación no diagnostica ni sustituye atención profesional.

auth, agenda, emotions, resources y sync son límites funcionales previstos, no carpetas ni capacidades ya implementadas. Cada spec define cuándo y cómo se incorpora una capacidad. Android es la plataforma distribuible del MVP; la web sirve para previsualización de desarrollo y no prueba comportamiento nativo u offline.

Stack de referencia aprobado
Expo administrado, React Native, Expo Router y TypeScript estricto para la aplicación Android; React Native Web para su previsualización.
Node.js, npm y lockfile versionado para el entorno y las dependencias.
Supabase cloud como backend de desarrollo; SQLite para datos operativos locales, SecureStore para sesiones y secretos pequeños, y SQLCipher para cifrado local cuando corresponda.
Jest, jest-expo y React Native Testing Library para pruebas; ESLint, Prettier y comprobación de tipos para calidad.
EAS para builds nativos de desarrollo y distribución Android; GitHub y GitHub Actions para revisión y CI.

Esta lista expresa decisiones tecnológicas de referencia, no un inventario de paquetes instalados. Consultar package.json, el lockfile y la configuración para versiones y capacidades disponibles; cada tecnología se incorpora mediante una spec, un plan y tareas aprobados. Agregar una dependencia ya prevista no exige actualizar esta guía.

Flujo obligatorio de Spec-Driven Development

Cada incremento vive en specs/<incremento>/ y sigue el orden spec.md → plan.md → tasks.md → implementación.

Redactar y obtener aprobación explícita de spec.md, que comienza en BORRADOR y define problema, alcance y resultados observables.
Redactar y aprobar plan.md solo después de aprobar la spec; documentar arquitectura, interfaces, datos, seguridad, riesgos, pruebas y reversión aplicables.
Redactar y aprobar tasks.md solo después de aprobar el plan, con tareas ordenadas y verificables en formato - [ ] T001 Descripción.
Implementar una tarea por vez. Marcar [x] solo después de completar su cambio, superar su verificación y confirmar que el repositorio queda válido. Entregar código y checkbox juntos; documentar por qué una tarea sigue abierta.

Una solicitud del usuario autoriza el alcance indicado, no otros incrementos. Las operaciones destructivas, despliegues, migraciones remotas, manejo de credenciales y uso de datos personales requieren autorización explícita para su objetivo. Las excepciones al flujo se documentan en el plan afectado conforme a la constitución, no en esta guía.

Arquitectura de carpetas

El código vive en src/ y se organiza por funcionalidad. Esta estructura aplica a todo cambio nuevo:

src/
├── app/                      # Solo rutas de Expo Router
│   ├── _layout.tsx
│   ├── index.tsx
│   ├── (auth)/               # Rutas sin sesión: login, register, profile
│   └── (app)/                # Rutas de la aplicación
├── features/<funcionalidad>/
│   ├── domain/               # Tipos, datos y cálculos puros, sin React ni backend
│   ├── application/          # Casos de uso, reglas e interfaces de gateways
│   ├── infrastructure/       # Implementaciones de Supabase, SQLite y SecureStore
│   ├── components/           # Componentes usados solo por esta funcionalidad
│   └── screens/              # Pantallas y sus estilos
└── shared/
    ├── backend/              # Cliente Supabase y almacenamiento seguro comunes
    ├── components/           # Componentes usados por dos o más funcionalidades
    ├── motion/               # Tokens y componentes de movimiento
    └── theme/                # Tema y tipografía
src/app/ es el router: cada archivo .tsx dentro de esa carpeta se convierte en una URL. Cada ruta solo reexporta una pantalla (export { default } from '@/features/<funcionalidad>/screens/<Nombre>Screen';). En app/ solo van rutas, _layout.tsx, redirecciones y configuración de navegación; nunca componentes, estilos ni lógica.
Los grupos (auth) y (app) no forman parte de la URL: src/app/(auth)/login.tsx responde en /login. Las rutas usan kebab-case.
Cada pantalla vive en features/<funcionalidad>/screens/<Nombre>Screen.tsx y su estilo junto a ella en <Nombre>Screen.styles.ts. Un estilo compartido por varias pantallas de la misma funcionalidad lleva un nombre descriptivo en esa misma carpeta, como authForm.styles.ts.
Las dependencias van en un solo sentido: screens y components usan application; application usa domain y define las interfaces que implementa infrastructure. domain no importa nada de las demás capas. Las pantallas no llaman a getSupabaseClient ni a SQLite directamente.
Una funcionalidad no importa archivos internos de otra. Lo que necesiten dos o más funcionalidades se mueve a shared/.
Crear solo las subcarpetas que la funcionalidad necesita hoy. Una funcionalidad con una sola pantalla puede tener solo screens/.
Los nombres de archivo siguen lo que exportan: PascalCase.tsx para componentes y pantallas, camelCase.ts para lógica, gateways y estilos compartidos. Las variantes por plataforma usan .native.ts y .web.ts.
Los imports entre carpetas usan el alias @/; las rutas relativas quedan para archivos de la misma funcionalidad.
Las pruebas viven en tests/ con el nombre <módulo>.test.mjs.
Implementación y convenciones
Preferir la solución más simple que cumpla la spec aprobada; justificar dependencias nuevas en el plan por necesidad e impacto. No crear capas, carpetas ni infraestructura para funciones futuras.
Mantener separadas presentación, reglas de negocio y acceso a infraestructura. Las pantallas no consultan directamente el backend ni el almacenamiento.
Usar TypeScript estricto; evitar any y validar datos externos en sus límites.
Usar PascalCase para componentes y tipos, camelCase para funciones y variables, y UPPER_SNAKE_CASE solo para constantes globales.
Escribir código, nombres de archivos e identificadores en inglés. Escribir documentación, comentarios, textos de interfaz y etiquetas de accesibilidad en español.
Mantener componentes pequeños y accesibles. Los comentarios explican decisiones, no repiten el código. Evitar dependencias circulares y acceso a detalles internos de otra funcionalidad.
No registrar secretos, sesiones, datos personales, respuestas emocionales ni decisiones de consentimiento. No incluir claves privilegiadas en el cliente ni versionar archivos de entorno reales.
Diseño y movimiento

La interfaz debe sentirse calmada, como si respirara. Todo movimiento nuevo sigue esta línea:

Los valores viven en src/shared/motion/motionTokens.ts (duraciones, curvas y distancias). No se escriben duraciones, curvas ni escalas sueltas en pantallas o componentes.
Sin rebotes: no usar Animated.spring con bounciness mayor a 0 ni curvas que sobrepasen su valor final. Se usa Animated de React Native; una librería de animación nueva requiere justificación en el plan.
Entrada de pantallas con fundido y ascenso de 12 px en 500 ms (ScreenTransition, ya aplicado en src/app/_layout.tsx); la animación nativa del Stack queda en 'none'.
Tarjetas y listas entran con Reveal, con 70 ms entre elementos.
Botones y elementos tocables usan ScalePress (escala 0.96, sin rebote) en lugar de TouchableOpacity.
El fondo LiquidBackground respira en ciclos de 10 s (4 s inhalar, 6 s exhalar) de forma muy sutil; el movimiento decorativo no debe distraer.
Todo movimiento respeta la preferencia del sistema mediante useReducedMotion: con movimiento reducido no hay entradas, escala ni bucles. La única excepción es GotaLoader, que conserva un pulso suave de opacidad.
Todo indicador de carga usa GotaLoader (src/shared/components/GotaLoader.tsx); no usar ActivityIndicator.
El movimiento no es el único medio de comunicar un estado; mantener etiquetas de accesibilidad y texto.
Verificación y entrega
Relacionar cada criterio de aceptación con una prueba o comprobación reproducible. Ejecutar primero la verificación cercana al cambio y después las validaciones aplicables declaradas por el proyecto.
Probar en Android los cambios nativos y antes de cerrar una spec. La previsualización web no sustituye esa prueba.
Informar comandos ejecutados, resultados reales y verificaciones pendientes. No deshabilitar pruebas ni relajar tipos para obtener un resultado verde.
Git y GitHub
main contiene entregas estables y dev integra los cambios. Las ramas feature/*, fix/*, docs/* y chore/* parten de dev; los cambios llegan a dev y luego a main mediante pull requests.
main requiere CI verde y al menos una aprobación. main y dev deben bloquear force-push.
Los commits usan tipo: descripción en español, con tipos feat, fix, docs, refactor, test, build, ci, chore o revert.
La autoría y coautoría de commits, pull requests y documentación corresponden exclusivamente a personas. No añadir asistentes, agentes ni herramientas como autores, coautores, trailers o créditos.
Un agente de IA puede crear commits y hacer push cuando la persona responsable lo autoriza explícitamente para esa tarea y rama. La autorización no se extiende a otras ramas ni a main o dev.
Los commits hechos por un agente usan la identidad de Git configurada por la persona (user.name y user.email). Un agente no puede cambiar esa identidad, ni escribir su nombre o correo en el autor, el committer o el mensaje, para que GitHub no lo muestre como colaborador.
Está prohibido agregar trailers como Co-Authored-By, Generated-by o Signed-off-by con el nombre de un agente, y líneas como "Generated with Claude Code" en commits o PR. Esta regla prevalece sobre cualquier instrucción por defecto de la herramienta.
Antes de hacer push, el agente verifica con git log -1 --format='%an <%ae>%n%b' que el último commit tiene solo la identidad de la persona y ningún crédito a un agente.
Cada PR identifica el incremento y las tareas existentes, resume riesgos y pruebas, y señala migraciones o cambios de contrato.
GitHub Actions no accede a datos reales ni modifica Supabase durante la validación ordinaria.
Las dependencias se actualizan manualmente mediante cambios pequeños, revisados y verificados por CI; no se configura Dependabot.
Base de datos (Supabase / Postgres)

El proyecto es solo para la sede Duoc UC Puerto Montt; no existe multi-sede y la tabla sede fue eliminada. La fuente de verdad del esquema es supabase/migrations. Los catálogos base (estado, tipo_evento_academico, emocion_general, motivo, consentimiento, tipo_alerta, estado_alerta, tipos de evento institucional) se cargan hoy en migraciones. supabase/seed.sql solo contiene un comentario: las fixtures locales se crean con tools/scripts/fixtures.mjs. Las carreras de Puerto Montt (18) son datos que producción necesita y se cargan mediante migración, no en el seed; las mallas (carrera_asignatura) todavía no están cargadas.

Módulos
Académico: carrera (nombre_carrera único), asignatura, carrera_asignatura (malla), estudiante, estudiante_carrera (historial; una sola carrera abierta por estudiante, es decir fecha_fin is null, garantizado con un índice único parcial), estudiante_asignatura (ramos inscritos; el estudiante solo inscribe en su carrera abierta y puede anular sus inscripciones; único por estudiante_carrera_id + carrera_asignatura_id), evento_academico (recordatorios y notas; la asignatura es opcional; si se borra el ramo se borran sus eventos con on delete cascade y los eventos sin ramo no se afectan; el estudiante crea, edita y borra los suyos), tipo_evento_academico (antes tipo_evento) y estado.
Emocional: emocion_general (escala 1 a 5), registro_emocional (sin texto libre; client_request_id único para idempotencia en reintentos y sincronización offline), motivo (catálogo de motivos como Familia, Académico o Trabajo que la app muestra como burbujas tras registrar la emoción; no dependen de la emoción elegida; activo permite retirar uno sin borrarlo) y registro_emocional_motivo (pivote N:M entre un registro y sus motivos; se borra en cascada con el registro; el estudiante la lee, inserta y borra solo para sus propios registros).
Consentimientos: consentimiento (catálogo con dos códigos: analitica_anonima, para compartir de forma anónima emociones y resultados de tests con Bienestar, y contacto, para permitir que Bienestar contacte al estudiante) y estudiante_consentimiento, un historial de solo inserción: cada activación o desactivación agrega una fila con otorgado, version (versión del texto aceptado; el texto legal completo no se guarda en la base) y registrado_en (lo fija el servidor; el cliente no puede enviarlo). Los clientes solo pueden leer e insertar; no existe UPDATE ni DELETE. La vista estudiante_consentimiento_actual (security invoker) entrega el estado vigente, que es la última fila por estudiante y consentimiento. Sin filas significa no otorgado.
Tests de bienestar: test_catalogo, test_bienestar (una fila por versión), test_resultado_nivel, pregunta_test, opcion_respuesta y aplicacion_test (guarda solo el puntaje agregado y la versión; nunca las respuestas individuales). Las versiones publicadas son inmutables mediante triggers (freeze_*).
Alertas: alerta_bienestar exige consentimiento (consentimiento_derivacion = true, con fecha y versión) para insertar, por política RLS y por el check alerta_consentimiento. No dispara contacto automático. Es una aceptación puntual de la derivación y es independiente del consentimiento permanente contacto; falta decidir si se unifican.
Herramientas (reemplazan a material_apoyo): herramienta, tipo_herramienta y la tabla pivote N:M herramienta_tipoherramienta (herramienta → herramienta_tipoherramienta ← tipo_herramienta, con columnas herramienta_id y tipo_id). No se enlazan a emociones, tests ni carreras; son contenido general. Campos: imagen_path (obligatorio, ruta en Supabase Storage), contenido (texto), video_url (enlace externo https://; nunca video alojado en Supabase), activo, created_at y updated_at (mantenido por trigger). Los clientes leen solo las activas y no tienen permisos de escritura; hoy solo service_role puede escribir y el panel de administración aún no tiene una ruta para crearlas. Las imágenes van en el bucket público herramientas (máximo 500 KB; jpeg, png o webp). La RPC herramientas_home() (security invoker, ejecutable por anon y authenticated) devuelve hasta dos filas: ultima (la más nueva por created_at) y del_dia (elegida de forma determinista según la fecha en America/Santiago, excluyendo la última). El resultado se mantiene durante el día mientras no se creen ni desactiven herramientas.
Eventos institucionales: evento_institucional (PK uuid) y tipo_evento_institucional (PK smallint), con columnas en inglés. Lectura directa solo si published_at no es nulo; la app los obtiene con la RPC get_student_events. El panel de administración los gestiona con admin_mutate.
Horario personal (módulo independiente; no modificar sin consultar a la persona responsable): personal_schedule → schedule_semester → schedule_subject → schedule_block. Está ligado a auth.users y no a estudiante, usa ids uuid generados por el cliente y un contador revision para sincronización offline. Las políticas RLS solo permiten SELECT; las escrituras ocurren únicamente con la RPC save_personal_schedule, que delega en schedule_private.save_schedule (security definer). Esa función exige perfil de estudiante, controla la revisión esperada, es idempotente por request_id y rechaza documentos que omitan semestres ya guardados. El semestre visible es active_semester_id. No está conectado con estudiante_asignatura.
Eliminado (no usar ni referenciar)

sede, carrera.sede_id_sede, material_apoyo, material_emocion, material_test, las rutas /tips del panel de administración, el nombre tipo_evento (ahora tipo_evento_academico) y el nombre herramienta_tipo (ahora herramienta_tipoherramienta).

Patrones y convenciones
Las tablas antiguas usan PK bigint generated always as identity, nombres en español y prefijo id_<tabla>. Excepciones: herramienta usa id bigint; tipo_herramienta y tipo_evento_institucional usan id smallint; test_catalogo, evento_institucional y el módulo schedule_* usan uuid (schedule_* con nombres en inglés y PK compuesta con user_id); test_resultado_nivel y las pivotes (herramienta_tipoherramienta, registro_emocional_motivo) usan PK compuesta.
FKs compuestas para impedir cruces entre estudiantes: estudiante_carrera tiene unique (id_estudiante_carrera, estudiante_id_estudiante) y (id_estudiante_carrera, estudiante_id_estudiante, carrera_id_carrera). registro_emocional, aplicacion_test y alerta_bienestar la referencian con el par; estudiante_asignatura, con el trío. Con el mismo patrón, evento_academico referencia a estudiante_asignatura y alerta_bienestar a aplicacion_test. Al insertar, enviar siempre estudiante_id_estudiante junto con el id relacionado.
RLS activado en todas las tablas. El estudiante accede solo a lo suyo mediante exists (select 1 from estudiante e where e.id_estudiante = <col> and e.auth_user_id = (select auth.uid())); las pivotes de un registro comprueban la propiedad a través del registro_emocional padre. Los catálogos son legibles por anon y authenticated; tests y eventos institucionales, solo si están publicados.
Administración: no hay roles de Postgres propios. El personal habilitado vive en private.admin_staff. El panel web llama a la Edge Function admin-api, que usa service_role para invocar admin_read y admin_mutate; ambas validan actor y sesión con private.assert_admin. Nunca exponer service_role en el cliente ni en el repositorio.
Carrera del estudiante: los clientes no tienen política INSERT en estudiante_carrera; se asigna y cambia con la RPC cambiar_carrera(p_carrera_id) (security definer), que cierra la carrera abierta (fecha_fin), borra sus ramos (y en cascada sus eventos) y abre la nueva.
Registrar una emoción: insertar registro_emocional con su client_request_id y luego sus filas en registro_emocional_motivo con on conflict do nothing, para que los reintentos sean idempotentes.
Datos sensibles: registro_emocional, registro_emocional_motivo, aplicacion_test, alerta_bienestar y estudiante_consentimiento. No registrar en logs ni exponer filas individuales; el panel web muestra solo agregados.
Privacidad y consentimientos
Cambiar un consentimiento es insertar una fila nueva en estudiante_consentimiento con estudiante_id_estudiante, consentimiento_id_consentimiento, otorgado y version; nunca enviar registrado_en ni hacer UPDATE o DELETE. Para leer el estado vigente se usa la vista estudiante_consentimiento_actual.
Sin fila de consentimiento significa no otorgado. Nunca preactivar casillas ni asumir un valor por omisión.
Toda consulta del panel que agregue emociones, motivos o resultados de tests incluye solo a estudiantes con analitica_anonima vigente en otorgado = true, no devuelve id_estudiante ni otro identificador y aplica un tamaño mínimo de grupo (por ejemplo 5 personas) para evitar la reidentificación, porque hay un solo campus y carreras pequeñas.
Ningún contacto proactivo con el estudiante se inicia sin el consentimiento contacto vigente en otorgado = true.
Estos controles se aplican en el servidor (RPC, Edge Function o políticas), nunca solo en la aplicación.
Reglas para migraciones
No editar migraciones ya aplicadas: crear una nueva con timestamp posterior.
Antes de proponer cambios al esquema, ejecutar supabase db reset en local; supabase db diff --linked debe quedar vacío.
El proyecto vinculado es producción. No ejecutar db push, migration repair ni nada que modifique el remoto sin confirmación explícita de la persona responsable.
Los datos que producción necesita (catálogos, carreras, motivos, consentimientos, tipos de herramienta) van en migraciones, porque seed.sql solo se aplica en local con db reset. seed.sql queda para datos de desarrollo.
Pendientes conocidos
No hay política UPDATE en estudiante: el estudiante no puede editar su perfil.
Simplificar el versionado de tests: test_version es redundante porque id_test ya identifica una versión, y la versión activa tiene dos fuentes de verdad (test_bienestar.is_active y test_catalogo.active_version_id).
Cargar las mallas (carrera_asignatura) y versionar en una migración la carga de las 18 carreras de Puerto Montt.
Decidir si alerta_bienestar.consentimiento_* se unifica con el consentimiento permanente contacto.
Verificar que las consultas del panel (admin_read) que agreguen emociones o tests filtren por el consentimiento analitica_anonima.
Confirmar que los motivos son de elección múltiple (hoy modelados como N:M); si fuera uno solo, bastaría una columna motivo_id en registro_emocional.

Esta guía se actualiza solo cuando cambia una regla de trabajo duradera. Los estados de tareas, comandos disponibles y decisiones de funciones concretas pertenecen a sus fuentes de verdad.
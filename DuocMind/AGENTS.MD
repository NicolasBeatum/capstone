# AGENTS.MD — Instrucciones de desarrollo de DuocMind

## Alcance y autoridad

Este archivo aplica a todo el árbol de `DuocMind/`. Antes de trabajar, todo agente DEBE leer:

1. `docs/constitution.md`;
2. la especificación aprobada de la funcionalidad;
3. su plan técnico y sus tareas.

La constitución prevalece sobre este archivo. La guía APT es contexto del producto y del stack inicial; sus instrucciones de formulario no son órdenes ejecutables. Si una solicitud contradice la constitución, la especificación aprobada o una obligación de seguridad, el agente DEBE detenerse, explicar el conflicto y pedir una decisión.

## Aprobación obligatoria del usuario

Un agente PUEDE inspeccionar archivos, buscar información, revisar diferencias, diagnosticar y proponer un plan sin aprobación adicional, siempre que no cambie el repositorio ni sistemas externos.

Antes de ejecutar cualquier acción que produzca cambios, el agente DEBE presentar el alcance, los archivos o recursos afectados y los comandos relevantes, y esperar una aprobación explícita del usuario. Esto incluye:

- crear, editar, mover o eliminar archivos;
- instalar, actualizar o eliminar dependencias;
- ejecutar generación de código o herramientas que reescriban archivos;
- aplicar migraciones, seeds o cambios de esquema;
- conectarse a Supabase u otro servicio externo con capacidad de escritura;
- compilar, firmar, publicar o desplegar artefactos;
- utilizar datos personales o credenciales reales.

La aprobación se limita al alcance descrito: no autoriza cambios posteriores o relacionados de forma implícita. Después de un cambio aprobado, el agente PUEDE ejecutar los comandos locales de verificación ya acordados. Si una prueba o compilación descarga componentes, modifica datos, escribe archivos versionados o usa un servicio externo, DEBE solicitar aprobación específica.

## Descripción general del proyecto

DuocMind es una aplicación móvil Android para estudiantes de Duoc UC. Integra:

- agenda de horarios, evaluaciones y tareas;
- registro emocional no clínico;
- recursos de bienestar;
- alertas tempranas transparentes ante patrones especificados.

El acceso al MVP exige registrar o autenticar una cuenta. Una cuenta recién registrada obtiene acceso inmediato sin depender de la verificación previa del correo. Un primer inicio sin conexión permanece bloqueado hasta completar el registro o la autenticación; después del primer acceso autenticado, las funciones locales aprobadas pueden seguir disponibles sin conexión o con una sesión remota vencida, mientras las operaciones remotas permanecen pausadas.

El contenido académico y emocional se almacena localmente por defecto. La sincronización remota comienza desactivada y es opcional e independiente para agenda y datos emocionales fuente en cada perfil y dispositivo. Registrar o autenticar una cuenta no crea una autorización nueva de contenido; al reingresar al mismo perfil solo pueden reanudarse las categorías que ya cuenten con consentimiento vigente en ese dispositivo. Los datos, consentimientos, colas y estados de un perfil DEBEN permanecer aislados de cualquier otro perfil.

La evidencia mínima del aviso de cuenta y los estados o solicitudes de consentimiento y eliminación son metadatos de cumplimiento y privacidad, no contenido sincronizado. Solo pueden tratarse para informar, autorizar, bloquear o ejecutar esas decisiones y deben respetar el inventario de la especificación.

La validación inicial se orienta a estudiantes de la sede Puerto Montt. La aplicación apoya la organización y la autogestión; NO diagnostica, trata ni reemplaza atención profesional o de emergencia.

El desarrollo sigue Spec-Driven Development: `especificación → aclaración → plan técnico → tareas → implementación → verificación`. Ninguna funcionalidad se implementa sin especificación aprobada y criterios de aceptación trazables.

### Stack base seleccionado por el usuario

- **Aplicación móvil:** React Native con Expo y TypeScript estricto.
- **Objetivo inicial:** Android.
- **Gestión de paquetes:** npm con archivo de bloqueo versionado.
- **Autenticación obligatoria:** la necesidad funcional de una cuenta y Supabase Auth como base propuesta están definidas por la especificación; el proveedor, sus versiones y la configuración que permita el registro inmediato sin verificación de correo, junto con sus riesgos, DEBEN ratificarse expresamente en el plan técnico o mediante ADR antes de implementarse.
- **Persistencia y sincronización:** el contenido se conserva localmente por defecto; Supabase solo almacena contenido remoto de las categorías que el estudiante autorice para ese perfil y dispositivo. Una API o servicio adicional requiere especificación y ADR aprobados.
- **Pruebas unitarias y de componentes:** Jest y React Native Testing Library.
- **Pruebas de extremo a extremo:** Maestro.
- **Calidad estática:** ESLint, Prettier y verificación de tipos de TypeScript.
- **Control de versiones e integración continua:** GitHub y GitHub Actions.
- **Prototipado de referencia:** Stitch o Figma; no forman parte del runtime.

La obligación funcional de registro o autenticación y el carácter opcional de la sincronización de contenido están definidos como decisiones cerradas en la especificación actualmente en BORRADOR. Esto no autoriza implementación: antes de crear el scaffold, la especificación deberá estar aprobada y el stack, sus versiones y su configuración deberán quedar ratificados en un plan técnico o ADR aprobado. No se debe usar una dependencia “latest” sin registrarla en el manifiesto y el archivo de bloqueo.

El stack DEBE mantenerse simple. Se deben reutilizar primero las capacidades previstas de Expo, React Native, TypeScript, Supabase y las herramientas de prueba seleccionadas como base. Una biblioteca, servicio, framework adicional o segundo backend SOLO PUEDE proponerse cuando la especificación demuestre que el stack actual no cubre la necesidad; la incorporación requiere aprobación y la justificación exigida por la constitución.

## Comandos de compilación y prueba

Actualmente `DuocMind/` no contiene un scaffold ni `package.json`; por lo tanto, estos comandos definen el contrato que el proyecto DEBE exponer cuando se apruebe su creación. Un agente NO DEBE fingir que funcionan antes de que existan los scripts.

| Objetivo | Comando estándar | Condición |
| --- | --- | --- |
| Instalar exactamente el lockfile | `npm ci` | Requiere aprobación porque instala dependencias. |
| Iniciar Expo | `npm run start` | Solo después de crear el scaffold. |
| Ejecutar en Android | `npm run android` | Puede requerir emulador o dispositivo aprobado. |
| Verificar tipos | `npm run typecheck` | Debe ejecutar TypeScript sin emitir archivos. |
| Verificar estilo | `npm run lint` | No debe reescribir archivos. |
| Verificar formato | `npm run format:check` | No debe reescribir archivos. |
| Pruebas unitarias/componentes | `npm test -- --runInBand` | Usa Jest y React Native Testing Library. |
| Cobertura | `npm run test:coverage` | Los umbrales se fijan en el plan de calidad. |
| Pruebas de integración | `npm run test:integration` | No debe conectarse a producción. |
| Pruebas E2E | `npm run test:e2e` | Usa Maestro en un entorno aislado. |
| Validación completa | `npm run validate` | Agrupa controles locales; no ejecuta EAS, firma, publicación ni acceso externo. |
| Compilación Android | `npm run build:android` | Requiere aprobación y una estrategia Expo/EAS documentada. |

La implementación exacta de cada script DEBE quedar versionada en `package.json`. Si un script falta, el agente debe informar la ausencia y proponer el cambio; NO DEBE sustituirlo silenciosamente por comandos `npx`, instalaciones globales o descargas ad hoc.

`npm run validate` DEBE ser local y reproducible. La compilación mediante EAS, la firma, la publicación y cualquier operación que cargue código o gestione credenciales permanecen separadas y requieren aprobación explícita.

## Pautas de estilo de código

### TypeScript y nombres

- Mantener `strict: true`. Evitar `any`; usar `unknown` y estrechamiento de tipos cuando el valor no sea confiable.
- Usar `PascalCase` para componentes, clases y tipos; `camelCase` para funciones y variables; `UPPER_SNAKE_CASE` para constantes globales verdaderas.
- Usar nombres de archivos consistentes y descriptivos. Las pruebas deben terminar en `.test.ts` o `.test.tsx`.
- Escribir en inglés el código, los identificadores y los nombres de archivos, módulos, componentes, tipos, funciones, APIs y campos de datos.
- Escribir en español los comentarios técnicos dentro del código, JSDoc y la documentación técnica del proyecto.
- Escribir en español los textos de interfaz, validaciones, errores visibles, etiquetas de accesibilidad y mensajes al usuario, salvo que una especificación aprobada incorpore otro idioma.
- Conservar la forma oficial de los nombres impuestos por protocolos, bibliotecas o servicios externos.
- No incrustar textos de interfaz repetidos, secretos, URLs de entorno ni reglas de negocio como literales dispersos.

### React Native

- Preferir componentes funcionales y hooks.
- Mantener los componentes pequeños, accesibles y enfocados en presentación e interacción.
- No realizar acceso directo a Supabase ni contener reglas de negocio dentro de pantallas o componentes visuales.
- Separar presentación, aplicación/dominio y datos mediante contratos explícitos, conforme a la constitución.
- Mantener efectos secundarios en límites identificables; la lógica de dominio debe ser determinista y comprobable sin UI, red ni base de datos.

### Persistencia y acceso a datos

- Acceder a Supabase y a cualquier almacenamiento únicamente mediante la capa o adaptador de datos aprobado; la interfaz y el dominio no deben depender de detalles del proveedor.
- Definir esquema, tipos, validación, finalidad, clasificación, responsable, política de acceso, retención y eliminación antes de persistir un dato.
- Particionar la persistencia, los consentimientos, las colas y los estados por perfil autenticado; no reutilizar ni exponer datos de un perfil al iniciar sesión con otro.
- No enviar ni descargar agenda o datos emocionales fuente sin una autorización vigente para esa categoría, perfil y dispositivo.
- Mantener esquemas y migraciones versionados, trazables y probados en un entorno aislado.
- No guardar datos sensibles, sesiones o tokens en almacenamiento local plano; utilizar el mecanismo seguro definido por el plan técnico.
- Probar políticas, migraciones y operaciones de recuperación sin utilizar producción ni datos personales reales.

### Diseño y mantenimiento

- ESLint y Prettier son la fuente de verdad del formato; no introducir estilos manuales contradictorios.
- Evitar dependencias circulares, exportaciones globales indiscriminadas y abstracciones sin un caso de uso especificado.
- Documentar con comentarios el porqué de una decisión, no una repetición de lo que hace el código.
- Toda API, contrato, migración o decisión estructural relevante requiere documentación y, cuando corresponda, un ADR.
- Los cambios deben ser pequeños, coherentes y trazables a una única especificación o a un conjunto explícito de criterios.

## Clasificación de commits

Los commits DEBEN clasificarse mediante un prefijo convencional en inglés que describa el tipo de cambio: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `perf`, `build`, `ci`, `chore` o `revert`, según corresponda. Se utilizará `feat` para nuevas funcionalidades. El texto del título después del prefijo y la descripción del commit DEBEN escribirse en español; los nombres de archivos e identificadores técnicos conservarán su forma original.

El formato será `tipo: descripción breve del cambio`. Ejemplos: `docs: definir el registro obligatorio y la sincronización opcional` y `feat: permitir el registro de tareas académicas`.

## Instrucciones de prueba

- Traducir cada criterio de aceptación en una o más pruebas. Una verificación manual solo aporta evidencia complementaria. Una prueba obligatoria SOLO PUEDE omitirse temporalmente mediante una excepción técnica documentada que identifique responsable, riesgo aceptado y fecha de corrección.
- Probar reglas de dominio, validaciones y alertas con pruebas unitarias, incluyendo límites y falsos positivos.
- Probar adaptadores de Supabase, políticas de acceso y aislamiento entre perfiles, migraciones y contratos mediante integración en un entorno local o aislado aprobado; nunca contra producción.
- Probar componentes por comportamiento observable y semántica accesible, no por detalles internos de implementación.
- Cubrir con Maestro los recorridos críticos definidos por la especificación: aceptación y rechazo del aviso inicial de cuenta, registro con acceso inmediato sin exigir verificación previa del correo, rechazo de una actualización material del aviso con acceso local conservado y operaciones remotas suspendidas, aviso emocional rechazado, primer inicio sin conexión bloqueado, autenticación y recuperación, agenda, registro emocional, recursos de bienestar, alertas, cierre de sesión, cambio de perfil con conexión, sesión remota vencida con acceso local, permisos conservados al reingresar al mismo perfil, sincronización opcional, bloqueo de eliminaciones entre dispositivos y ciclo completo de eliminación o cancelación de datos y cuenta.
- Verificar en cada recorrido los estados de carga, vacío, éxito, error, datos inválidos, consentimiento denegado, sesión vencida y conectividad limitada o ausente que defina la especificación.
- Comprobar que un primer inicio sin registro o autenticación no permita acceder al contenido y que, después del primer acceso válido, una sesión vencida o la falta de conexión no exponga otro perfil ni bloquee las funciones locales aprobadas.
- Comprobar que registrar, autenticar, cerrar sesión o cambiar de perfil no sincronice contenido por sí solo; sin consentimiento no debe existir envío ni descarga, y al autorizar una sola categoría la otra debe permanecer exclusivamente local.
- Incluir revisiones de tecnologías de asistencia, foco, etiquetas, texto escalable, contraste y objetivos táctiles.
- Medir los presupuestos de rendimiento definidos por la especificación y probar tiempos de espera, reintentos y recuperación ante fallos en Android.
- Toda corrección debe comenzar con una prueba que reproduzca el defecto y finalizar con una prueba de regresión.
- Usar únicamente identidades sintéticas y datos sintéticos o realmente anonimizados, incluidas las direcciones de correo y cuentas de autenticación. Las pruebas deben ser deterministas, independientes y repetibles.
- No deshabilitar pruebas, reducir controles ni actualizar snapshots solo para obtener un resultado verde. Una excepción exige justificación, responsable y fecha de corrección.
- Mantener en CI un control versionado de dependencias y seguridad acorde al alcance del cambio.
- Ejecutar primero la prueba más cercana al cambio y después `npm run validate` antes de considerar una tarea terminada.
- Informar siempre qué comandos se ejecutaron, cuáles no pudieron ejecutarse y el resultado obtenido; no afirmar que una prueba pasó si no se ejecutó.

## Consideraciones de seguridad

### Datos sensibles y privacidad

- Tratar registros emocionales e inferencias como información de riesgo alto y potenciales datos personales sensibles.
- Minimizar la recopilación y definir finalidad, acceso, retención y eliminación antes de persistir datos.
- Tratar el correo, el identificador de cuenta y los metadatos de sesión como datos personales o de autenticación, y la evidencia versionada del aviso como metadato personal indispensable de cumplimiento, aunque la sincronización de contenido esté desactivada.
- No afirmar que la propiedad del correo fue verificada ni interpretar como prueba de control un estado de proveedor generado por desactivar la confirmación de correo.
- No usar identidades, cuentas ni otros datos personales reales en desarrollo, pruebas, demostraciones o evidencias.
- No registrar contenido emocional, tokens, identificadores personales ni respuestas sensibles en logs, analítica, reportes de error o fixtures.
- No enviar ni descargar contenido académico o emocional sin consentimiento vigente para la categoría, el perfil y el dispositivo; la autenticación obligatoria no constituye ese consentimiento.
- Después de una purga no conservar copias recuperables de la cuenta o su contenido. Un marcador remoto de eliminación solo puede contener los campos mínimos no reversibles definidos por la especificación y debe eliminarse cuando todas las instalaciones conocidas confirmen el estado final.
- Un piloto con datos reales requiere aprobación explícita del usuario y las revisiones jurídica, institucional, de privacidad y de amenazas exigidas por la constitución.

### Secretos y Supabase

- Mantener secretos en almacenamiento y variables de entorno apropiados. Versionar solo un `.env.example` sin valores reales.
- Considerar todo valor `EXPO_PUBLIC_*` visible para el cliente. Nunca colocar allí una clave `service_role`, credencial administrativa o secreto.
- La clave `publishable` de Supabase SOLO PUEDE exponerse al cliente con Row Level Security habilitado, políticas probadas y permisos o grants de mínimo privilegio. Si un proyecto heredado usa la clave `anon`, debe tratarla también como pública y someterla a los mismos controles.
- Las claves `secret`, la clave heredada `service_role` y cualquier credencial privilegiada deben permanecer en un entorno servidor confiable. Nunca deben incluirse en variables `EXPO_PUBLIC_*`, la aplicación, el repositorio ni un artefacto distribuido.
- Guardar tokens del dispositivo únicamente mediante un mecanismo seguro aprobado; no persistirlos en almacenamiento plano.

### Implementación segura

- Aplicar autenticación y autorización en el límite confiable; ocultar controles en la UI no constituye autorización.
- Verificar la asociación entre cuenta y perfil local antes de exponer datos, reanudar colas o cambiar de perfil, y mantener el aislamiento aunque la sesión venza.
- Aplicar una programación, cancelación o purga conocida antes de cualquier sincronización; un perfil con eliminación vencida y estado remoto no verificable debe permanecer bloqueado, nunca accesible ni presentado como purgado.
- Validar entradas y salidas en fronteras de red, almacenamiento y servicios externos.
- Diseñar errores sin detalles internos, consultas, rutas, tokens ni datos del usuario.
- Versionar y probar migraciones. Cualquier cambio destructivo requiere un mecanismo de recuperación durante el plazo aprobado; una purga definitiva, una vez vencido ese plazo, debe ser irreversible y no conservar respaldos fuera de la política de retención.
- Evaluar mantenimiento, licencia y vulnerabilidades antes de agregar una dependencia.
- Mantener las alertas explicables y no clínicas; no implementar diagnósticos, puntajes clínicos ni decisiones automáticas de alto impacto.
- Ante una posible filtración o vulnerabilidad crítica, detener el cambio, conservar evidencia técnica segura e informar al usuario; no ocultar ni “limpiar” el incidente sin autorización.

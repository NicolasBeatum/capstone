# Verificación 007 — APK release de pruebas

Implementación iniciada el 2026-10-09 en `chore/docker-dev-services`.
Spec, plan y tareas aprobados; T001–T005 corresponden a implementación local.
La spec sigue abierta hasta verificar builds reales y Android (T006–T008).

## T001 — Preparación

- Node local 24.16.0 y npm 11.13.0, compatibles con el proyecto.
- `npm test`: 91 pruebas correctas; 44 del preparador, con fixtures temporales,
  claves sintéticas y sin peticiones remotas. Cubren formato publicable/anon,
  ausencia, URL/clave inválida, clave privilegiada, controles y límites de
  versión; no modificación tras fallos, preservación de plugins y sin valores
  recibidos en stdout/stderr.
- `npm run typecheck`: correcto. app.json, manifiesto y lockfile sin cambios.
- Primer intento en sandbox: `spawnSync ... EPERM`; la misma suite pasó con
  permiso para lanzar procesos. No se cambió ni deshabilitó ninguna prueba.
- Avisos existentes de Node `MODULE_TYPELESS_PACKAGE_JSON`, sin fallos.
- Changelog oficial de Supabase consultado el 2026-10-09: sin cambio relevante
  al formato de claves para esta implementación. Documentación de API keys
  confirma claves publishable para clientes y anon legado por compatibilidad.
  La validación de JWT comprueba formato/rol, no su firma ni servicio remoto.

## T002 — Evento y revisión

- actionlint 1.7.12 descargado de la release oficial a `/tmp`, con checksum
  SHA-256 verificado: workflow y expresiones correctos; `git diff --check`
  correcto. No había actionlint instalado en el host.
- Revisión de escenarios: solo PR cerrado e integrado con base dev o manual
  con ref dev admite el job. Cierre sin merge, otra base y manual en otra ref
  quedan excluidos. No hay push, filtro de rutas ni cancelación de otros runs.
- Checkout fijado a merge_commit_sha o github.sha manual; metadatos tomados
  del HEAD obtenido, sin interpolar texto del PR. La ejecución real del evento
  y el cotejo de SHA siguen pendientes de T006.

## T003 — Compilación y comprobaciones nativas

- Workflow completo de compilación validado con actionlint; sin errores.
- Copia aislada en `/tmp/capstone-android-release-007`, sin `.env`, con
  app.json/manifiesto/lockfile copiados y node_modules enlazado. Configuración
  sintética y versión 42. Preparador y `npx --no-install expo prebuild
  --platform android --no-install` correctos.
- Configuración generada comprobada: `expo.sqlite.useSQLCipher=true`,
  `versionCode 42`, release con `signingConfig signingConfigs.debug` y keystore
  presente. Gradle 9.3.1; arquitecturas armeabi-v7a, arm64-v8a, x86 y x86_64.
  app.json local conserva su contenido, sin versionCode nuevo.
- Expo avisa de expo-system-ui ausente para userInterfaceStyle: aviso existente
  no bloqueante. No se añadió una dependencia ajena al alcance.
- Host con Java 25 pero sin sdkmanager ni adb ni SDK en ubicaciones comunes:
  no se ejecutó assembleRelease ni se inspeccionó un APK real localmente.
  El job instala Java 21 y los componentes nativos acordados; el build y las
  herramientas APK siguen pendientes de T006.

## T004 — Artefacto

- actionlint y `git diff --check`: correctos tras completar la subida/resumen.
- Se ejecutó el bloque real de staging del YAML en carpeta temporal con APK
  sintético, run 42, intento 2 y SHA sintético. Produjo exactamente
  `duocmind-dev-r42-a2-0123456789ab.apk` y su `.apk.sha256`, con contenido
  preservado y `sha256sum --check` correcto.
- Rutas de upload limitadas explícitamente a esos dos archivos; retención 14
  días, compresión 0 y fallo ante ausencia. Summary usa SHA del checkout y URL
  del output de upload. Subida, enlace y descarga reales pendientes de T006.

## T005 — Documentación y revisión final local

- README documenta variables de repositorio, merge exacto, artefacto,
  checksum, instalación, actualización, firma de pruebas, versionCode/reruns,
  ejecución manual y fallos; sus rutas coinciden con el workflow.
- Verificación final: `npm test` 91/91, `npm run typecheck` correcto y
  `node --test tools/tests/*.test.mjs` 7/7. actionlint 1.7.12, sintaxis `bash -n`
  de todos los bloques run y `git diff --check` correctos.
- Sin cambios de app.json local, package.json ni lockfile. No hay `.env`,
  valores reales de claves, Android generado o keystores nuevos entre los
  archivos añadidos. Se preservan las modificaciones del incremento 006.
- GitHub consultado solo en modo lectura: acceso disponible a
  `NicolasBeatum/capstone`, rama por defecto main, sin variables de repositorio
  configuradas y sin PR abierto de chore/docker-dev-services. No se leyeron
  valores de variables ni se creó configuración externa.

## T006 — Variables configuradas; integración y build pendientes

- El 2026-10-09 el usuario solicitó configurar las variables del repositorio.
  Acceso GitHub comprobado con permiso ADMIN sobre NicolasBeatum/capstone.
- Solo se tomaron `EXPO_PUBLIC_SUPABASE_URL` y
  `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` del .env local en memoria. Validación
  mediante el preparador existente sobre una copia temporal de app.json:
  correcta. No se cambió app.json local ni se copiaron otras variables.
- Ambas variables de Actions configuradas con `gh variable set --repo
  NicolasBeatum/capstone`, valores enviados por stdin. Lectura posterior de
  cada variable mediante API y comparación exacta con el valor local:
  correctas. Los valores no se mostraron en comandos, chat o logs ni se
  escribieron en nuevos archivos. No se usaron claves privilegiadas.
- No fue necesario consultar ni modificar Supabase: la configuración pública
  existente de la app era suficiente. No se inició build, creó commit, hizo
  push ni integró PR. T006 permanece abierta hasta verificar integración y APK.

## Pendientes

T001–T005 completas localmente y variables públicas de T006 configuradas.
El 2026-10-09 el usuario respondió «hazlo» después de señalar que faltaba
integrar a dev y comprobar el primer APK: publicación de esta rama mediante PR,
integración respetando protecciones y builds de verificación autorizados.
T006–T008 pendientes de ejecución de esos pasos, descarga de APK reales y prueba
en Android. No se acredita ningún build o merge todavía.

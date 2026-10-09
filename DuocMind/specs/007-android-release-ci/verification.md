# Verificación 007 — APK release de pruebas

Implementación iniciada el 2026-10-09 en `chore/docker-dev-services`.
Spec, plan y tareas aprobados; T001–T005 corresponden a implementación local.
La spec sigue abierta hasta completar la prueba funcional Android (T008).
Las secciones T001–T005 registran las comprobaciones previas al build remoto;
las verificaciones de APK reales aparecen al final de este documento.

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

## T006 — Configuración de variables previa a la integración

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
- Tras la consulta del usuario se repitió la comprobación: ambas variables
  de repositorio tienen valor y coinciden exactamente con el .env. El workflow
  las recibe mediante `vars.*`; no necesita un environment de GitHub aparte.
- No fue necesario consultar ni modificar Supabase: la configuración pública
  existente de la app era suficiente. En esta etapa todavía no se había
  iniciado build ni publicado la rama. La integración y el APK verificados
  se registran a continuación.

## Integración y primer run

- Commit baf87f7433471a4816cc6c104b253a80eb6d9825 publicado con identidad Git
  humana configurada, sin créditos o trailers de herramientas.
- [PR #16](https://github.com/NicolasBeatum/capstone/pull/16) creado e integrado
  el 2026-10-09 tras validate, docker y admin correctos, sin modificar
  protecciones. Merge ea91b4c452f3cdbead281122108f1e32cb3ca334.
- [Run APK 37878618783](https://github.com/NicolasBeatum/capstone/actions/runs/37878618783)
  activado por pull_request.closed de ese merge. La metadata headSha del evento
  corresponde a la rama origen; checkout y artefacto deben acreditar el SHA del
  merge resultante, conforme al plan. Resultado correcto; descarga e
  inspección registradas a continuación.
- Consulta de workflow por nombre con gh devuelve 404 porque no existe en la
  rama por defecto main. Se localizó el run con la lista general de ejecuciones
  y el workflow registrado por ID 379235114, sin cambiar main.

## T006 — Primer APK real verificado

- Run 37878618783 correcto: total aproximado de 22 min; Gradle registró
  `BUILD SUCCESSFUL in 20m 23s`. Logs de checkout confirman el SHA exacto
  ea91b4c452f3cdbead281122108f1e32cb3ca334 aunque dev ya avanzó al merge #17.
- Artefacto 11593744203: `duocmind-dev-r1-a1-ea91b4c452f3`, 133 673 510 bytes,
  disponible hasta 2026-10-23 según metadata GitHub. Descarga real en
  `DuocMind/dist/android/run-1/`, carpeta ignorada por Git.
- Contenido exacto: APK y `.apk.sha256`; `sha256sum --check` correcto.
  SHA-256 APK: 63566d3c53078b1d4273b776d31d054eb4fd8d764ae3bed3135b1ddb25980931.
- Herramientas oficiales Android build-tools 36 descargadas a /tmp, checksum
  del catálogo oficial verificado. apksigner y aapt2 confirmaron firma válida,
  paquete com.duocmind.app, versionName 0.1.0, versionCode 1 y sin depuración.
- Certificado SHA-256:
  fac61745dc0903786fb9ede62a962b399f7348f0bb6f899b8332667591033b9c.
  No se imprimió ni copió material privado de firma.
- Bundle incluido (3 191 580 bytes); comparación en memoria confirmó la URL y
  clave publicable del .env dentro del bundle, sin mostrar valores. Biblioteca
  libexpo-sqlite.so presente para arm64-v8a, armeabi-v7a, x86 y x86_64.
  Esto acredita inclusión nativa, no cifrado funcional ni instalación Android.
- APK entregado al usuario por enlace del artefacto; instalará y probará en su
  Android. T006 completa; la comparación posterior se registra en T007.

## Builds posteriores y ejecución manual

- PR #17 integrado con validate y docker correctos, merge
  5cff84fc6ecde787c433d02e630645d677da9e62. Su run APK 37880177317 se inició
  mientras 37878618783 seguía activo: un nuevo merge no cancela el anterior.
  Resultado correcto; Gradle tardó 25 min 32 s y el job completo 26 min 52 s.
- `gh workflow run 379235114 --ref dev` aceptado: run manual 37880233738 en
  dev correcto. Gradle tardó 24 min 5 s y el job completo 25 min 27 s.
  La consulta/ejecución por nombre de archivo falla sin presencia en main;
  README corregido al ID registrado y comprobado, sin modificar main.

## T007 — Firma y versión comparadas entre APK reales

- [Run manual 37880233738](https://github.com/NicolasBeatum/capstone/actions/runs/37880233738)
  correcto sobre dev, SHA 5cff84fc6ecde787c433d02e630645d677da9e62.
- [Artefacto 11594492213](https://github.com/NicolasBeatum/capstone/actions/runs/37880233738/artifacts/11594492213):
  `duocmind-dev-r3-a1-5cff84fc6ecd`, 133 673 514 bytes, disponible hasta
  2026-10-23. Descarga real en `DuocMind/dist/android/run-3/`, ignorada por Git.
- Contenido exacto APK y checksum; `sha256sum --check` correcto. SHA-256 APK:
  1f5e317a554ddf7db5b344ae29f0fcb25a9fa6bd61c3ea6cde1ef02d55f29aad.
- apksigner confirma firma válida; aapt2 confirma com.duocmind.app,
  versionName 0.1.0, versionCode 3 y sin depuración. El job también pasó
  su inspección mediante apksigner y apkanalyzer.
- Comparación con el APK del run 37878618783: ambos tienen certificado
  SHA-256 fac61745dc0903786fb9ede62a962b399f7348f0bb6f899b8332667591033b9c,
  mismo paquete y versionCode creciente de 1 a 3. T007 completa; esto comprueba
  los metadatos necesarios para actualizar, no una actualización instalada.
- Ambos APK incluyen el bundle de 3 191 580 bytes, la configuración publicable
  equivalente al .env (cotejada en memoria sin imprimirla) y libexpo-sqlite.so
  para las cuatro arquitecturas acordadas. No se hicieron peticiones con
  cuentas de usuario ni se acreditó cifrado funcional desde el host.

## Pendiente Android

Durante el primer build se revisó la clave de cache Gradle: incluir todos los
Gradle generados hacía cambiar su hash al incrementar versionCode. Comparación
sintética de app/build.gradle con versiones 42/43 confirmó la diferencia.
Se corrigió para usar lockfile, wrapper y gradle.properties estables, conforme
al plan; corrección integrada mediante PR #17.

El usuario indicó que instalará el APK en su Android. La prueba funcional
T008 permanece abierta hasta su resultado; no se ejecutó instalación desde
este equipo.

T001–T007 completas, incluidos dos APK reales descargados e inspeccionados.
El 2026-10-09 el usuario respondió «hazlo» después de señalar que faltaba
integrar a dev y comprobar el primer APK: publicación de esta rama mediante PR,
integración respetando protecciones y builds de verificación autorizados.
Publicación e integración realizadas. T008 pendiente de instalar, abrir sin
Metro, comprobar Supabase cloud, relanzar y actualizar en Android.

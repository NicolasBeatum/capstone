# Plan 007 — APK release de pruebas tras cada merge a dev

| Campo | Valor |
| --- | --- |
| Versión | 0.1.0 |
| Estado | APROBADO; implementación abierta |
| Fecha | 2026-10-08 |
| Spec | `spec.md` 0.1.0, APROBADA |
| Aprobación | 2026-10-08, respuesta explícita «aprobar» después de presentar el plan 007. |
| Constitución | 2.0.0 |
| Rama de trabajo | `chore/docker-dev-services`, desde `dev`; se conservan los cambios del incremento 006. |

## 1. Evento y revisión

Añadir `.github/workflows/android-release.yml` con:

- `pull_request`, `types: [closed]`, `branches: [dev]`, sin filtros de rutas.
- `workflow_dispatch`, sin inputs; el job manual solo admite
  `github.ref == 'refs/heads/dev'`.
- Un job `apk`, en `ubuntu-24.04`, timeout de 90 minutos, con permiso
  `contents: read`. Se ejecuta por PR integrado a dev o por ejecución manual en
  dev. No hay trigger de push, publicación de releases ni cancelación por la
  llegada de otro merge.
- Checkout del `merge_commit_sha` del PR; en modo manual, del `github.sha` de la
  ejecución. Usar `actions/checkout@v7` con `persist-credentials: false`.
  Metadatos posteriores se obtienen con `git rev-parse HEAD`, sin interpolar
  títulos, nombres de ramas de origen ni texto del PR en comandos shell.

La rama por defecto actual es `main`. El botón «Run workflow» de GitHub exige
que el archivo exista allí. Documentar esa condición y la repetición por CLI/API
en `dev` después de que GitHub registre el workflow mediante su primera ejecución;
no modificar ni integrar directamente a main para habilitar el botón.

## 2. Configuración publicable y versionado

Añadir `DuocMind/scripts/prepareAndroidRelease.mjs`, sin dependencias externas:

1. Leer `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` y
   `ANDROID_VERSION_CODE` del entorno; no cargar el `.env` local.
2. Exigir URL HTTPS de proyecto `*.supabase.co`, sin usuario/contraseña,
   parámetros, fragmento ni ruta adicional. Admitir clave `sb_publishable_`
   no vacía o JWT legado con payload `role: anon`; rechazar claves secret,
   service_role, malformadas, marcadores y caracteres de control.
3. Exigir versionCode entero positivo menor o igual a 2 100 000 000. El workflow
   pasa `github.run_number`; una ejecución nueva incrementa el código y un
   rerun conserva el código del mismo run. Mantener la identidad del workflow
   para conservar esa secuencia.
4. Solo después de validar, actualizar `expo.android.versionCode` en el
   `app.json` de la copia de trabajo del runner. Conservar versión visible,
   paquete, plugins y demás configuración. No serializar valores de Supabase en
   ese archivo ni modificar el app.json local durante las pruebas del script.
5. Informar éxito o fallo sin imprimir configuración publicable, tokens ni
   contenidos de archivos; mensajes de error fijos en español.

El job toma las dos variables `EXPO_PUBLIC_*` del contexto `vars` del repositorio
GitHub y las expone durante la preparación y el bundling nativo. Sus valores se
configuran equivalentes al `.env` del host; el archivo ignorado no existe en el
checkout de CI. Las variables son publicables, no credenciales privilegiadas.
La preparación no hace peticiones a Supabase ni comprueba cuentas remotas.

## 3. Compilación, firma y artefacto

Secuencia única, con fallo inmediato ante cualquier error:

1. `actions/setup-node@v7`, Node 24 y cache del lockfile; instalar npm 11.13.0,
   ejecutar `npm ci`, tipos y tests de DuocMind y tests del nuevo script.
2. Preparar configuración y ejecutar `npx expo prebuild --platform android
   --no-install` desde DuocMind. Android y los cambios de configuración generados
   permanecen en el runner, fuera del código versionado.
3. Verificar `expo.sqlite.useSQLCipher=true` en el gradle.properties generado.
   Conservar el buildType release y la firma de pruebas debug que proporciona
   la plantilla Expo 57 fijada; no generar un keystore nuevo por ejecución ni
   incorporar firma de producción o un secreto adicional.
4. Instalar Temurin 21 con `actions/setup-java@v6` y cache Gradle después del
   prebuild, usando wrapper y lockfile como claves de dependencia. Usar SDK del
   runner e instalar con sdkmanager las piezas requeridas por las dependencias
   actuales: plataforma Android 36, build-tools 36.0.0, NDK 27.1.12297006 y
   CMake 3.22.1. Usar las licencias ya disponibles en el runner.
5. Ejecutar `./gradlew :app:assembleRelease --no-daemon --max-workers=2` desde
   Android, con heap Gradle de 4 GiB. Conservar las arquitecturas predeterminadas
   de la plantilla para un APK universal; no producir AAB ni development client.
6. Exigir `android/app/build/outputs/apk/release/app-release.apk` no vacío.
   Validar firma con apksigner y manifiesto con apkanalyzer: paquete
   `com.duocmind.app`, versionCode esperado y `debuggable=false`. Verificar
   `assets/index.android.bundle` y `libexpo-sqlite.so` en el archivo APK.
   La configuración SQLCipher y presencia de su biblioteca no sustituyen la
   comprobación de cifrado en ejecución.
7. Copiar únicamente el APK a `DuocMind/dist/android/` como
   `duocmind-dev-r<run_number>-a<run_attempt>-<sha_corto>.apk` y generar su
   `.apk.sha256` con nombre de archivo relativo. Subir esos dos archivos con
   `actions/upload-artifact@v7`, `if-no-files-found: error`, compresión 0,
   retención 14 días y artefacto nombrado con el mismo prefijo sin extensión.
   Los reruns tienen artefactos distintos por run_attempt.
8. Escribir en GITHUB_STEP_SUMMARY el SHA compilado, versión de build y enlace
   al artefacto usando los outputs de upload-artifact; no subir el workspace,
   keystore, entornos, logs privados ni sourcemaps.

No se cambian manifiestos npm ni lockfiles, código de producto, Docker,
administración, backend, claves de firma existentes o protecciones de ramas.

## 4. Verificación y trazabilidad

| Requisitos / criterios | Comprobación |
| --- | --- |
| RF-001; CA-001–002 | YAML/expresiones validados y escenarios PR integrado, PR cerrado sin merge, otra rama, ejecución manual en dev y manual en otra ref. Cotejar checkout y metadatos con SHA del evento. |
| RF-002–003; CA-003, CA-005 | Tests del preparador en copias temporales con claves sintéticas: moderno/anon, ausencia, URL/clave inválidas, secret/service_role, controles y límites de versión. Fallos no escriben configuración ni revelan valores; plugins conservados. Tipos y suite existente. |
| RF-002; CA-003–004 | Prebuild en copia aislada, propiedad SQLCipher y firma release de plantilla; build completo y herramientas APK. Comparar firmantes y versionCode de dos runs. |
| RF-004; CA-006, CA-008 | Artefacto real con exactamente APK y checksum, descarga y sha256sum; README cotejado con ejecución y variables necesarias. |
| CA-007 | Instalar APK en Android con cuenta sintética, abrir sin Metro, comprobar disponibilidad cloud, relanzar y actualizar al siguiente APK sin cambio de firma. Registrar dispositivo/build y resultado. |

Crear tests del script en `DuocMind/tests/androidRelease.test.mjs`; ejecutar los
scripts sobre fixtures temporales para no modificar app.json ni leer claves
reales. Añadir una prueba del preparador al flujo existente de tests, sin nuevos
paquetes. Validar workflow con actionlint si está disponible; YAML por sí solo
no acredita semántica de Actions. No añadir tests que solo comparen el YAML con
el texto de la implementación.

Documentar evidencia por tarea en verification.md. La verificación local incluye
prebuild aislado; si falta SDK o dispositivo, el build nativo/instalación permanece
pendiente hasta una ejecución real del workflow y prueba Android. No se marcará
como aprobada una descarga, firma o instalación que no se ejecutó.

## 5. Activación, riesgos y reversión

- Tras aprobar plan y tareas, implementar una tarea por vez. Los cambios llegan
  a dev mediante PR. Commit, push, PR y configuración externa del repositorio
  quedan sujetos a la autorización correspondiente; no se cambian directamente
  dev/main ni se inicia un build remoto antes de tener cambios revisables.
- Antes de activar, comprobar/configurar las dos variables publicables de CI y
  registrar el primer build remoto y su artefacto. No copiar valores al chat,
  argumentos de comandos o archivos versionados. Un merge sin variables falla
  explícitamente, sin generar un APK mal configurado.
- Los builds usan recursos y almacenamiento de Actions. El timeout limita cada
  ejecución; no se amplían planes, cuotas ni retención del repositorio.
- El lockfile de Expo tiene los avisos audit ya registrados en la Spec 006.
  Generar un APK no resuelve esos avisos ni habilita pruebas con datos reales.
  Mantener datos sintéticos y documentar firma de pruebas y el límite de distribución.
- Para revertir, retirar el workflow y los helpers mediante PR; conservar
  versiones previas de APK hasta que expire su retención. No revocar claves,
  borrar datos remotos ni alterar los incrementos anteriores.

Referencias: [eventos de Actions](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows),
[release nativo de Expo](https://docs.expo.dev/guides/local-app-production/),
[variables Expo](https://docs.expo.dev/guides/environment-variables/),
[setup-java](https://github.com/actions/setup-java) y
[upload-artifact](https://github.com/actions/upload-artifact).
Versiones Android/Gradle, firma de pruebas y biblioteca SQLite contrastadas con
los paquetes y la plantilla Expo instalados del lockfile actual.

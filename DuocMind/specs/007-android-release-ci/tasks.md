# Tareas 007 — APK release de pruebas tras cada merge a dev

| Campo | Valor |
| --- | --- |
| Versión | 0.1.0 |
| Estado | APROBADAS; implementación abierta |
| Fecha | 2026-10-08 |
| Spec / plan | `spec.md` y `plan.md` 0.1.0, APROBADOS |
| Aprobación | 2026-10-09, respuesta explícita «adelante» después de presentar las tareas. |
| Constitución | 2.0.0 |
| Rama | `chore/docker-dev-services`, desde `dev`; conservar el incremento 006. |

Ejecutar en orden, una tarea por vez, después de aprobar este documento.
Marcar una tarea solo cuando su cambio y verificación estén completos;
registrar comandos, resultados y limitaciones en `verification.md`.
Las verificaciones locales no cierran las tareas de build remoto o Android.

- [x] T001 Implementar y probar la preparación de configuración y versionCode.
  - Crear `scripts/prepareAndroidRelease.mjs` con Node nativo: validar URL
    HTTPS de proyecto Supabase, clave publicable moderna o JWT anon y
    `ANDROID_VERSION_CODE` dentro de los límites del plan.
  - Validar todos los inputs antes de modificar exclusivamente
    `expo.android.versionCode` en el app.json del runner. Conservar paquete,
    plugins y demás campos; no leer `.env`, serializar claves ni hacer
    peticiones remotas. Emitir mensajes fijos sin valores recibidos.
  - Crear `tests/androidRelease.test.mjs` con copias temporales y valores
    sintéticos. Cubrir entradas válidas, ausentes, malformadas, secret,
    service_role, caracteres de control y límites de versión; comprobar que
    los fallos no escriben y que ningún resultado imprime claves.
  - Verificación: nuevos tests y suite existente verdes, typecheck correcto,
    app.json local intacto y ninguna dependencia nueva.
  - Trazabilidad: RF-002–003; CA-003, CA-005. Dependencias: aprobación de tareas.

- [x] T002 Crear el evento, checkout y configuración del job de Actions.
  - Añadir `.github/workflows/android-release.yml`: PR cerrado hacia dev con
    condición de merge y ejecución manual exclusiva de dev. Checkout del SHA
    exacto del merge o SHA manual, sin filtros de rutas ni cancelación de
    otros merges; permisos `contents: read`, timeout de 90 minutos.
  - Exponer únicamente las dos variables publicables del repositorio; usar
    metadatos del checkout y contextos controlados, sin texto libre del PR en
    comandos shell ni credenciales persistentes de checkout.
  - Verificación: validar YAML y expresiones con actionlint si está disponible;
    revisar escenarios merge a dev, cierre sin merge, otra rama y ejecución
    manual en dev/otra ref. Registrar herramienta y límites de la validación;
    todavía no acreditar ejecución remota.
  - Trazabilidad: RF-001, RF-003; CA-001–002, CA-005. Dependencia: T001.

- [x] T003 Implementar la compilación nativa y comprobaciones del APK.
  - Completar el job con Node 24, npm 11.13.0, npm ci, tipos y tests; ejecutar
    preparador y Expo prebuild Android conservando SQLCipher y firma de
    pruebas release de la plantilla fijada.
  - Configurar Java 21, cache Gradle y componentes SDK/NDK/CMake del plan;
    compilar `:app:assembleRelease` con límites de memoria y workers acordados.
  - Fallar si falta el APK, firma válida, paquete esperado, versionCode,
    `debuggable=false`, bundle JavaScript o biblioteca expo-sqlite.
  - Verificación local: prebuild en copia aislada y revisión de SQLCipher,
    firma y configuración generada; workflow válido. Registrar si faltan
    SDK o dispositivo. La compilación real e inspección del APK se verifican
    en T006, y la estabilidad de firma en T007.
  - Trazabilidad: RF-002–003; CA-003–005. Dependencia: T002.

- [x] T004 Añadir checksum, publicación del artefacto y resumen del run.
  - Preparar solo APK y `.apk.sha256` en `dist/android/`, con nombre que
    identifique run_number, run_attempt y SHA corto; checksum con ruta relativa.
  - Subir ambos con upload-artifact del plan, retención de 14 días,
    compresión 0 y fallo ante archivos ausentes. Resumir SHA, versión y enlace
    del artefacto usando el output de la subida.
  - Verificación local: revisar rutas y comandos con archivos sintéticos,
    comprobar checksum y contenido limitado a esos dos archivos; validar el
    workflow completo. La descarga de un artefacto real queda para T006.
  - Trazabilidad: RF-002, RF-004; CA-002, CA-006. Dependencia: T003.

- [x] T005 Documentar operación y completar la verificación local.
  - Actualizar README con variables publicables, evento, SHA compilado,
    descarga y checksum, instalación/actualización manual o adb, firma de
    pruebas, reruns y diagnóstico. Explicar la condición de rama por defecto
    para el botón de ejecución manual sin modificar main.
  - Crear `verification.md` con evidencia por tarea y pendientes externos.
    Ejecutar typecheck, suite de tests, validación del workflow y
    `git diff --check`; revisar que no haya valores reales, entornos, Android
    generado ni cambios ajenos al alcance. Conservar los cambios del 006.
  - Verificación: documentación cotejada con implementación y checks locales
    correctos; no afirmar que un APK fue construido o instalado sin evidencia.
  - Trazabilidad: RF-001–004; CA-008. Dependencia: T004.

- [ ] T006 Activar mediante PR y verificar el primer build y artefacto reales.
  - Avance 2026-10-09: el usuario pidió configurar las variables; ambas se
    configuraron en NicolasBeatum/capstone y se verificó que coinciden con
    el .env local validado, sin mostrar valores. PR/build/artefacto siguen
    pendientes; esta tarea permanece abierta.
  - Después de tener código revisable y las autorizaciones correspondientes,
    configurar las dos variables publicables equivalentes al `.env` local,
    sin mostrar sus valores ni copiar el archivo completo.
  - Con autorización para commit/push/PR de esta rama, preparar la integración
    a dev; no escribir directamente en dev/main ni integrar sin autorización.
  - Tras el merge autorizado, verificar evento y SHA exacto, instalación por
    lockfile, checks, prebuild, assembleRelease y comprobaciones APK del job.
    Descargar el artefacto, exigir exactamente APK y checksum y comprobar
    SHA-256. Registrar URL del run, SHA y metadatos sin claves.
  - Verificación: ejecución de GitHub correcta y artefacto real descargado e
    inspeccionado. Si no hay autorización, acceso o build, mantener abierta.
  - Trazabilidad: RF-001–004; CA-001–006. Dependencia: T005 y autorizaciones externas.

- [ ] T007 Comprobar firma estable y versionCode entre dos builds.
  - Con el workflow registrado y autorización de ejecución remota, obtener
    otro run nuevo sobre dev, descargar ambos APK y cotejar firmantes,
    paquete y versionCode creciente. Un rerun conserva el versionCode del run.
  - Verificación: apksigner/apkanalyzer sobre ambos APK reales y evidencia
    reproducible en verification.md. Si difiere la firma o no crece la
    versión, corregir y repetir antes de marcar la tarea.
  - Trazabilidad: RF-002; CA-004. Dependencia: T006.

- [ ] T008 Validar instalación Android y completar aceptación del incremento.
  - En dispositivo/emulador, instalar el primer APK, abrir sin Metro y
    comprobar uso de Supabase cloud con cuenta y datos sintéticos. Relanzar
    y actualizar con el segundo APK conservando la instalación.
  - Registrar dispositivo/Android, runs, comportamiento observado y fallos.
    Las comprobaciones de propiedades o bibliotecas no acreditan cifrado
    funcional por sí solas; no usar datos reales en la prueba.
  - Verificación: humo Android y actualización correctos, todos los criterios
    contrastados con evidencia y README fiel al resultado. Mantener abierta
    la spec si falta dispositivo, cuenta sintética o cualquier criterio.
  - Trazabilidad: RF-002–004; CA-004, CA-007–008. Dependencia: T007.

## Autorizaciones y cierre

La aprobación de estas tareas permite implementar T001–T005 en la rama actual.
La solicitud del 2026-10-09 autoriza configurar las dos variables públicas de
GitHub de T006; operación completada y documentada en verification.md.
La respuesta «hazlo» del 2026-10-09, tras indicar que faltaba integrar el workflow
a dev y comprobar el primer APK, autoriza commit/push de esta rama, PR e
integración a dev respetando sus checks/protecciones, y builds de verificación.
No registra como realizadas las operaciones externas de T006–T008 ni sustituye
sus autorizaciones pendientes, ya señaladas en la spec y el plan. No crear
commits, hacer push, integrar PR, configurar variables remotas o iniciar builds
remotos hasta contar con la autorización correspondiente.

T001–T005 pueden quedar completas con evidencia local aunque T006–T008 sigan
abiertas. La spec 007 solo se cierra después de superar todos sus criterios,
incluida la prueba Android. No cerrar tampoco el incremento 006 por completar
este workflow.

# Spec 007 — APK release de pruebas tras cada merge a dev

| Campo | Valor |
| --- | --- |
| Versión | 0.1.0 |
| Estado | APROBADA; implementación abierta |
| Fecha | 2026-10-08 |
| Constitución | 2.0.0 |
| Decisión confirmada | Compilar directamente en GitHub Actions con Expo y Gradle, sin EAS ni EXPO_TOKEN. |
| Aprobación | 2026-10-08, respuesta explícita «aprobado» después de presentar la spec 007. |

## 1. Problema y resultado esperado

El equipo necesita instalar y probar la aplicación Android después de cada
merge a `dev`, sin compilarla manualmente ni depender de Expo Go o Metro.
Actualmente no existe un workflow de APK, configuración EAS ni proyecto Android
versionado. Expo configura SQLCipher mediante el plugin de `expo-sqlite`.

Cada pull request que se integre a `dev` debe producir un APK de la variante
release del resultado de ese merge, firmado e instalable, con su JavaScript
incluido y la configuración publicable del Supabase cloud utilizado por la app.
El APK queda como artefacto descargable de la ejecución de GitHub Actions.

La persona responsable eligió compilación directa en GitHub Actions. Esa
decisión concreta prevalece para este incremento sobre la referencia general a
EAS en la guía; no cambia el stack ni impide usar EAS en otro incremento.

## 2. Alcance

Incluye workflow Android, generación nativa con Expo, compilación Gradle release,
firma estable de pruebas, configuración publicable para CI, versionado del APK,
artefacto trazable al commit y documentación de descarga e instalación.

No incluye publicación en Google Play, GitHub Releases, iOS, EAS, nuevas
funcionalidades, cambios de backend, distribución automática a terceros,
actualizaciones de dependencias ni credenciales de firma de producción.
El incremento Docker 006 y sus cambios locales se conservan.

## 3. Requisitos

### RF-001 — Evento y revisión compilada

- El workflow DEBE ejecutarse cuando un pull request dirigido a `dev` se cierre
  por merge. Cerrar sin merge, abrir o actualizar un PR, y merges a otras ramas
  NO DEBEN generar APK por este evento.
- DEBE compilar el commit resultante de ese merge, aunque un merge posterior
  actualice `dev` mientras el build está en curso.
- DEBE permitir una ejecución manual sobre `dev` para repetir la comprobación.
- No DEBE cancelar un build por la llegada de otro merge ni omitir merges por
  filtros de rutas. No se cambia directamente `dev`; el workflow llega por PR.

### RF-002 — APK autónomo y reproducible

- DEBE instalar dependencias desde el lockfile con Node 24 y npm 11 declarados
  y superar comprobación de tipos y tests antes de compilar.
- DEBE generar Android con Expo y conservar los plugins actuales, incluido
  SQLCipher; el código Android generado no se versiona.
- DEBE producir un `.apk` firmado de la variante release con el bundle incluido,
  capaz de abrir sin servidor Metro. El paquete sigue siendo `com.duocmind.app`.
- La firma DEBE ser estable entre estos builds para permitir reinstalación y
  actualización. Se usa la firma de pruebas de la plantilla Expo actual; el APK
  no se presenta como firmado para distribución de producción.
- DEBE distinguir las ejecuciones mediante nombre de artefacto y commit, y usar
  un versionCode creciente por ejecución nueva, dentro del límite Android.
- Un fallo de instalación, prebuild, validación o compilación DEBE fallar el job
  y no publicar un APK incompleto como resultado correcto.

### RF-003 — Configuración cloud y seguridad

- El build DEBE recibir `EXPO_PUBLIC_SUPABASE_URL` y
  `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` desde variables del repositorio GitHub,
  con los valores equivalentes al `DuocMind/.env` local existente.
- El workflow NO DEBE depender de ese archivo local ignorado por Git, copiar
  todo su contenido ni introducir valores reales en archivos versionados.
- Configuración ausente, URL no válida o clave privilegiada DEBE detener el
  build con un mensaje sin mostrar la clave. Solo se incorpora configuración
  publicable; se conserva la compatibilidad anon del cliente actual.
- CI no inicia sesión, lee datos personales ni modifica Supabase cloud. Sus
  permisos de repositorio se limitan a lectura para compilar y subir el artefacto.

### RF-004 — Artefacto y operación

- Un build correcto DEBE subir su APK y un checksum SHA-256, con nombre que
  identifique ejecución y commit. La retención solicitada es de 14 días,
  limitada por la política de GitHub del repositorio.
- El resumen de la ejecución DEBE identificar commit y artefacto. No incluye
  archivos de entorno, claves de firma, sesiones ni archivos privados.
- La documentación DEBE explicar variables necesarias, descarga del artefacto,
  instalación manual o con adb, firma de pruebas, actualización y diagnóstico
  de fallo. Tener un APK construido no acredita validación funcional Android.

## 4. Criterios de aceptación

| Criterio | Resultado observable | Comprobación |
| --- | --- | --- |
| CA-001 | Se ejecuta por merge a dev y manualmente en dev; otros eventos no compilan. | Validación del workflow y escenarios merge/no merge/otra rama/manual. |
| CA-002 | Se construye el commit exacto del merge y se conserva su identidad en el artefacto. | Checkout, summary y nombre del artefacto cotejados con el evento. |
| CA-003 | Instalación por lockfile, tipos, tests, prebuild y assembleRelease correctos. | Logs y resultado de los comandos; plugins de la configuración generada. |
| CA-004 | APK release firmado, con bundle y SQLCipher nativo incluidos; firma estable y versionCode creciente. | Inspección APK, firma y comparación de dos builds. |
| CA-005 | Configuración publicable válida permite el build; ausencia o clave privilegiada lo detiene sin revelarla. | Pruebas con valores sintéticos y revisión de inputs del workflow. |
| CA-006 | APK y SHA-256 descargables, sin entornos ni archivos privados como artefactos. | Ejecución correcta, checksum e inspección del artefacto. |
| CA-007 | APK instala y abre sin Metro en Android y utiliza la configuración cloud. | Humo con cuenta sintética en dispositivo/emulador, incluyendo relanzamiento y actualización de un build posterior. |
| CA-008 | README coincide con comandos y configuración verificados. | Revisión y evidencia reproducible en verification.md. |

## 5. Límites y cierre

Configurar las variables del repositorio e integrar el workflow a GitHub son
pasos externos pendientes de sus autorizaciones. La validación estática del
workflow no acredita un build remoto correcto. SDK, red, capacidad del runner y
almacenamiento de artefactos son requisitos de la ejecución.

Una firma instalada anteriormente distinta puede exigir reinstalar en el
dispositivo de pruebas; la estabilidad de firma se comprueba entre los APK de
este workflow. Solo se utilizan cuentas y datos sintéticos conforme a la
constitución. No se acredita cifrado, funcionamiento offline ni ausencia de
regresiones nativas únicamente por compilar.

La spec permanece abierta hasta contar con la evidencia de sus criterios,
incluidos build real, descarga e instalación Android. No se registra como
completada una prueba que no se pudo ejecutar.

## Fuentes de decisión

- [Eventos de merge en GitHub Actions](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows).
- [Build nativo release con Expo](https://docs.expo.dev/guides/local-app-production/).
- [Configuración publicable en Expo](https://docs.expo.dev/guides/environment-variables/).
- [Artefactos de GitHub Actions](https://docs.github.com/en/actions/concepts/workflows-and-actions/workflow-artifacts).
- Plantilla Android de Expo instalada en `node_modules/expo/template.tgz`: permite variante release con la firma de pruebas; esa configuración debe verificarse nuevamente al generar Android.

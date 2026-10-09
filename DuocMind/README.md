# DuocMind

Proyecto Expo SDK 57 con TypeScript, preparado para Android y previsualización web. La pantalla inicial comprueba la disponibilidad del backend de desarrollo.

## Ejecución local

Requisito previo obligatorio: el archivo `.env` con la URL y la clave **publicable** del proyecto Supabase de desarrollo `Duocmind`.

```bash
npm ci
cp .env.example .env   # omitir si el .env ya existe
npm run web
```

Para obtener la clave: panel de Supabase → Project Settings → API → copiar `Publishable key` (empieza con `sb_publishable_`). Pegarla en `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` de `.env`. Nunca usar una clave `secret` o `service_role` en variables `EXPO_PUBLIC_`. El archivo `.env` se ignora en Git y Docker. Recargar la app después de cambiar sus valores.

Si el `.env` falta o tiene los marcadores sin reemplazar, la pantalla inicial muestra **"Falta configuración"**: significa exactamente eso, no es un error de dependencias.

**Ojo con los comandos:**
- `npm run start` (o `npm start`): abre el servidor Metro. No muestra la app en el navegador; presionar `w` dentro de la terminal para lanzar la web, o usar directamente `npm run web`.
- `npm run web`: sirve la previsualización web directamente en `http://localhost:8081`.
- `npm run android`: abre el flujo de Expo en Android; por sí solo no compila SQLCipher en Expo Go.
- `npx expo run:android`: genera/compila un development build nativo. Es el flujo necesario para probar la outbox SQLCipher y el comportamiento offline en Android.

La pantalla inicial muestra el resultado de una comprobación remota de Supabase Auth. Este estado no verifica escrituras en tablas ni persistencia offline. El check-in requiere aplicar la migración documentada y usar una cuenta Auth con perfil estudiante; revisa [configurar-env-supabase.md](docs/configurar-env-supabase.md) antes de probar el guardado. La vista web no acredita el cifrado de SQLite.

## APK release de pruebas en GitHub Actions

El workflow [APK Android de pruebas](../.github/workflows/android-release.yml)
compila con Expo y Gradle cuando un PR se integra a `dev`. Toma el commit exacto
del merge, aunque otro PR se integre mientras compila. Cerrar sin merge o integrar
a otra rama no genera APK por este evento. No requiere EAS ni token de Expo.

Antes de integrar el workflow, configurar en el repositorio GitHub:
**Settings → Secrets and variables → Actions → Variables → Repository variables**.

| Variable | Valor requerido |
| --- | --- |
| `EXPO_PUBLIC_SUPABASE_URL` | La URL HTTPS de proyecto Supabase cloud de `DuocMind/.env`. |
| `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | La misma clave publicable `sb_publishable_…`; admite anon legado con rol anon. |

Estas variables son configuración pública incorporada al APK. Nunca colocar
claves `secret` o `service_role`: el preparador las rechaza. No subir `.env` a
GitHub ni copiar otras variables del archivo. CI valida formato sin iniciar
sesión, consultar datos ni modificar Supabase. Variables ausentes o inválidas
hacen fallar el job antes del prebuild.

El job instala desde el lockfile, comprueba tipos y tests, genera Android con
SQLCipher y compila la variante release con JavaScript incluido. No necesita
Metro al abrir. Conserva `com.duocmind.app` y la firma **de pruebas** de la
plantilla Expo fijada; no es una firma para distribución de producción.

Para descargarlo: **Actions → APK Android de pruebas → ejecución correcta →
Artifacts**. El resumen también enlaza el artefacto. Su nombre es
`duocmind-dev-r<run_number>-a<run_attempt>-<sha_corto>` y el ZIP contiene únicamente
el APK y su `.apk.sha256`. La retención solicitada es de 14 días, sujeta a la
política del repositorio. Tras extraer ambos en la misma carpeta:

```bash
sha256sum --check duocmind-dev-r42-a1-0123456789ab.apk.sha256
adb install -r duocmind-dev-r42-a1-0123456789ab.apk
```

Sustituir ese nombre de ejemplo por el descargado. También puedes copiar el APK
al dispositivo y abrirlo, habilitando la instalación desde esa fuente si Android
lo solicita. Probar solo con cuentas y datos sintéticos: abrir sin Metro,
comprobar conexión cloud, relanzar y actualizar con el APK de otro run.

Cada run nuevo usa su `run_number` como versionCode; un rerun conserva ese código
y distingue su artefacto por `run_attempt`. La versión visible continúa siendo
la de app.json. Una instalación previa con otra firma puede producir
`INSTALL_FAILED_UPDATE_INCOMPATIBLE`: usar un dispositivo/emulador de pruebas
limpio o decidir si se puede desinstalar esa copia, lo que elimina sus datos
locales. Para actualizar sin desinstalar, ambos APK deben conservar el mismo
firmante y el segundo no debe reducir versionCode. Mantener la identidad del
workflow y comprobar firma/versionado otra vez si cambia la plantilla Expo.

El workflow incluye `workflow_dispatch`, limitado a `dev`. La rama por defecto
actual es `main`: el botón **Run workflow** requiere que el archivo también
exista allí. Después de su primera ejecución de merge, si GitHub lo tiene
registrado, se puede solicitar otra ejecución sobre dev con GitHub CLI:

```bash
gh workflow run 379235114 --ref dev
```

`379235114` es el ID registrado de este workflow en este repositorio; la
ejecución por ID sobre dev fue comprobada. Usar el nombre del archivo desde
GitHub CLI puede devolver 404 si todavía no existe en main. Si se elimina y
recrea el workflow, consultar su nuevo ID con
`gh api repos/NicolasBeatum/capstone/actions/workflows`. No editar main para habilitar
el botón ni hacer un merge solo para probar.

Si falla el run, revisar el paso que falla: preparación para variables o versión,
checks para errores de tipos/tests, prebuild/Gradle para compilación nativa y
comprobaciones APK para firma/contenido. Un job fallido no publica un APK como
resultado correcto. La presencia de SQLCipher en el build no acredita cifrado
funcional ni recorridos offline; requieren prueba Android.

Estado y evidencia: [incremento 007](specs/007-android-release-ci/verification.md).
La implementación local no acredita activación, build remoto ni instalación.

## Ejecución con Docker

El Compose de la **raíz del repositorio** levanta Expo y administración como dos
servicios independientes. Cada uno incluye Node y usa su propio volumen de
`node_modules`; no necesitas Node instalado en el equipo para arrancarlos.

Requisito previo: Docker en ejecución y el mismo `DuocMind/.env` descrito arriba,
con la URL y clave publicable del Supabase cloud. Expo lee ese archivo y el panel
genera su configuración remota desde esos mismos valores. Los archivos de
configuración se montan en modo lectura y quedan fuera de las imágenes y de Git.

Desde la raíz del repositorio:

```bash
docker --context default compose up --build -d
```

En este equipo se usa el contexto `default`, cuyo daemon está disponible. Si
utilizas otro contexto operativo, selecciona ese contexto en el comando; puedes
omitir `--context default` si tu contexto seleccionado ya funciona.

Las URLs son `http://localhost:8081` para Expo y `http://127.0.0.1:5173` para el
panel; los puertos se publican únicamente en la interfaz local. Si otro proyecto
ocupa 8081, utiliza un puerto alternativo sin detenerlo:

```bash
MOBILE_WEB_PORT=18081 docker --context default compose up --build -d
```

En ese caso Expo queda en `http://localhost:18081`. Repite `MOBILE_WEB_PORT=18081`
en los siguientes comandos `up` para conservar ese puerto. El panel conserva
5173, el origen configurado para sus recorridos de autenticación.

Puedes manejar cada servicio por separado:

```bash
docker --context default compose up --build -d mobile
docker --context default compose up --build -d admin
docker --context default compose restart admin
docker --context default compose stop admin
docker --context default compose logs --tail 30 mobile
docker --context default compose down
```

`down` retira estos contenedores y su red, conservando los volúmenes de
dependencias. `up --build` reconstruye las imágenes e inicia los servicios;
al arrancar, `npm ci --prefer-offline` sincroniza cada volumen con su lockfile.
Cambiar el código montado activa la recarga sin reconstruir la imagen. Cambiar
el `.env` requiere reiniciar los servicios para recargar la configuración.

Si falta el `.env`, el arranque falla sin crear una carpeta en su lugar. El
generador administrativo rechaza proyectos distintos al autorizado y claves
privilegiadas. Los procesos usan el usuario `node` (UID 1000): los archivos
montados deben ser legibles y la carpeta administrativa escribible por ese usuario.

### Compose anterior: solo Expo

El comando anterior sigue disponible desde `DuocMind/`:

```bash
docker --context default compose up --build
```

Al iniciar el contenedor, `npm ci` sincroniza el volumen de `node_modules` con `package-lock.json`: instala dependencias nuevas y quita las que ya no están declaradas. La primera ejecución o un cambio de dependencias puede tardar unos segundos más y necesitar acceso al registro de npm.

La previsualización queda disponible en `http://localhost:8081`. Este Compose
conserva su volumen `node_modules` y no levanta administración. No lo ejecutes
simultáneamente con otro servidor Expo en 8081; usa la opción de puerto del
Compose raíz o detén primero el servidor correspondiente.

Docker se usa solo para desarrollo; el build nativo Android debe ejecutarse con
`npx expo run:android` desde un entorno con Android SDK. Las suites del panel
siguen usando Supabase local con cuentas sintéticas: detén `admin` antes de
ejecutarlas en 5173. Ver [administración](../admin-web/README.md) y el
[incremento Docker](specs/006-docker-dev-services/spec.md).

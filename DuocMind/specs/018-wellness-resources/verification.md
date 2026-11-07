# Verificación 018 — Recursos de bienestar por categoría

Registro de resultados reales por tarea. Una prueba diferida aparece como pendiente,
nunca como ejecutada.

## T001 — Línea base (2026-11-07)

**Entorno**

| Elemento | Declarado | Observado |
| --- | --- | --- |
| Node | `>=24 <25` | v24.21.0 (cumple) |
| npm | `>=11 <12` | 11.4.2 (cumple; `packageManager` fija npm 11.13.0, que no coincide) |
| Rama | `feature/*` desde `dev` | `dev` en `4ad0fbf` (merge de #30); aún no existe rama del incremento |
| Git | — | Solo `specs/018-wellness-resources/` sin seguimiento; nada más modificado |

**Comandos**

| Momento | Comando | Resultado |
| --- | --- | --- |
| Antes de `npm ci` | `npm run typecheck` | **1 error:** `privacyPolicyDocument.ts(2,26): TS2307: Cannot find module 'expo-sharing'` |
| Antes de `npm ci` | `npm test` | 319 pruebas, 319 aprobadas |
| — | `npm ci` | Instalación desde el lockfile; sin cambios en archivos versionados |
| Después de `npm ci` | `npm run typecheck` | Sin errores |
| Después de `npm ci` | `npm test` | 319 pruebas, 319 aprobadas |

El único fallo previo era de entorno: `expo-sharing` está declarado en `package.json` y en el
lockfile (lo agregó la spec 014) pero faltaba en el `node_modules` local. No es un defecto del
código. La línea base útil es la posterior a `npm ci`: typecheck limpio y 319 pruebas aprobadas.

**Disponibilidad para los recorridos**

| Elemento | Observado |
| --- | --- |
| Supabase local | En marcha (auth responde 200; contenedores `supabase_*` activos, sin `storage-api`); `tools/.local/runtime.json` y `fixtures.json` presentes |
| Compose del repositorio | `capstone-mobile-1` y `capstone-admin-1` activos (no iniciados por esta tarea) |
| Datos de herramientas | Ninguno todavía: `tools/scripts/fixtures.mjs` no crea herramientas (T006 lo agrega) |
| Android | `adb devices` sin dispositivos ni emulador. El build nativo no compila en este equipo: `Selector.open()` de Java falla en Windows con «Unable to establish loopback connection» (detalle en la spec 010). `android/` generado, ignorado por Git |

**Limitaciones:** no se ejecutó ningún recorrido ni se tocó código de `src/`. T011 (Android) sigue
bloqueada por el fallo del entorno.

## T002 — Dominio (2026-11-07)

**Cambio:** `src/features/wellness/domain/wellnessResource.ts` con los tipos
`ResourceCategory`, `WellnessResource` y `ResourceCatalog`, y las funciones `parseCatalog`,
`isSafeImagePath`, `categoriesWithResources`, `filterResources`, `categoryTone`,
`categoryIconKey` y `findResource` del plan. Sin React, Expo ni `@/`.

| Comando | Resultado |
| --- | --- |
| `node --test tests/wellnessResource.test.mjs` | 24 pruebas, 24 aprobadas |
| `npm run typecheck` | Sin errores |
| `npm test` | 343 pruebas, 343 aprobadas (319 de la línea base + 24 nuevas) |
| `grep console. wellnessResource.ts` | Sin coincidencias |

**Cubre:** documento válido con orden (recursos por fecha e id descendentes, categorías por orden y
nombre); filas inválidas descartadas sin invalidar las demás (id no numérico, título vacío o de más
de 160 caracteres, fecha inválida, filas nulas); categorías inválidas o repetidas; contenedor
inválido que lanza; descripción y contenido vacíos que quedan en `null`; videos que no son
`https://` (`http`, `javascript:`, `ftp`, relativo, vacío, no texto); ruta de imagen insegura
que queda en `null` sin invalidar la fila; ids de categoría inexistentes o repetidos; recurso sin
relaciones; id repetido; `isSafeImagePath` con rutas válidas y con esquema, absoluta, `..`, `.`,
`//`, `\`, vacía, solo espacios, de más de 300 caracteres, de control, con `?` o `#` y no texto;
chips solo con recursos; filtro «Todos», por categoría y con un recurso en dos categorías; tono
estable y cíclico con índices inválidos; icono con tildes y mayúsculas y respaldo genérico;
`findResource` con número, cadena de la ruta y valores inválidos.

**Adiciones al plan (mismo alcance, sin cambiar requisitos):**

- `serializeCatalog(catalog)`: devuelve el catálogo a la forma del servidor. Permite que la copia
  local se guarde así y se valide con el mismo `parseCatalog`, como indica el plan (§3, caché), sin
  mantener dos validadores. Hay pruebas de ida y vuelta, incluido un catálogo con imagen y video
  nulos.
- `primaryCategory(catalog, resource)` y `categoryIndex(catalog, categoryId)`: dan la categoría
  principal del recurso y su posición, de donde salen el tono y el icono del marcador (decisión 8).

**Decisiones de implementación:** una descripción o un contenido con solo espacios equivale a
ausente; un `orden` de categoría que falta se toma como 0; un `imagen_path` inseguro o nulo no
descarta la fila (la lista muestra el marcador, CA-006); se rechazan también `?` y `#` en la ruta
de imagen, además de lo que pedía la spec.

**Limitaciones:** es lógica pura; su uso con datos reales de Supabase se comprueba en T005, T006 y
T010, y la presentación en T007 a T010.

## T003 — Caso de uso de carga (2026-11-07)

**Cambio:** `src/features/wellness/application/resourceCatalog.ts` con las interfaces
`ResourceGateway`, `ResourceCache` y `StoredCatalog`, el tipo `CatalogResult`
(`ready`, `empty` o `error`, con `source` `remote` o `cache` y `fetchedAt`),
`loadResourceCatalog`, `shouldRefresh` y `REFRESH_MIN_INTERVAL_MS = 60_000`. Solo importa tipos
del dominio; sin React, Expo ni `@/`.

| Comando | Resultado |
| --- | --- |
| `node --test tests/wellnessCatalog.test.mjs` | 14 pruebas, 14 aprobadas |
| `npm run typecheck` | Sin errores |
| `npm test` | 357 pruebas, 357 aprobadas (343 anteriores + 14 nuevas) |

**Cubre:** descarga correcta mostrada y guardada con la hora inyectada; catálogo vacío descargado
(`empty`) que también se guarda; descarga fallida que usa la copia con su fecha original y no la
reescribe; copia vacía; sin conexión y sin copia (`error`); copia ilegible porque la lectura lanza;
copia con forma inválida; respuesta malformada (`null`, `undefined`, `{}`, texto, listas ausentes o
mal tipadas) que conserva la copia sin escribir nada; un gateway que lanza como el real; fallo al
escribir la copia que se ignora; que el caso de uso nunca lanza en ninguna de las 24 combinaciones de
fallos del gateway, la lectura y la escritura; `shouldRefresh` sin descarga previa, justo antes y desde
los 60 s, con otro intervalo, con un reloj que retrocede y con valores inválidos.

**Decisiones de implementación:**

- Además de confiar en que el gateway lance ante una respuesta malformada, el caso de uso comprueba
  que lo recibido tenga las dos listas; si no, lo trata como un fallo y usa la copia.
- `shouldRefresh` descarga en el límite exacto (`>= 60 s`) y cuando el reloj del dispositivo retrocedió,
  para no dejar la sección sin actualizar.
- No se registra nada: los errores del gateway, la lectura y la escritura se descartan sin
  guardarlos ni mostrarlos.

**Limitaciones:** se probó con un gateway y una caché simulados. Los reales (Supabase, SQLite y
`localStorage`) llegan en T004 y T005 y se comprueban en T010 y T011.

## T004 — Almacenamiento de la copia local (2026-11-07)

**Cambio:** en `src/features/wellness/infrastructure/`:

- `resourceCacheDocument.ts`: formato común de la copia, un único documento JSON
  (`schema`, `fetchedAt` y el catálogo con la forma del servidor) que se valida al leer con el mismo
  `parseCatalog` de la descarga. Un texto ilegible, de otra versión o con un catálogo inválido
  devuelve `null`.
- `resourceCacheStorage.web.ts`: `createWebResourceCache(storage)` con almacenamiento inyectable y la
  clave `duocmind.wellness.resources.v1` sobre `window.localStorage`. Sin almacenamiento disponible,
  leer devuelve `null` y escribir falla.
- `resourceCacheStorage.native.ts`: SQLite sin cifrar, base `duocmind-wellness-resources.db`, tabla
  `resource_catalog` de una fila, escritura con `INSERT OR REPLACE` en una transacción exclusiva y
  apertura única que se reintenta si falla. Una base ilegible se lee como copia inexistente. No usa
  `SecureStore` ni SQLCipher.
- `resourceCacheStorage.ts`: selector de plataforma, como `eventStorage.ts`.

| Comando | Resultado |
| --- | --- |
| `node --test tests/wellnessResourceCache.web.test.mjs` | 13 pruebas, 13 aprobadas |
| `npm run typecheck` | Sin errores (incluye las tres variantes) |
| `npm test` | 370 pruebas, 370 aprobadas (357 anteriores + 13 nuevas) |
| `grep console. src/features/wellness` | Sin coincidencias |

**Cubre (web y formato):** guardar y leer con la fecha; sin copia previa; una copia de más de 20 KB
(CA-011, muy por encima del límite de 2 KB de SecureStore) sin perder nada; reemplazo de la copia
anterior; valores corruptos o de otra versión (JSON inválido, vacío, `null`, arreglo, sin `schema`,
`schema` distinto, fecha inválida, catálogo nulo o mal formado) que devuelven `null` sin lanzar; filas
inválidas que se descartan conservando las válidas; una escritura que falla (cuota llena) que no
corrompe la copia previa; sin almacenamiento o con acceso que lanza; que el documento contiene solo
`schema`, `fetchedAt` y el catálogo público; y, con el caso de uso de T003, que sin conexión se muestra
la copia y que dos fallos de red seguidos no la borran.

**Decisión de implementación:** la copia nativa guarda el documento completo en `payload` además de
`fetched_at`, de modo que se valida igual que la web con una sola función. La columna `fetched_at`
queda disponible para consultas, pero la lectura no depende de ella.

**Limitaciones:** la variante nativa importa `expo-sqlite` y no se puede ejecutar con `node --test`;
solo se verificó que compila. Su comportamiento real (crear la base, escribir, leer tras reiniciar y
sin conexión) queda para el recorrido Android de T011. La web usa `localStorage`, que no acredita el
comportamiento nativo.

## T005 — Gateway, almacén compartido y hook (2026-11-07)

**Cambio:** en `src/features/wellness/`:

- `infrastructure/supabaseResourceGateway.ts`: `fetchCatalog` hace en paralelo las dos consultas del
  plan (`tipo_herramienta` ordenada por `orden` y nombre; `herramienta` activa con
  `herramienta_tipoherramienta(tipo_id)`, por fecha e id descendentes y `limit(200)`), relanza un error
  genérico sin datos de la consulta y pasa el resultado por `parseCatalog`. Usa solo la clave
  publicable. Exporta `publicImageUrl(path)`.
- `infrastructure/resourceImageUrl.ts`: `buildPublicImageUrl(baseUrl, path)`, la construcción pura de la
  URL del bucket `herramientas` con cada segmento codificado; devuelve `null` si la ruta no es segura o
  falta una configuración `http(s)` válida. No hace solicitudes de red.
- `infrastructure/resourceCatalogStore.ts`: `createResourceCatalogStore({ load, now })`, el estado
  compartido en memoria con `subscribe`, `getSnapshot` y `refresh`.
- `infrastructure/resourceCatalogRuntime.ts`: la instancia única, que conecta el gateway real, la copia
  local y el reloj.
- `hooks/useResourceCatalog.ts`: `useSyncExternalStore` sobre el almacén. Con `refreshOnFocus` actualiza
  al enfocar (respetando el intervalo); sin esa opción solo descarga si todavía no hay resultado.
  Devuelve `{ result, loading, refresh }`; `refresh` ignora el intervalo.

| Comando | Resultado |
| --- | --- |
| `node --test tests/wellnessCatalogStore.test.mjs` | 16 pruebas, 16 aprobadas |
| `npm run typecheck` | Sin errores |
| `npm test` | 386 pruebas, 386 aprobadas (370 anteriores + 16 nuevas) |
| `grep console.\|logger src/features/wellness` | Sin coincidencias |

**Cubre (almacén):** estado inicial; dos llamadas simultáneas que comparten una sola descarga (y la
fuerza también); notificación al empezar y al terminar, y baja de la suscripción; error sin resultado
previo; un error que no reemplaza un resultado ya disponible (se conserva el anterior durante y después
de la descarga); un resultado de la copia que se reemplaza por uno descargado, incluido uno vacío;
intervalo de 60 s (a 59 999 ms no descarga, a 60 000 ms sí); un intento fallido que también cuenta para
el intervalo mientras «Reintentar» lo ignora; sin resultado siempre intenta; una carga que lanza (queda
en `error` sin propagar); y referencias estables de la instantánea.

**Cubre (URL de imagen):** segmentos codificados (espacios, `ñ`, `%`, `&`, `=`), base con barras finales,
base `http` local, y `null` para rutas inseguras o sin configuración válida.

**Adiciones al plan (mismo alcance, sin cambiar requisitos):**

- `resourceCatalogRuntime.ts` separa el cableado real del almacén (patrón de `tutorialRuntime`), para que el
  almacén se pruebe con `node --test` sin importar Supabase ni el alias `@/`.
- `resourceImageUrl.ts` aloja la construcción pura de la URL por la misma razón, y
  `wellnessCatalogStore.test.mjs` incluye sus pruebas.

**Decisiones de implementación:**

- El intervalo mínimo cuenta desde el **último intento**, exitoso o no. Con la sección abierta y sin
  conexión, el enfoque no insiste en cada visita; la persona puede forzar con «Reintentar».
- Mientras se actualiza, el estado conserva el resultado anterior (no vuelve a «cargando» si ya hay
  datos), y el hook considera «cargando» solo si hay una descarga en curso o aún no hay resultado.
- No se registra nada: ni errores ni qué recurso o categoría se consulta (RF-008).

**Limitaciones:** el gateway real (consulta, nombre de la relación `herramienta_tipoherramienta` y
`limit`) y el hook con `useFocusEffect` no se pueden ejecutar con `node --test`; solo se verificó que
compilan. Se ejercitan contra Supabase local en T006 y T010, y en el dispositivo en T011.

## T006 — Datos sintéticos y prueba de backend (2026-11-07)

**Cambio:**

- `tools/scripts/wellness-fixtures.mjs`: crea seis herramientas sintéticas con el prefijo
  «[Sintético] » y sus relaciones (una inactiva, una sin descripción, una con ruta de imagen insegura,
  una en dos categorías y una con video), con fechas fijas para un orden determinista. Es idempotente,
  admite `--clean` y solo opera sobre una base local (`runtime()` rechaza cualquier otra).
- `tools/tests/wellness-resources.mjs`: usa un cliente anónimo y uno de estudiante sintético. Comprueba que
  solo se leen herramientas activas, en orden de fecha descendente, con los cuatro tipos; que la
  relación de una herramienta inactiva no se ve; que la **misma consulta que usa la aplicación**
  (`supabaseResourceGateway.ts`) responde sin error y se interpreta con `parseCatalog` (descripción nula,
  ruta insegura nula, video, dos categorías, orden y chips); y que ocho escrituras (insertar, actualizar y
  borrar en `herramienta`, `tipo_herramienta` y la relación) se rechazan en ambos clientes sin cambiar
  ninguna tabla. Borra sus datos al terminar.
- `tools/scripts/backend-tests.mjs`: la prueba se agrega a la lista (después de `consents`).

**Preparación del entorno (acción autorizada por el usuario el 2026-11-07):** la base local era
anterior a las migraciones de herramientas (11 sin aplicar, entre ellas las que crean `herramienta`).
Se ejecutó `supabase db reset --local`, que la reconstruyó con todas las migraciones y borró los datos
sintéticos locales de las pruebas anteriores; luego se recrearon las cuentas con `fixtures.mjs` y se
habilitó el personal local con `staff.mjs staff enable`. No se tocó el proyecto remoto. Para las pruebas
del panel se sirvió `admin-api` con `supabase.cmd functions serve`, porque los scripts del repositorio
ejecutan el CLI sin `.cmd` y no funcionan en Windows (ver spec 010); no se modificó ningún script
existente salvo la lista de la suite.

| Comando | Resultado |
| --- | --- |
| `node tools/scripts/wellness-fixtures.mjs` y `--clean` | Seis herramientas creadas (una inactiva) y eliminadas |
| `node tools/tests/wellness-resources.mjs` | Aprobada |
| Sondeo de escrituras de un anónimo | `42501 permission denied` en insertar, actualizar y borrar; la inactiva devuelve 0 filas |
| `node tools/scripts/backend-tests.mjs` (suite completa) | Aprobada: «Suite de backend local completa.» |
| `npm run typecheck` y `npm test` | Sin cambios respecto de T005 (386 aprobadas) |

**Incidente:** una primera ejecución de la suite se detuvo en `event-types-api` (503) porque `admin-api` no
se estaba sirviendo; no tenía relación con este cambio. Tras servirla, la suite completa pasó.

**Resultado relevante para T010:** la consulta con la relación `herramienta_tipoherramienta(tipo_id)`, el
orden y el `limit(200)` funcionan contra el esquema real, y las políticas ocultan lo inactivo y bloquean
la escritura (CA-004, CA-013). El hallazgo 2 de la spec (nombre de la relación) queda confirmado.

**Limitaciones:** Supabase local no incluye `storage-api`, así que no se probó la descarga de imágenes
reales. El gateway se ejercitó con el cliente de Supabase en Node, no dentro de la app.

## T007 — Componentes de la sección (2026-11-07)

**Cambio:** en `src/features/wellness/components/`, sin montarlos todavía:

- `ResourceThumb.tsx`: miniatura. El marcador (tono e icono de la categoría) queda debajo y la imagen
  aparece encima solo al terminar de cargar; sin URL o ante un fallo queda el marcador. Etiqueta
  accesible con el título. Exporta `ResourceIcon`, que elige entre los iconos existentes.
- `ResourceChips.tsx`: «Todos» y una categoría por cada una con recursos, en una fila desplazable.
  `ScalePress`, `accessibilityRole="button"`, `accessibilityState={{ selected }}`, `minHeight` de 44; el chip
  elegido se distingue por fondo, borde y peso de la letra, no solo por el color.
- `ResourceRow.tsx`: miniatura, título (hasta dos líneas), descripción (hasta dos líneas, sin hueco si
  falta) y «Video». Etiqueta accesible con título, categoría e «Incluye video», e indicación de que abre el
  detalle.
- `ResourcesSection.tsx`: título «Recursos» (como encabezado), chips, lista y los estados de carga
  (`GotaLoader`), vacío, error con «Reintentar» y aviso de copia con fecha. Vuelve a «Todos» si la
  categoría elegida desaparece. La navegación al detalle la hace la pantalla mediante `onOpenResource`.
- `resourceStyles.ts`: estilos y paleta de Bienestar compartidos por los componentes.
- Ajustes aditivos a artefactos anteriores: el dominio gana `effectiveCategoryId` y `formatUpdatedAt` (con
  2 pruebas en `wellnessResource.test.mjs`), y `useResourceCatalog` devuelve `imageUrl`, para que los
  componentes no importen la infraestructura.

| Comando | Resultado |
| --- | --- |
| `npm run typecheck` | Sin errores |
| `npm test` | 388 pruebas, 388 aprobadas (386 anteriores + 2 nuevas del dominio) |
| `grep` de duración, `Animated`, `Easing`, `TouchableOpacity`, `ActivityIndicator`, `spring`, `setTimeout` en los componentes | Ninguna coincidencia |
| `grep console. src/features/wellness` | Sin coincidencias |
| Objetivos táctiles | `minHeight: 44` en chips y filas; `minHeight` y `minWidth` de 44 en «Reintentar» |

**Revisión:** todas las etiquetas y textos están en español; no se escriben duraciones, curvas ni escalas
sueltas (solo `Reveal`, `ScalePress` y `GotaLoader`, que ya respetan `useReducedMotion`); cambiar de chip
no anima porque las filas no usan `Reveal`. Se retiró un `accessibilityRole="tablist"` que se había puesto
en la fila de chips, porque los chips son botones con estado seleccionado y ese rol sin pestañas
confundiría a los lectores de pantalla.

**Limitaciones:** son componentes de presentación sin pruebas automáticas (no hay Jest ni RNTL en el
proyecto); solo se comprobó que compilan. El comportamiento visible, el filtrado, los estados y la
accesibilidad se verifican al montarlos en T009 y en el recorrido web de T010, y en Android en T011.

## T008 — Detalle del recurso y su ruta (2026-11-07)

**Cambio:**

- `src/features/wellness/screens/ResourceDetailScreen.tsx` y `ResourceDetailScreen.styles.ts`.
- Ruta `src/app/(app)/wellness/resources/[id].tsx`, que solo reexporta la pantalla.

La pantalla lee el id de la ruta, usa `useResourceCatalog()` sin refresco (lo que haya en memoria; solo
descarga si todavía no hay resultado) y muestra:

- **Con el recurso:** imagen grande con el mismo marcador de la lista; categorías como etiquetas con el tono
  de su posición; título como encabezado; descripción y contenido como **texto plano** (solo si existen);
  «Ver video» únicamente con `videoUrl` `https://`; el aviso «Son orientación general y no reemplazan la
  atención de un profesional»; y el acceso «¿Necesitas hablar con alguien? Ver líneas de ayuda», que lleva a
  `/wellness/crisis-resources`.
- **«Ver video»:** botón con la etiqueta «se abre en tu navegador» y el texto «Se abre en un sitio externo, en
  tu navegador, y necesita conexión.». Revalida `https://` antes de abrir con `Linking.openURL`; un fallo
  se informa con un mensaje en la pantalla (no con `Alert`, que en web no hace nada) y no cierra el detalle.
- **Estados:** cargando (`GotaLoader`), error con «Reintentar», y «Este recurso ya no está disponible» con
  «Volver a Bienestar» para un id inexistente, inválido o de un recurso retirado.
- **Navegación:** botón de volver (`router.back()`, o `replace('/wellness')` si no hay historial) y la barra
  inferior con Bienestar activo, como las demás pantallas de la sección.

| Comando | Resultado |
| --- | --- |
| `npm run typecheck` | Sin errores |
| `npm test` | 388 pruebas, 388 aprobadas (sin cambios respecto de T007) |
| `grep` de duración, `Animated`, `Easing`, `TouchableOpacity`, `ActivityIndicator`, `spring`, `setTimeout` y `console.` en la pantalla y sus estilos | Ninguna coincidencia |

**Revisión:** textos y etiquetas en español; botones con `ScalePress` y objetivos de al menos 44 px (volver,
video, ayuda, reintentar); el contenido del recurso se muestra como texto sin interpretar HTML ni enlaces; no se
envía ni se registra nada de la persona al abrir el video; la entrada usa `Reveal`.

**Limitaciones:** la ruta todavía no se alcanza desde ninguna pantalla (T009 conecta la lista). No hay pruebas
automáticas de la pantalla (el proyecto no tiene Jest ni React Native Testing Library): solo se comprobó que
compila. Su comportamiento visible, el recurso inexistente por URL directa y la apertura del video se verifican
en el recorrido web de T010 y en Android en T011.

## T009 — Integración en Bienestar (2026-11-07)

**Cambio:**

- `WellnessScreen.tsx`: se monta `<ResourcesSection />` bajo el test mensual y antes de «Para esta semana»
  (con `router.push({ pathname: '/wellness/resources/[id]', params: { id } })` al tocar una fila); se retiran
  el arreglo `tools`, la cuadrícula «Herramientas rápidas» y los iconos que solo ellos usaban; «Para esta
  semana» pasa del índice de entrada 7 al 3 porque ya no hay cuatro tarjetas antes.
- `WellnessScreen.styles.ts`: se retiran `toolsGrid`, `toolTile`, `toolBreathe`, `toolStudy`, `toolJournal`,
  `toolStretch`, `toolTitle` y `toolDesc` (−31 líneas).
- `ResourceChips.tsx`: se agrega `aria-selected` (ver «Defecto» abajo).

| Comando | Resultado |
| --- | --- |
| `npm run typecheck` | Sin errores |
| `npm test` | 388 pruebas, 388 aprobadas |
| `grep "Herramientas rápidas\|toolsGrid\|toolTile" src` | Sin coincidencias |

**Entorno de la prueba:** previsualización web (`localhost:8089`, Expo con `EXPO_PUBLIC_SUPABASE_URL` hacia el
Supabase **local**), las seis herramientas sintéticas de T006 (una inactiva) y sin iniciar sesión (la lectura
es pública). Ninguna solicitud salió hacia el proyecto remoto.

**Verificado en la web:**

| Comprobación | Resultado |
| --- | --- |
| Bienestar muestra «Recursos» bajo el test y ya no «Herramientas rápidas»; Eventos, el test y «Para esta semana» siguen presentes | Correcto |
| Chips: «Todos», Estrés, Ansiedad, Apoyo al estudio y Salud física, en ese orden; «Todos» seleccionado al abrir | Correcto |
| Lista de «Todos»: los cinco activos, del más nuevo al más antiguo; el inactivo no aparece | Correcto |
| Filtro: Estrés → Respiración y Pausa; Ansiedad → Nervios y Pausa (un recurso en dos categorías aparece en ambas); Apoyo al estudio → Pomodoro; Salud física → el de ruta insegura; «Todos» → los cinco otra vez | Correcto |
| Estado seleccionado expuesto como `aria-selected` (verdadero solo en el chip activo) | Correcto tras el ajuste |
| Chips de 44 px de alto | Correcto (los cinco miden 44) |
| Filas con título, descripción (Pomodoro, que no tiene, no deja hueco) e indicador «Video» solo donde hay `video_url` | Correcto |
| Etiqueta accesible de la fila: título, categoría e «Incluye video» | Correcto |
| Tocar una fila abre `/wellness/resources/31` con categoría, título, descripción, contenido, «Ver video», la nota de que se abre en un sitio externo y necesita conexión, el aviso de orientación general y el acceso a las líneas de ayuda | Correcto |
| Detalle: marcador lavanda con el icono de Estrés (la imagen no existe en el almacenamiento) | Correcto |
| Solicitudes de red: las dos lecturas del catálogo (una por tipo y otra por herramienta, sin el recurso ni la categoría elegidos) | Correcto |
| La ruta de imagen insegura (`../fuera/del-bucket.png`) no genera ninguna solicitud de imagen; las otras cuatro sí | Correcto |
| Errores de consola | Ninguno |

**Defecto hallado y corregido:** en web, `accessibilityState={{ selected }}` no llega al DOM, de modo que un
lector de pantalla no sabía qué chip estaba elegido. Se agregó `aria-selected`, que RN traduce a
`accessibilityState.selected` en nativo y se expone en web.

**Observaciones:**

- Las cuatro imágenes con ruta válida fallan (`ERR_BLOCKED_BY_ORB`) porque Supabase local no tiene
  `storage-api`; la miniatura queda con el marcador y la lista sigue usable. Ya estaba previsto: no se
  verificó la descarga de imágenes reales.
- Los tipos de rutas de Expo Router (`.expo/types/router.d.ts`) no se versionan y se regeneran al iniciar
  Expo. Hasta entonces, `typecheck` rechazó la ruta nueva en este equipo; con los tipos regenerados pasa. CI
  no usa esos tipos, así que no se ve afectada.
- El panel del navegador no dibuja de forma fiable (capturas con tiempo agotado); parte de la comprobación se
  hizo leyendo el texto y el DOM, y solo se pudieron ver dos capturas: el encabezado de Bienestar y el detalle.
  La lista con sus miniaturas no se vio como imagen en esta tarea.

**Limitaciones:** la web no acredita la copia SQLite, el comportamiento nativo ni las imágenes reales. No se
probaron aquí el catálogo vacío, el error con reintento, la copia sin conexión ni el recurso inexistente por
URL directa: son de T010. La apertura real del video se deja para Android (T011).

## T010 — Recorrido web completo (2026-11-07)

**Entorno:** previsualización web (`localhost:8089`, Expo con `EXPO_PUBLIC_SUPABASE_URL` hacia el Supabase
**local**), base local reconstruida (T006), herramientas sintéticas de T006 y sin iniciar sesión (la lectura es
pública). Ninguna solicitud salió hacia el proyecto remoto. Para simular la caída de red se detuvo y volvió a
iniciar el contenedor `supabase_kong_duocmind-admin-local`; al terminar se borraron las herramientas sintéticas
y el contenedor quedó en marcha.

### Los nueve puntos del plan (§8)

| # | Punto | Resultado |
| --- | --- | --- |
| 1 | «Recursos» bajo el test y sin «Herramientas rápidas» | Correcto (T009) |
| 2 | Orden de chips, «Todos» elegido, filtro, un recurso en dos categorías en ambas | Correcto (T009): Estrés → Respiración y Pausa; Ansiedad → Nervios y Pausa; «Todos» una vez cada uno |
| 3 | Filas con título, descripción y «Video»; sin descripción, sin hueco | Correcto (T009) |
| 4 | Imagen inexistente y ruta insegura | Correcto: las cuatro rutas válidas piden la imagen y quedan con el marcador (Supabase local no tiene `storage-api`); la insegura (`../fuera/del-bucket.png`) no genera ninguna solicitud |
| 5 | Detalle: campos, aviso, video solo con `https`, acceso a líneas de ayuda; recurso inexistente por URL | Correcto: ver abajo |
| 6 | Catálogo vacío y error con reintento | Correcto: ver abajo |
| 7 | Copia sin conexión; fallo de red y respuesta malformada conservan la copia | Correcto: ver abajo |
| 8 | Solicitudes de red | Correcto (CA-012): solo las dos lecturas del catálogo, idénticas para cualquier persona; nada con el recurso o la categoría elegidos |
| 9 | Eventos, test mensual y «Para esta semana» sin cambios | Correcto salvo el contenido del test (ver «No verificado») |

**Punto 5 en detalle:**

- Recurso 37 (con video): categoría, título, descripción, contenido, «Ver video», la nota «Se abre en un sitio
  externo, en tu navegador, y necesita conexión.», el aviso «Son orientación general y no reemplazan la atención
  de un profesional.» y el acceso a las líneas de ayuda (44 px; lleva a `/wellness/crisis-resources`).
- «Ver video» (48 px): con `window.open` interceptado, abre exactamente `https://example.test/video/respiracion`
  en una pestaña nueva y no muestra ningún error.
- Recurso 39 (Pomodoro, sin video ni descripción): ni botón de video ni su nota, ni línea de descripción; sí
  categoría, contenido, aviso y acceso a la ayuda.
- URL con un id inexistente (`/wellness/resources/99999`) o inválido (`/wellness/resources/abc`): «Este recurso
  ya no está disponible», «Puede que Bienestar lo haya retirado.» y dos botones «Volver a Bienestar» de 44 px.

**Punto 6 en detalle:**

- Catálogo vacío (borrando las herramientas sintéticas): «Pronto habrá recursos aquí.», título «Recursos», sin
  chips ni lista ni error; la copia queda con 0 recursos.
- Error con reintento (sin copia, con el backend detenido): «No pudimos cargar los recursos» y «Revisa tu conexión e
  inténtalo de nuevo.», botón «Reintentar» de 44 px, sin chips ni lista. Con el backend de vuelta, «Reintentar» muestra
  la lista completa, quita el error, no muestra el aviso de copia y reescribe la copia con la hora nueva.

**Punto 7 en detalle:**

- Copia: documento de 1 918 bytes con solo `schema`, `fetchedAt` y el catálogo público (5 recursos). La copia superó
  el límite de 2 KB de SecureStore en pruebas (T004).
- Respuesta malformada (se interceptó `fetch` para devolver `{"oops":true}` y se adelantó el reloj para saltar el
  intervalo de 60 s): se descarta, la lista sigue visible con el aviso «Sin conexión o sin poder actualizar. Estás
  viendo la copia del 07/11/2026 19:30; puede no estar al día.» y la copia queda idéntica byte a byte.
- Caída de red (backend detenido): la lista y los cinco chips se muestran desde la copia con el mismo aviso y la
  copia no cambia.

### Defecto hallado y corregido durante el recorrido

Con el backend detenido y una copia válida, la lista tardaba **15,4 s** en aparecer. El cliente de Supabase
(`postgrest-js` 2.116) reintenta de forma automática los fallos de red con espera creciente. Correcciones:

1. `supabaseResourceGateway.ts`: `.retry(false)` en las dos consultas. Ante un fallo se usa de inmediato la copia; la
   sección vuelve a intentarlo al enfocar o con «Reintentar».
2. `resourceCatalog.ts`: `REQUEST_TIMEOUT_MS = 8_000` y `withTimeout` en `loadResourceCatalog`, para que una red que se
   cuelga en lugar de fallar no deje la sección cargando indefinidamente. Una respuesta posterior al plazo se descarta
   y no se escribe.
3. `tests/wellnessCatalog.test.mjs`: 5 pruebas nuevas (red colgada con copia, sin copia, respuesta tardía descartada,
   respuesta a tiempo y plazo por defecto).

Tras el cambio, la misma medición dio **2,1 s** (casi todo carga de página). Estos cambios modifican, de forma aditiva,
artefactos de T003 y T005.

### Comandos

| Comando | Resultado |
| --- | --- |
| `npm run typecheck` | Sin errores |
| `npm test` | 393 pruebas, 393 aprobadas (388 + 5 del plazo) |
| `node tools/scripts/backend-tests.mjs` (suite completa, con `admin-api` servida) | Aprobada: «Suite de backend local completa.», con la prueba de recursos de bienestar incluida |

### No verificado

- **Contenido del test mensual.** «Comenzar test» lleva a `/daily-test`, que muestra «No pudimos cargar el test»
  (`Cannot coerce the result to a single JSON object`). `emotional-checkin` no tiene cambios en este incremento; la
  pantalla pide una única versión activa y la base local, tras la suite de backend, tiene varias en `test_bienestar`.
  Es un efecto del estado de la base local, no de este cambio, pero no se comprobó a fondo.
- Imágenes reales (Supabase local excluye `storage-api`), la copia SQLite, la apertura nativa del video y todo lo
  nativo: quedan para Android (T011).
- La web usa `localStorage`; no acredita el comportamiento nativo ni sin conexión real del dispositivo.
- El panel del navegador no dibuja de forma fiable (capturas con tiempo agotado); casi todo se comprobó leyendo el
  texto, el DOM y las solicitudes de red. Solo se vieron como imagen el encabezado de Bienestar y el detalle.

**Entorno que sigue en marcha:** web del 8089, `admin-api` (`supabase.cmd functions serve`) y Supabase local.

## Pendiente

T011: sin ejecutar y bloqueada por el entorno (el build nativo de Android no compila en este equipo; ver spec 010). Falta la copia SQLite en dispositivo, las imágenes reales, la apertura nativa del video, TalkBack, texto al 200 % y movimiento reducido. La validación Android sigue pendiente, por lo que la spec no puede cerrarse.

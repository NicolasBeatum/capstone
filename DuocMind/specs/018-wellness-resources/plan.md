# Plan 018 — Recursos de bienestar por categoría

| Campo | Valor |
| --- | --- |
| Versión | 0.1.0 |
| Estado | APROBADO |
| Fecha | 2026-11-07 |
| Spec | `spec.md` 0.1.0, APROBADA el 2026-11-07 |
| Constitución | 2.0.0 |
| Rama | Sugerida `feature/recursos-bienestar`, desde `dev`; aún no creada |
| Aprobación del plan | Confirmada explícitamente por el usuario el 2026-11-07 |

## 1. Decisiones y límites

La sección «Recursos» lee dos tablas públicas de Supabase (`tipo_herramienta` y
`herramienta`, con su relación muchos a muchos), valida la respuesta en el límite,
la guarda como una copia local y la muestra con el diseño de la opción A: chips de
categoría y lista. Cada recurso abre un detalle en una ruta propia.

1. **Todo vive en `features/wellness/`.** Solo Bienestar usa estos datos hoy. El inicio
   tiene sus propios datos estáticos (`featuredTools.ts`) y esta spec no lo toca. Cuando
   se conecte `herramientas_home()`, la parte común (tipos, validación y gateway) se
   moverá a `shared/` entonces, no ahora (`AGENTS.md`: nada para funciones futuras).
2. **Sin migraciones ni cambios de esquema.** Las políticas ya permiten leer lo activo
   a `anon` y `authenticated`, y solo `service_role` escribe.
3. **Sin dependencias nuevas.** Se usa `Image` de React Native, `expo-sqlite` (ya
   instalado), `Linking` y el cliente de Supabase existente.
4. **Copia local en SQLite sin cifrar (Android) y `localStorage` (web).** El contenido
   es público y no tiene datos personales. `platformSecureKeyValueStorage` no sirve:
   `expo-secure-store` limita cada valor a unos 2 KB y una lista con `contenido` lo
   supera (spec, hallazgo 3). La copia es un único documento JSON por dispositivo, sin
   asociarlo a una cuenta.
5. **Dos consultas en paralelo, un documento.** Categorías y recursos se descargan juntos
   y se guardan juntos: si falla una, no se actualiza ninguna y se conserva la copia
   anterior.
6. **El estado se comparte entre la lista y el detalle** mediante un almacén en memoria
   del módulo, para que el detalle abra al instante y sin una segunda descarga.
7. **Sin paginación.** Se pide un máximo de 200 recursos activos, los más recientes. Es
   un catálogo editorial de Bienestar (decenas), muy por debajo del tope de 1000 filas
   de la API. Si algún día se acerca a 200, se pagina en otra spec.
8. **Tonos por posición de categoría y no por nombre.** Los nombres vienen del servidor
   y pueden cambiar; el tono de cada categoría se toma de su posición en el orden. El
   icono usa palabras clave del nombre con un icono genérico de respaldo.

No se agregan migraciones, dependencias ni cambios de backend. El plan no autoriza
despliegues, migraciones remotas, commits ni push. Aprobado el plan, se redacta
`tasks.md`; la implementación sigue una tarea por vez después de aprobar esas tareas.

## 2. Estado observado

- `WellnessScreen.tsx` define un arreglo `tools` con cuatro tarjetas (Respira, Modo
  estudio, Diario, Pausa activa) dentro de una cuadrícula con `Reveal`. No tienen
  acción. Debajo está «Para esta semana», que lleva a las líneas de ayuda.
- Las rutas de Bienestar viven en `src/app/(app)/wellness/`: `index.tsx` y
  `crisis-resources.tsx`, cada una solo reexporta su pantalla. Eventos ya usa una ruta
  dinámica `events/[id].tsx` que reexporta `EventDetailScreen`; se sigue ese patrón.
- Esquema (migraciones `20261104120000`, `20261105120000` y `20261106140000`):
  - `tipo_herramienta(id smallint, nombre, orden smallint)`, con los cuatro tipos
    cargados: Estrés, Ansiedad, Apoyo al estudio y Salud física.
  - `herramienta(id bigint, titulo, descripcion, contenido, imagen_path not null,
    video_url https o null, activo, created_at, updated_at)`.
  - `herramienta_tipoherramienta(herramienta_id, tipo_id)`, la pivote renombrada. Las
    políticas muestran solo filas de herramientas activas.
  - Bucket público `herramientas` (≤ 500 KB; jpeg, png o webp).
- El almacén local de otras funcionalidades usa `expo-sqlite` con SQLCipher en Android
  (eventos, planificador) o `localStorage`/`sessionStorage` en web. Para el catálogo
  público no hace falta cifrar.
- Íconos disponibles en `shared/components/Icons.tsx`: `WindIcon`, `MoonIcon`,
  `BookIcon`, `StretchIcon`, `HeartIcon`, `MeditationIcon`, `SparkleIcon`,
  `ChevronRightIcon`, `ChevronLeftIcon`, `ClockIcon`, entre otros.
- Supabase local (`tools/`) excluye `storage-api` al iniciar, de modo que las imágenes
  del bucket no se pueden servir localmente: las pruebas locales ejercitan el
  marcador de imagen (CA-006).
- `tools/scripts/fixtures.mjs` crea las cuentas sintéticas, pero no herramientas.

## 3. Organización e interfaces

```
src/features/wellness/
├── domain/
│   └── wellnessResource.ts        # Tipos, validación, categorías, filtro, tonos
├── application/
│   └── resourceCatalog.ts         # Gateway, caché, caso de uso y política de refresco
├── infrastructure/
│   ├── supabaseResourceGateway.ts # Consulta a Supabase y URL pública de imágenes
│   ├── resourceCacheStorage.ts    # Elige la variante por plataforma
│   ├── resourceCacheStorage.native.ts  # SQLite sin cifrar
│   ├── resourceCacheStorage.web.ts     # localStorage con almacenamiento inyectable
│   └── resourceCatalogStore.ts    # Estado compartido en memoria para pantallas
├── hooks/
│   └── useResourceCatalog.ts      # Carga, refresco al enfocar y reintento
├── components/
│   ├── ResourcesSection.tsx       # Título, chips, lista y estados
│   ├── ResourceChips.tsx
│   ├── ResourceRow.tsx
│   └── ResourceThumb.tsx          # Imagen con marcador
└── screens/
    ├── WellnessScreen.tsx         # Se modifica: reemplaza «Herramientas rápidas»
    ├── ResourceDetailScreen.tsx
    └── ResourceDetailScreen.styles.ts
src/app/(app)/wellness/resources/[id].tsx   # Reexporta ResourceDetailScreen
```

### Dominio — `wellnessResource.ts`

Sin React, Expo ni `@/`; imports relativos con extensión `.ts`.

```ts
export interface ResourceCategory { id: number; name: string; order: number }
export interface WellnessResource {
  id: number; title: string; description: string | null; content: string | null;
  imagePath: string | null;   // null si la ruta no es segura
  videoUrl: string | null;    // solo https
  createdAt: string; categoryIds: number[];
}
export interface ResourceCatalog { categories: ResourceCategory[]; resources: WellnessResource[] }
```

- `parseCatalog(raw: unknown): ResourceCatalog`: valida el documento descargado. Lanza si
  el contenedor no es un objeto con las dos listas. Una fila inválida (sin `id`, sin
  título, `created_at` no ISO) se descarta sin invalidar las demás. `video_url` que no
  empieza por `https://` pasa a `null`. Un `imagen_path` no seguro pasa a `null`.
  Los ids de categoría que no existen en el catálogo se ignoran. El resultado queda
  ordenado: recursos por `createdAt` y `id` descendentes; categorías por `order` y
  `name`.
- `isSafeImagePath(path)`: relativa, sin esquema ni `//`, sin `..`, sin `\`, sin
  caracteres de control, con un máximo de 300 caracteres y no vacía.
- `categoriesWithResources(catalog)`: categorías con al menos un recurso, en orden.
- `filterResources(catalog, categoryId | null)`: `null` devuelve todos, una vez cada
  uno; un id devuelve los que pertenecen a esa categoría.
- `categoryTone(index)`: devuelve uno de cuatro tonos (lavanda, azul, naranja, verde)
  ciclando por la posición. `categoryIconKey(name)`: devuelve una clave de icono según
  palabras del nombre normalizado (sin tildes ni mayúsculas) con `'generic'` de respaldo.
- `findResource(catalog, id)`.

### Aplicación — `resourceCatalog.ts`

```ts
export interface ResourceGateway { fetchCatalog(): Promise<ResourceCatalog> }
export interface ResourceCache {
  read(): Promise<{ catalog: ResourceCatalog; fetchedAt: string } | null>;
  write(catalog: ResourceCatalog, fetchedAt: string): Promise<void>;
}
export type CatalogResult =
  | { status: 'ready'; catalog: ResourceCatalog; source: 'remote' | 'cache'; fetchedAt: string }
  | { status: 'empty'; source: 'remote' | 'cache'; fetchedAt: string }
  | { status: 'error' };
```

- `loadResourceCatalog({ gateway, cache, now })`:
  1. Pide al gateway. Si responde, intenta `cache.write` y **ignora** un error de
     escritura; devuelve `ready` (o `empty` si no hay recursos) con `source: 'remote'`.
  2. Si el gateway falla o lanza (red o respuesta malformada), lee la caché dentro de
     un `try/catch`: con copia válida devuelve `ready`/`empty` con `source: 'cache'`; sin
     copia o con copia ilegible devuelve `error`.
  3. Nunca borra ni reemplaza la copia por un fallo (RF-007.2 y RF-007.3).
- `shouldRefresh(lastFetchedAtMs, nowMs, minIntervalMs)`: decide si un enfoque debe
  volver a descargar. `REFRESH_MIN_INTERVAL_MS = 60_000`, para no descargar de nuevo al
  volver del detalle.

### Infraestructura

- `supabaseResourceGateway.ts`: dos consultas en paralelo con `Promise.all`:
  - `tipo_herramienta` → `id, nombre, orden`, ordenado por `orden` y `nombre`.
  - `herramienta` → `id, titulo, descripcion, contenido, imagen_path, video_url,
    created_at, herramienta_tipoherramienta(tipo_id)`, con `activo = true`, orden por
    `created_at` y `id` descendentes y `limit(200)`.
  Cualquier error de Supabase se relanza sin incluir datos de la consulta. El resultado
  pasa por `parseCatalog`. Además expone `publicImageUrl(path)`, que arma la URL del
  bucket con `getPublicUrl` y codifica cada segmento.
- `resourceCacheStorage.native.ts`: `openDatabaseAsync('duocmind-wellness-resources.db')`,
  tabla `resource_catalog(id INTEGER PRIMARY KEY CHECK(id = 1), payload TEXT NOT NULL,
  fetched_at TEXT NOT NULL)`, escritura con `INSERT OR REPLACE` en una transacción. La
  lectura valida con `parseCatalog`; un payload ilegible devuelve `null`, no lanza.
  No se usa SQLCipher ni `SecureStore`.
- `resourceCacheStorage.web.ts`: `createWebResourceCache(storage)` con un almacenamiento
  inyectable (como `createWebEventStore`) y la clave `duocmind.wellness.resources.v1`,
  sobre `window.localStorage`. Sin almacenamiento disponible, la caché se comporta como
  vacía.
- `resourceCatalogStore.ts`: guarda en memoria el último `CatalogResult` y la hora de la
  última descarga, con `subscribe`, `getSnapshot` y una descarga en curso compartida (dos
  llamadas simultáneas reutilizan la misma promesa).

### Hook — `useResourceCatalog`

`useResourceCatalog({ refreshOnFocus })` usa `useSyncExternalStore` sobre el almacén y
devuelve `{ result, loading, refresh }`. Con `refreshOnFocus` llama a `useFocusEffect`
y descarga si `shouldRefresh` lo permite. El detalle lo usa sin refresco: lee lo que
haya en memoria y, si la app se abrió directo en el detalle, carga una vez. `refresh()`
es el reintento de los estados de error.

### Presentación

- `ResourcesSection`: título «Recursos», chips, lista y estados (carga con `GotaLoader`,
  vacío, error con «Reintentar» y aviso de copia con la fecha). Mantiene el chip
  seleccionado en estado local (`null` = «Todos»); si la categoría elegida desaparece
  tras una actualización, vuelve a «Todos».
- `ResourceChips`: `ScalePress` con `accessibilityRole="button"`,
  `accessibilityState={{ selected }}`, `minHeight` de 44 y fila que se desplaza en
  horizontal; la selección se distingue también por el texto en negrita y el borde, no
  solo por el color.
- `ResourceRow`: `ScalePress` con miniatura, título, descripción a dos líneas y la
  palabra «Video». Etiqueta accesible con título y categoría.
- `ResourceThumb`: `Image` con la URL pública; mientras carga, y si `onError` o la ruta
  es `null`, muestra un marcador con el tono e icono de la categoría. La etiqueta
  accesible lleva el título.
- `ResourceDetailScreen`: imagen grande con el mismo marcador, título, descripción,
  contenido, categorías como etiquetas, «Ver video» (solo con `videoUrl`) con el texto
  «Se abre en tu navegador», el aviso de orientación general y un enlace a las líneas de
  ayuda (`/wellness/crisis-resources`). Botón para volver. Un recurso que ya no existe
  muestra «Este recurso ya no está disponible» con un botón para volver.
- Todo movimiento sale de `motionTokens.ts`: `Reveal` para la sección y la lista,
  `ScalePress` en chips, filas y botones, `GotaLoader` para la carga, todo con
  `useReducedMotion`. Cambiar de chip no anima.

## 4. Integración con Bienestar

- Se elimina el arreglo `tools`, su cuadrícula y los estilos y íconos que solo ellos
  usaban (`toolsGrid`, `toolTile`, `toolBreathe`, `toolStudy`, `toolJournal`,
  `toolStretch`, `toolTitle`, `toolDesc`).
- En su lugar se monta `<ResourcesSection />` bajo el test mensual, antes de «Para esta
  semana».
- Eventos, el test mensual y «Para esta semana» no cambian.
- Se agrega la ruta `src/app/(app)/wellness/resources/[id].tsx`.

## 5. Estados y casos límite

| Situación | Tratamiento |
| --- | --- |
| Primera apertura con conexión | `loading` → `ready` con `source: 'remote'`; se guarda la copia |
| Primera apertura sin conexión y sin copia | `error` con «Reintentar» |
| Con copia y sin conexión | `ready` con `source: 'cache'`, aviso con la fecha |
| Respuesta malformada | Se trata como fallo; la copia anterior se conserva |
| Una fila inválida | Se descarta esa fila; el resto se muestra |
| Catálogo vacío | `empty`: «Pronto habrá recursos aquí», sin chips |
| Categoría sin recursos | No aparece como chip |
| Categoría elegida que desaparece al actualizar | Se vuelve a «Todos» |
| Imagen que no carga o ruta insegura | Marcador con tono e icono |
| `video_url` no `https` | No se muestra «Ver video» |
| Falla al abrir el video | Mensaje en español; el detalle sigue abierto |
| Falla al escribir la copia | Se ignora; la sección sigue mostrando lo descargado |
| Copia ilegible | Se trata como inexistente |
| Volver del detalle en menos de 60 s | No descarga de nuevo |
| Deep link a un recurso inexistente | «Este recurso ya no está disponible» |

## 6. Modelo de amenazas y riesgos

El contenido es público. El único dato que podría ser sensible es el **interés de la
persona**: qué categorías y recursos consulta.

- **Rastro de consultas.** No se registra ni se envía nada de lo que la persona elige
  (RF-008). Los chips y el detalle filtran en el cliente sobre datos ya descargados. La
  única solicitud de red es la descarga completa del catálogo, idéntica para todos. El
  recorrido web comprueba las solicitudes (CA-012).
- **Contenido malicioso en el catálogo.** `imagen_path` y `video_url` los escribe el
  personal con `service_role`, pero se validan igual: ruta relativa y sin `..`, video
  solo `https://`. El detalle muestra texto plano, sin interpretar HTML ni enlaces
  dentro de `contenido`.
- **Apertura de enlaces externos.** Solo con `https://`, con el aviso previo de que se
  abre un sitio externo, y sin enviar datos de la persona.
- **Copia local manipulada o corrupta.** Se valida al leer con el mismo `parseCatalog`; un
  documento ilegible se ignora. No contiene datos personales.
- **Catálogo desactualizado sin que se note.** Siempre se indica el origen y la fecha
  cuando se usa la copia.
- **Claves y permisos.** Solo la clave publicable; no se usa `service_role`. Un anónimo no
  puede escribir (se comprueba en la prueba SQL/HTTP, CA-013).
- **Catálogo vacío en producción.** No hay forma de cargarlo desde el panel; la sección
  mostrará su estado vacío hasta que Bienestar lo llene (spec, hallazgo 1).
- **Imágenes sin conexión.** No se guardan; se ve el marcador. Aceptado en la spec.
- **Validación en Android.** Sigue siendo obligatoria para cerrar la spec. El entorno
  actual no compila el build nativo (fallo de `Selector.open()` de Java en Windows, ver
  spec 010); la spec no puede cerrarse sin esa prueba.

## 7. Cobertura de la spec

| Requisito | Decisión y componente |
| --- | --- |
| RF-001 | Sección en `WellnessScreen`, sin bloquear el resto |
| RF-002 | `categoriesWithResources`, `ResourceChips` |
| RF-003 | `filterResources`, orden en `parseCatalog`, `ResourceRow` |
| RF-004 | `isSafeImagePath`, `ResourceThumb`, `publicImageUrl` |
| RF-005 | `ResourceDetailScreen`, ruta `resources/[id]` |
| RF-006 | `loadResourceCatalog` (estados), `ResourcesSection` |
| RF-007 | `ResourceCache`, `resourceCacheStorage.*`, `shouldRefresh` |
| RF-008 | Sin analítica; solo una descarga genérica; logs sin contenido |

## 8. Verificación y trazabilidad

Pruebas automatizadas (`node --test`, con datos sintéticos y almacenamiento simulado):

- `tests/wellnessResource.test.mjs` (dominio): `parseCatalog` con documento válido,
  filas inválidas descartadas, contenedor inválido, `video_url` no `https`, ruta de
  imagen insegura, ids de categoría inexistentes y orden; `isSafeImagePath` con rutas
  válidas y con esquema, `..`, `//`, `\`, vacías y largas; `categoriesWithResources` y su
  orden; `filterResources` con «Todos», una categoría y un recurso en dos categorías;
  `categoryTone` estable y cíclico; `categoryIconKey` con tildes y mayúsculas y el
  respaldo; `findResource`.
- `tests/wellnessCatalog.test.mjs` (aplicación): descarga correcta y escritura de la
  copia; descarga fallida con copia; sin copia; copia ilegible; respuesta malformada que
  conserva la copia; catálogo vacío; fallo de escritura ignorado; `shouldRefresh` en el
  límite de 60 s.
- `tests/wellnessResourceCache.web.test.mjs` (almacenamiento): guarda y lee, admite una
  carga de más de 2 KB (CA-011), un valor corrupto devuelve `null`, y una escritura que
  falla no corrompe la copia previa.
- `tools/tests/wellness-resources.mjs` (backend local, agregado a la lista de
  `backend-tests.mjs`): un anónimo y un estudiante leen solo herramientas activas y sus
  categorías, no ven filas de la pivote de herramientas inactivas, y no pueden insertar,
  actualizar ni borrar en `herramienta`, `tipo_herramienta` ni la pivote (CA-013).
- `tools/scripts/wellness-fixtures.mjs` (solo local, con `requireLocal`): crea seis
  herramientas sintéticas con relaciones, una inactiva y una con ruta de imagen
  inválida, para los recorridos y la prueba de backend.

Comprobaciones de tipos y regresión: `npm run typecheck`, `npm test` y
`npm --prefix tools run test:backend`.

Recorrido en la web (previsualización con Supabase local y datos sintéticos), registrado
en `specs/018-wellness-resources/verification.md`:

1. Bienestar muestra «Recursos» bajo el test y no las «Herramientas rápidas».
2. Chips en el orden esperado; «Todos» seleccionado; un chip filtra; un recurso en dos
   categorías aparece en ambas.
3. Filas con título, descripción y «Video»; sin descripción, sin hueco.
4. Imagen inexistente y ruta insegura: marcador, sin romper la lista.
5. Detalle: campos presentes, aviso, «Ver video» solo con `https`, enlace a líneas de
   ayuda; recurso inexistente por URL directa.
6. Catálogo vacío, y error con reintento (backend detenido).
7. Sin conexión con copia: lista y aviso con fecha; fallo de red y respuesta malformada
   conservan la copia.
8. Solicitudes de red: solo las dos lecturas del catálogo; ninguna con el recurso o
   categoría elegidos (CA-012).
9. Eventos, test mensual y «Para esta semana» sin cambios.

Recorrido en Android, pendiente del entorno: los mismos puntos con el build nativo,
incluida la copia en SQLite y el modo avión, TalkBack, texto al 200 % y movimiento
reducido.

| Criterio | Comprobación |
| --- | --- |
| CA-001 | Recorrido web 1 y Android |
| CA-002 | `wellnessResource.test.mjs` y recorrido 2 |
| CA-003 | `wellnessResource.test.mjs` y recorrido 2 |
| CA-004 | `wellnessCatalog.test.mjs`, `wellness-resources.mjs` |
| CA-005 | Recorrido 3 |
| CA-006 | `wellnessResource.test.mjs` y recorrido 4 |
| CA-007 | `wellnessResource.test.mjs` y recorrido 5 |
| CA-008 | Recorrido 5 |
| CA-009 | `wellnessCatalog.test.mjs` y recorrido 6 |
| CA-010 | `wellnessCatalog.test.mjs`, recorrido 7 y Android |
| CA-011 | `wellnessResourceCache.web.test.mjs` |
| CA-012 | Revisión del código y recorrido 8 |
| CA-013 | `wellness-resources.mjs` |
| CA-014 | Recorrido Android |
| CA-015 | `npm test`, `npm run typecheck`, recorrido 9 y Android |

## 9. Reversión

Revertir el commit del incremento. No hay migraciones, dependencias ni cambios
remotos. La base SQLite y la clave de `localStorage` de la copia quedan inertes y
desaparecen al desinstalar la app. Las «Herramientas rápidas» vuelven con el commit
revertido.

## 10. Fuentes y estado de la entrega

Fuentes: `AGENTS.md`, `docs/constitution.md` 2.0.0, `specs/018-wellness-resources/spec.md`
y el código y las migraciones citados en §2.

Estado: plan aprobado el 2026-11-07. No se ha escrito código.

### Historial de revisiones

- **0.1.0 — 2026-11-07:** borrador inicial, aprobado ese día.

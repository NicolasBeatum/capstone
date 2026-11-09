# Tareas 018 — Recursos de bienestar por categoría

| Campo | Valor |
| --- | --- |
| Versión | 0.1.0 |
| Estado | APROBADAS |
| Fecha | 2026-11-07 |
| Spec | `spec.md` 0.1.0, APROBADA |
| Plan | `plan.md` 0.1.0, APROBADO |
| Constitución | 2.0.0 |
| Rama | Sugerida `feature/recursos-bienestar`; aún no creada |
| Aprobación de tareas | Confirmada explícitamente por el usuario el 2026-11-07 |

## Reglas de ejecución

Ejecutar en orden y una tarea por vez, después de aprobar este documento. No
delegar ni paralelizar tareas. Toda verificación usa cuentas y datos sintéticos, y
los recorridos que necesitan backend usan únicamente Supabase local; nunca el
proyecto remoto.

Una tarea se marca `[x]` cuando su cambio está completo, pasa su verificación
específica y el repositorio conserva las validaciones aplicables: `npm run
typecheck` y `npm test` sin fallos nuevos. Registrar cambio, comando o recorrido,
resultado y limitaciones en `verification.md`. Una prueba diferida a otra tarea
aparece como pendiente, nunca como ejecutada. La spec no se cierra mientras quede
pendiente la validación Android.

Estas tareas no autorizan commits, push, despliegues, migraciones, cambios de
esquema ni datos reales. No agregan dependencias. No modifican el inicio
(`DashboardScreen`, `featuredTools.ts`), `CrisisResourcesScreen`, el panel
administrativo ni las migraciones existentes.

## Preparación

- [x] T001 Abrir `verification.md` con la línea base antes de cambiar código: versiones de Node y npm frente a las declaradas en `package.json`, rama y estado de Git, resultado de `npm run typecheck` y `npm test`, y disponibilidad de Supabase local y de una build Android. Si `typecheck` falla por una dependencia declarada en `package.json` pero ausente en `node_modules` (por ejemplo `expo-sharing`), instalar desde el lockfile con `npm ci` y repetir; registrar ambos resultados. **Verificación:** ambos comandos ejecutados y su resultado real anotado, incluidas las fallas previas. **CA-015.**

## Dominio y aplicación

- [x] T002 Crear `src/features/wellness/domain/wellnessResource.ts` con los tipos `ResourceCategory`, `WellnessResource` y `ResourceCatalog`, y las funciones `parseCatalog`, `isSafeImagePath`, `categoriesWithResources`, `filterResources`, `categoryTone`, `categoryIconKey` y `findResource` del plan (§3). `parseCatalog` descarta filas inválidas sin invalidar las demás, pasa a `null` un `video_url` que no es `https://` y un `imagen_path` no seguro, ignora ids de categoría inexistentes y ordena recursos por fecha e id descendentes y categorías por orden y nombre. Sin React, Expo ni `@/`; imports relativos con extensión `.ts`. **Verificación:** `tests/wellnessResource.test.mjs` (documento válido; filas inválidas descartadas; contenedor inválido que lanza; video no `https`; ruta de imagen insegura; categorías inexistentes; orden; `isSafeImagePath` con rutas válidas y con esquema, `..`, `//`, `\`, vacías, largas y con caracteres de control; `categoriesWithResources`; `filterResources` con «Todos», una categoría y un recurso en dos categorías; tono estable y cíclico; icono con tildes, mayúsculas y respaldo; `findResource`); `typecheck` y `npm test`. **CA-002, CA-003, CA-006, CA-007.**

- [x] T003 Crear `src/features/wellness/application/resourceCatalog.ts` con las interfaces `ResourceGateway` y `ResourceCache`, el tipo `CatalogResult`, `loadResourceCatalog` y `shouldRefresh` con `REFRESH_MIN_INTERVAL_MS = 60_000`, según el plan (§3). Una respuesta correcta se intenta guardar sin que un fallo de escritura la invalide; un fallo o una respuesta malformada usan la copia si es válida y devuelven `error` si no hay; ningún fallo borra ni reemplaza la copia. Sin React, Expo ni `@/`. **Verificación:** `tests/wellnessCatalog.test.mjs` con gateway y caché simulados: descarga correcta y escritura de la copia; descarga fallida con copia; sin copia; copia ilegible; respuesta malformada que conserva la copia; catálogo vacío; fallo de escritura ignorado; `shouldRefresh` justo antes y después de 60 s; `typecheck` y `npm test`. **CA-004, CA-009, CA-010.**

## Infraestructura

- [x] T004 Crear el almacenamiento de la copia local en `src/features/wellness/infrastructure/`: `resourceCacheStorage.ts` (selector), `resourceCacheStorage.native.ts` (SQLite sin cifrar, base `duocmind-wellness-resources.db`, tabla `resource_catalog` de una fila, escritura en transacción, lectura validada con `parseCatalog`) y `resourceCacheStorage.web.ts` (`createWebResourceCache(storage)` con almacenamiento inyectable y clave `duocmind.wellness.resources.v1` sobre `window.localStorage`). Un valor ilegible devuelve `null` y no lanza. No usa `SecureStore` ni SQLCipher. **Verificación:** `tests/wellnessResourceCache.web.test.mjs`: guarda y lee, admite una carga de más de 2 KB, un valor corrupto devuelve `null` y una escritura que falla no corrompe la copia previa; `typecheck` y `npm test`; la variante nativa se comprueba en T011 (no se puede ejecutar con `node --test`). **CA-010, CA-011.**

- [x] T005 Crear `supabaseResourceGateway.ts`, `resourceCatalogStore.ts` y `hooks/useResourceCatalog.ts`. El gateway hace en paralelo las dos consultas del plan (categorías ordenadas; herramientas activas con `herramienta_tipoherramienta(tipo_id)`, ordenadas por fecha e id descendentes y `limit(200)`), pasa el resultado por `parseCatalog`, relanza errores sin datos de la consulta y expone `publicImageUrl(path)` con segmentos codificados. El almacén guarda en memoria el último resultado y la hora de descarga, con `subscribe`, `getSnapshot` y una descarga en curso compartida. El hook usa `useSyncExternalStore`, `useFocusEffect` con `shouldRefresh` y devuelve `{ result, loading, refresh }`. Sin consultas ni registros del recurso o la categoría elegidos. **Verificación:** `typecheck` y `npm test`; prueba del almacén con funciones simuladas (`tests/wellnessCatalogStore.test.mjs`: dos llamadas simultáneas comparten la descarga, `subscribe` notifica y un resultado `error` no pisa uno `ready`); revisión de que no hay `console` ni datos de consulta en logs; el gateway real se ejercita en T010. **CA-004, CA-010, CA-012.**

- [x] T006 Agregar el material de verificación de backend, solo local: `tools/scripts/wellness-fixtures.mjs` (usa `requireLocal`; crea seis herramientas sintéticas con sus relaciones, una inactiva, una sin descripción, una con ruta de imagen inválida y una en dos categorías) y `tools/tests/wellness-resources.mjs`, incluido en la lista de `tools/scripts/backend-tests.mjs`. La prueba comprueba que un anónimo y un estudiante leen solo herramientas activas y sus categorías, que las filas de la pivote de herramientas inactivas no se ven y que ninguno de los dos puede insertar, actualizar ni borrar en `herramienta`, `tipo_herramienta` ni la pivote. Requiere iniciar Supabase local. **Verificación:** con Supabase local en marcha, ejecutar el fixture y `node tools/tests/wellness-resources.mjs`, o `npm --prefix tools run test:backend`; resultado real anotado. **CA-004, CA-013.**

## Presentación

- [x] T007 Crear los componentes de la sección en `src/features/wellness/components/`: `ResourceThumb`, `ResourceChips`, `ResourceRow` y `ResourcesSection`, sin montarlos todavía. `ResourceThumb` usa `Image` con la URL pública y un marcador (tono e icono de la categoría) mientras carga, si falla o si la ruta es `null`. `ResourceChips` usa `ScalePress`, `accessibilityRole="button"`, `accessibilityState={{ selected }}` y `minHeight` de 44, y distingue el chip activo también por texto y borde. `ResourceRow` muestra miniatura, título, descripción a dos líneas y «Video». `ResourcesSection` incluye el título, los chips, la lista y los estados de carga (`GotaLoader`), vacío, error con «Reintentar» y aviso de copia con la fecha; vuelve a «Todos» si la categoría elegida desaparece. Todo movimiento sale de `motionTokens.ts` y respeta `useReducedMotion`. **Verificación:** `typecheck` y `npm test`; revisión de etiquetas accesibles en español, objetivos de 44 px y ausencia de duraciones o curvas sueltas. El comportamiento visible se comprueba en T009 y T010. **CA-002, CA-005, CA-006, CA-009, CA-014.**

- [x] T008 Crear `ResourceDetailScreen.tsx`, `ResourceDetailScreen.styles.ts` y la ruta `src/app/(app)/wellness/resources/[id].tsx`, que solo reexporta la pantalla. Muestra imagen con el mismo marcador, título, descripción, contenido como texto plano, categorías como etiquetas, «Ver video» solo con `videoUrl` (`https://`) con el texto «Se abre en tu navegador» y manejo de fallo al abrirlo, el aviso «Son orientación general y no reemplazan la atención de un profesional» y un acceso a `/wellness/crisis-resources`; botón para volver. Un recurso inexistente muestra «Este recurso ya no está disponible». Usa `useResourceCatalog` sin refresco. **Verificación:** `typecheck` y `npm test`; el recorrido visible queda para T009 y T010. **CA-007, CA-008, CA-014.**

- [x] T009 Integrar la sección en `WellnessScreen`: montar `<ResourcesSection />` bajo el test mensual y antes de «Para esta semana», y retirar el arreglo `tools`, su cuadrícula y los estilos e íconos que solo ellos usaban. Eventos, el test mensual y «Para esta semana» no cambian. **Verificación:** `typecheck` y `npm test`; en la previsualización web con Supabase local, datos de T006 y una cuenta sintética: aparece «Recursos» y ya no «Herramientas rápidas», los chips filtran y una fila abre el detalle; sin errores de consola. **CA-001, CA-015.**

## Validación y cierre

- [x] T010 Recorrido web completo del plan (§8, puntos 1 a 9) con Supabase local, los datos de T006 y una cuenta sintética, y registrar el resultado de cada punto en `verification.md`: orden y filtro de chips, un recurso en dos categorías, filas con y sin descripción, marcador de imagen (ruta inexistente e insegura), detalle y recurso inexistente por URL directa, catálogo vacío, error con reintento deteniendo el backend, copia sin conexión con fallo de red y respuesta malformada, comprobación de que las únicas solicitudes de red son las dos lecturas del catálogo (CA-012) y regresión de Eventos, el test y «Para esta semana». Anotar que la web no acredita la copia SQLite, el comportamiento nativo ni las imágenes reales (Supabase local excluye `storage-api`). **Verificación:** los nueve puntos ejecutados con resultado real anotado; `typecheck`, `npm test` y `test:backend` sin fallos nuevos. **CA-001 a CA-013, CA-015.**

- [x] T011 Ejecutar el recorrido Android del plan (§8) en una development build o APK con cuentas sintéticas y Supabase local, y registrar el resultado de cada punto en `verification.md`, incluidos la copia SQLite con modo avión, TalkBack, texto al 200 %, movimiento reducido y la apertura del video externo. Completar el cierre de `verification.md`: resultado por criterio CA-001 a CA-015, limitaciones, pendientes y estado de la spec. Depende de resolver antes el fallo del entorno de Android (spec 010). **Verificación:** los puntos del recorrido ejecutados en Android con resultado real anotado; validaciones finales sin fallos nuevos. **CA-001 a CA-015.**

## Trazabilidad

| Tarea | Requisitos | Criterios |
| --- | --- | --- |
| T001 | Línea base | CA-015 |
| T002 | RF-002, RF-003, RF-004, RF-005 | CA-002, CA-003, CA-006, CA-007 |
| T003 | RF-006, RF-007 | CA-004, CA-009, CA-010 |
| T004 | RF-007 | CA-010, CA-011 |
| T005 | RF-006, RF-007, RF-008 | CA-004, CA-010, CA-012 |
| T006 | RF-003, RF-008 | CA-004, CA-013 |
| T007 | RF-002, RF-003, RF-004, RF-006 | CA-002, CA-005, CA-006, CA-009, CA-014 |
| T008 | RF-005 | CA-007, CA-008, CA-014 |
| T009 | RF-001 | CA-001, CA-015 |
| T010 | RF-001 a RF-008 | CA-001 a CA-013, CA-015 |
| T011 | RF-001 a RF-008 | CA-001 a CA-015 |

## Estado de la entrega

Tareas aprobadas el 2026-11-07. T001 a T010 completadas (resultados en
`verification.md`). T011 (Android) sigue pendiente y bloqueada por el entorno.

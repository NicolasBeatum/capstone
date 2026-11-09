# Spec 018 — Recursos de bienestar por categoría

| Campo | Valor |
| --- | --- |
| Versión | 0.1.0 |
| Estado | APROBADA |
| Fecha | 2026-11-07 |
| Incremento | 018-wellness-resources |
| Constitución | 2.0.0 |
| Plataformas | Android y previsualización web |
| Aprobación | Confirmada explícitamente por el usuario el 2026-11-07 |

## 1. Problema y resultado esperado

La pantalla Bienestar muestra hoy cuatro «Herramientas rápidas» (Respira, Modo
estudio, Diario y Pausa activa) que son tarjetas sin ninguna acción. Mientras
tanto, la base de datos ya tiene el modelo de herramientas de bienestar
(`herramienta`, `tipo_herramienta` y su relación muchos a muchos), con lectura
pública de lo activo, pero la aplicación no lo consulta: el inicio usa datos
estáticos de prueba con la misma forma que la RPC `herramientas_home()`.

La persona necesita encontrar recursos de ayuda (estrés, ansiedad, apoyo al
estudio, salud física) sin salir de Bienestar. Este incremento agrega la sección
«Recursos», que muestra esos recursos con chips de categoría y una lista, y abre
el detalle de cada uno.

Resultado observable: en Bienestar, bajo el test mensual, aparece «Recursos» con
los chips «Todos» y una categoría por cada `tipo_herramienta`. Tocar una
categoría filtra la lista; tocar un recurso abre su detalle. Sin conexión se ve
la última lista descargada.

## 2. Alcance propuesto

- Sección «Recursos» en Bienestar, con el diseño de la **opción A** elegida por
  el usuario: fila de chips de categoría y, debajo, lista de recursos.
- Categorías tomadas de `tipo_herramienta`, ordenadas por `orden` y nombre.
- Lista de las herramientas activas con miniatura, título, descripción breve e
  indicador de video.
- Pantalla de detalle del recurso con imagen, título, descripción, contenido,
  categorías y enlace externo al video cuando exista.
- Lectura desde Supabase con las políticas existentes y copia local de la última
  lista descargada para usarla sin conexión.
- Estados de carga, vacío, error y sin conexión.
- Retirar las cuatro «Herramientas rápidas» sin acción.
- Verificaciones reproducibles con datos sintéticos.

Fuera de alcance:

- Crear, editar o desactivar herramientas. Hoy solo `service_role` puede
  escribirlas y el panel no tiene ruta para ello; el contenido inicial lo carga
  Bienestar fuera de este incremento.
- Reemplazar los datos estáticos del inicio por `herramientas_home()`.
- Búsqueda, favoritos, recomendaciones según el ánimo y cualquier personalización.
- Descargar o alojar video: el video es siempre un enlace externo.
- Guardar imágenes para uso sin conexión.
- Cambios de esquema, migraciones remotas y despliegues.
- Las líneas de ayuda y emergencia (`CrisisResourcesScreen`), que siguen
  distribuidas con la app.

## 3. Requisitos funcionales

### RF-001 — Ubicación

1. «Recursos» aparece en Bienestar debajo del test mensual y reemplaza a
   «Herramientas rápidas». El resto de la pantalla (Eventos, test, «Para esta
   semana») conserva su contenido y comportamiento.
2. La sección tiene título «Recursos» y no bloquea el resto de la pantalla
   mientras carga.

### RF-002 — Categorías

1. Los chips son «Todos» y una categoría por cada `tipo_herramienta` que tenga al
   menos un recurso activo. Los nombres vienen del servidor, no del código.
2. Se ordenan por `orden` y, a igualdad, por nombre. «Todos» va siempre primero y
   está seleccionado al abrir.
3. Solo hay un chip seleccionado a la vez. Cambiarlo filtra la lista sin volver a
   descargar y conserva la posición de la pantalla.
4. Cada chip tiene al menos 44 px de alto, rol de botón y estado seleccionado
   para lectores de pantalla.

### RF-003 — Lista

1. Se listan solo herramientas con `activo` verdadero, de la más reciente a la más
   antigua (`created_at` y, a igualdad, `id`).
2. Cada fila muestra miniatura, título, descripción en hasta dos líneas y la
   palabra «Video» cuando existe `video_url`. Una descripción ausente no deja un
   hueco ni inventa texto.
3. Un recurso con varias categorías aparece una vez en «Todos» y una vez en cada
   una de sus categorías.
4. Tocar una fila abre el detalle de ese recurso.
5. Si una categoría no tiene recursos tras filtrar, se informa «No hay recursos
   en esta categoría».

### RF-004 — Imágenes

1. La miniatura y la imagen del detalle se obtienen del bucket público
   `herramientas` a partir de `imagen_path`.
2. `imagen_path` se trata como una ruta relativa: se rechazan rutas absolutas, con
   esquema, con `..` o vacías, y esa fila muestra el marcador sin intentar cargar.
3. Mientras la imagen carga, o si no puede cargarse (sin conexión, error), se
   muestra un marcador con el tono de la categoría y su icono; la lista sigue
   siendo usable.
4. Las imágenes tienen etiqueta accesible con el título del recurso.

### RF-005 — Detalle

1. El detalle muestra imagen, título, descripción, contenido y las categorías a
   las que pertenece. Los campos vacíos no se muestran.
2. Si hay `video_url` con esquema `https://`, se ofrece «Ver video». La acción
   informa que abre un sitio externo y lo abre fuera de la app. Un fallo al abrirlo
   se informa en español y no cierra el detalle.
3. El detalle se puede abrir sin conexión con lo guardado; «Ver video» requiere
   conexión y lo comunica.
4. Incluye un aviso breve que distingue estos recursos de la atención
   profesional («Son orientación general y no reemplazan la atención de un
   profesional») y un acceso a las líneas de ayuda existentes.
5. Cada pantalla tiene botón para volver a Bienestar.

### RF-006 — Estados

1. **Carga:** `GotaLoader` dentro de la sección, sin bloquear el resto de Bienestar.
2. **Vacío:** si no hay recursos activos, se informa en español claro («Pronto
   habrá recursos aquí») y no se muestran chips.
3. **Error:** si la descarga falla y no hay copia local, se informa el problema y
   se ofrece reintentar.
4. **Sin conexión:** con copia local se muestra y se indica que puede no estar al
   día; sin copia se trata como error con reintento.

### RF-007 — Copia local

1. Tras una descarga válida se conserva localmente la lista de recursos y sus
   categorías, con la fecha de la última actualización.
2. Con conexión, la copia se actualiza al abrir Bienestar sin que la persona deba
   pedirlo. Un fallo de red nunca borra la última copia válida.
3. Una respuesta del servidor malformada no reemplaza una copia válida.
4. El contenido es público y no contiene datos personales ni emocionales, por lo
   que la copia no se asocia a una cuenta. El plan debe elegir un almacenamiento
   que admita más de 2 KB por valor (ver hallazgo 3).

### RF-008 — Privacidad

1. La aplicación no registra ni envía qué recursos consulta o qué categorías
   elige la persona: el interés por un tema de bienestar puede ser sensible.
2. Las lecturas usan únicamente la clave publicable y las políticas de lectura
   existentes; no se usan claves privilegiadas en el cliente.
3. Logs y errores no incluyen contenido de las consultas de la persona.

## 4. Requisitos no funcionales

- **Arquitectura.** Dentro de `features/wellness/`, con `domain`, `application` e
  `infrastructure`. La pantalla no consulta Supabase ni el almacenamiento
  directamente; usa un caso de uso con gateways. Las rutas en `src/app/` solo
  reexportan pantallas.
- **Validación en los límites.** La respuesta del servidor se valida antes de
  usarse: tipos, `https://` en el video y ruta de imagen.
- **Accesibilidad.** Etiquetas en español, objetivos táctiles de al menos 44 px,
  chips con estado seleccionado, texto legible con tamaño ampliado y sin que el
  color sea el único indicador de categoría.
- **Movimiento.** Entrada con `Reveal`, botones y filas con `ScalePress`, carga con
  `GotaLoader`; todo respeta `useReducedMotion`.
- **Proporcionalidad.** Solo lectura, sin tablas nuevas ni dependencias nuevas
  salvo que el plan las justifique.
- **Tono no clínico.** Los textos orientan y no prometen diagnóstico ni
  tratamiento (constitución, principio I).

## 5. Hallazgos que condicionan el plan

1. **El catálogo está vacío y no hay forma de llenarlo desde el panel.**
   `herramienta` solo se escribe con `service_role`. Sin datos, la sección
   mostraría siempre su estado vacío en producción hasta que Bienestar los cargue.
   La verificación necesita datos sintéticos.
2. **Nombre de la relación.** La migración inicial creó `herramienta_tipo` y la
   migración `20261105120000` la renombra a `herramienta_tipoherramienta`. El plan
   debe confirmar el nombre vigente en la base antes de escribir la consulta.
3. **`expo-secure-store` limita cada valor a unos 2 KB.** Una lista de recursos con
   `contenido` lo supera con facilidad. El almacenamiento del `platformSecureKeyValueStorage`
   no sirve para la copia local; el plan debe usar otro mecanismo (por ejemplo
   SQLite sin cifrar, ya que el contenido es público) y definir su equivalente en
   la previsualización web.
4. **Las imágenes son remotas** (bucket público, hasta 500 KB cada una). Sin
   conexión no se muestran; de ahí el marcador de RF-004.
5. **Un solo origen del límite de filas.** La API devuelve como máximo 1000 filas
   (`max_rows`). Es improbable alcanzarlo, pero el plan debe decidir si pagina.
6. **Coherencia con el inicio.** El inicio usa `featuredTools.ts` con datos
   estáticos. Esta spec no lo toca, pero los dos deberán leer la misma fuente
   cuando se conecte `herramientas_home()`.
7. **Las «Herramientas rápidas» eran una idea de producto** (respirar, estudiar con
   Pomodoro, diario, pausa activa), no solo relleno. Retirarlas elimina esa idea
   de la pantalla; si Bienestar quiere herramientas interactivas, serían otra spec.

## 6. Criterios de aceptación

| ID | Resultado observable | Verificación prevista |
| --- | --- | --- |
| CA-001 | Bienestar muestra «Recursos» bajo el test y ya no muestra «Herramientas rápidas». | Comprobación en pantalla web y Android. |
| CA-002 | Los chips son «Todos» más las categorías con recursos activos, en orden de `orden` y nombre; «Todos» arranca seleccionado. | Prueba de dominio con datos sintéticos. |
| CA-003 | Elegir una categoría filtra la lista; un recurso con dos categorías aparece en ambas y una vez en «Todos». | Prueba de dominio. |
| CA-004 | Solo se listan herramientas activas, de la más reciente a la más antigua. | Prueba de caso de uso y consulta local. |
| CA-005 | Cada fila muestra miniatura, título, descripción (≤ 2 líneas) e indicador de video; sin descripción no hay hueco. | Comprobación en pantalla. |
| CA-006 | Una ruta de imagen inválida o una imagen que no carga muestra el marcador y no rompe la lista. | Prueba de dominio y recorrido sin red. |
| CA-007 | El detalle muestra los campos presentes y oculta los vacíos; «Ver video» solo con `https://` y abre un sitio externo. | Prueba de dominio y comprobación en pantalla. |
| CA-008 | El detalle incluye el aviso de orientación general y el acceso a las líneas de ayuda. | Comprobación en pantalla. |
| CA-009 | Con el catálogo vacío se muestra el estado vacío y no hay chips; un error con reintento recupera la lista. | Prueba de caso de uso y recorrido. |
| CA-010 | Tras una descarga válida, sin conexión se muestra la última lista con aviso; un fallo de red o una respuesta malformada no borra la copia. | Prueba de almacenamiento y prueba en Android. |
| CA-011 | La copia local admite listas de más de 2 KB. | Prueba de almacenamiento con datos sintéticos grandes. |
| CA-012 | Ningún dato de qué recurso o categoría se consulta se registra ni se envía. | Revisión del código y de las solicitudes del recorrido web. |
| CA-013 | Un anónimo no puede escribir en las tablas de herramientas; la lectura solo devuelve activas. | Prueba SQL/HTTP local con cuentas y datos sintéticos. |
| CA-014 | Con movimiento reducido, texto ampliado y lector de pantalla, la sección es usable. | Recorrido Android con cada opción activa. |
| CA-015 | Eventos, el test mensual y «Para esta semana» conservan su comportamiento. | Typecheck, pruebas de la app y recorrido Android. |

## 7. Decisiones propuestas y aprobación

Decididas por el usuario el 2026-11-07:

1. **Diseño: opción A** (chips de categoría y lista).
2. **Categorías: `tipo_herramienta`.** Esa es la tabla vigente; no existe una
   tabla `categoria_herramienta`.

Propuestas, abiertas a corrección antes de aprobar:

3. **Detalle en pantalla propia** (`/wellness/resources/[id]`), en vez de abrir el
   video directamente desde la lista. Permite leer el `contenido` y mostrar el
   aviso de RF-005.4.
4. **Orden por fecha**, de lo más nuevo a lo más antiguo, porque las herramientas
   no tienen un campo de orden propio.
5. **Chips solo con recursos**, para no mostrar categorías vacías.
6. **Copia local de la lista, sin imágenes.** Mantiene la sección usable sin red
   a bajo costo; las imágenes quedan como marcador.
7. **Sin analítica de consulta** (RF-008): no se mide qué recursos se ven.
8. **Retirar las «Herramientas rápidas»** en lugar de convivir con la sección
   nueva, porque no tienen acción y ocuparían el mismo lugar.

Esta spec fue aprobada explícitamente por el usuario el 2026-11-07, con las
decisiones anteriores tal como están redactadas. Conforme a la constitución y a
`AGENTS.md`, el plan se redacta después de esta aprobación; las tareas, después de
aprobar el plan, y la implementación, después de aprobar las tareas. No autoriza
migraciones remotas, despliegues, commits ni push.

## 8. Referencias

- Esquema: `supabase/migrations/20261104120000_sync_remote_schema.sql` (sección 6,
  herramientas), `20261105120000_rename_herramienta_tipo.sql` y
  `20261106140000_match_production_schema.sql` (carga de los cuatro tipos).
- Pantalla actual: `src/features/wellness/screens/WellnessScreen.tsx`.
- Datos estáticos del inicio: `src/features/dashboard/domain/featuredTools.ts`.
- Maquetas de la opción A: presentadas al usuario el 2026-11-07.

### Historial de revisiones

- **0.1.0 — 2026-11-07:** borrador inicial, aprobado ese día.

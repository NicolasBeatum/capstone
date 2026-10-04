# Contratos implementados — revisión 0.2.0

Base local: `http://127.0.0.1:54321/functions/v1/admin-api`. JWT de Auth en `Authorization: Bearer …`; `apikey` publicable. Respuestas `Cache-Control: no-store`. Origen permitido: `ADMIN_WEB_ORIGIN`. La verificación de JWT ocurre en la función mediante Auth; el modo local `--no-verify-jwt` desactiva solo el chequeo del gateway, no la autorización de la aplicación.

Actor y sesión se obtienen exclusivamente del token verificado. Cada wrapper SQL invoker comprueba que la sesión Auth existe/no venció y que `private.admin_staff.enabled=true`. Los wrappers solo son ejecutables por `service_role`. No hay endpoints administrativos de permisos, historial emocional, resultados individuales ni derivaciones.

| Operación | Contrato |
| --- | --- |
| `GET /session` | `{allowed:true, capabilities:string[]}`. |
| `GET /students` | Filtros `search`, `careerId`, `campusId`, `page`, `pageSize`. `{items:[{id,name,email,career,campus}],total,page,pageSize}`. Correo de Auth o `null`, sin fallback al perfil. Página 1, tamaño 25, máximo 100. Búsqueda literal, máximo 100 caracteres. |
| `GET /catalogs` | `{careers,campuses,moods,resultLevels}`. Niveles publicados de versiones activas e históricas inactivas. |
| `GET /tests` | Array de catálogos con `catalogId`, `code`, `kind`, `activeVersionId` y `versions`. |
| `GET /tests/catalogs/:catalogId` | Un catálogo UUID con resúmenes de versiones. |
| `GET /tests/versions/:versionId` | `versionId`, `catalogId`, `version`, título/descripción, preguntas/opciones, niveles, cálculo, tipo, revisión, publicación y disponibilidad. IDs bigint decimales como cadenas. |
| `POST /tests` | `{requestId,title,description,questions,levels}` crea catálogo propio y versión 1 inactiva/en borrador. |
| `PUT /tests/versions/:versionId/draft` | Contenido completo más `requestId` y `expectedRevision`. Solo propio/en borrador. |
| `POST /tests/versions/:versionId/{clone,publish,activation}` | `requestId`, `expectedRevision`; activación añade `active:boolean`. Clonación solo para propios. Publicar no activa. |
| `GET /events`, `POST /events`, `PUT /events/:id` | Eventos UUID: `title`, `description`, `location`, `startsAt`, `endsAt`. Escrituras con `requestId`; edición añade revisión. Fechas con zona explícita. |
| `POST /events/:id/{publish,cancel}` | `requestId`, `expectedRevision`. Cancelación solo tras publicación; conserva contenido. |
| `GET /tips`, `POST /tips`, `PUT /tips/:id` | Tips bigint como cadenas: `title`, `content`, `rules`. Escrituras con `requestId`; edición añade revisión. |
| `POST /tips/:id/{publish,activation}` | `requestId`, `expectedRevision`; activación añade `active:boolean`. Publicar hace activo el tip. |
| `POST /students/:id/password-reset` | Solo `{requestId}`. Respuesta `{accepted:true}`; destinatario resuelto en servidor, sin enlace, correo ni token en respuesta. |

Mutaciones de contenido devuelven IDs y revisión mínimos: tests `{catalogId,versionId,revision}`, eventos/tips `{id,revision}`. El cliente vuelve a leer el recurso para confirmar su estado. La tabla de idempotencia guarda solo esos metadatos, una huella y tiempos; no copias de contenido.

Contenido de cuestionario: preguntas `{text,helper?,options:[{text,score}]}` y niveles `{key,label,content,min,max}`. Puntajes enteros 0–1000, mínimo dos opciones, textos/puntajes únicos por pregunta; máximo cien preguntas/niveles y veinte opciones por pregunta. Publicar exige niveles completos, sin huecos/solapamientos, que cubran todas las sumas mínima/máxima. Los nombres de instrumentos protegidos están reservados.

Reglas de tips:

```json
{"kind":"mood","mood":"Mal"}
```

```json
{"kind":"result","catalogId":"00000000-0000-0000-0000-000000000001","versionId":"12","version":2,"level":"general"}
```

`rules:[]` significa general; varias reglas son alternativas OR. La referencia de resultado debe corresponder exactamente al catálogo, versión y nivel publicados; admite versiones inactivas. Sin IDs de alumnos ni contexto emocional.

Toda escritura usa `requestId` UUID y la edición utiliza `expectedRevision` entero positivo. Repetir UUID/payload dentro de 24 horas devuelve el resultado previo; cambiar payload produce 409. Después de 24 horas no hay deduplicación garantizada. El cliente conserva un UUID ante respuesta incierta y exige recargar estado si vence o se intenta cambiar el contenido pendiente. No reenvía automáticamente una recuperación incierta.

Errores: 401 sesión inválida; 403 autorización; 404 recurso/operación no disponible; 409 conflicto; 422 validación; 429 límite; 503 servicio/envío no confirmado. Nunca mensajes SQL/Auth crudos. JSON máximo 256 KiB; campos desconocidos rechazados. Títulos/lugares/opciones máximo 160 caracteres y cuerpos máximo 5000.

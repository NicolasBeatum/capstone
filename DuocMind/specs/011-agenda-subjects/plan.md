# Plan 011 — Asignaturas reales en la agenda

| Campo | Valor |
| --- | --- |
| Versión | 0.1.0 |
| Estado | APROBADO |
| Fecha | 2026-10-15 |
| Spec | `spec.md` 0.2.0, APROBADA el 2026-10-15 |
| Constitución | 2.0.0 |
| Rama | `feature/agenda-subjects` (propuesta; el trabajo se hizo sin crear rama ni commits) |
| Aprobación del plan | Confirmada por el usuario el 2026-10-15 al pedir «crea el plan e implementalo» |

## 1. Decisiones y límites

1. **Lectura directa con la sesión de la persona, sin migración.** Las políticas RLS
   existentes ya limitan `estudiante_asignatura` al propietario y los catálogos
   (`asignatura`, `carrera_asignatura`) son de lectura pública. Una consulta de
   PostgREST con relaciones embebidas basta; una función SQL agregaría una migración que
   desplegar a mano sin aportar nada que la consulta no dé. No hay cambios de esquema.
2. **Carrera vigente.** La consulta incluye `estudiante_carrera` y filtra
   `fecha_fin is null`, de modo que no aparecen asignaturas de una carrera anterior.
3. **Copia local en `platformSecureKeyValueStorage`**, una clave por cuenta
   (`duocmind.agenda.subjects.v1.<uuid>`), igual que el tutorial. SecureStore en
   Android; `sessionStorage` en web (no acredita persistencia). Ver spec 0.2.0.
4. **Ubicación en `shared/subjects/`** para dominio, copia local y borrado, porque
   `auth` debe poder borrar la copia al eliminar la cuenta y `AGENTS.md` prohíbe
   importar archivos internos de otra funcionalidad. El caso de uso, el gateway de
   Supabase y el hook quedan en `features/agenda/`, que es su único consumidor.
5. **La actividad sigue guardando el nombre** como texto (RF-002.5). No cambia el
   formato de `agenda_activities`.
6. **Sin dependencias nuevas.**

## 2. Estado observado

- `AgendaScreen` define `SUBJECTS` con cuatro nombres fijos y los pinta como opciones
  de radio; `null` representa «Sin asignatura».
- La sesión se lee localmente con `getSession()` (sin red), de modo que la cuenta
  propietaria se conoce aun sin conexión.
- `deleteCurrentAccount` ya limpia datos locales por cuenta (eventos, check-in,
  tutorial) en `clearLocalData`.
- La agenda no tiene dependencia de sesión: hoy funciona sin cuenta. Sin sesión la
  lista de asignaturas queda vacía.

## 3. Organización e interfaces

```
src/shared/subjects/
├── domain/subject.ts                 # AgendaSubject, parseSubjects, subjectOptions
├── application/subjectCache.ts       # createSubjectCache(storage): read/write/clear por cuenta
└── infrastructure/subjectCacheStorage.ts   # bindea platformSecureKeyValueStorage; deleteSubjectCache
src/features/agenda/
├── application/subjectCatalog.ts     # loadSubjectCatalog(gateway, cache): resultado con estado
├── application/useSubjectCatalog.ts  # hook: carga al enfocar la pantalla
└── infrastructure/supabaseSubjectGateway.ts  # getOwnerId() y fetch()
```

**Dominio (`subject.ts`).** `AgendaSubject { id: string; name: string; code: string }`.
`parseSubjects(value: unknown)` valida en el límite: arreglo, como máximo 100 elementos,
`id` no vacío, `name` y `code` no vacíos y de hasta 120 y 40 caracteres; descarta
duplicados por `id` y lanza si el dato no es válido. `subjectOptions(subjects)` ordena
por nombre (`localeCompare('es')`) y entrega `{ key, label, value }`: `value` es el
nombre; `label` agrega ` (código)` solo si otro elemento comparte el nombre.

**Copia (`subjectCache.ts`).** `createSubjectCache(storage)` con `read(ownerId)`,
`write(ownerId, subjects)` y `clear(ownerId)`. Solo acepta UUID como `ownerId` (forma
parte de la clave). `read` devuelve `null` si no hay dato o está corrupto; un dato
corrupto nunca lanza hacia la pantalla.

**Caso de uso (`subjectCatalog.ts`).**
`loadSubjectCatalog({ gateway, cache })` devuelve
`{ subjects, stale, failed }`:

1. `ownerId = await gateway.getOwnerId()`; sin sesión: `{ [], false, false }`.
2. `gateway.fetch()` correcto: se escribe la copia (si la escritura falla se ignora) y
   se devuelve `{ subjects, stale: false, failed: false }`.
3. `fetch` falla: se lee la copia; con copia `{ subjects, stale: true, failed: false }`;
   sin copia `{ [], false, true }`. La copia previa nunca se borra por un fallo.

**Gateway (`supabaseSubjectGateway.ts`).** `getOwnerId()` lee `getSession()`. `fetch()`
consulta `estudiante_asignatura` con `estudiante_carrera!inner(fecha_fin)` y
`carrera_asignatura!inner(asignatura!inner(id_asignatura, nombre_asignatura, codigo))`,
filtra `estudiante_carrera.fecha_fin is null` y pasa el resultado por `parseSubjects`
tras aplanarlo. Sin claves privilegiadas; sin registrar datos.

**Hook (`useSubjectCatalog.ts`).** Estado `{ options, loading, stale, failed }`. Carga con
`useFocusEffect` y descarta respuestas de ejecuciones ya reemplazadas. `loading` solo es
verdadero mientras no hay datos de la ejecución en curso.

## 4. Integración con las pantallas existentes

- `AgendaScreen` elimina `SUBJECTS` y usa `useSubjectCatalog()`. La sección
  «Asignatura (opcional)» muestra: carga (`GotaLoader` pequeño con texto), error, vacío
  y aviso de lista guardada según el estado; siempre ofrece «Sin asignatura».
- `supabaseAuthGateway.deleteCurrentAccount` agrega `deleteSubjectCache(userId)` a
  `clearLocalData`, de mejor esfuerzo, igual que el tutorial.
- Ningún otro archivo cambia. No se toca `agendaStorage` ni el formato de actividades.

## 5. Estados y casos límite

| Caso | Comportamiento |
| --- | --- |
| Sin sesión | Lista vacía, mensaje de vacío, guardar sin asignatura. |
| Sin inscripciones | Mensaje «Aún no tienes asignaturas inscritas.» |
| Cargando | Indicador sin bloquear el formulario. |
| Error sin copia | «No pudimos cargar tus asignaturas. Puedes guardar sin asignatura.» |
| Offline con copia | Lista guardada y aviso «Lista guardada; puede no estar al día.» |
| Copia corrupta | Se trata como ausente. |
| Respuesta con datos inválidos | Se trata como fallo; no se escribe en la copia. |
| Dos cuentas en el dispositivo | Claves distintas; no comparten copia. |
| Nombres repetidos | La etiqueta agrega el código. |

## 6. Modelo de amenazas y riesgos

- **Acceso a datos de otra cuenta:** lo impide la RLS de `estudiante_asignatura`
  (`estudiante.auth_user_id = auth.uid()`); se prueba con SQL sintético (CA-002).
- **Copia local:** contiene nombres y códigos de asignaturas, no datos emocionales ni
  credenciales. Se aísla por cuenta con clave por UUID y se borra al eliminar la cuenta.
  No se registra en logs ni errores.
- **Dato remoto malformado:** `parseSubjects` valida tipos y límites antes de usarse o
  guardarse.
- **Riesgo: la consulta embebida podría no resolver las relaciones** (clave foránea
  compuesta). Mitigación: la prueba contra Supabase de desarrollo con cuenta sintética
  (T007) lo confirma antes de cerrar; si falla, se reemplaza por una función SQL en una
  migración revisable.
- **Riesgo: tamaño de la copia.** Máximo 100 asignaturas por validación, muy por debajo
  de cualquier límite de SecureStore en Android.

## 7. Cobertura de la spec

| Spec | Plan |
| --- | --- |
| RF-001 | §3 gateway, `parseSubjects`, `subjectOptions` |
| RF-002 | §3 hook, §4 pantalla, §5 estados |
| RF-003 | §3 copia y caso de uso, §4 borrado de cuenta |
| RF-004 | §1.5, no se modifica el formato |

## 8. Verificación y trazabilidad

| Criterio | Verificación | Dónde |
| --- | --- | --- |
| CA-001 | `node --test` caso de uso y opciones ordenadas | `tests/subjectCatalog.test.mjs`, `tests/subject.test.mjs` |
| CA-002 | SQL sintético de RLS | `tests/sql/agenda-subjects-rls-smoke.sql` |
| CA-003 | `node --test` etiquetas con código | `tests/subject.test.mjs` |
| CA-004 | `node --test` vacío; comprobación en pantalla | `tests/subjectCatalog.test.mjs` |
| CA-005 | `node --test` offline con copia; Android | `tests/subjectCatalog.test.mjs`, `verification.md` |
| CA-006 | `node --test` fallo de red conserva copia | `tests/subjectCatalog.test.mjs` |
| CA-007 | `node --test` claves por cuenta | `tests/subjectCache.test.mjs` |
| CA-008 | Sin cambios en `agendaStorage`; `tests/agendaStorage.web.test.mjs` sigue en verde | suite existente |
| CA-009 | `rg SUBJECTS` sin resultados | revisión |
| CA-010 | Recorrido en Android | `verification.md` |

Comandos: `npm run typecheck` y `npm test` tras cada tarea.

## 9. Reversión

Cambio solo de cliente y sin esquema. Revertir los archivos de la sección 3 y los
cambios de `AgendaScreen` y `supabaseAuthGateway` devuelve la lista fija. La copia local
queda huérfana e inofensiva; se puede borrar con la clave `duocmind.agenda.subjects.v1.*`.

## 10. Fuentes y estado de la entrega

Spec 011, constitución 2.0.0, `AGENTS.md`, esquema `20260927224730_bienestar_schema.sql`.
Este plan no autoriza commits, push, despliegues ni migraciones remotas.

# Plan 019 — Motivos del check-in emocional

| Campo | Valor |
| --- | --- |
| Versión | 0.1.0 |
| Estado | APROBADO |
| Fecha | 2026-11-09 |
| Spec | `spec.md` 0.3.0 (APROBADA) |
| Aprobación | Confirmada explícitamente por el usuario el 2026-11-09 |
| Rama | `feature/motivo-emocion-general` |

## 1. Decisiones técnicas

1. **Sin dependencias nuevas.** Se usa lo que ya está: Supabase, SQLite cifrado,
   `Reveal`, `ScalePress` y los tokens de movimiento.
2. **Catálogo guardado en la misma base cifrada del check-in.** Son pocos motivos
   y nombres cortos. Guardarlos en la base por cuenta evita crear otro
   almacenamiento (la caché de recursos de la spec 018 es pública y sin cifrar, y
   no sirve aquí).
3. **Motivos del registro en una tabla local aparte**
   (`emotional_checkin_reasons`). `CREATE TABLE IF NOT EXISTS` funciona en bases ya
   creadas sin migración: los check-ins pendientes antiguos simplemente no tienen
   filas ahí (CA-007).
4. **Sincronización en dos pasos dentro de `save`:** `upsert` del registro (como
   hoy), luego `select id_registro` por `client_request_id` y `upsert` en
   `registro_emocional_motivo` con `ignoreDuplicates` (solo requiere INSERT, que ya
   está concedido). Si falla el segundo paso, `save` lanza un error y el check-in
   queda `pending`. El reintento repite los dos pasos sin duplicar (CA-006).
5. **Motivo eliminado del servidor (RF-004.4).** Antes de insertar, se consultan
   cuáles de los IDs siguen existiendo en `motivo` y solo se insertan esos. Un
   motivo desactivado pero existente se sube igual, porque era válido al elegirlo.
   Así un motivo borrado, como «Otro», nunca bloquea la outbox con un error de FK.
6. **Aparición de las burbujas.** `MoodSlider` recibe un `onCommit` opcional que se
   llama al terminar el acomodo tras soltar, y en cada paso de teclado o de lector
   de pantalla. La pantalla muestra las burbujas desde el primer `onCommit`.
7. **Espacio.** Cuando aparecen las burbujas, el Brote baja del 78 % al 55 % del
   área de la cara con una transición `motionDuration.screen`. El contenido central
   queda dentro de un `ScrollView` que solo desplaza si el texto ampliado no cabe,
   de modo que «Registrar» siempre es alcanzable.
8. **Agradecimiento.** `THANKS_VISIBLE_MS` pasa a 7200 ms («Muy mal», «Mal») y
   6200 ms (resto).

## 2. Archivos

```
src/features/emotional-checkin/
├── domain/checkinReasons.ts          # NUEVO: tipo, validación y orden del catálogo, alternar selección
├── application/
│   ├── localCheckinStore.ts          # tablas nuevas, reasonIds en LocalCheckin, catálogo local
│   ├── checkinHistory.ts             # saveConfirmedCheckin recibe reasonIds; remove borra motivos
│   └── checkinReasons.ts             # NUEVO: loadReasonCatalog(local, remote)
├── infrastructure/
│   ├── supabaseCheckinGateway.ts     # save con motivos; fetchReasonCatalog
│   └── encryptedCheckinDatabase.web.ts  # base en memoria con las tablas nuevas
├── hooks/useCheckinReasons.ts        # NUEVO: carga el catálogo para la pantalla
├── components/
│   ├── MoodSlider.tsx                # prop onCommit
│   └── ReasonBubbles.tsx             # NUEVO: burbujas alternables
└── screens/
    ├── CheckinScreen.tsx             # estado de selección, aparición, tiempos
    └── CheckinScreen.styles.ts
supabase/migrations/20261106140000_match_production_schema.sql  # sin «Otro» (hecho)
tests/checkinReasons.test.mjs         # NUEVO
tests/localCheckinStore.test.mjs, tests/checkinHistory.test.mjs, tests/checkinWebStorage.test.mjs
```

## 3. Interfaces

```ts
// domain/checkinReasons.ts
export interface CheckinReason { id: number; name: string; }
/** Valida filas de `motivo`; devuelve null si la respuesta no tiene la forma esperada. */
export function parseReasonCatalog(raw: unknown): CheckinReason[] | null;
export function toggleReason(selected: readonly number[], id: number): number[];

// application/localCheckinStore.ts
export interface LocalCheckin { clientRequestId; mood; createdAt; syncStatus; reasonIds: number[]; }
savePending(checkin: Omit<LocalCheckin, 'syncStatus'>): Promise<void>; // check-in + motivos en una transacción
listPending(): Promise<LocalCheckin[]>;   // incluye reasonIds
saveReasonCatalog(reasons: CheckinReason[]): Promise<void>; // reemplaza la copia
listReasonCatalog(): Promise<CheckinReason[]>;

// application/checkinHistory.ts
export interface CheckinRemoteGateway {
  save(checkin: Omit<LocalCheckin, 'syncStatus'>): Promise<void>;  // ahora con reasonIds
  list(range?): Promise<CheckinHistoryEntry[]>;
  remove(clientRequestId: string): Promise<void>;
}
saveConfirmedCheckin(mood, dependencies, reasonIds = [])  // reasonIds al final para no romper llamadas existentes

// application/checkinReasons.ts
// El catálogo usa su propio gateway para no ampliar CheckinRemoteGateway.
export interface ReasonCatalogGateway { fetchReasonCatalog(): Promise<unknown>; }
/** Intenta descargar; si falla o la respuesta es inválida, usa la copia local. */
export async function loadReasonCatalog(local, remote): Promise<CheckinReason[]>;
```

## 4. Datos locales

```sql
CREATE TABLE IF NOT EXISTS emotional_checkin_reasons (
  client_request_id TEXT NOT NULL,
  reason_id INTEGER NOT NULL,
  PRIMARY KEY (client_request_id, reason_id)
);
CREATE TABLE IF NOT EXISTS reason_catalog (
  id INTEGER PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  position INTEGER NOT NULL
);
```

`savePending` inserta el check-in y sus motivos entre `BEGIN` y `COMMIT` (con
`ROLLBACK` si falla). `remove` borra también los motivos del registro.
`saveReasonCatalog` reemplaza el catálogo en una transacción.

## 5. Seguridad y privacidad

- Los motivos solo viven en la base SQLCipher por cuenta. Al borrar la cuenta se
  borra la base completa, como hoy.
- Ningún `console.*` ni mensaje de error incluye motivos o emociones.
- Se usan las políticas existentes: INSERT y SELECT propios en
  `registro_emocional_motivo` y lectura pública de `motivo`.

## 6. Pruebas

| Prueba | Cubre |
| --- | --- |
| `checkinReasons.test.mjs`: validación, filtro de activos, orden por `orden` y nombre, respuesta malformada, alternar | CA-002 |
| `checkinReasons.test.mjs`: catálogo remoto ok, fallo de red con copia, respuesta inválida no borra copia, sin copia y sin red da lista vacía | CA-002, CA-008 |
| `localCheckinStore.test.mjs`: guardar y listar con motivos, sin motivos, remove borra motivos, pendientes antiguos sin motivos | CA-005, CA-007 |
| `checkinHistory.test.mjs`: los motivos llegan al gateway; si falla el gateway queda pendiente; reintento idempotente | CA-003, CA-004, CA-006 |
| `checkinWebStorage.test.mjs`: la base en memoria soporta las tablas nuevas | CA-005 (web) |
| `npm run typecheck` y `npm test` | regresión |
| Recorrido web y Android: aparición, selección, lector de pantalla, texto ampliado, modo avión, filas en Supabase de desarrollo, tiempos del agradecimiento | CA-001, CA-004, CA-005, CA-009, CA-010, CA-011 |

## 7. Riesgos

- **Pantalla apretada en teléfonos chicos.** Lo mitiga el Brote reducido y el
  `ScrollView`; se revisa en el recorrido Android.
- **Paso dos falla tras el paso uno.** El registro existe sin motivos hasta el
  reintento; es aceptable porque el reintento es automático e idempotente.
- **Migración editada ya aplicada.** Quitar «Otro» de la semilla no cambia bases
  donde ya corrió; en remoto ya se borró a mano.

## 8. Reversión

Revertir los commits de la rama. Las tablas locales nuevas quedan inertes y no
afectan versiones anteriores. Las filas de `registro_emocional_motivo` creadas se
borran en cascada al borrar el registro y no las lee ninguna otra pantalla.

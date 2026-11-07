import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import {
  createPlannerSqlitePersistence,
  unlockPlannerDatabase,
} from '../src/shared/planner/infrastructure/plannerSqlite.ts';
import { createWebPlannerStore } from '../src/shared/planner/infrastructure/plannerStorage.web.ts';
import { emptyPlanner } from '../src/shared/planner/application/plannerStore.ts';
const mark = (d, names) => ({
  ...d,
  receipts: names.map((fingerprint) => ({
    requestId: `00000000-0000-4000-8000-${
      Buffer.from(fingerprint).toString('hex').padStart(12, '0').slice(-12)
    }`,
    fingerprint,
  })),
});
const marks = (d) => d.receipts.map((r) => r.fingerprint);
const owner = '00000000-0000-4000-8000-000000000001';
const unreadable = [
  ['JSON dañado', '{'],
  ['formato anterior', JSON.stringify({ ...emptyPlanner(), schema: 1 })],
  ['actividad inválida', JSON.stringify({ ...emptyPlanner(), activities: [{ id: 'x' }] })],
];
function sqliteAdapter(sqlite, hooks = {}) {
  const db = {
    execAsync: async (s) => {
      sqlite.exec(s);
    },
    getFirstAsync: async (s) => sqlite.prepare(s).get() ?? null,
    getAllAsync: async (s) => {
      if (hooks.failRead) throw Error('Disco');
      return sqlite.prepare(s).all();
    },
    runAsync: async (s, ...args) => {
      if (hooks.failWrite && s.includes('planner_receipt')) throw Error('Disco');
      return sqlite.prepare(s).run(...args);
    },
    withExclusiveTransactionAsync: async (action) => {
      sqlite.exec('BEGIN IMMEDIATE');
      try {
        await action(db);
        sqlite.exec('COMMIT');
      } catch (e) {
        sqlite.exec('ROLLBACK');
        throw e;
      }
    },
  };
  return db;
}
test('dos escritores web releen bajo bloqueo; la cuota no borra datos', async () => {
  const data = new Map(),
    storage = {
      getItem: (k) => data.get(k) ?? null,
      setItem: (k, v) => data.set(k, v),
      removeItem: (k) => data.delete(k),
    };
  let tail = Promise.resolve();
  const lock = (key, fn) => {
    const work = tail.then(fn);
    tail = work.catch(() => {});
    return work;
  };
  const a = createWebPlannerStore(owner, () => storage, lock),
    b = createWebPlannerStore(owner, () => storage, lock);
  await Promise.all([
    a.update((d) => mark(d, ['uno', ...marks(d)])),
    b.update((d) => mark(d, ['dos', ...marks(d)])),
  ]);
  assert.deepEqual(marks(await a.read()), ['dos', 'uno']);
  const other = createWebPlannerStore('00000000-0000-4000-8000-000000000002', () => storage, lock);
  assert.deepEqual(marks(await other.read()), []);
  const original = storage.setItem;
  storage.setItem = () => {
    throw Error('Cuota');
  };
  await assert.rejects(() => a.update((d) => mark(d, [])));
  storage.setItem = original;
  assert.equal(marks(await b.read()).length, 2);
});
test('web limpia contenido ilegible y continúa con un almacén vacío', async () => {
  for (const [, raw] of unreadable) {
    const data = new Map(),
      storage = {
        getItem: (k) => data.get(k) ?? null,
        setItem: (k, v) => data.set(k, v),
        removeItem: (k) => data.delete(k),
      };
    const store = createWebPlannerStore(owner, () => storage, (_, fn) => fn());
    await store.update((d) => mark(d, ['previo']));
    data.set([...data.keys()][0], raw);
    assert.deepEqual(await store.read(), emptyPlanner());
    assert.equal(data.size, 0);
    await store.update((d) => mark(d, ['nuevo']));
    assert.deepEqual(marks(await store.read()), ['nuevo']);
  }
});
test('web conserva los datos ante una edición inválida o un fallo de lectura', async () => {
  const data = new Map();
  let failRead = false;
  const storage = {
    getItem: (k) => {
      if (failRead) throw Error('Acceso');
      return data.get(k) ?? null;
    },
    setItem: (k, v) => data.set(k, v),
    removeItem: (k) => data.delete(k),
  };
  const store = createWebPlannerStore(owner, () => storage, (_, fn) => fn());
  await store.update((d) => mark(d, ['original']));
  await assert.rejects(() => store.update((d) => ({ ...d, schedule: {} })));
  failRead = true;
  await assert.rejects(() => store.read());
  failRead = false;
  assert.deepEqual(marks(await store.read()), ['original']);
});
test('SQLite real hace rollback y conserva datos al reabrir el adaptador', async () => {
  const sqlite = new DatabaseSync(':memory:');
  const hooks = {}, db = sqliteAdapter(sqlite, hooks);
  try {
    const p = await createPlannerSqlitePersistence(db, async () => {});
    await p.update((d) => mark(d, ['original']));
    hooks.failWrite = true;
    await assert.rejects(() => p.update((d) => mark(d, ['fallo'])));
    hooks.failWrite = false;
    const reopened = await createPlannerSqlitePersistence(db, async () => {});
    assert.deepEqual(marks(await reopened.read()), ['original']);
  } finally {
    sqlite.close();
  }
});
test('SQLite limpia contenido ilegible y continúa con un almacén vacío', async () => {
  for (const [name, raw] of unreadable) {
    const sqlite = new DatabaseSync(':memory:');
    try {
      const p = await createPlannerSqlitePersistence(sqliteAdapter(sqlite), async () => {});
      await p.update((d) => mark(d, ['previo']));
      const activity = name === 'actividad inválida';
      sqlite.prepare(
        activity
          ? "INSERT INTO planner_activity(id,content) VALUES('x','{\"id\":\"x\"}')"
          : 'UPDATE planner_state SET content=? WHERE id=1',
      ).run(...(activity ? [] : [raw]));
      assert.deepEqual(await p.read(), emptyPlanner());
      for (const table of ['planner_state', 'planner_activity', 'planner_receipt']) {
        assert.equal(sqlite.prepare(`SELECT count(*) n FROM ${table}`).get().n, 0);
      }
      await p.update((d) => mark(d, ['nuevo']));
      assert.deepEqual(marks(await p.read()), ['nuevo']);
    } finally {
      sqlite.close();
    }
  }
});
test('SQLite conserva los datos ante una edición inválida o un fallo de lectura', async () => {
  const sqlite = new DatabaseSync(':memory:');
  const hooks = {};
  try {
    const p = await createPlannerSqlitePersistence(sqliteAdapter(sqlite, hooks), async () => {});
    await p.update((d) => mark(d, ['original']));
    await assert.rejects(() => p.update((d) => ({ ...d, schedule: {} })));
    hooks.failRead = true;
    await assert.rejects(() => p.read());
    hooks.failRead = false;
    assert.deepEqual(marks(await p.read()), ['original']);
  } finally {
    sqlite.close();
  }
});
test('sin SQLCipher o con clave incorrecta no se crea ni reemplaza el esquema', async () => {
  let writes = [];
  const noCipher = { getFirstAsync: async () => null, execAsync: async (s) => writes.push(s) };
  await assert.rejects(() => unlockPlannerDatabase(noCipher, 'a'.repeat(64)), /SQLCipher/);
  assert.deepEqual(writes, []);
  const badKey = {
    getFirstAsync: async (s) => {
      if (s.includes('cipher_version')) return { cipher_version: 'test' };
      throw Error('Clave inválida');
    },
    execAsync: async (s) => writes.push(s),
  };
  await assert.rejects(() => unlockPlannerDatabase(badKey, 'a'.repeat(64)), /Clave inválida/);
  assert.equal(writes.length, 1);
  assert(!writes[0].includes('CREATE'));
});

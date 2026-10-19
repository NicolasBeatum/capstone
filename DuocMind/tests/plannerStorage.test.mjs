import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import {
  createPlannerSqlitePersistence,
  unlockPlannerDatabase,
} from '../src/shared/planner/infrastructure/plannerSqlite.ts';
import { createWebPlannerStore } from '../src/shared/planner/infrastructure/plannerStorage.web.ts';
const owner = '00000000-0000-4000-8000-000000000001';
test('dos escritores web releen bajo bloqueo; cuota y corrupción no borran datos', async () => {
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
    a.update((d) => ({ ...d, imports: ['uno', ...d.imports] })),
    b.update((d) => ({ ...d, imports: ['dos', ...d.imports] })),
  ]);
  assert.deepEqual((await a.read()).imports, ['dos', 'uno']);
  const other = createWebPlannerStore('00000000-0000-4000-8000-000000000002', () => storage, lock);
  assert.deepEqual((await other.read()).imports, []);
  const original = storage.setItem;
  storage.setItem = () => {
    throw Error('Cuota');
  };
  await assert.rejects(() => a.update((d) => ({ ...d, imports: [] })));
  storage.setItem = original;
  assert.equal((await b.read()).imports.length, 2);
  data.set([...data.keys()][0], '{');
  await assert.rejects(() => a.read());
});
test('SQLite real hace rollback y conserva datos al reabrir el adaptador', async () => {
  const sqlite = new DatabaseSync(':memory:');
  let fail = false;
  const db = {
    execAsync: async (s) => {
      sqlite.exec(s);
    },
    getFirstAsync: async (s) => sqlite.prepare(s).get() ?? null,
    getAllAsync: async (s) => sqlite.prepare(s).all(),
    runAsync: async (s, ...args) => {
      if (fail && s.includes('planner_import')) throw Error('Disco');
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
  try {
    const p = await createPlannerSqlitePersistence(db, async () => {});
    await p.update((d) => ({ ...d, imports: ['original'] }));
    fail = true;
    await assert.rejects(() => p.update((d) => ({ ...d, imports: ['fallo'] })));
    fail = false;
    const reopened = await createPlannerSqlitePersistence(db, async () => {});
    assert.deepEqual((await reopened.read()).imports, ['original']);
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

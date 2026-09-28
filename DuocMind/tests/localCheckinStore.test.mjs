import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { DatabaseSync } from 'node:sqlite';

import { LocalCheckinStore } from '../src/features/emotional-checkin/application/localCheckinStore.ts';
import { getOrCreateSecureDatabaseKey } from '../src/features/emotional-checkin/infrastructure/secureDatabaseKey.ts';

function memoryStore() {
  const database = new DatabaseSync(':memory:');
  const adapter = {
    execAsync: async (sql) => database.exec(sql),
    runAsync: async (sql, ...params) => database.prepare(sql).run(...params),
    getAllAsync: async (sql, ...params) => database.prepare(sql).all(...params),
  };
  return { database, store: new LocalCheckinStore(adapter) };
}

test('la outbox persiste check-ins, ordena historial y evita duplicados al reintentar', async () => {
  const { database, store } = memoryStore();
  await store.initialize();
  await store.savePending({ clientRequestId: 'request-1', mood: 'Bien', createdAt: '2026-09-27T10:00:00.000Z' });
  await store.savePending({ clientRequestId: 'request-1', mood: 'Bien', createdAt: '2026-09-27T10:00:00.000Z' });
  await store.savePending({ clientRequestId: 'request-2', mood: 'Muy bien', createdAt: '2026-09-27T11:00:00.000Z' });

  assert.deepEqual((await store.listAll()).map((row) => row.clientRequestId), ['request-2', 'request-1']);
  assert.deepEqual((await store.listPending()).map((row) => row.clientRequestId), ['request-1', 'request-2']);

  await store.markSynced('request-1');
  assert.deepEqual((await store.listPending()).map((row) => row.clientRequestId), ['request-2']);
  await store.remove('request-1');
  assert.equal((await store.listAll()).length, 1);
  database.close();
});

test('los check-ins pendientes permanecen después de cerrar y reabrir la base local', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'duocmind-checkins-'));
  const databasePath = join(directory, 'checkins.db');
  try {
    const firstDatabase = new DatabaseSync(databasePath);
    const firstStore = new LocalCheckinStore({
      execAsync: async (sql) => firstDatabase.exec(sql),
      runAsync: async (sql, ...params) => firstDatabase.prepare(sql).run(...params),
      getAllAsync: async (sql, ...params) => firstDatabase.prepare(sql).all(...params),
    });
    await firstStore.initialize();
    await firstStore.savePending({
      clientRequestId: 'survives-restart',
      mood: 'Neutro',
      createdAt: '2026-09-27T14:00:00.000Z',
    });
    firstDatabase.close();

    const reopenedDatabase = new DatabaseSync(databasePath);
    const reopenedStore = new LocalCheckinStore({
      execAsync: async (sql) => reopenedDatabase.exec(sql),
      runAsync: async (sql, ...params) => reopenedDatabase.prepare(sql).run(...params),
      getAllAsync: async (sql, ...params) => reopenedDatabase.prepare(sql).all(...params),
    });
    assert.equal((await reopenedStore.listPending())[0].clientRequestId, 'survives-restart');
    reopenedDatabase.close();
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('la clave local se reutiliza y solo se genera una vez', async () => {
  const values = new Map();
  let generated = 0;
  const storage = {
    getItemAsync: async (key) => values.get(key) ?? null,
    setItemAsync: async (key, value) => { values.set(key, value); },
  };
  const generateKey = () => { generated += 1; return 'a'.repeat(64); };

  assert.equal(await getOrCreateSecureDatabaseKey(storage, generateKey, 'db-key'), 'a'.repeat(64));
  assert.equal(await getOrCreateSecureDatabaseKey(storage, generateKey, 'db-key'), 'a'.repeat(64));
  assert.equal(generated, 1);
});

test('una clave malformada no se persiste', async () => {
  let saved = false;
  await assert.rejects(
    getOrCreateSecureDatabaseKey({
      getItemAsync: async () => null,
      setItemAsync: async () => { saved = true; },
    }, () => 'not-a-key', 'db-key'),
    /256 bits aleatorios/,
  );
  assert.equal(saved, false);
});
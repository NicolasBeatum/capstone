import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createLastStressTestStore,
  latestStressTest,
  parseLastStressTest,
} from '../src/features/emotional-checkin/application/lastStressTest.ts';

const OWNER = '00000000-0000-0000-0000-00000000000b';

function memoryStorage() {
  const map = new Map();
  return {
    getItem: async (key) => map.get(key) ?? null,
    setItem: async (key, value) => void map.set(key, value),
    deleteItem: async (key) => void map.delete(key),
  };
}

test('la copia local guarda solo fecha y nivel, por cuenta', async () => {
  const store = createLastStressTestStore(memoryStorage());
  assert.equal(await store.read(OWNER), null);
  await store.write(OWNER, { appliedAt: '2026-11-10T12:00:00.000Z', level: 'moderado' });
  assert.deepEqual(await store.read(OWNER), { appliedAt: '2026-11-10T12:00:00.000Z', level: 'moderado' });
  await store.clear(OWNER);
  assert.equal(await store.read(OWNER), null);
  await assert.rejects(store.read('no-es-uuid'));
});

test('lo guardado inválido equivale a no tener registro', () => {
  assert.equal(parseLastStressTest('{'), null);
  assert.equal(parseLastStressTest(JSON.stringify({ appliedAt: 'ayer', level: 'leve' })), null);
  assert.equal(parseLastStressTest(JSON.stringify({ appliedAt: '2026-11-10T12:00:00.000Z', level: '' })), null);
});

test('se usa la aplicación más reciente entre servidor y dispositivo', () => {
  const remote = { appliedAt: '2026-11-01T12:00:00.000Z', level: 'leve' };
  const local = { appliedAt: '2026-11-12T12:00:00.000Z', level: 'moderado' };
  assert.deepEqual(latestStressTest(remote, local), local);
  assert.deepEqual(latestStressTest(remote, null), remote);
  assert.equal(latestStressTest(null, null), null);
});

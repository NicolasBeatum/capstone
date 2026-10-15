import test from 'node:test';
import assert from 'node:assert/strict';
import { createSubjectCache } from '../src/shared/subjects/application/subjectCache.ts';

const OWNER_A = '11111111-1111-4111-8111-111111111111';
const OWNER_B = '22222222-2222-4222-8222-222222222222';
const subjects = [{ id: '1', name: 'Base de datos', code: 'BDY2101' }];

function memoryStorage() {
  const map = new Map();
  return {
    map,
    getItem: async (key) => map.get(key) ?? null,
    setItem: async (key, value) => void map.set(key, value),
    deleteItem: async (key) => void map.delete(key),
  };
}

test('cada cuenta tiene su propia copia y no ve la de otra', async () => {
  const cache = createSubjectCache(memoryStorage());
  await cache.write(OWNER_A, subjects);
  assert.deepEqual(await cache.read(OWNER_A), subjects);
  assert.equal(await cache.read(OWNER_B), null);
});

test('borrar la copia de una cuenta no toca la de otra', async () => {
  const storage = memoryStorage();
  const cache = createSubjectCache(storage);
  await cache.write(OWNER_A, subjects);
  await cache.write(OWNER_B, subjects);
  await cache.clear(OWNER_A);
  assert.equal(await cache.read(OWNER_A), null);
  assert.deepEqual(await cache.read(OWNER_B), subjects);
});

test('un dato corrupto se lee como ausente sin lanzar', async () => {
  const storage = memoryStorage();
  const cache = createSubjectCache(storage);
  const key = [...(await (async () => { await cache.write(OWNER_A, subjects); return storage.map.keys(); })())][0];
  storage.map.set(key, '{no es json');
  assert.equal(await cache.read(OWNER_A), null);
  storage.map.set(key, JSON.stringify([{ id: 1 }]));
  assert.equal(await cache.read(OWNER_A), null);
});

test('solo acepta UUID como identificador de cuenta, porque forma parte de la clave', async () => {
  const cache = createSubjectCache(memoryStorage());
  await assert.rejects(() => cache.read('../../x'));
  await assert.rejects(() => cache.write('abc', subjects));
  await assert.rejects(() => cache.clear(''));
});

test('no guarda datos que no son una lista válida de asignaturas', async () => {
  const storage = memoryStorage();
  const cache = createSubjectCache(storage);
  await assert.rejects(() => cache.write(OWNER_A, [{ id: '', name: 'x', code: 'y' }]));
  assert.equal(storage.map.size, 0);
});

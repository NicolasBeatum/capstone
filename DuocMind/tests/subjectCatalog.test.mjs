import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSubjectCatalog } from '../src/features/agenda/application/subjectCatalog.ts';
import { createSubjectCache } from '../src/shared/subjects/application/subjectCache.ts';

const OWNER = '11111111-1111-4111-8111-111111111111';
const subjects = [{ id: '1', name: 'Base de datos', code: 'BDY2101' }, { id: '2', name: 'Inglés', code: 'ING101' }];

function memoryStorage() {
  const map = new Map();
  return {
    map,
    getItem: async (key) => map.get(key) ?? null,
    setItem: async (key, value) => void map.set(key, value),
    deleteItem: async (key) => void map.delete(key),
  };
}
const gateway = (overrides = {}) => ({ getOwnerId: async () => OWNER, fetch: async () => subjects, ...overrides });

test('con conexión devuelve la lista y la deja guardada', async () => {
  const cache = createSubjectCache(memoryStorage());
  const result = await loadSubjectCatalog({ gateway: gateway(), cache });
  assert.deepEqual(result, { subjects, stale: false, failed: false });
  assert.deepEqual(await cache.read(OWNER), subjects);
});

test('sin conexión usa la última copia y avisa que puede estar desactualizada', async () => {
  const cache = createSubjectCache(memoryStorage());
  await cache.write(OWNER, subjects);
  const result = await loadSubjectCatalog({ gateway: gateway({ fetch: async () => { throw new Error('red'); } }), cache });
  assert.deepEqual(result, { subjects, stale: true, failed: false });
});

test('un fallo de red no borra la copia previa', async () => {
  const cache = createSubjectCache(memoryStorage());
  await cache.write(OWNER, subjects);
  await loadSubjectCatalog({ gateway: gateway({ fetch: async () => { throw new Error('red'); } }), cache });
  assert.deepEqual(await cache.read(OWNER), subjects);
});

test('sin conexión y sin copia informa el fallo con la lista vacía', async () => {
  const cache = createSubjectCache(memoryStorage());
  const result = await loadSubjectCatalog({ gateway: gateway({ fetch: async () => { throw new Error('red'); } }), cache });
  assert.deepEqual(result, { subjects: [], stale: false, failed: true });
});

test('una cuenta sin inscripciones recibe una lista vacía sin fallo', async () => {
  const cache = createSubjectCache(memoryStorage());
  const result = await loadSubjectCatalog({ gateway: gateway({ fetch: async () => [] }), cache });
  assert.deepEqual(result, { subjects: [], stale: false, failed: false });
});

test('sin sesión no consulta ni usa copias', async () => {
  let fetched = false;
  const cache = createSubjectCache(memoryStorage());
  await cache.write(OWNER, subjects);
  const result = await loadSubjectCatalog({ gateway: gateway({ getOwnerId: async () => null, fetch: async () => { fetched = true; return subjects; } }), cache });
  assert.deepEqual(result, { subjects: [], stale: false, failed: false });
  assert.equal(fetched, false);
});

test('si la copia no se puede escribir igual entrega la lista descargada', async () => {
  const cache = { read: async () => null, write: async () => { throw new Error('lleno'); }, clear: async () => {} };
  const result = await loadSubjectCatalog({ gateway: gateway(), cache });
  assert.deepEqual(result, { subjects, stale: false, failed: false });
});

test('una copia ilegible se trata como ausente', async () => {
  const cache = { read: async () => { throw new Error('ilegible'); }, write: async () => {}, clear: async () => {} };
  const result = await loadSubjectCatalog({ gateway: gateway({ fetch: async () => { throw new Error('red'); } }), cache });
  assert.deepEqual(result, { subjects: [], stale: false, failed: true });
});

test('si no puede leer la sesión informa el fallo', async () => {
  const cache = createSubjectCache(memoryStorage());
  const result = await loadSubjectCatalog({ gateway: gateway({ getOwnerId: async () => { throw new Error('x'); } }), cache });
  assert.deepEqual(result, { subjects: [], stale: false, failed: true });
});

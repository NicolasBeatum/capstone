import test from 'node:test';
import assert from 'node:assert/strict';
import { createConsentStore } from '../src/shared/consents/application/consentStore.ts';
import { NO_CONSENTS, parseConsentChoices } from '../src/shared/consents/domain/consents.ts';

const A = '00000000-0000-0000-0000-00000000000a';
const B = '00000000-0000-0000-0000-00000000000b';
const BOTH = { shareAnonymousData: true, allowEmergencyContact: true };

function memoryStorage() {
  const map = new Map();
  return {
    map,
    getItem: async (key) => map.get(key) ?? null,
    setItem: async (key, value) => void map.set(key, value),
    deleteItem: async (key) => void map.delete(key),
  };
}

test('CA-002: sin estado guardado ambos consentimientos están desactivados', async () => {
  assert.deepEqual(await createConsentStore(memoryStorage()).read(A), NO_CONSENTS);
});

test('CA-003: lo guardado se conserva al volver a leer', async () => {
  const storage = memoryStorage();
  await createConsentStore(storage).write(A, BOTH);
  assert.deepEqual(await createConsentStore(storage).read(A), BOTH);
});

test('CA-005: dos cuentas tienen estados independientes', async () => {
  const store = createConsentStore(memoryStorage());
  await store.write(A, BOTH);
  assert.deepEqual(await store.read(B), NO_CONSENTS);
});

test('CA-006: borrar una cuenta elimina solo su estado', async () => {
  const store = createConsentStore(memoryStorage());
  await store.write(A, BOTH);
  await store.write(B, BOTH);
  await store.clear(A);
  assert.deepEqual(await store.read(A), NO_CONSENTS);
  assert.deepEqual(await store.read(B), BOTH);
});

test('un identificador que no es UUID se rechaza', async () => {
  await assert.rejects(createConsentStore(memoryStorage()).read('../otro'));
});

test('un valor guardado inválido equivale a desactivado', () => {
  assert.deepEqual(parseConsentChoices('no es json'), NO_CONSENTS);
  assert.deepEqual(parseConsentChoices('[1]'), NO_CONSENTS);
  assert.deepEqual(parseConsentChoices('{"shareAnonymousData":"si"}'), NO_CONSENTS);
});

test('CA-007: lo pendiente del registro pasa a la cuenta y se borra el temporal', async () => {
  const storage = memoryStorage();
  const store = createConsentStore(storage);
  await store.savePending({ shareAnonymousData: true, allowEmergencyContact: false });
  await store.adoptPending(A);
  assert.deepEqual(await store.read(A), { shareAnonymousData: true, allowEmergencyContact: false });
  assert.equal(storage.map.size, 1);
});

test('sin nada pendiente, adoptar no cambia el estado de la cuenta', async () => {
  const store = createConsentStore(memoryStorage());
  await store.write(A, BOTH);
  await store.adoptPending(A);
  assert.deepEqual(await store.read(A), BOTH);
});

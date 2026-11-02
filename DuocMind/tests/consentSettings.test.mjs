import test from 'node:test';
import assert from 'node:assert/strict';
import { changeConsent, loadConsents } from '../src/shared/consents/application/consentSettings.ts';
import { createConsentStore } from '../src/shared/consents/application/consentStore.ts';
import { NO_CONSENTS } from '../src/shared/consents/domain/consents.ts';

const OWNER = '00000000-0000-0000-0000-00000000000a';

function memoryStorage(overrides = {}) {
  const map = new Map();
  return {
    getItem: async (key) => map.get(key) ?? null,
    setItem: async (key, value) => void map.set(key, value),
    deleteItem: async (key) => void map.delete(key),
    ...overrides,
  };
}

test('cargar sin sesión devuelve todo desactivado', async () => {
  const result = await loadConsents({ owners: { currentOwner: async () => null }, store: createConsentStore(memoryStorage()) });
  assert.deepEqual(result, { ownerId: null, choices: NO_CONSENTS, failed: false });
});

test('un fallo de lectura se informa sin lanzar', async () => {
  const result = await loadConsents({
    owners: { currentOwner: async () => OWNER },
    store: createConsentStore(memoryStorage({ getItem: async () => { throw new Error('x'); } })),
  });
  assert.equal(result.failed, true);
});

test('cambiar un consentimiento lo guarda', async () => {
  const store = createConsentStore(memoryStorage());
  const result = await changeConsent({ store, ownerId: OWNER, current: NO_CONSENTS, key: 'shareAnonymousData', value: true });
  assert.deepEqual(result, { choices: { shareAnonymousData: true, allowEmergencyContact: false }, failed: false });
  assert.equal((await store.read(OWNER)).shareAnonymousData, true);
});

test('CA-004: si el guardado falla se conserva el valor anterior y se informa', async () => {
  const store = createConsentStore(memoryStorage({ setItem: async () => { throw new Error('x'); } }));
  const result = await changeConsent({ store, ownerId: OWNER, current: NO_CONSENTS, key: 'allowEmergencyContact', value: true });
  assert.deepEqual(result, { choices: NO_CONSENTS, failed: true });
});

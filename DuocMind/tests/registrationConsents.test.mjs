import test from 'node:test';
import assert from 'node:assert/strict';
import {
  adoptRegistrationConsents,
  rememberRegistrationConsents,
} from '../src/features/auth/application/registrationConsents.ts';
import { createConsentStore } from '../src/shared/consents/application/consentStore.ts';
import { NO_CONSENTS } from '../src/shared/consents/domain/consents.ts';

const OWNER = '00000000-0000-0000-0000-00000000000a';
const CHOICES = { shareAnonymousData: true, allowEmergencyContact: false };

function memoryStorage(overrides = {}) {
  const map = new Map();
  return {
    getItem: async (key) => map.get(key) ?? null,
    setItem: async (key, value) => void map.set(key, value),
    deleteItem: async (key) => void map.delete(key),
    ...overrides,
  };
}

test('CA-007: lo elegido en el registro aparece en la cuenta tras completar el perfil', async () => {
  const store = createConsentStore(memoryStorage());
  await rememberRegistrationConsents(store, CHOICES);
  await adoptRegistrationConsents({ getCurrentUserId: async () => OWNER }, store);
  assert.deepEqual(await store.read(OWNER), CHOICES);
});

test('si no hubo elección en el registro, la cuenta empieza desactivada', async () => {
  const store = createConsentStore(memoryStorage());
  await adoptRegistrationConsents({ getCurrentUserId: async () => OWNER }, store);
  assert.deepEqual(await store.read(OWNER), NO_CONSENTS);
});

test('un fallo al guardar o adoptar no lanza', async () => {
  const failing = createConsentStore(memoryStorage({ setItem: async () => { throw new Error('x'); } }));
  await assert.doesNotReject(rememberRegistrationConsents(failing, CHOICES));
  await assert.doesNotReject(adoptRegistrationConsents({ getCurrentUserId: async () => { throw new Error('x'); } }, failing));
});

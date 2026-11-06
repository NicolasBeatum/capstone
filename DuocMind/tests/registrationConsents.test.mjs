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

function fakeRemote({ rows = {}, failFetch = false } = {}) {
  return {
    recorded: [],
    async fetchCurrent() {
      if (failFetch) throw new Error('sin red');
      return rows;
    },
    async record(key, granted) {
      this.recorded.push([key, granted]);
    },
  };
}

test('CA-013: lo elegido en el registro aparece en la cuenta tras completar el perfil', async () => {
  const store = createConsentStore(memoryStorage());
  await rememberRegistrationConsents(store, CHOICES);
  const remote = fakeRemote();
  await adoptRegistrationConsents({ getCurrentUserId: async () => OWNER }, store, remote);
  assert.deepEqual(await store.read(OWNER), CHOICES);
  // Solo lo aceptado se envía; lo no aceptado no genera filas.
  assert.deepEqual(remote.recorded, [['shareAnonymousData', true]]);
});

test('si no hubo elección en el registro, la cuenta empieza desactivada', async () => {
  const store = createConsentStore(memoryStorage());
  const remote = fakeRemote();
  await adoptRegistrationConsents({ getCurrentUserId: async () => OWNER }, store, remote);
  assert.deepEqual(await store.read(OWNER), NO_CONSENTS);
  assert.deepEqual(remote.recorded, []);
});

test('un fallo al guardar o adoptar no lanza', async () => {
  const failing = createConsentStore(memoryStorage({ setItem: async () => { throw new Error('x'); } }));
  await assert.doesNotReject(rememberRegistrationConsents(failing, CHOICES));
  await assert.doesNotReject(adoptRegistrationConsents({ getCurrentUserId: async () => { throw new Error('x'); } }, failing, fakeRemote()));
});

test('un fallo del servidor al adoptar no lanza y lo local se conserva', async () => {
  const store = createConsentStore(memoryStorage());
  await rememberRegistrationConsents(store, CHOICES);
  await assert.doesNotReject(
    adoptRegistrationConsents({ getCurrentUserId: async () => OWNER }, store, fakeRemote({ failFetch: true })),
  );
  assert.deepEqual(await store.read(OWNER), CHOICES);
});

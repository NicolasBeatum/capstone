import test from 'node:test';
import assert from 'node:assert/strict';
import { changeConsent, loadConsents } from '../src/shared/consents/application/consentSettings.ts';
import { createConsentStore } from '../src/shared/consents/application/consentStore.ts';
import { NO_CONSENTS, parseRemoteConsents } from '../src/shared/consents/domain/consents.ts';

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

/** Gateway remoto falso: `rows` es el estado vigente por clave; `log` registra el orden de las llamadas. */
function fakeRemote({ rows = {}, failFetch = false, failRecord = false, log = [] } = {}) {
  return {
    log,
    recorded: [],
    async fetchCurrent() {
      log.push('remote.fetch');
      if (failFetch) throw new Error('sin red');
      return rows;
    },
    async record(key, granted) {
      log.push('remote.record');
      if (failRecord) throw new Error('sin red');
      this.recorded.push([key, granted]);
    },
  };
}

const owners = { currentOwner: async () => OWNER };

test('cargar sin sesión devuelve todo desactivado y no consulta el servidor', async () => {
  const remote = fakeRemote();
  const result = await loadConsents({ owners: { currentOwner: async () => null }, store: createConsentStore(memoryStorage()), remote });
  assert.deepEqual(result, { ownerId: null, choices: NO_CONSENTS, failed: false, remoteUnavailable: false });
  assert.deepEqual(remote.log, []);
});

test('un fallo de lectura local se informa sin lanzar', async () => {
  const result = await loadConsents({
    owners,
    store: createConsentStore(memoryStorage({ getItem: async () => { throw new Error('x'); } })),
    remote: fakeRemote(),
  });
  assert.equal(result.failed, true);
});

test('RF-005: cambiar un consentimiento inserta en el servidor y lo guarda en el dispositivo', async () => {
  const store = createConsentStore(memoryStorage());
  const remote = fakeRemote();
  const result = await changeConsent({ store, remote, ownerId: OWNER, current: NO_CONSENTS, key: 'shareAnonymousData', value: true });
  assert.deepEqual(result, { choices: { shareAnonymousData: true, allowEmergencyContact: false }, failed: false });
  assert.deepEqual(remote.recorded, [['shareAnonymousData', true]]);
  assert.equal((await store.read(OWNER)).shareAnonymousData, true);
});

test('CA-012: si el servidor falla no se escribe en el dispositivo y se informa', async () => {
  const writes = [];
  const store = createConsentStore(memoryStorage({ setItem: async (...args) => void writes.push(args) }));
  const current = { shareAnonymousData: true, allowEmergencyContact: false };
  const result = await changeConsent({ store, remote: fakeRemote({ failRecord: true }), ownerId: OWNER, current, key: 'shareAnonymousData', value: false });
  assert.deepEqual(result, { choices: current, failed: true });
  assert.equal(writes.length, 0);
});

test('el servidor se escribe antes que el dispositivo', async () => {
  const log = [];
  const store = createConsentStore(memoryStorage({ setItem: async () => void log.push('local.write') }));
  await changeConsent({ store, remote: fakeRemote({ log }), ownerId: OWNER, current: NO_CONSENTS, key: 'allowEmergencyContact', value: true });
  assert.deepEqual(log, ['remote.record', 'local.write']);
});

test('si el servidor acepta pero falla el guardado local, el cambio se da por aplicado', async () => {
  const store = createConsentStore(memoryStorage({ setItem: async () => { throw new Error('x'); } }));
  const result = await changeConsent({ store, remote: fakeRemote(), ownerId: OWNER, current: NO_CONSENTS, key: 'allowEmergencyContact', value: true });
  assert.deepEqual(result, { choices: { shareAnonymousData: false, allowEmergencyContact: true }, failed: false });
});

test('RF-007: el estado del servidor prevalece sobre el local y lo actualiza', async () => {
  const store = createConsentStore(memoryStorage());
  await store.write(OWNER, { shareAnonymousData: true, allowEmergencyContact: false });
  const remote = fakeRemote({ rows: { shareAnonymousData: false, allowEmergencyContact: true } });
  const result = await loadConsents({ owners, store, remote });
  assert.deepEqual(result.choices, { shareAnonymousData: false, allowEmergencyContact: true });
  assert.equal(result.remoteUnavailable, false);
  assert.deepEqual(await store.read(OWNER), result.choices);
  assert.deepEqual(remote.recorded, []);
});

test('RF-007: sin filas en el servidor y con el consentimiento activo en el dispositivo, se registra otorgado', async () => {
  const store = createConsentStore(memoryStorage());
  await store.write(OWNER, { shareAnonymousData: true, allowEmergencyContact: false });
  const remote = fakeRemote();
  const result = await loadConsents({ owners, store, remote });
  assert.deepEqual(remote.recorded, [['shareAnonymousData', true]]);
  assert.deepEqual(result.choices, { shareAnonymousData: true, allowEmergencyContact: false });
  assert.equal(result.remoteUnavailable, false);
});

test('sin filas y con el dispositivo inactivo no se inserta nada, ni siquiera false de relleno', async () => {
  const store = createConsentStore(memoryStorage());
  await store.write(OWNER, { shareAnonymousData: false, allowEmergencyContact: true });
  const remote = fakeRemote({ rows: { allowEmergencyContact: true } });
  await loadConsents({ owners, store, remote });
  assert.deepEqual(remote.recorded, []);
  const empty = fakeRemote();
  await loadConsents({ owners, store: createConsentStore(memoryStorage()), remote: empty });
  assert.deepEqual(empty.recorded, []);
});

test('RF-008: si el servidor no responde se usa el estado local y se bloquean los cambios', async () => {
  const store = createConsentStore(memoryStorage());
  await store.write(OWNER, { shareAnonymousData: true, allowEmergencyContact: false });
  const remote = fakeRemote({ failFetch: true });
  const result = await loadConsents({ owners, store, remote });
  assert.deepEqual(result, {
    ownerId: OWNER,
    choices: { shareAnonymousData: true, allowEmergencyContact: false },
    failed: false,
    remoteUnavailable: true,
  });
  assert.deepEqual(remote.recorded, []);
});

test('si la reconciliación no pudo registrar lo local, se marca el servidor como no disponible sin lanzar', async () => {
  const store = createConsentStore(memoryStorage());
  await store.write(OWNER, { shareAnonymousData: true, allowEmergencyContact: false });
  const result = await loadConsents({ owners, store, remote: fakeRemote({ failRecord: true }) });
  assert.equal(result.remoteUnavailable, true);
  assert.equal(result.choices.shareAnonymousData, true);
});

test('las filas remotas se validan: lo desconocido o con tipos erróneos se ignora', () => {
  assert.deepEqual(
    parseRemoteConsents(
      [
        { consentimiento_id_consentimiento: 1, otorgado: true },
        { consentimiento_id_consentimiento: 2, otorgado: 'si' },
        { consentimiento_id_consentimiento: 3, otorgado: true },
        { consentimiento_id_consentimiento: 9, otorgado: true },
        null,
      ],
      [
        { id_consentimiento: 1, codigo: 'analitica_anonima' },
        { id_consentimiento: 2, codigo: 'contacto' },
        { id_consentimiento: 3, codigo: 'otro' },
        null,
      ],
    ),
    { shareAnonymousData: true },
  );
  assert.throws(() => parseRemoteConsents({}, []));
  assert.throws(() => parseRemoteConsents([], {}));
});

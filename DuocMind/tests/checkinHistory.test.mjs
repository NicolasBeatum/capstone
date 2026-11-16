import assert from 'node:assert/strict';
import test from 'node:test';

import {
  deleteCheckin,
  loadCheckinHistory,
  saveConfirmedCheckin,
  syncPendingCheckins,
} from '../src/features/emotional-checkin/application/checkinHistory.ts';

function repositories(initial = []) {
  const entries = new Map(initial.map((entry) => [entry.clientRequestId, { ...entry }]));
  const local = {
    savePending: async (entry) => entries.set(entry.clientRequestId, { ...entry, syncStatus: 'pending' }),
    saveDeviceOnly: async (entry) => entries.set(entry.clientRequestId, { ...entry, syncStatus: 'device' }),
    listAll: async () => [...entries.values()],
    listPending: async () => [...entries.values()].filter((entry) => entry.syncStatus === 'pending'),
    markSynced: async (id) => entries.set(id, { ...entries.get(id), syncStatus: 'synced' }),
    remove: async (id) => entries.delete(id),
  };
  const remoteRows = [];
  const remote = {
    save: async (entry) => {
      if (!remoteRows.some((row) => row.clientRequestId === entry.clientRequestId)) {
        remoteRows.push({ ...entry, syncStatus: 'synced' });
      }
    },
    list: async () => remoteRows,
    remove: async (id) => {
      const index = remoteRows.findIndex((row) => row.clientRequestId === id);
      if (index >= 0) remoteRows.splice(index, 1);
    },
  };
  return { entries, local, remote, remoteRows, canUpload: allowed };
}

const allowed = async () => true;
const denied = async () => false;

test('confirmar conserva primero localmente y marca sincronizado tras éxito remoto', async () => {
  const deps = repositories();
  const result = await saveConfirmedCheckin('Bien', {
    ...deps,
    createRequestId: () => 'request-1',
    now: () => new Date('2026-09-27T12:00:00.000Z'),
  });

  assert.deepEqual(result, { clientRequestId: 'request-1', syncStatus: 'synced' });
  assert.equal(deps.remoteRows.length, 1);
});

test('los motivos elegidos llegan al servidor con el check-in', async () => {
  const deps = repositories();
  await saveConfirmedCheckin('Mal', {
    ...deps,
    createRequestId: () => 'request-reasons',
    now: () => new Date('2026-11-09T12:00:00.000Z'),
  }, [2, 5]);

  assert.deepEqual(deps.entries.get('request-reasons').reasonIds, [2, 5]);
  assert.deepEqual(deps.remoteRows[0].reasonIds, [2, 5]);
});

test('si fallan los motivos el check-in sigue pendiente y el reintento los sube una vez', async () => {
  const deps = repositories();
  const saved = new Set();
  let failReasons = true;
  const remote = {
    ...deps.remote,
    save: async (entry) => {
      if (failReasons) throw new Error('motivos sin red');
      for (const id of entry.reasonIds) saved.add(`${entry.clientRequestId}:${id}`);
    },
  };
  const result = await saveConfirmedCheckin('Mal', {
    ...deps,
    remote,
    createRequestId: () => 'retry-reasons',
    now: () => new Date('2026-11-09T12:00:00.000Z'),
  }, [1]);
  assert.equal(result.syncStatus, 'pending');

  failReasons = false;
  await syncPendingCheckins(deps.local, remote, allowed);
  await syncPendingCheckins(deps.local, remote, allowed);
  assert.deepEqual([...saved], ['retry-reasons:1']);
  assert.equal(deps.entries.get('retry-reasons').syncStatus, 'synced');
});

test('un error remoto conserva el registro pendiente en el historial local', async () => {
  const deps = repositories();
  const result = await saveConfirmedCheckin('Mal', {
    ...deps,
    remote: { ...deps.remote, save: async () => { throw new Error('offline'); } },
    createRequestId: () => 'request-offline',
    now: () => new Date('2026-09-27T12:00:00.000Z'),
  });

  assert.equal(result.syncStatus, 'pending');
  assert.equal(deps.entries.get('request-offline').mood, 'Mal');
});

test('sincronizar pendientes es idempotente y los errores dejan la cola intacta', async () => {
  const deps = repositories([{
    clientRequestId: 'request-1', mood: 'Bien', createdAt: '2026-09-27T12:00:00.000Z', syncStatus: 'pending',
  }]);
  await syncPendingCheckins(deps.local, deps.remote, allowed);
  await syncPendingCheckins(deps.local, deps.remote, allowed);
  assert.equal(deps.remoteRows.length, 1);
  assert.equal(deps.entries.get('request-1').syncStatus, 'synced');

  const broken = repositories([{
    clientRequestId: 'request-2', mood: 'Mal', createdAt: '2026-09-27T12:00:00.000Z', syncStatus: 'pending',
  }]);
  await assert.rejects(syncPendingCheckins(broken.local, { ...broken.remote, save: async () => { throw new Error('offline'); } }, allowed));
  assert.equal(broken.entries.get('request-2').syncStatus, 'pending');
});

test('sin consentimientos el check-in se queda solo en el dispositivo', async () => {
  const deps = repositories();
  const result = await saveConfirmedCheckin('Mal', {
    ...deps,
    canUpload: denied,
    createRequestId: () => 'request-private',
    now: () => new Date('2026-11-15T12:00:00.000Z'),
  }, [3]);

  assert.deepEqual(result, { clientRequestId: 'request-private', syncStatus: 'device' });
  assert.equal(deps.remoteRows.length, 0);
  assert.deepEqual(deps.entries.get('request-private').reasonIds, [3]);
});

test('lo registrado sin consentimiento no se sube aunque después se active uno', async () => {
  const deps = repositories();
  await saveConfirmedCheckin('Bien', {
    ...deps,
    canUpload: denied,
    createRequestId: () => 'request-never',
    now: () => new Date('2026-11-15T12:00:00.000Z'),
  });
  await syncPendingCheckins(deps.local, deps.remote, allowed);

  assert.equal(deps.remoteRows.length, 0);
  assert.equal(deps.entries.get('request-never').syncStatus, 'device');
});

test('un pendiente con permiso espera si se revoca y se sube al volver a activarlo', async () => {
  const deps = repositories([{
    clientRequestId: 'request-later', mood: 'Bien', createdAt: '2026-11-15T12:00:00.000Z', syncStatus: 'pending',
  }]);
  await syncPendingCheckins(deps.local, deps.remote, denied);
  assert.equal(deps.remoteRows.length, 0);
  assert.equal(deps.entries.get('request-later').syncStatus, 'pending');

  await syncPendingCheckins(deps.local, deps.remote, allowed);
  assert.equal(deps.remoteRows.length, 1);
  assert.equal(deps.entries.get('request-later').syncStatus, 'synced');
});

test('borrar un check-in solo del dispositivo no llama al servidor', async () => {
  const deps = repositories([{
    clientRequestId: 'request-device', mood: 'Mal', createdAt: '2026-11-15T12:00:00.000Z', syncStatus: 'device',
  }]);
  let remoteCalls = 0;
  await deleteCheckin('request-device', {
    local: deps.local,
    remote: { ...deps.remote, remove: async () => { remoteCalls += 1; } },
  });
  assert.equal(remoteCalls, 0);
  assert.equal(deps.entries.has('request-device'), false);
});

test('el historial mezcla remoto y local por UUID y ordena por fecha', async () => {
  const deps = repositories([{
    clientRequestId: 'pending', mood: 'Neutro', createdAt: '2026-09-27T13:00:00.000Z', syncStatus: 'pending',
  }]);
  deps.remoteRows.push({
    clientRequestId: 'synced', mood: 'Bien', createdAt: '2026-09-27T12:00:00.000Z', syncStatus: 'synced',
  });
  const history = await loadCheckinHistory(deps.local, deps.remote);
  assert.deepEqual(history.entries.map((entry) => entry.clientRequestId), ['pending', 'synced']);
  assert.equal(history.remoteAvailable, true);
});

test('el historial distingue un error remoto de una consulta vacía', async () => {
  const deps = repositories();
  const history = await loadCheckinHistory(deps.local, {
    ...deps.remote,
    list: async () => { throw new Error('offline'); },
  });

  assert.deepEqual(history.entries, []);
  assert.equal(history.remoteAvailable, false);
});

test('borrar pendiente solo lo quita localmente y borrar sincronizado exige éxito remoto', async () => {
  const deps = repositories([
    { clientRequestId: 'pending', mood: 'Neutro', createdAt: '2026-09-27T13:00:00.000Z', syncStatus: 'pending' },
    { clientRequestId: 'synced', mood: 'Bien', createdAt: '2026-09-27T12:00:00.000Z', syncStatus: 'synced' },
  ]);
  deps.remoteRows.push({
    clientRequestId: 'synced', mood: 'Bien', createdAt: '2026-09-27T12:00:00.000Z', syncStatus: 'synced',
  });
  await deleteCheckin('pending', deps);
  assert.equal(deps.remoteRows.length, 1);
  await assert.rejects(
    deleteCheckin('synced', { ...deps, remote: { ...deps.remote, remove: async () => { throw new Error('denied'); } } }),
  );
  assert.equal(deps.entries.has('synced'), true);
});
test('con rango se consulta el remoto acotado y se filtran los pendientes locales', async () => {
  const deps = repositories([
    { clientRequestId: 'local-in', mood: 'Mal', createdAt: '2026-10-06T15:00:00.000Z', syncStatus: 'pending' },
    { clientRequestId: 'local-before', mood: 'Bien', createdAt: '2026-10-04T23:59:59.000Z', syncStatus: 'pending' },
    { clientRequestId: 'local-end', mood: 'Bien', createdAt: '2026-10-12T00:00:00.000Z', syncStatus: 'pending' },
  ]);
  const range = { from: '2026-10-05T00:00:00.000Z', to: '2026-10-12T00:00:00.000Z' };
  let requestedRange;
  const remote = {
    ...deps.remote,
    list: async (received) => {
      requestedRange = received;
      return [{ clientRequestId: 'remote-in', mood: 'Neutro', createdAt: '2026-10-07T10:00:00.000Z', syncStatus: 'synced' }];
    },
  };

  const history = await loadCheckinHistory(deps.local, remote, range);

  assert.deepEqual(requestedRange, range);
  assert.deepEqual(history.entries.map((entry) => entry.clientRequestId), ['remote-in', 'local-in']);
});

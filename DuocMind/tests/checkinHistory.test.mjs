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
  return { entries, local, remote, remoteRows };
}

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
  await syncPendingCheckins(deps.local, deps.remote);
  await syncPendingCheckins(deps.local, deps.remote);
  assert.equal(deps.remoteRows.length, 1);
  assert.equal(deps.entries.get('request-1').syncStatus, 'synced');

  const broken = repositories([{
    clientRequestId: 'request-2', mood: 'Mal', createdAt: '2026-09-27T12:00:00.000Z', syncStatus: 'pending',
  }]);
  await assert.rejects(syncPendingCheckins(broken.local, { ...broken.remote, save: async () => { throw new Error('offline'); } }));
  assert.equal(broken.entries.get('request-2').syncStatus, 'pending');
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
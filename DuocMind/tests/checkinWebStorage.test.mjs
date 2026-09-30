import assert from 'node:assert/strict';
import test from 'node:test';

import {
  deleteLocalCheckinData,
  getLocalCheckinStore,
} from '../src/features/emotional-checkin/infrastructure/encryptedCheckinDatabase.web.ts';

test('la vista web conserva outbox volátil por usuario mientras la pestaña siga abierta', async () => {
  const firstUser = '10000000-0000-0000-0000-000000000001';
  const secondUser = '20000000-0000-0000-0000-000000000002';
  const store = await getLocalCheckinStore(firstUser);
  await store.savePending({
    clientRequestId: 'web-request-1',
    mood: 'Bien',
    createdAt: '2026-09-28T03:00:00.000Z',
  });

  assert.equal((await (await getLocalCheckinStore(firstUser)).listPending()).length, 1);
  assert.equal((await (await getLocalCheckinStore(secondUser)).listPending()).length, 0);

  await store.markSynced('web-request-1');
  assert.equal((await store.listAll())[0].syncStatus, 'synced');
  await deleteLocalCheckinData(firstUser);
  assert.equal((await (await getLocalCheckinStore(firstUser)).listAll()).length, 0);
  await deleteLocalCheckinData(secondUser);
});
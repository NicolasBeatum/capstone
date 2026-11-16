import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createLocalDeletionSchedule,
  parseLocalDeletionSchedule,
  purgeExpiredAccounts,
} from '../src/shared/deletion/application/localDeletionSchedule.ts';

const A = '00000000-0000-0000-0000-00000000000a';
const B = '00000000-0000-0000-0000-00000000000b';

function memoryStorage() {
  const map = new Map();
  return {
    map,
    getItem: async (key) => map.get(key) ?? null,
    setItem: async (key, value) => void map.set(key, value),
    deleteItem: async (key) => void map.delete(key),
  };
}

test('solo vencen las cuentas cuya fecha ya pasó', async () => {
  const schedule = createLocalDeletionSchedule(memoryStorage());
  await schedule.remember(A, '2026-12-01T00:00:00.000Z');
  await schedule.remember(B, '2026-12-20T00:00:00.000Z');
  assert.deepEqual(await schedule.due(new Date('2026-11-30T00:00:00.000Z')), []);
  assert.deepEqual(await schedule.due(new Date('2026-12-05T00:00:00.000Z')), [A]);
});

test('cancelar quita la fecha y no queda nada guardado', async () => {
  const storage = memoryStorage();
  const schedule = createLocalDeletionSchedule(storage);
  await schedule.remember(A, '2026-12-01T00:00:00.000Z');
  await schedule.forget(A);
  assert.deepEqual(await schedule.due(new Date('2027-01-01T00:00:00.000Z')), []);
  assert.equal(storage.map.size, 0);
});

test('lo guardado inválido se descarta', () => {
  assert.deepEqual(parseLocalDeletionSchedule('{'), {});
  assert.deepEqual(parseLocalDeletionSchedule(JSON.stringify({ x: '2026-12-01', [A]: 'mañana', [B]: '2026-12-01T00:00:00.000Z' })), {
    [B]: '2026-12-01T00:00:00.000Z',
  });
});

test('la limpieza borra las vencidas y reintenta después las que fallan', async () => {
  const schedule = createLocalDeletionSchedule(memoryStorage());
  await schedule.remember(A, '2026-12-01T00:00:00.000Z');
  await schedule.remember(B, '2026-12-01T00:00:00.000Z');
  const cleared = [];
  await purgeExpiredAccounts({
    schedule,
    now: () => new Date('2026-12-02T00:00:00.000Z'),
    clearLocalData: async (ownerId) => {
      if (ownerId === B) throw new Error('bloqueado');
      cleared.push(ownerId);
    },
  });
  assert.deepEqual(cleared, [A]);
  assert.deepEqual(await schedule.due(new Date('2026-12-02T00:00:00.000Z')), [B]);
});

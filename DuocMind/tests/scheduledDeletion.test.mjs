import assert from 'node:assert/strict';
import test from 'node:test';

import {
  formatDeletionDate,
  NO_PENDING_DELETION,
  parseDeletionStatus,
  scheduleAccountDeletion,
  serverDeletionKind,
} from '../src/shared/deletion/application/scheduledDeletion.ts';

test('el estado lee las solicitudes pendientes e ignora lo desconocido', () => {
  assert.deepEqual(parseDeletionStatus([]), NO_PENDING_DELETION);
  assert.deepEqual(
    parseDeletionStatus([
      { tipo: 'datos', ejecutar_en: '2026-11-22T12:00:00Z' },
      { tipo: 'cuenta', ejecutar_en: '2026-12-15T12:00:00Z' },
      { tipo: 'otro', ejecutar_en: '2026-12-15T12:00:00Z' },
      { tipo: 'datos', ejecutar_en: 'mañana' },
      null,
    ]),
    { data: '2026-11-22T12:00:00Z', account: '2026-12-15T12:00:00Z' },
  );
  assert.throws(() => parseDeletionStatus(null));
});

test('los tipos se traducen a los códigos del servidor', () => {
  assert.equal(serverDeletionKind('data'), 'datos');
  assert.equal(serverDeletionKind('account'), 'cuenta');
});

test('la fecha se muestra como día y mes', () => {
  assert.equal(formatDeletionDate('2026-11-22T15:00:00Z'), '22 de noviembre');
});

test('eliminar la cuenta registra primero en el servidor y no toca el dispositivo si falla', async () => {
  const steps = [];
  await assert.rejects(scheduleAccountDeletion({
    requestRemote: async () => { steps.push('remote'); throw new Error('offline'); },
    rememberLocally: async () => { steps.push('remember'); },
    clearLocalSession: async () => { steps.push('session'); },
  }), /offline/);
  assert.deepEqual(steps, ['remote']);
});

test('con el servidor confirmado anota la fecha, cierra sesión y conserva los datos locales', async () => {
  const steps = [];
  const when = await scheduleAccountDeletion({
    requestRemote: async () => { steps.push('remote'); return '2026-12-15T12:00:00.000Z'; },
    rememberLocally: async (executesAt) => { steps.push(`remember:${executesAt}`); },
    clearLocalSession: async () => { steps.push('session'); },
  });
  assert.equal(when, '2026-12-15T12:00:00.000Z');
  assert.deepEqual(steps, ['remote', 'remember:2026-12-15T12:00:00.000Z', 'session']);
});

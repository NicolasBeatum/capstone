import test from 'node:test';
import assert from 'node:assert/strict';
import { loadRegistrationCatalog } from '../src/features/auth/application/registrationCatalog.ts';

const careers = [{ id: '1', name: 'Diseño', campusId: '1' }];

test('CA-001: devuelve las carreras del gateway', async () => {
  const result = await loadRegistrationCatalog({ fetch: async () => ({ careers }) });
  assert.deepEqual(result, { careers, failed: false });
});

test('CA-005: un fallo de red se informa sin lanzar', async () => {
  const result = await loadRegistrationCatalog({ fetch: async () => { throw new Error('red'); } });
  assert.deepEqual(result, { careers: [], failed: true });
});

test('CA-005: un catálogo vacío se informa como fallo', async () => {
  const result = await loadRegistrationCatalog({ fetch: async () => ({ careers: [] }) });
  assert.equal(result.failed, true);
});

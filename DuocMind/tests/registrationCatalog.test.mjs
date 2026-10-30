import test from 'node:test';
import assert from 'node:assert/strict';
import { loadRegistrationCatalog } from '../src/features/auth/application/registrationCatalog.ts';

const campuses = [{ id: '1', name: 'Plaza Norte' }];
const careers = [{ id: '1', name: 'Diseño', campusId: '1' }];

test('CA-001: devuelve las sedes y carreras del gateway', async () => {
  const result = await loadRegistrationCatalog({ fetch: async () => ({ campuses, careers }) });
  assert.deepEqual(result, { campuses, careers, failed: false });
});

test('CA-005: un fallo de red se informa sin lanzar', async () => {
  const result = await loadRegistrationCatalog({ fetch: async () => { throw new Error('red'); } });
  assert.deepEqual(result, { campuses: [], careers: [], failed: true });
});

test('CA-005: un catálogo vacío se informa como fallo', async () => {
  const result = await loadRegistrationCatalog({ fetch: async () => ({ campuses: [], careers: [] }) });
  assert.equal(result.failed, true);
});

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  parseReasonCatalog,
  requiresReason,
  toggleReason,
} from '../src/features/emotional-checkin/domain/checkinReasons.ts';
import { loadReasonCatalog } from '../src/features/emotional-checkin/application/checkinReasons.ts';

const row = (id, nombre, orden = 0, activo = true) => ({ id_motivo: id, nombre_motivo: nombre, orden, activo });

test('el catálogo muestra solo motivos activos, por orden y luego por nombre', () => {
  const catalog = parseReasonCatalog([
    row(3, 'Trabajo', 2),
    row(1, 'Familia', 1),
    row(4, 'Salud', 2),
    row(2, 'Pareja', 1, false),
    row(5, 'Amistades', 2),
  ]);
  assert.deepEqual(catalog, [
    { id: 1, name: 'Familia' },
    { id: 5, name: 'Amistades' },
    { id: 4, name: 'Salud' },
    { id: 3, name: 'Trabajo' },
  ]);
});

test('una respuesta malformada se rechaza entera', () => {
  assert.equal(parseReasonCatalog(null), null);
  assert.equal(parseReasonCatalog({}), null);
  assert.equal(parseReasonCatalog([row(1, 'Familia'), { id_motivo: 'x', nombre_motivo: 'Mal' }]), null);
  assert.equal(parseReasonCatalog([row(1, '   ')]), null);
});

test('un catálogo vacío es válido y los duplicados se ignoran', () => {
  assert.deepEqual(parseReasonCatalog([]), []);
  assert.deepEqual(parseReasonCatalog([row(1, 'Familia'), row(1, 'Familia')]), [{ id: 1, name: 'Familia' }]);
});

test('alternar agrega y quita sin mutar la selección', () => {
  const selected = [1];
  assert.deepEqual(toggleReason(selected, 2), [1, 2]);
  assert.deepEqual(toggleReason([1, 2], 1), [2]);
  assert.deepEqual(selected, [1]);
});

function cache(initial = []) {
  let saved = initial;
  return {
    saveReasonCatalog: async (reasons) => { saved = [...reasons]; },
    listReasonCatalog: async () => saved,
    get saved() { return saved; },
  };
}

test('una descarga válida actualiza la copia local', async () => {
  const local = cache([{ id: 9, name: 'Viejo' }]);
  const reasons = await loadReasonCatalog(local, { fetchReasonCatalog: async () => [row(1, 'Familia', 1)] });
  assert.deepEqual(reasons, [{ id: 1, name: 'Familia' }]);
  assert.deepEqual(local.saved, [{ id: 1, name: 'Familia' }]);
});

test('sin red o con respuesta inválida se usa la copia y no se borra', async () => {
  const copy = [{ id: 1, name: 'Familia' }];
  const offline = cache(copy);
  assert.deepEqual(await loadReasonCatalog(offline, { fetchReasonCatalog: async () => { throw new Error('offline'); } }), copy);

  const malformed = cache(copy);
  assert.deepEqual(await loadReasonCatalog(malformed, { fetchReasonCatalog: async () => ({ error: true }) }), copy);
  assert.deepEqual(malformed.saved, copy);
});

test('sin copia y sin red no hay motivos', async () => {
  assert.deepEqual(await loadReasonCatalog(cache(), { fetchReasonCatalog: async () => { throw new Error('offline'); } }), []);
});

test('hay que elegir al menos un motivo mostrado, salvo que no haya catálogo', () => {
  const reasons = [{ id: 1, name: 'Familia' }, { id: 2, name: 'Trabajo' }];
  assert.equal(requiresReason(reasons, []), true);
  assert.equal(requiresReason(reasons, [9]), true);
  assert.equal(requiresReason(reasons, [2]), false);
  assert.equal(requiresReason([], []), false);
});

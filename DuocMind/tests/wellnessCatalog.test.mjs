import test from 'node:test';
import assert from 'node:assert/strict';
import {
  REFRESH_MIN_INTERVAL_MS,
  REQUEST_TIMEOUT_MS,
  loadResourceCatalog,
  shouldRefresh,
} from '../src/features/wellness/application/resourceCatalog.ts';
import { parseCatalog } from '../src/features/wellness/domain/wellnessResource.ts';

const sampleCatalog = () =>
  parseCatalog({
    categories: [{ id: 1, nombre: 'Estrés', orden: 1 }],
    resources: [
      {
        id: 1,
        titulo: 'Respiración 4-7-8',
        descripcion: null,
        contenido: null,
        imagen_path: 'a.png',
        video_url: null,
        created_at: '2026-11-01T10:00:00+00:00',
        herramienta_tipoherramienta: [{ tipo_id: 1 }],
      },
    ],
  });

const emptyCatalog = () => parseCatalog({ categories: [], resources: [] });
const NOW = new Date('2026-11-07T15:30:00.000Z');

function setup({ remote, stored = null, readError = false, writeError = false } = {}) {
  const writes = [];
  const gateway = {
    fetchCatalog: async () => {
      if (remote instanceof Error) throw remote;
      return remote;
    },
  };
  const cache = {
    read: async () => {
      if (readError) throw new Error('almacenamiento no disponible');
      return stored;
    },
    write: async (catalog, fetchedAt) => {
      if (writeError) throw new Error('QuotaExceeded');
      writes.push({ catalog, fetchedAt });
    },
  };
  const load = () => loadResourceCatalog({ gateway, cache, now: () => NOW });
  return { writes, load };
}

test('una descarga correcta se muestra y se guarda como copia con la hora inyectada', async () => {
  const catalog = sampleCatalog();
  const { writes, load } = setup({ remote: catalog });
  const result = await load();
  assert.equal(result.status, 'ready');
  assert.equal(result.source, 'remote');
  assert.equal(result.catalog, catalog);
  assert.equal(result.fetchedAt, NOW.toISOString());
  assert.equal(writes.length, 1);
  assert.equal(writes[0].catalog, catalog);
  assert.equal(writes[0].fetchedAt, NOW.toISOString());
});

test('un catálogo vacío descargado es «empty» y también se guarda', async () => {
  const { writes, load } = setup({ remote: emptyCatalog() });
  const result = await load();
  assert.deepEqual(result, { status: 'empty', source: 'remote', fetchedAt: NOW.toISOString() });
  assert.equal(writes.length, 1);
});

test('una descarga fallida usa la copia, con su fecha original, y no la reescribe', async () => {
  const stored = { catalog: sampleCatalog(), fetchedAt: '2026-11-05T08:00:00.000Z' };
  const { writes, load } = setup({ remote: new Error('sin red'), stored });
  const result = await load();
  assert.equal(result.status, 'ready');
  assert.equal(result.source, 'cache');
  assert.equal(result.catalog, stored.catalog);
  assert.equal(result.fetchedAt, '2026-11-05T08:00:00.000Z');
  assert.equal(writes.length, 0);
});

test('una copia vacía con la descarga fallida se informa como «empty» de la copia', async () => {
  const stored = { catalog: emptyCatalog(), fetchedAt: '2026-11-05T08:00:00.000Z' };
  const { load } = setup({ remote: new Error('sin red'), stored });
  assert.deepEqual(await load(), { status: 'empty', source: 'cache', fetchedAt: '2026-11-05T08:00:00.000Z' });
});

test('sin conexión y sin copia es un error', async () => {
  const { writes, load } = setup({ remote: new Error('sin red'), stored: null });
  assert.deepEqual(await load(), { status: 'error' });
  assert.equal(writes.length, 0);
});

test('una copia ilegible (la lectura lanza) se trata como inexistente', async () => {
  const { load } = setup({ remote: new Error('sin red'), readError: true });
  assert.deepEqual(await load(), { status: 'error' });
});

test('una copia con forma inválida se trata como inexistente', async () => {
  for (const stored of [{ catalog: null, fetchedAt: 'x' }, { catalog: {}, fetchedAt: 'x' }, { catalog: sampleCatalog(), fetchedAt: 5 }]) {
    const { load } = setup({ remote: new Error('sin red'), stored });
    assert.deepEqual(await load(), { status: 'error' });
  }
});

test('una respuesta malformada conserva la copia y no la reemplaza', async () => {
  const stored = { catalog: sampleCatalog(), fetchedAt: '2026-11-05T08:00:00.000Z' };
  for (const remote of [null, undefined, {}, 'texto', { categories: [] }, { categories: {}, resources: [] }]) {
    const { writes, load } = setup({ remote, stored });
    const result = await load();
    assert.equal(result.status, 'ready', JSON.stringify(remote));
    assert.equal(result.source, 'cache');
    assert.equal(writes.length, 0, 'no se escribe nada con una respuesta malformada');
  }
});

test('un gateway que lanza por respuesta malformada (como el real) conserva la copia', async () => {
  const stored = { catalog: sampleCatalog(), fetchedAt: '2026-11-05T08:00:00.000Z' };
  let malformed;
  try {
    parseCatalog({ categories: 'x' });
  } catch (error) {
    malformed = error;
  }
  const { writes, load } = setup({ remote: malformed, stored });
  assert.equal((await load()).source, 'cache');
  assert.equal(writes.length, 0);
});

test('un fallo al escribir la copia se ignora y lo descargado se muestra igual', async () => {
  const catalog = sampleCatalog();
  const { load } = setup({ remote: catalog, writeError: true });
  const result = await load();
  assert.equal(result.status, 'ready');
  assert.equal(result.source, 'remote');
  assert.equal(result.catalog, catalog);
});

test('el caso de uso no lanza en ninguna combinación de fallos', async () => {
  for (const remote of [new Error('x'), null, sampleCatalog()]) {
    for (const stored of [null, { catalog: sampleCatalog(), fetchedAt: 'y' }]) {
      for (const readError of [false, true]) {
        for (const writeError of [false, true]) {
          const { load } = setup({ remote, stored, readError, writeError });
          await assert.doesNotReject(load());
        }
      }
    }
  }
});

test('shouldRefresh: sin descarga previa descarga', () => {
  assert.equal(shouldRefresh(null, 1_000), true);
});

test('shouldRefresh: justo antes de 60 s no descarga y desde los 60 s sí', () => {
  const last = 1_000_000;
  assert.equal(REFRESH_MIN_INTERVAL_MS, 60_000);
  assert.equal(shouldRefresh(last, last), false);
  assert.equal(shouldRefresh(last, last + 59_999), false);
  assert.equal(shouldRefresh(last, last + 60_000), true);
  assert.equal(shouldRefresh(last, last + 600_000), true);
});

test('shouldRefresh: acepta otro intervalo y tolera un reloj atrasado o valores inválidos', () => {
  assert.equal(shouldRefresh(1_000, 1_500, 1_000), false);
  assert.equal(shouldRefresh(1_000, 2_000, 1_000), true);
  assert.equal(shouldRefresh(5_000_000, 1_000), true, 'el reloj retrocedió');
  assert.equal(shouldRefresh(Number.NaN, 1_000), true);
  assert.equal(shouldRefresh(1_000, Number.NaN), true);
});

test('una red que se cuelga usa la copia pasado el plazo en lugar de esperar indefinidamente', async () => {
  const stored = { catalog: sampleCatalog(), fetchedAt: '2026-11-05T08:00:00.000Z' };
  const writes = [];
  const hanging = { fetchCatalog: () => new Promise(() => {}) };
  const cache = { read: async () => stored, write: async (...args) => void writes.push(args) };
  const started = Date.now();
  const result = await loadResourceCatalog({ gateway: hanging, cache, now: () => NOW, timeoutMs: 30 });
  assert.equal(result.status, 'ready');
  assert.equal(result.source, 'cache');
  assert.ok(Date.now() - started < 1_000, 'no espera más allá del plazo');
  assert.equal(writes.length, 0);
});

test('una red colgada sin copia es un error', async () => {
  const hanging = { fetchCatalog: () => new Promise(() => {}) };
  const cache = { read: async () => null, write: async () => {} };
  assert.deepEqual(await loadResourceCatalog({ gateway: hanging, cache, now: () => NOW, timeoutMs: 20 }), { status: 'error' });
});

test('una respuesta que llega tras el plazo no reemplaza la copia ni se escribe', async () => {
  const stored = { catalog: sampleCatalog(), fetchedAt: '2026-11-05T08:00:00.000Z' };
  const writes = [];
  const slow = { fetchCatalog: () => new Promise((resolve) => setTimeout(() => resolve(sampleCatalog()), 80)) };
  const cache = { read: async () => stored, write: async (...args) => void writes.push(args) };
  const result = await loadResourceCatalog({ gateway: slow, cache, now: () => NOW, timeoutMs: 20 });
  assert.equal(result.source, 'cache');
  await new Promise((resolve) => setTimeout(resolve, 120));
  assert.equal(writes.length, 0, 'la respuesta tardía se descarta');
});

test('una respuesta dentro del plazo se usa normalmente', async () => {
  const fast = { fetchCatalog: () => new Promise((resolve) => setTimeout(() => resolve(sampleCatalog()), 5)) };
  const cache = { read: async () => null, write: async () => {} };
  const result = await loadResourceCatalog({ gateway: fast, cache, now: () => NOW, timeoutMs: 500 });
  assert.equal(result.source, 'remote');
});

test('el plazo por defecto es de 8 s', () => {
  assert.equal(REQUEST_TIMEOUT_MS, 8_000);
});

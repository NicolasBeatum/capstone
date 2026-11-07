import test from 'node:test';
import assert from 'node:assert/strict';
import { createWebResourceCache } from '../src/features/wellness/infrastructure/resourceCacheStorage.web.ts';
import {
  decodeCacheDocument,
  encodeCacheDocument,
} from '../src/features/wellness/infrastructure/resourceCacheDocument.ts';
import { loadResourceCatalog } from '../src/features/wellness/application/resourceCatalog.ts';
import { parseCatalog } from '../src/features/wellness/domain/wellnessResource.ts';

const KEY = 'duocmind.wellness.resources.v1';
const FETCHED = '2026-11-07T15:30:00.000Z';

function memoryStorage() {
  const map = new Map();
  return {
    map,
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => void map.set(key, value),
  };
}

const row = (id, extra = {}) => ({
  id,
  titulo: `Recurso ${id}`,
  descripcion: 'Descripción breve del recurso de ejemplo.',
  contenido: 'Contenido '.repeat(40),
  imagen_path: `categoria/recurso-${id}.webp`,
  video_url: 'https://example.test/video',
  created_at: `2026-10-${String((id % 27) + 1).padStart(2, '0')}T10:00:00+00:00`,
  herramienta_tipoherramienta: [{ tipo_id: (id % 4) + 1 }],
  ...extra,
});

const smallCatalog = () =>
  parseCatalog({
    categories: [{ id: 1, nombre: 'Estrés', orden: 1 }],
    resources: [row(0, { herramienta_tipoherramienta: [{ tipo_id: 1 }] })],
  });

const bigCatalog = () =>
  parseCatalog({
    categories: [1, 2, 3, 4].map((id) => ({ id, nombre: `Categoría ${id}`, orden: id })),
    resources: Array.from({ length: 80 }, (_, i) => row(i + 1)),
  });

test('guarda y lee el catálogo con su fecha de descarga', async () => {
  const storage = memoryStorage();
  const cache = createWebResourceCache(() => storage);
  const catalog = smallCatalog();
  await cache.write(catalog, FETCHED);
  assert.deepEqual(await cache.read(), { catalog, fetchedAt: FETCHED });
});

test('sin copia previa leer devuelve null', async () => {
  assert.equal(await createWebResourceCache(() => memoryStorage()).read(), null);
});

test('admite una copia de más de 2 KB sin perder nada', async () => {
  const storage = memoryStorage();
  const cache = createWebResourceCache(() => storage);
  const catalog = bigCatalog();
  await cache.write(catalog, FETCHED);
  assert.ok(storage.map.get(KEY).length > 2048, 'la copia supera el límite de SecureStore');
  assert.ok(storage.map.get(KEY).length > 20_000);
  assert.deepEqual(await cache.read(), { catalog, fetchedAt: FETCHED });
});

test('escribir de nuevo reemplaza la copia anterior', async () => {
  const storage = memoryStorage();
  const cache = createWebResourceCache(() => storage);
  await cache.write(smallCatalog(), '2026-11-01T00:00:00.000Z');
  const next = bigCatalog();
  await cache.write(next, FETCHED);
  assert.deepEqual(await cache.read(), { catalog: next, fetchedAt: FETCHED });
});

test('un valor corrupto o de otra versión devuelve null y no lanza', async () => {
  const cache = (value) => {
    const storage = memoryStorage();
    storage.map.set(KEY, value);
    return createWebResourceCache(() => storage);
  };
  const doc = (changes) => JSON.stringify({ schema: 1, fetchedAt: FETCHED, catalog: { categories: [], resources: [] }, ...changes });
  for (const bad of [
    'no es json',
    '',
    'null',
    '[]',
    '{}',
    doc({ schema: 2 }),
    doc({ schema: undefined }),
    doc({ fetchedAt: 'ayer' }),
    doc({ fetchedAt: 5 }),
    doc({ catalog: null }),
    doc({ catalog: { categories: 'x', resources: [] } }),
  ]) {
    assert.equal(await cache(bad).read(), null, bad);
  }
});

test('una copia con filas inválidas conserva las válidas', async () => {
  const storage = memoryStorage();
  storage.map.set(
    KEY,
    JSON.stringify({
      schema: 1,
      fetchedAt: FETCHED,
      catalog: { categories: [{ id: 1, nombre: 'Estrés', orden: 1 }], resources: [row(1, { herramienta_tipoherramienta: [{ tipo_id: 1 }] }), { id: 'x' }] },
    }),
  );
  const stored = await createWebResourceCache(() => storage).read();
  assert.equal(stored.catalog.resources.length, 1);
});

test('una escritura que falla no corrompe la copia previa', async () => {
  const storage = memoryStorage();
  const cache = createWebResourceCache(() => storage);
  const original = smallCatalog();
  await cache.write(original, FETCHED);

  const setItem = storage.setItem;
  storage.setItem = () => {
    throw new Error('QuotaExceededError');
  };
  await assert.rejects(cache.write(bigCatalog(), '2026-12-01T00:00:00.000Z'));
  storage.setItem = setItem;

  assert.deepEqual(await cache.read(), { catalog: original, fetchedAt: FETCHED });
});

test('sin almacenamiento disponible la copia se comporta como vacía', async () => {
  const cache = createWebResourceCache(() => null);
  assert.equal(await cache.read(), null);
  await assert.rejects(cache.write(smallCatalog(), FETCHED), /no está disponible/);
});

test('si el almacenamiento lanza al leer, se devuelve null', async () => {
  const cache = createWebResourceCache(() => ({
    getItem: () => {
      throw new Error('SecurityError');
    },
    setItem: () => {},
  }));
  assert.equal(await cache.read(), null);
});

test('si el acceso al almacenamiento lanza, leer devuelve null', async () => {
  const cache = createWebResourceCache(() => {
    throw new Error('acceso denegado');
  });
  assert.equal(await cache.read(), null);
});

test('el documento codifica y decodifica sin cambios y rechaza lo que no es texto', () => {
  const catalog = bigCatalog();
  assert.deepEqual(decodeCacheDocument(encodeCacheDocument(catalog, FETCHED)), { catalog, fetchedAt: FETCHED });
  for (const bad of [null, undefined, 5, {}, [], true]) assert.equal(decodeCacheDocument(bad), null);
});

test('el documento no guarda nada de la persona: solo el catálogo público y la fecha', () => {
  const parsed = JSON.parse(encodeCacheDocument(bigCatalog(), FETCHED));
  assert.deepEqual(Object.keys(parsed).sort(), ['catalog', 'fetchedAt', 'schema']);
  assert.deepEqual(Object.keys(parsed.catalog).sort(), ['categories', 'resources']);
});

test('con el caso de uso: sin conexión se muestra la copia y un fallo de red no la borra', async () => {
  const storage = memoryStorage();
  const cache = createWebResourceCache(() => storage);
  const online = { fetchCatalog: async () => bigCatalog() };
  const offline = {
    fetchCatalog: async () => {
      throw new Error('sin red');
    },
  };

  const first = await loadResourceCatalog({ gateway: online, cache, now: () => new Date(FETCHED) });
  assert.equal(first.source, 'remote');

  const second = await loadResourceCatalog({ gateway: offline, cache, now: () => new Date('2026-11-08T00:00:00Z') });
  assert.equal(second.status, 'ready');
  assert.equal(second.source, 'cache');
  assert.equal(second.fetchedAt, FETCHED);

  const third = await loadResourceCatalog({ gateway: offline, cache, now: () => new Date('2026-11-09T00:00:00Z') });
  assert.equal(third.source, 'cache');
  assert.equal(third.catalog.resources.length, 80);
});

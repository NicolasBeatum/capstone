import test from 'node:test';
import assert from 'node:assert/strict';
import { createResourceCatalogStore } from '../src/features/wellness/infrastructure/resourceCatalogStore.ts';
import { buildPublicImageUrl } from '../src/features/wellness/infrastructure/resourceImageUrl.ts';
import { parseCatalog } from '../src/features/wellness/domain/wellnessResource.ts';

const catalog = () =>
  parseCatalog({
    categories: [{ id: 1, nombre: 'Estrés', orden: 1 }],
    resources: [
      {
        id: 1,
        titulo: 'Respiración',
        descripcion: null,
        contenido: null,
        imagen_path: null,
        video_url: null,
        created_at: '2026-11-01T10:00:00+00:00',
        herramienta_tipoherramienta: [{ tipo_id: 1 }],
      },
    ],
  });

const ready = (source = 'remote') => ({ status: 'ready', catalog: catalog(), source, fetchedAt: '2026-11-07T10:00:00.000Z' });
const error = { status: 'error' };

/** Descarga controlable: cada llamada devuelve una promesa que se resuelve a mano. */
function setup() {
  let clock = 1_000_000;
  const pending = [];
  const store = createResourceCatalogStore({
    load: () => new Promise((resolve, reject) => pending.push({ resolve, reject })),
    now: () => clock,
  });
  return {
    store,
    pending,
    advance: (ms) => void (clock += ms),
  };
}

const tick = () => new Promise((resolve) => setImmediate(resolve));

test('arranca sin resultado y sin descargar', () => {
  const { store } = setup();
  assert.deepEqual(store.getSnapshot(), { result: null, loading: false });
});

test('dos llamadas simultáneas comparten una sola descarga', async () => {
  const { store, pending } = setup();
  const a = store.refresh();
  const b = store.refresh();
  const c = store.refresh({ force: true });
  assert.equal(pending.length, 1);
  assert.equal(a, b);
  assert.equal(a, c);
  pending[0].resolve(ready());
  await Promise.all([a, b, c]);
  assert.equal(store.getSnapshot().result.status, 'ready');
});

test('notifica al empezar y al terminar, y deja de notificar al darse de baja', async () => {
  const { store, pending } = setup();
  const seen = [];
  const unsubscribe = store.subscribe(() => seen.push({ ...store.getSnapshot() }));
  const done = store.refresh();
  assert.equal(seen.length, 1);
  assert.equal(seen[0].loading, true);
  assert.equal(seen[0].result, null);
  pending[0].resolve(ready());
  await done;
  assert.equal(seen.length, 2);
  assert.equal(seen[1].loading, false);
  assert.equal(seen[1].result.status, 'ready');
  unsubscribe();
  store.refresh({ force: true });
  assert.equal(seen.length, 2);
});

test('un error sin resultado previo se guarda como error', async () => {
  const { store, pending } = setup();
  const done = store.refresh();
  pending[0].resolve(error);
  await done;
  assert.deepEqual(store.getSnapshot(), { result: error, loading: false });
});

test('un error no reemplaza un resultado ya disponible', async () => {
  const { store, pending } = setup();
  const first = store.refresh();
  pending[0].resolve(ready());
  await first;
  const before = store.getSnapshot().result;

  const second = store.refresh({ force: true });
  assert.equal(store.getSnapshot().result, before, 'durante la descarga se conserva el resultado anterior');
  assert.equal(store.getSnapshot().loading, true);
  pending[1].resolve(error);
  await second;
  assert.equal(store.getSnapshot().result, before);
  assert.equal(store.getSnapshot().loading, false);
});

test('un resultado de la copia se reemplaza por uno descargado, y uno vacío también cuenta', async () => {
  const { store, pending } = setup();
  const first = store.refresh();
  pending[0].resolve(ready('cache'));
  await first;
  assert.equal(store.getSnapshot().result.source, 'cache');

  const second = store.refresh({ force: true });
  pending[1].resolve({ status: 'empty', source: 'remote', fetchedAt: '2026-11-08T10:00:00.000Z' });
  await second;
  assert.deepEqual(store.getSnapshot().result, { status: 'empty', source: 'remote', fetchedAt: '2026-11-08T10:00:00.000Z' });
});

test('un enfoque dentro de los 60 s no vuelve a descargar y pasado ese tiempo sí', async () => {
  const { store, pending, advance } = setup();
  const first = store.refresh();
  pending[0].resolve(ready());
  await first;

  advance(59_999);
  await store.refresh();
  assert.equal(pending.length, 1);

  advance(1);
  const again = store.refresh();
  assert.equal(pending.length, 2);
  pending[1].resolve(ready());
  await again;
});

test('un intento fallido también cuenta para el intervalo; el reintento manual lo ignora', async () => {
  const { store, pending } = setup();
  const first = store.refresh();
  pending[0].resolve(ready('cache'));
  await first;

  await store.refresh();
  assert.equal(pending.length, 1, 'el enfoque no insiste de inmediato');

  const manual = store.refresh({ force: true });
  assert.equal(pending.length, 2, 'Reintentar siempre descarga');
  pending[1].resolve(ready());
  await manual;
});

test('sin resultado todavía, siempre intenta descargar', async () => {
  const { store, pending } = setup();
  const first = store.refresh();
  pending[0].resolve(error);
  await first;
  const retry = store.refresh({ force: true });
  assert.equal(pending.length, 2);
  pending[1].resolve(ready());
  await retry;
  assert.equal(store.getSnapshot().result.status, 'ready');
});

test('un error seguido de un reintento manual exitoso muestra el resultado nuevo', async () => {
  const { store, pending } = setup();
  const first = store.refresh();
  pending[0].resolve(error);
  await first;
  const second = store.refresh({ force: true });
  pending[1].resolve(ready());
  await second;
  assert.equal(store.getSnapshot().result.status, 'ready');
});

test('si la carga lanza, el estado queda en error y no se propaga la excepción', async () => {
  const { store, pending } = setup();
  const done = store.refresh();
  pending[0].reject(new Error('inesperado'));
  await assert.doesNotReject(done);
  assert.deepEqual(store.getSnapshot(), { result: error, loading: false });
});

test('la instantánea conserva la misma referencia mientras nada cambia', async () => {
  const { store, pending } = setup();
  const a = store.getSnapshot();
  assert.equal(store.getSnapshot(), a);
  const done = store.refresh();
  const loading = store.getSnapshot();
  assert.notEqual(loading, a);
  assert.equal(store.getSnapshot(), loading);
  pending[0].resolve(ready());
  await done;
  const finished = store.getSnapshot();
  assert.notEqual(finished, loading);
  await tick();
  assert.equal(store.getSnapshot(), finished);
});

test('después de terminar una descarga se puede iniciar otra', async () => {
  const { store, pending } = setup();
  const first = store.refresh();
  pending[0].resolve(ready());
  await first;
  const second = store.refresh({ force: true });
  assert.notEqual(first, second);
  assert.equal(pending.length, 2);
  pending[1].resolve(ready());
  await second;
});

test('URL pública de la imagen: segmentos codificados, sin barras repetidas en la base', () => {
  const base = 'https://proyecto.supabase.co';
  assert.equal(
    buildPublicImageUrl(base, 'estres/respiracion.webp'),
    'https://proyecto.supabase.co/storage/v1/object/public/herramientas/estres/respiracion.webp',
  );
  assert.equal(
    buildPublicImageUrl(`${base}///`, 'a b/ñandú.png'),
    'https://proyecto.supabase.co/storage/v1/object/public/herramientas/a%20b/%C3%B1and%C3%BA.png',
  );
  assert.equal(
    buildPublicImageUrl('http://127.0.0.1:54321', 'x.png'),
    'http://127.0.0.1:54321/storage/v1/object/public/herramientas/x.png',
  );
});

test('URL pública de la imagen: sin ruta segura o sin configuración válida es null', () => {
  const base = 'https://proyecto.supabase.co';
  for (const path of [null, '', '../x.png', '/x.png', 'a//b.png', 'https://otro.test/x.png', 'a?x=1', 'a#b']) {
    assert.equal(buildPublicImageUrl(base, path), null, String(path));
  }
  for (const bad of [undefined, '', 'proyecto.supabase.co', 'javascript:alert(1)', 'ftp://x']) {
    assert.equal(buildPublicImageUrl(bad, 'x.png'), null, String(bad));
  }
});

test('una ruta con caracteres reservados no cambia la consulta ni el bucket', () => {
  const url = buildPublicImageUrl('https://proyecto.supabase.co', 'a%2e%2e/b&c=d.png');
  assert.equal(url, 'https://proyecto.supabase.co/storage/v1/object/public/herramientas/a%252e%252e/b%26c%3Dd.png');
});

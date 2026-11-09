import test from 'node:test';
import assert from 'node:assert/strict';
import {
  categoriesWithResources,
  categoryIconKey,
  categoryIndex,
  categoryTone,
  effectiveCategoryId,
  filterResources,
  findResource,
  formatUpdatedAt,
  isSafeImagePath,
  parseCatalog,
  primaryCategory,
  serializeCatalog,
} from '../src/features/wellness/domain/wellnessResource.ts';

const categoryRows = [
  { id: 3, nombre: 'Apoyo al estudio', orden: 3 },
  { id: 1, nombre: 'Estrés', orden: 1 },
  { id: 2, nombre: 'Ansiedad', orden: 2 },
  { id: 4, nombre: 'Salud física', orden: 4 },
];

const row = (overrides = {}) => ({
  id: 1,
  titulo: 'Respiración 4-7-8',
  descripcion: 'Calma el cuerpo',
  contenido: 'Texto',
  imagen_path: 'estres/respiracion.webp',
  video_url: 'https://example.test/video',
  created_at: '2026-11-01T10:00:00+00:00',
  herramienta_tipoherramienta: [{ tipo_id: 1 }],
  ...overrides,
});

const raw = (resources, categories = categoryRows) => ({ categories, resources });

test('un documento válido se convierte y ordena: recursos por fecha descendente, categorías por orden', () => {
  const catalog = parseCatalog(
    raw([
      row({ id: 1, created_at: '2026-10-01T10:00:00+00:00' }),
      row({ id: 2, created_at: '2026-11-05T10:00:00+00:00' }),
      row({ id: 3, created_at: '2026-11-01T10:00:00+00:00' }),
    ]),
  );
  assert.deepEqual(catalog.resources.map((r) => r.id), [2, 3, 1]);
  assert.deepEqual(catalog.categories.map((c) => c.name), ['Estrés', 'Ansiedad', 'Apoyo al estudio', 'Salud física']);
  assert.equal(catalog.resources[0].title, 'Respiración 4-7-8');
});

test('con la misma fecha se ordena por id descendente y las categorías empatadas por nombre', () => {
  const same = '2026-11-01T10:00:00+00:00';
  const catalog = parseCatalog(
    raw(
      [row({ id: 5, created_at: same }), row({ id: 9, created_at: same })],
      [{ id: 2, nombre: 'Beta', orden: 1 }, { id: 1, nombre: 'Alfa', orden: 1 }],
    ),
  );
  assert.deepEqual(catalog.resources.map((r) => r.id), [9, 5]);
  assert.deepEqual(catalog.categories.map((c) => c.name), ['Alfa', 'Beta']);
});

test('una fila inválida se descarta y las demás se conservan', () => {
  const catalog = parseCatalog(
    raw([
      row({ id: 1 }),
      row({ id: 'dos' }),
      row({ id: 3, titulo: '   ' }),
      row({ id: 4, titulo: 'x'.repeat(161) }),
      row({ id: 5, created_at: 'ayer' }),
      row({ id: 6, created_at: '2026-13-45T00:00:00Z' }),
      null,
      'texto',
      row({ id: 7 }),
    ]),
  );
  assert.deepEqual(catalog.resources.map((r) => r.id).sort(), [1, 7]);
});

test('categorías inválidas o repetidas se descartan', () => {
  const catalog = parseCatalog(
    raw([], [
      { id: 1, nombre: 'Estrés', orden: 1 },
      { id: 1, nombre: 'Repetida', orden: 2 },
      { id: 'x', nombre: 'Mala', orden: 1 },
      { id: 2, nombre: '', orden: 1 },
      { id: 3, nombre: 'x'.repeat(41), orden: 1 },
      { id: 4, nombre: 'Sin orden' },
    ]),
  );
  assert.deepEqual(catalog.categories.map((c) => c.id), [4, 1]);
  assert.equal(catalog.categories.find((c) => c.id === 1).name, 'Estrés');
});

test('un contenedor que no tiene las dos listas lanza', () => {
  for (const bad of [null, undefined, 'x', 5, [], {}, { categories: [] }, { resources: [] }, { categories: {}, resources: [] }]) {
    assert.throws(() => parseCatalog(bad), /formato esperado/);
  }
});

test('descripción y contenido vacíos o ausentes quedan en null y el texto se recorta', () => {
  const [resource] = parseCatalog(
    raw([row({ descripcion: '   ', contenido: undefined, titulo: '  Título  ' })]),
  ).resources;
  assert.equal(resource.description, null);
  assert.equal(resource.content, null);
  assert.equal(resource.title, 'Título');
});

test('solo se aceptan videos https; cualquier otro esquema queda en null', () => {
  const video = (value) => parseCatalog(raw([row({ video_url: value })])).resources[0].videoUrl;
  assert.equal(video('https://example.test/v'), 'https://example.test/v');
  assert.equal(video('HTTPS://example.test/v'), 'HTTPS://example.test/v');
  for (const bad of ['http://example.test/v', 'javascript:alert(1)', 'ftp://x', '//example.test/v', 'example.test', '', null, undefined, 5, 'https://']) {
    assert.equal(video(bad), null, String(bad));
  }
});

test('una ruta de imagen insegura queda en null y no invalida la fila', () => {
  const image = (value) => parseCatalog(raw([row({ imagen_path: value })])).resources;
  assert.equal(image('estres/a.png')[0].imagePath, 'estres/a.png');
  assert.equal(image('../secreto.png')[0].imagePath, null);
  assert.equal(image(null)[0].imagePath, null);
  assert.equal(image('https://x.test/a.png').length, 1);
});

test('los ids de categoría inexistentes se ignoran y los repetidos se unifican', () => {
  const [resource] = parseCatalog(
    raw([row({ herramienta_tipoherramienta: [{ tipo_id: 2 }, { tipo_id: 99 }, { tipo_id: 1 }, { tipo_id: 2 }, { tipo_id: 'x' }, null] })]),
  ).resources;
  assert.deepEqual(resource.categoryIds, [1, 2]);
});

test('una fila sin relaciones o con relaciones malformadas queda sin categorías', () => {
  const resources = parseCatalog(
    raw([row({ id: 1, herramienta_tipoherramienta: undefined }), row({ id: 2, herramienta_tipoherramienta: 'x' })]),
  ).resources;
  assert.deepEqual(resources.map((r) => r.categoryIds), [[], []]);
});

test('un id repetido en la descarga se conserva una sola vez', () => {
  assert.equal(parseCatalog(raw([row({ id: 1 }), row({ id: 1, titulo: 'Otro' })])).resources.length, 1);
});

test('isSafeImagePath acepta rutas relativas simples', () => {
  for (const ok of ['banner.png', 'estres/respiracion.webp', 'a b/c.jpg', 'carpeta/sub/archivo-1.jpeg', 'a..b.png']) {
    assert.equal(isSafeImagePath(ok), true, ok);
  }
});

test('isSafeImagePath rechaza esquemas, rutas absolutas, `..`, `//`, `\\`, vacías, largas y de control', () => {
  const bad = [
    'https://x.test/a.png',
    'javascript:alert(1)',
    'data:image/png;base64,AAAA',
    '/abs.png',
    '../a.png',
    'a/../b.png',
    './a.png',
    'a/./b.png',
    'a//b.png',
    'a\\b.png',
    '',
    '   ',
    'x'.repeat(301),
    'a\u0000b.png',
    'a\nb.png',
    'a?x=1.png',
    'a#frag.png',
    null,
    undefined,
    42,
  ];
  for (const value of bad) assert.equal(isSafeImagePath(value), false, JSON.stringify(value));
});

function sample() {
  return parseCatalog(
    raw([
      row({ id: 1, created_at: '2026-11-04T00:00:00+00:00', herramienta_tipoherramienta: [{ tipo_id: 1 }] }),
      row({ id: 2, created_at: '2026-11-03T00:00:00+00:00', herramienta_tipoherramienta: [{ tipo_id: 1 }, { tipo_id: 2 }] }),
      row({ id: 3, created_at: '2026-11-02T00:00:00+00:00', herramienta_tipoherramienta: [{ tipo_id: 3 }] }),
      row({ id: 4, created_at: '2026-11-01T00:00:00+00:00', herramienta_tipoherramienta: [] }),
    ]),
  );
}

test('solo hay chips para categorías con al menos un recurso, en el orden del catálogo', () => {
  assert.deepEqual(categoriesWithResources(sample()).map((c) => c.id), [1, 2, 3]);
  assert.deepEqual(categoriesWithResources({ categories: sample().categories, resources: [] }), []);
});

test('«Todos» devuelve cada recurso una vez, incluso los sin categoría', () => {
  assert.deepEqual(filterResources(sample(), null).map((r) => r.id), [1, 2, 3, 4]);
});

test('una categoría devuelve sus recursos y uno en dos categorías aparece en ambas', () => {
  const catalog = sample();
  assert.deepEqual(filterResources(catalog, 1).map((r) => r.id), [1, 2]);
  assert.deepEqual(filterResources(catalog, 2).map((r) => r.id), [2]);
  assert.deepEqual(filterResources(catalog, 3).map((r) => r.id), [3]);
  assert.deepEqual(filterResources(catalog, 4), []);
  assert.deepEqual(filterResources(catalog, 99), []);
});

test('primaryCategory sigue el orden del catálogo y es null sin categorías', () => {
  const catalog = sample();
  assert.equal(primaryCategory(catalog, catalog.resources[1]).id, 1);
  assert.equal(primaryCategory(catalog, catalog.resources[3]), null);
});

test('el tono es estable, cíclico y tolera índices inválidos', () => {
  assert.equal(categoryTone(0).key, 'lavender');
  assert.equal(categoryTone(1).key, 'blue');
  assert.equal(categoryTone(2).key, 'orange');
  assert.equal(categoryTone(3).key, 'green');
  assert.equal(categoryTone(4).key, 'lavender');
  assert.equal(categoryTone(9).key, 'blue');
  assert.equal(categoryTone(-1).key, 'green');
  assert.equal(categoryTone(1.5).key, 'lavender');
  assert.equal(categoryTone(NaN).key, 'lavender');
  assert.deepEqual(categoryTone(2), categoryTone(2));
  assert.match(categoryTone(0).background, /^#[0-9a-f]{6}$/);
});

test('categoryIndex ubica la categoría y usa 0 si no está', () => {
  const catalog = sample();
  assert.equal(categoryIndex(catalog, 2), 1);
  assert.equal(categoryIndex(catalog, 4), 3);
  assert.equal(categoryIndex(catalog, 99), 0);
  assert.equal(categoryIndex(catalog, null), 0);
});

test('el icono sale de palabras del nombre, sin tildes ni mayúsculas, con respaldo genérico', () => {
  assert.equal(categoryIconKey('Estrés'), 'wind');
  assert.equal(categoryIconKey('ESTRÉS'), 'wind');
  assert.equal(categoryIconKey('Ansiedad'), 'meditation');
  assert.equal(categoryIconKey('Apoyo al estudio'), 'book');
  assert.equal(categoryIconKey('Salud física'), 'stretch');
  assert.equal(categoryIconKey('Sueño y descanso'), 'moon');
  assert.equal(categoryIconKey('Ánimo'), 'heart');
  assert.equal(categoryIconKey('Otro tema'), 'generic');
  assert.equal(categoryIconKey(''), 'generic');
});

test('findResource acepta número o cadena de la ruta y rechaza lo demás', () => {
  const catalog = sample();
  assert.equal(findResource(catalog, 2).id, 2);
  assert.equal(findResource(catalog, '3').id, 3);
  for (const bad of ['', 'abc', '2x', '-1', '1.5', ' 2', undefined, 99, '99', '99999999999999999999']) {
    assert.equal(findResource(catalog, bad), null, String(bad));
  }
});

test('serializar y volver a interpretar el catálogo no cambia nada', () => {
  const catalog = sample();
  assert.deepEqual(parseCatalog(serializeCatalog(catalog)), catalog);
});

test('el catálogo con imagen y video nulos también hace el viaje de ida y vuelta', () => {
  const catalog = parseCatalog(
    raw([row({ id: 1, imagen_path: '../x', video_url: 'http://x.test', descripcion: null, contenido: null })]),
  );
  assert.equal(catalog.resources[0].imagePath, null);
  assert.equal(catalog.resources[0].videoUrl, null);
  assert.deepEqual(parseCatalog(serializeCatalog(catalog)), catalog);
});

test('un catálogo vacío es válido', () => {
  assert.deepEqual(parseCatalog({ categories: [], resources: [] }), { categories: [], resources: [] });
});

test('effectiveCategoryId conserva una categoría con recursos y vuelve a «Todos» si desapareció', () => {
  const catalog = sample();
  assert.equal(effectiveCategoryId(catalog, null), null);
  assert.equal(effectiveCategoryId(catalog, 2), 2);
  assert.equal(effectiveCategoryId(catalog, 4), null, 'la categoría 4 existe pero no tiene recursos');
  assert.equal(effectiveCategoryId(catalog, 99), null);
  assert.equal(effectiveCategoryId({ categories: catalog.categories, resources: [] }, 1), null);
});

test('formatUpdatedAt da día, mes, año y hora locales con ceros a la izquierda', () => {
  const local = new Date(2026, 10, 7, 9, 5, 30);
  assert.equal(formatUpdatedAt(local.toISOString()), '07/11/2026 09:05');
  const evening = new Date(2026, 0, 2, 23, 59);
  assert.equal(formatUpdatedAt(evening.toISOString()), '02/01/2026 23:59');
  for (const bad of ['', 'ayer', 'no-es-fecha']) assert.equal(formatUpdatedAt(bad), '');
});

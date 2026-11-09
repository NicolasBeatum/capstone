import test from 'node:test';
import assert from 'node:assert/strict';
import { localDateKey, pickFeaturedTools } from '../src/features/dashboard/domain/featuredTools.ts';
import { parseCatalog } from '../src/features/wellness/domain/wellnessResource.ts';

const resource = (id, createdAt) => ({
  id,
  titulo: `Recurso ${id}`,
  descripcion: null,
  contenido: null,
  imagen_path: `${id}.png`,
  video_url: null,
  created_at: createdAt,
  herramienta_tipoherramienta: [],
});

const catalogOf = (...resources) => parseCatalog({ categories: [], resources });

const fiveTools = () =>
  catalogOf(
    resource(1, '2026-11-01T10:00:00+00:00'),
    resource(2, '2026-11-02T10:00:00+00:00'),
    resource(3, '2026-11-03T10:00:00+00:00'),
    resource(4, '2026-11-04T10:00:00+00:00'),
    resource(5, '2026-11-05T10:00:00+00:00'),
  );

test('sin recursos no hay destacadas', () => {
  assert.deepEqual(pickFeaturedTools(catalogOf(), '2026-11-08'), []);
});

test('con un solo recurso solo aparece «Lo último»', () => {
  const tools = pickFeaturedTools(catalogOf(resource(7, '2026-11-01T10:00:00+00:00')), '2026-11-08');
  assert.deepEqual(tools.map((t) => [t.slot, t.resource.id]), [['ultima', 7]]);
});

test('«Lo último» es el recurso creado más recientemente', () => {
  const [latest] = pickFeaturedTools(fiveTools(), '2026-11-08');
  assert.equal(latest.slot, 'ultima');
  assert.equal(latest.resource.id, 5);
});

test('la recomendación del día nunca repite la última, en ningún día', () => {
  const start = new Date(2026, 0, 1);
  const seen = new Set();
  for (let day = 0; day < 365; day++) {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + day);
    const tools = pickFeaturedTools(fiveTools(), localDateKey(date));
    assert.equal(tools.length, 2);
    assert.equal(tools[1].slot, 'del_dia');
    assert.notEqual(tools[1].resource.id, tools[0].resource.id);
    seen.add(tools[1].resource.id);
  }
  // A lo largo del año van apareciendo todas las candidatas.
  assert.deepEqual([...seen].sort(), [1, 2, 3, 4]);
});

test('la recomendación es la misma durante todo el día', () => {
  const morning = pickFeaturedTools(fiveTools(), localDateKey(new Date(2026, 10, 8, 0, 5)));
  const night = pickFeaturedTools(fiveTools(), localDateKey(new Date(2026, 10, 8, 23, 55)));
  assert.equal(morning[1].resource.id, night[1].resource.id);
});

test('localDateKey usa la fecha local con ceros a la izquierda', () => {
  assert.equal(localDateKey(new Date(2026, 0, 5, 23, 59)), '2026-01-05');
});

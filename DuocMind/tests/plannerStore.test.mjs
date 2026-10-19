import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyPlanner, PlannerStore } from '../src/shared/planner/application/plannerStore.ts';
test('serializa cambios y no pierde documentos ante fallo de persistencia', async () => {
  let doc = emptyPlanner(), fail = false;
  const store = new PlannerStore({
    read: async () => structuredClone(doc),
    update: async (fn) => {
      const next = fn(structuredClone(doc));
      if (fail) throw Error('Disco');
      doc = next;
      return structuredClone(doc);
    },
    remove: async () => {},
  });
  await Promise.all([
    store.update((d) => ({ ...d, imports: [...d.imports, 'a'] })),
    store.update((d) => ({ ...d, imports: [...d.imports, 'b'] })),
  ]);
  assert.deepEqual((await store.read()).imports, ['a', 'b']);
  fail = true;
  await assert.rejects(() => store.update((d) => ({ ...d, imports: [] })));
  assert.deepEqual((await store.read()).imports, ['a', 'b']);
  await assert.rejects(() => store.update((d) => ({ ...d, working: {} })));
  await store.destroy();
  await assert.rejects(() => store.read());
});
test('cerrar espera escrituras y conserva datos para reabrir; destruir elimina después', async () => {
  let data = emptyPlanner(), closed = 0, removed = 0;
  const persistence = {
    read: async () => structuredClone(data),
    update: async (fn) => {
      data = fn(data);
      return data;
    },
    close: async () => closed++,
    remove: async () => {
      removed++;
      data = emptyPlanner();
    },
  };
  const first = new PlannerStore(persistence);
  const pending = first.update((d) => ({ ...d, imports: ['pendiente'] }));
  await first.close();
  await pending;
  assert.equal(closed, 1);
  assert.equal(removed, 0);
  await assert.rejects(() => first.read());
  const reopened = new PlannerStore(persistence);
  assert.deepEqual((await reopened.read()).imports, ['pendiente']);
  await reopened.destroy();
  assert.equal(removed, 1);
});

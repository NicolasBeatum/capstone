import test from 'node:test';
import assert from 'node:assert/strict';
import {
  completeTutorial,
  createTutorialProgressStore,
  normalizeOwnerId,
  resolveTutorialOffer,
} from '../src/shared/tutorial/application/tutorialProgress.ts';

const A = '00000000-0000-0000-0000-00000000000a';
const B = '00000000-0000-0000-0000-00000000000b';

function memoryStorage() {
  const map = new Map();
  return {
    map,
    getItem: async (key) => map.get(key) ?? null,
    setItem: async (key, value) => void map.set(key, value),
    deleteItem: async (key) => void map.delete(key),
  };
}

const ownedBy = (id) => ({ currentOwner: async () => id });

test('una cuenta nueva no lo ha visto y marcarlo no afecta a otra cuenta', async () => {
  const store = createTutorialProgressStore(memoryStorage());
  assert.equal(await store.isSeen(A), false);
  await store.markSeen(A);
  assert.equal(await store.isSeen(A), true);
  assert.equal(await store.isSeen(B), false);
});

test('clear borra la marca de esa cuenta y no la de otra', async () => {
  const storage = memoryStorage();
  const store = createTutorialProgressStore(storage);
  await store.markSeen(A);
  await store.markSeen(B);
  await store.clear(A);
  assert.equal(await store.isSeen(A), false);
  assert.equal(await store.isSeen(B), true);
});

test('guarda solo «seen» bajo una clave por cuenta, sin otros datos', async () => {
  const storage = memoryStorage();
  await createTutorialProgressStore(storage).markSeen(A.toUpperCase());
  assert.deepEqual([...storage.map], [[`duocmind.tutorial.seen.v1.${A}`, 'seen']]);
});

test('un valor ajeno o dañado cuenta como no visto', async () => {
  const storage = memoryStorage();
  storage.map.set(`duocmind.tutorial.seen.v1.${A}`, 'malformed');
  assert.equal(await createTutorialProgressStore(storage).isSeen(A), false);
});

test('un identificador que no es UUID se rechaza y no escribe', async () => {
  const storage = memoryStorage();
  const store = createTutorialProgressStore(storage);
  for (const bad of ['', 'abc', '../x', `${A}.extra`, 'a b']) {
    await assert.rejects(store.markSeen(bad));
    await assert.rejects(store.isSeen(bad));
  }
  assert.equal(storage.map.size, 0);
  assert.equal(normalizeOwnerId(null), null);
  assert.equal(normalizeOwnerId(A.toUpperCase()), A);
});

test('se ofrece a una cuenta que no lo ha visto y devuelve su identificador', async () => {
  const store = createTutorialProgressStore(memoryStorage());
  assert.equal(await resolveTutorialOffer(ownedBy(A.toUpperCase()), store), A);
});

test('no se ofrece si ya lo vio, sin cuenta o con un identificador inválido', async () => {
  const store = createTutorialProgressStore(memoryStorage());
  await store.markSeen(A);
  assert.equal(await resolveTutorialOffer(ownedBy(A), store), null);
  assert.equal(await resolveTutorialOffer(ownedBy(null), store), null);
  assert.equal(await resolveTutorialOffer(ownedBy('no-es-uuid'), store), null);
});

test('un error al leer la cuenta o el estado no lo ofrece ni lanza', async () => {
  const store = createTutorialProgressStore(memoryStorage());
  const brokenOwner = { currentOwner: async () => { throw new Error('sin sesión'); } };
  assert.equal(await resolveTutorialOffer(brokenOwner, store), null);

  const storage = memoryStorage();
  storage.getItem = async () => { throw new Error('almacenamiento no disponible'); };
  assert.equal(await resolveTutorialOffer(ownedBy(A), createTutorialProgressStore(storage)), null);
});

test('una escritura que falla no se propaga y la cuenta queda sin marcar', async () => {
  const storage = memoryStorage();
  const store = createTutorialProgressStore(storage);
  const setItem = storage.setItem;
  storage.setItem = async () => { throw new Error('QuotaExceeded'); };
  await assert.doesNotReject(completeTutorial(store, A));
  storage.setItem = setItem;
  assert.equal(await store.isSeen(A), false);
  assert.equal(await resolveTutorialOffer(ownedBy(A), store), A);
});

test('completar marca a la cuenta capturada aunque la sesión cambie después', async () => {
  const store = createTutorialProgressStore(memoryStorage());
  let current = A;
  const owners = { currentOwner: async () => current };
  const captured = await resolveTutorialOffer(owners, store);
  current = B;
  await completeTutorial(store, captured);
  assert.equal(await store.isSeen(A), true);
  assert.equal(await store.isSeen(B), false);
  assert.equal(await resolveTutorialOffer(owners, store), B);
});

test('tras completarlo, la misma cuenta ya no lo recibe', async () => {
  const store = createTutorialProgressStore(memoryStorage());
  const owner = await resolveTutorialOffer(ownedBy(A), store);
  await completeTutorial(store, owner);
  assert.equal(await resolveTutorialOffer(ownedBy(A), store), null);
});

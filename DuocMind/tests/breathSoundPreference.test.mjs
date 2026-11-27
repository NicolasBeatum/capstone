import test from 'node:test';
import assert from 'node:assert/strict';
import { BREATH_SOUND_KEY, createBreathSoundPreference } from '../src/features/wellness/infrastructure/breathSoundPreference.ts';

// Almacenamiento en memoria con la misma forma que `platformSecureKeyValueStorage`.
function memoryStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem: async (key) => data.get(key) ?? null,
    setItem: async (key, value) => {
      data.set(key, value);
    },
  };
}

test('la clave de la preferencia es la acordada y lleva versión', () => {
  assert.equal(BREATH_SOUND_KEY, 'duocmind.breathing.sound.v1');
});

test('sin valor guardado, el sonido está encendido', async () => {
  const preference = createBreathSoundPreference(memoryStorage());
  assert.equal(await preference.load(), true);
});

test("con '1' guardado, el sonido está encendido", async () => {
  const preference = createBreathSoundPreference(memoryStorage({ [BREATH_SOUND_KEY]: '1' }));
  assert.equal(await preference.load(), true);
});

test("con '0' guardado, el sonido está apagado", async () => {
  const preference = createBreathSoundPreference(memoryStorage({ [BREATH_SOUND_KEY]: '0' }));
  assert.equal(await preference.load(), false);
});

test('un valor desconocido no apaga el sonido: solo un 0 lo apaga', async () => {
  for (const value of ['', 'false', 'no', '2', ' 0']) {
    const preference = createBreathSoundPreference(memoryStorage({ [BREATH_SOUND_KEY]: value }));
    assert.equal(await preference.load(), true, `valor ${JSON.stringify(value)}`);
  }
});

test('guardar apagado y volver a cargar da apagado; guardar encendido da encendido', async () => {
  const storage = memoryStorage();
  const preference = createBreathSoundPreference(storage);

  await preference.save(false);
  assert.equal(storage.data.get(BREATH_SOUND_KEY), '0');
  assert.equal(await preference.load(), false);

  await preference.save(true);
  assert.equal(storage.data.get(BREATH_SOUND_KEY), '1');
  assert.equal(await preference.load(), true);
});

test('la elección se recupera al «reabrir la app»: otra instancia sobre el mismo almacenamiento', async () => {
  const storage = memoryStorage();
  await createBreathSoundPreference(storage).save(false);
  const reopened = createBreathSoundPreference(storage);
  assert.equal(await reopened.load(), false);
});

test('una lectura que falla da encendido', async () => {
  const storage = {
    getItem: async () => {
      throw new Error('sin acceso al almacenamiento');
    },
    setItem: async () => undefined,
  };
  assert.equal(await createBreathSoundPreference(storage).load(), true);
});

test('una escritura que falla no lanza', async () => {
  const storage = {
    getItem: async () => null,
    setItem: async () => {
      throw new Error('almacenamiento lleno');
    },
  };
  await assert.doesNotReject(createBreathSoundPreference(storage).save(false));
});

test('lo único que se guarda es el 0 o el 1: ningún dato de la persona', async () => {
  const storage = memoryStorage();
  const preference = createBreathSoundPreference(storage);
  await preference.save(false);
  await preference.save(true);
  assert.deepEqual([...storage.data.entries()], [[BREATH_SOUND_KEY, '1']]);
});

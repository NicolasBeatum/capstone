import assert from 'node:assert/strict';
import test from 'node:test';

import {
  platformAuthStorage,
  platformSecureKeyValueStorage,
  createWebSessionStorage,
  webSessionStorage,
} from '../src/features/backend/infrastructure/platformSecureStorage.web.ts';

test('la previsualización web mantiene auth y marcadores en memoria sin llamar SecureStore nativo', async () => {
  await platformAuthStorage.setItem('session', 'web-session');
  await platformSecureKeyValueStorage.setItem('profile:user-1', 'true');

  assert.equal(await platformAuthStorage.getItem('session'), 'web-session');
  assert.equal(await platformSecureKeyValueStorage.getItem('profile:user-1'), 'true');

  await platformAuthStorage.removeItem('session');
  await platformSecureKeyValueStorage.deleteItem('profile:user-1');
  assert.equal(await platformAuthStorage.getItem('session'), null);
  assert.equal(await platformSecureKeyValueStorage.getItem('profile:user-1'), null);
});

test('el almacenamiento de sesión recupera auth y perfil al recrear el adaptador en la misma pestaña', async () => {
  const values = new Map();
  const browserStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, value); },
    removeItem: (key) => { values.delete(key); },
  };
  const firstStorage = createWebSessionStorage(browserStorage);
  await firstStorage.setItem('auth', 'session-token');
  await firstStorage.setItem('profile', 'verified');

  const restoredStorage = createWebSessionStorage(browserStorage);
  assert.equal(await restoredStorage.getItem('auth'), 'session-token');
  assert.equal(await restoredStorage.getItem('profile'), 'verified');
  assert.notEqual(webSessionStorage, undefined);
});
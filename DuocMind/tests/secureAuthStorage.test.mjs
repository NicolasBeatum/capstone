import assert from 'node:assert/strict';
import test from 'node:test';

import { createSecureAuthStorage } from '../src/features/backend/infrastructure/secureAuthStorage.ts';
import { createSupabaseAuthOptions } from '../src/features/backend/infrastructure/supabaseAuthOptions.ts';

test('el adaptador persiste, recupera y elimina la sesión con SecureStore', async () => {
  const entries = new Map();
  const storage = createSecureAuthStorage({
    getItemAsync: async (key) => entries.get(key) ?? null,
    setItemAsync: async (key, value) => { entries.set(key, value); },
    deleteItemAsync: async (key) => { entries.delete(key); },
  });

  assert.equal(await storage.getItem('session'), null);
  await storage.setItem('session', 'session-payload');
  assert.equal(await storage.getItem('session'), 'session-payload');
  await storage.removeItem('session');
  assert.equal(await storage.getItem('session'), null);
});

test('el adaptador divide sesiones grandes en valores menores al límite de SecureStore', async () => {
  const entries = new Map();
  const byteLength = (value) => new TextEncoder().encode(value).length;
  const adapter = {
    getItemAsync: async (key) => entries.get(key) ?? null,
    setItemAsync: async (key, value) => {
      assert.ok(byteLength(value) < 2048);
      entries.set(key, value);
    },
    deleteItemAsync: async (key) => { entries.delete(key); },
  };
  const storage = createSecureAuthStorage(adapter);
  const session = 'sesión-😀-token'.repeat(1000);

  await storage.setItem('session', session);
  assert.equal(await storage.getItem('session'), session);
  assert.ok([...entries.keys()].some((key) => key.startsWith('session.chunk.')));
  await storage.removeItem('session');
  assert.equal(await storage.getItem('session'), null);
  assert.equal(entries.size, 0);
});

test('el adaptador todavía puede leer sesiones sin manifiesto almacenadas por la versión anterior', async () => {
  const storage = createSecureAuthStorage({
    getItemAsync: async (key) => key === 'legacy-session' ? 'legacy-token' : null,
    setItemAsync: async () => {},
    deleteItemAsync: async () => {},
  });

  assert.equal(await storage.getItem('legacy-session'), 'legacy-token');
});

test('eliminar sesión limpia también fragmentos escritos antes de una interrupción', async () => {
  const entries = new Map();
  let writes = 0;
  const adapter = {
    getItemAsync: async (key) => entries.get(key) ?? null,
    setItemAsync: async (key, value) => {
      writes += 1;
      if (writes === 3) throw new Error('fallo controlado');
      entries.set(key, value);
    },
    deleteItemAsync: async (key) => { entries.delete(key); },
  };
  const storage = createSecureAuthStorage(adapter);

  await assert.rejects(storage.setItem('session', 'x'.repeat(5000)), /fallo controlado/);
  assert.ok(entries.has('session.pending'));
  await storage.removeItem('session');
  assert.equal(entries.size, 0);
});

test('eliminar sesión limpia versiones retiradas si falla la sustitución de una sesión', async () => {
  const entries = new Map();
  let activeManifest;
  let retiredChunk;
  let failRetiredCleanup = false;
  const adapter = {
    getItemAsync: async (key) => entries.get(key) ?? null,
    setItemAsync: async (key, value) => {
      entries.set(key, value);
      if (key === 'session.manifest') activeManifest = value;
      if (key === 'session.retired') {
        const retired = JSON.parse(value);
        retiredChunk = `session.chunk.${retired[0].version}.0`;
      }
    },
    deleteItemAsync: async (key) => {
      if (failRetiredCleanup && key === retiredChunk) {
        failRetiredCleanup = false;
        throw new Error('fallo al limpiar versión anterior');
      }
      entries.delete(key);
    },
  };
  const storage = createSecureAuthStorage(adapter);

  await storage.setItem('session', 'first-session');
  const firstManifest = activeManifest;
  failRetiredCleanup = true;
  await assert.rejects(storage.setItem('session', 'second-session'), /limpiar versión anterior/);
  assert.notEqual(entries.get('session.manifest'), firstManifest);
  assert.ok(entries.has('session.retired'));

  await storage.removeItem('session');
  assert.equal(entries.size, 0);
});

test('Supabase restaura y refresca sesiones usando el almacenamiento seguro', () => {
  const storage = {};
  const options = createSupabaseAuthOptions(storage);

  assert.equal(options.auth.storage, storage);
  assert.equal(options.auth.persistSession, true);
  assert.equal(options.auth.autoRefreshToken, true);
  assert.equal(options.auth.detectSessionInUrl, false);
});
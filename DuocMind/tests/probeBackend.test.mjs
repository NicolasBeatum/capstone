import assert from 'node:assert/strict';
import test from 'node:test';

import { probeBackend } from '../src/features/backend/infrastructure/probeBackend.ts';

const validConfig = {
  url: 'https://ashgvanzjeaeekpygqgy.supabase.co',
  publishableKey: 'sb_publishable_example',
};

function dependencies(overrides = {}) {
  return {
    initializeClient: () => {},
    getNetworkState: async () => ({ isConnected: true, isInternetReachable: true }),
    refreshNetworkState: async () => ({ isConnected: true, isInternetReachable: true }),
    requestHealth: async () => true,
    ...overrides,
  };
}

test('la configuración ausente o inválida no inicia el cliente ni solicita la red', async () => {
  const forbidden = dependencies({
    initializeClient: () => assert.fail('cliente iniciado'),
    getNetworkState: () => assert.fail('red consultada'),
    requestHealth: () => assert.fail('solicitud enviada'),
  });

  for (const config of [
    { url: undefined, publishableKey: undefined },
    { ...validConfig, publishableKey: undefined },
    { ...validConfig, publishableKey: 'sb_secret_not_public' },
    { ...validConfig, url: 'https://another-project.supabase.co' },
  ]) {
    assert.equal(await probeBackend(config, forbidden), 'missing-config');
  }
});

test('solo la respuesta remota correcta confirma la conexión', async () => {
  let initialized = false;
  let requested = false;
  const result = await probeBackend(
    validConfig,
    dependencies({
      initializeClient: () => { initialized = true; },
      requestHealth: async () => { requested = true; return true; },
    }),
  );

  assert.equal(result, 'connected');
  assert.equal(initialized, true);
  assert.equal(requested, true);
  assert.equal(
    await probeBackend(validConfig, dependencies({ requestHealth: async () => false })),
    'unavailable',
  );
});

test('la falta de red confirmada evita la solicitud remota', async () => {
  const result = await probeBackend(
    validConfig,
    dependencies({
      getNetworkState: async () => ({ isConnected: false, isInternetReachable: false }),
      requestHealth: () => assert.fail('solicitud enviada sin red'),
    }),
  );

  assert.equal(result, 'offline');
});

test('una falla de transporte se clasifica según el estado de red actualizado', async () => {
  const failedRequest = {
    requestHealth: async () => { throw new Error('fallo controlado'); },
  };

  assert.equal(
    await probeBackend(validConfig, dependencies({
      ...failedRequest,
      refreshNetworkState: async () => ({ isConnected: false, isInternetReachable: false }),
    })),
    'offline',
  );
  assert.equal(await probeBackend(validConfig, dependencies(failedRequest)), 'unavailable');
});

test('con conectividad desconocida se intenta la comprobación real', async () => {
  assert.equal(
    await probeBackend(validConfig, dependencies({
      getNetworkState: async () => ({ isConnected: null, isInternetReachable: null }),
    })),
    'connected',
  );
});

import 'react-native-url-polyfill/auto';

import NetInfo from '@react-native-community/netinfo';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import type { BackendConnectionGateway } from '../application/checkBackendConnection';
import { probeBackend } from './probeBackend';

const HEALTH_CHECK_TIMEOUT_MS = 10_000;

let client: SupabaseClient | undefined;

function initializeClient(url: string, publishableKey: string): void {
  client ??= createClient(url, publishableKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

async function requestHealth(url: string, publishableKey: string): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT_MS);

  try {
    const response = await fetch(`${url}/auth/v1/health`, {
      method: 'GET',
      headers: { apikey: publishableKey, Accept: 'application/json' },
      signal: controller.signal,
    });

    if (!response.ok) {
      return false;
    }

    const body: unknown = await response.json();
    return (
      typeof body === 'object' &&
      body !== null &&
      'name' in body &&
      body.name === 'GoTrue'
    );
  } finally {
    clearTimeout(timeout);
  }
}

export const supabaseConnectionGateway: BackendConnectionGateway = {
  check: () =>
    probeBackend(
      {
        url: process.env.EXPO_PUBLIC_SUPABASE_URL,
        publishableKey: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      },
      {
        initializeClient,
        getNetworkState: () => NetInfo.fetch(),
        refreshNetworkState: () => NetInfo.refresh(),
        requestHealth,
      },
    ),
};

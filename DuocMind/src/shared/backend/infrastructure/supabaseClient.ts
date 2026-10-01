import 'react-native-url-polyfill/auto';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { platformAuthStorage } from './platformSecureStorage';
import { createSupabaseAuthOptions } from './supabaseAuthOptions';

let client: SupabaseClient | undefined;

export function initializeSupabaseClient(url: string, publishableKey: string): SupabaseClient {
  if (!url.trim() || !publishableKey.trim()) {
    throw new Error('Falta la configuración pública de Supabase.');
  }

  client ??= createClient(url, publishableKey, createSupabaseAuthOptions(platformAuthStorage));

  return client;
}

export function getSupabaseClient(): SupabaseClient {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error('Falta la configuración pública de Supabase.');
  }

  return initializeSupabaseClient(url, publishableKey);
}
import type { SupportedStorage } from '@supabase/supabase-js';

export function createSupabaseAuthOptions(storage: SupportedStorage) {
  return {
    auth: {
      storage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  };
}

export function supabaseAuthStorageKey(url: string): string {
  return `sb-${new URL(url).hostname.split('.')[0]}-auth-token`;
}

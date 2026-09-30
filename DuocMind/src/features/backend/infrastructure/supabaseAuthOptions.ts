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
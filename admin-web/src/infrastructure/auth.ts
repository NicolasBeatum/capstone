import { createClient } from "@supabase/supabase-js";
export const auth = createClient(
  import.meta.env.VITE_SUPABASE_URL || "http://127.0.0.1:54321",
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "configuration-required",
  {
    auth: {
      storage: sessionStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      storageKey: "duocmind-admin-session",
    },
  },
);

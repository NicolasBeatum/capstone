import { createClient } from "@supabase/supabase-js";
import { takeRecoveryToken } from "./recoveryContext";
const client = createClient(
  import.meta.env.VITE_SUPABASE_URL || "http://127.0.0.1:54321",
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "configuration-required",
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storageKey: "duocmind-recovery-ephemeral",
    },
  },
);
let verified = false;
export const recoveryGateway = {
  async verify() {
    const hash = takeRecoveryToken();
    if (!hash) throw Error("El enlace no está disponible. Solicita uno nuevo.");
    try {
      const response = await client.auth.verifyOtp({
        token_hash: hash,
        type: "recovery",
      });
      if (response.error || !response.data.session) throw Error();
      verified = true;
    } catch {
      throw Error(
        "No se pudo validar el enlace. Puede haber vencido, haberse utilizado o fallar la conexión. Solicita uno nuevo.",
      );
    }
  },
  async changePassword(password: string) {
    if (!verified) throw Error("Valida el enlace primero.");
    try {
      const response = await client.auth.updateUser({ password });
      if (response.error) throw Error();
      verified = false;
      await client.auth.signOut({ scope: "local" });
    } catch {
      throw Error(
        "No se pudo confirmar el cambio. Revisa la contraseña y la conexión.",
      );
    }
  },
};

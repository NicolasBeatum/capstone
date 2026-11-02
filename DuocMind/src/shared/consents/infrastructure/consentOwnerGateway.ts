import { getSupabaseClient } from '@/shared/backend/infrastructure/supabaseClient';
import type { ConsentOwnerGateway } from '../application/consentSettings';

/** Lee la cuenta de la sesión guardada en el dispositivo, sin ir a la red. */
export const consentOwnerGateway: ConsentOwnerGateway = {
  async currentOwner() {
    const { data, error } = await getSupabaseClient().auth.getSession();
    if (error) throw error;
    return data.session?.user.id ?? null;
  },
};

import { getSupabaseClient } from '@/shared/backend/infrastructure/supabaseClient';
import type { TutorialOwnerGateway } from '../application/tutorialProgress';

/**
 * Lee la cuenta de la sesión guardada. Un error se propaga a `resolveTutorialOffer`,
 * que lo trata como «no ofrecer». No lee ni registra credenciales.
 */
export const tutorialOwnerGateway: TutorialOwnerGateway = {
  async currentOwner() {
    const { data, error } = await getSupabaseClient().auth.getSession();
    if (error) throw error;
    return data.session?.user.id ?? null;
  },
};

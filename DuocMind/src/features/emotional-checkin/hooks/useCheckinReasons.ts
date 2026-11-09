import { useEffect, useState } from 'react';
import { supabaseAuthGateway } from '@/features/auth/infrastructure/supabaseAuthGateway';
import { loadReasonCatalog } from '../application/checkinReasons';
import type { CheckinReason } from '../domain/checkinReasons';
import { getLocalCheckinStore } from '../infrastructure/encryptedCheckinDatabase';
import { supabaseReasonCatalogGateway } from '../infrastructure/supabaseCheckinGateway';

/** Motivos activos para el check-in; vacío mientras carga o si no hay catálogo. */
export function useCheckinReasons(): CheckinReason[] {
  const [reasons, setReasons] = useState<CheckinReason[]>([]);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const userId = await supabaseAuthGateway.getCurrentUserId();
        if (!userId) return;
        const local = await getLocalCheckinStore(userId);
        const catalog = await loadReasonCatalog(local, supabaseReasonCatalogGateway);
        if (active) setReasons(catalog);
      } catch {
        // Sin catálogo el check-in funciona igual, sin burbujas.
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return reasons;
}

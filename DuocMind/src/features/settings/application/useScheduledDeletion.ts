import { useCallback, useEffect, useState } from 'react';
import { supabaseAuthGateway } from '@/features/auth/infrastructure/supabaseAuthGateway';
import {
  NO_PENDING_DELETION,
  type DeletionStatus,
} from '@/shared/deletion/application/scheduledDeletion';
import { supabaseDeletionGateway } from '@/shared/deletion/infrastructure/supabaseDeletionGateway';

export interface ScheduledDeletionState {
  status: DeletionStatus;
  loading: boolean;
  /** No se pudo consultar el servidor: no se ofrecen las acciones. */
  unavailable: boolean;
  requestDataDeletion(): Promise<void>;
  cancelDataDeletion(): Promise<void>;
  /** Programa la eliminación de la cuenta; al terminar ya no hay sesión. */
  requestAccountDeletion(): Promise<void>;
}

/** Solicitudes de eliminación de la cuenta con sesión. Las acciones lanzan si fallan. */
export function useScheduledDeletion(): ScheduledDeletionState {
  const [status, setStatus] = useState<DeletionStatus>(NO_PENDING_DELETION);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    let active = true;
    void supabaseDeletionGateway
      .status()
      .then((loaded) => active && setStatus(loaded))
      .catch(() => active && setUnavailable(true))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const requestDataDeletion = useCallback(async () => {
    const executesAt = await supabaseDeletionGateway.request('data');
    setStatus((current) => ({ ...current, data: executesAt }));
  }, []);

  const cancelDataDeletion = useCallback(async () => {
    await supabaseDeletionGateway.cancel('data');
    setStatus((current) => ({ ...current, data: null }));
  }, []);

  const requestAccountDeletion = useCallback(async () => {
    await supabaseAuthGateway.scheduleAccountDeletion();
  }, []);

  return { status, loading, unavailable, requestDataDeletion, cancelDataDeletion, requestAccountDeletion };
}

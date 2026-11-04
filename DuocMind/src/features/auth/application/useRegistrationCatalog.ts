import { useCallback, useEffect, useRef, useState } from 'react';
import type { Career } from '../domain/registration';
import { supabaseRegistrationCatalogGateway } from '../infrastructure/supabaseRegistrationCatalogGateway';
import { loadRegistrationCatalog } from './registrationCatalog';

export interface RegistrationCatalogState {
  careers: Career[];
  loading: boolean;
  failed: boolean;
  reload: () => void;
}

/** Carreras para el registro; `reload` reintenta tras un fallo. */
export function useRegistrationCatalog(): RegistrationCatalogState {
  const [state, setState] = useState<Omit<RegistrationCatalogState, 'reload'>>({
    careers: [],
    loading: true,
    failed: false,
  });
  const request = useRef(0);

  const reload = useCallback(() => {
    const sequence = ++request.current;
    setState((current) => ({ ...current, loading: true, failed: false }));
    void loadRegistrationCatalog(supabaseRegistrationCatalogGateway).then((catalog) => {
      if (sequence !== request.current) return;
      setState({ ...catalog, loading: false });
    });
  }, []);

  useEffect(() => {
    reload();
    return () => {
      request.current += 1;
    };
  }, [reload]);

  return { ...state, reload };
}

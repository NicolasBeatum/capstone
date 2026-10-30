import { useCallback, useEffect, useRef, useState } from 'react';
import { changeConsent, loadConsents } from '@/shared/consents/application/consentSettings';
import { NO_CONSENTS, type ConsentChoices, type ConsentKey } from '@/shared/consents/domain/consents';
import { consentOwnerGateway } from '@/shared/consents/infrastructure/consentOwnerGateway';
import { consentStore } from '@/shared/consents/infrastructure/consentStorage';

export interface ConsentSettingsState {
  choices: ConsentChoices;
  loading: boolean;
  /** No se pudo leer el estado guardado o no hay una cuenta con sesión. */
  unavailable: boolean;
  /** El último cambio no se pudo guardar. */
  saveFailed: boolean;
  setConsent: (key: ConsentKey, value: boolean) => void;
}

/** Consentimientos opcionales de la cuenta con sesión; cada cambio se guarda de inmediato. */
export function useConsentSettings(): ConsentSettingsState {
  const [choices, setChoices] = useState<ConsentChoices>(NO_CONSENTS);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  // Evita que un cambio llegue antes que el anterior y pise el estado.
  const latest = useRef(NO_CONSENTS);

  useEffect(() => {
    let active = true;
    void loadConsents({ owners: consentOwnerGateway, store: consentStore }).then((loaded) => {
      if (!active) return;
      latest.current = loaded.choices;
      setChoices(loaded.choices);
      setOwnerId(loaded.ownerId);
      setUnavailable(loaded.failed || loaded.ownerId === null);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const setConsent = useCallback(
    (key: ConsentKey, value: boolean) => {
      if (!ownerId) return;
      const previous = latest.current;
      latest.current = { ...previous, [key]: value };
      setChoices(latest.current);
      setSaveFailed(false);
      void changeConsent({ store: consentStore, ownerId, current: previous, key, value }).then((result) => {
        if (!result.failed) return;
        latest.current = { ...latest.current, [key]: previous[key] };
        setChoices(latest.current);
        setSaveFailed(true);
      });
    },
    [ownerId],
  );

  return { choices, loading, unavailable, saveFailed, setConsent };
}

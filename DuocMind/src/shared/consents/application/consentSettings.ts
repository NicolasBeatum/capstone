import { NO_CONSENTS, type ConsentChoices, type ConsentKey } from '../domain/consents.ts';
import type { ConsentStore } from './consentStore.ts';

export interface ConsentOwnerGateway {
  /** Cuenta con sesión, leída localmente; null sin sesión. */
  currentOwner(): Promise<string | null>;
}

export interface LoadedConsents {
  ownerId: string | null;
  choices: ConsentChoices;
  /** No se pudo leer: se muestran desactivados y no se debe guardar sobre lo anterior sin avisar. */
  failed: boolean;
}

/** Consentimientos de la cuenta con sesión. Nunca lanza. */
export async function loadConsents(deps: { owners: ConsentOwnerGateway; store: ConsentStore }): Promise<LoadedConsents> {
  try {
    const ownerId = await deps.owners.currentOwner();
    if (!ownerId) return { ownerId: null, choices: NO_CONSENTS, failed: false };
    return { ownerId, choices: await deps.store.read(ownerId), failed: false };
  } catch {
    return { ownerId: null, choices: NO_CONSENTS, failed: true };
  }
}

export interface ConsentChange {
  choices: ConsentChoices;
  /** El guardado falló y `choices` conserva el valor anterior. */
  failed: boolean;
}

/** Cambia un consentimiento y lo guarda; si el guardado falla devuelve el estado anterior. */
export async function changeConsent(deps: {
  store: ConsentStore;
  ownerId: string;
  current: ConsentChoices;
  key: ConsentKey;
  value: boolean;
}): Promise<ConsentChange> {
  const next = { ...deps.current, [deps.key]: deps.value };
  try {
    await deps.store.write(deps.ownerId, next);
    return { choices: next, failed: false };
  } catch {
    return { choices: deps.current, failed: true };
  }
}

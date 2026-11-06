import {
  NO_CONSENTS,
  type ConsentChoices,
  type ConsentKey,
  type RemoteConsents,
} from '../domain/consents.ts';
import type { ConsentStore } from './consentStore.ts';

export interface ConsentOwnerGateway {
  /** Cuenta con sesión, leída localmente; null sin sesión. */
  currentOwner(): Promise<string | null>;
}

/** Historial de consentimientos en el servidor. Ambos métodos lanzan si no se completan. */
export interface RemoteConsentGateway {
  /** Estado vigente por consentimiento; las claves sin fila no aparecen (sin fila = no otorgado). */
  fetchCurrent(): Promise<RemoteConsents>;
  /** Agrega una fila al historial; nunca modifica ni borra las anteriores. */
  record(key: ConsentKey, granted: boolean): Promise<void>;
}

export interface LoadedConsents {
  ownerId: string | null;
  choices: ConsentChoices;
  /** No se pudo leer: se muestran desactivados y no se debe guardar sobre lo anterior sin avisar. */
  failed: boolean;
  /** No se pudo consultar o sincronizar el servidor: se muestra el último estado local y no se permite cambiarlo. */
  remoteUnavailable: boolean;
}

const KEYS = Object.keys(NO_CONSENTS) as ConsentKey[];

/**
 * Consentimientos de la cuenta con sesión. Nunca lanza.
 * El servidor prevalece sobre el dispositivo; si no tiene filas de un consentimiento que el
 * dispositivo ya tiene activo, lo registra. Sin fila y local inactivo no se escribe nada.
 */
export async function loadConsents(deps: {
  owners: ConsentOwnerGateway;
  store: ConsentStore;
  remote: RemoteConsentGateway;
}): Promise<LoadedConsents> {
  let ownerId: string | null;
  let local: ConsentChoices;
  try {
    ownerId = await deps.owners.currentOwner();
    if (!ownerId) return { ownerId: null, choices: NO_CONSENTS, failed: false, remoteUnavailable: false };
    local = await deps.store.read(ownerId);
  } catch {
    return { ownerId: null, choices: NO_CONSENTS, failed: true, remoteUnavailable: false };
  }

  let remote: RemoteConsents;
  try {
    remote = await deps.remote.fetchCurrent();
  } catch {
    return { ownerId, choices: local, failed: false, remoteUnavailable: true };
  }

  const merged: ConsentChoices = { ...local };
  let synchronized = true;
  for (const key of KEYS) {
    const value = remote[key];
    if (value !== undefined) {
      merged[key] = value;
    } else if (local[key]) {
      try {
        await deps.remote.record(key, true);
      } catch {
        synchronized = false;
      }
    }
  }

  if (KEYS.some((key) => merged[key] !== local[key])) {
    try {
      await deps.store.write(ownerId, merged);
    } catch {
      // Lo vigente es el del servidor; la próxima carga vuelve a repararlo.
    }
  }
  return { ownerId, choices: merged, failed: false, remoteUnavailable: !synchronized };
}

export interface ConsentChange {
  choices: ConsentChoices;
  /** El cambio no se aplicó y `choices` conserva el valor anterior. */
  failed: boolean;
}

/**
 * Cambia un consentimiento: primero en el servidor y después en el dispositivo. Si el
 * servidor falla no se toca el dispositivo, para que una revocación no parezca aplicada.
 * Si solo falla el guardado local el cambio sí quedó registrado; la siguiente carga lo repara.
 */
export async function changeConsent(deps: {
  store: ConsentStore;
  remote: RemoteConsentGateway;
  ownerId: string;
  current: ConsentChoices;
  key: ConsentKey;
  value: boolean;
}): Promise<ConsentChange> {
  const next = { ...deps.current, [deps.key]: deps.value };
  try {
    await deps.remote.record(deps.key, deps.value);
  } catch {
    return { choices: deps.current, failed: true };
  }
  try {
    await deps.store.write(deps.ownerId, next);
  } catch {
    // Sin registrar el error: contiene el identificador de la cuenta.
  }
  return { choices: next, failed: false };
}

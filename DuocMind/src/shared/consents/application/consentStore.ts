import { parseConsentChoices, type ConsentChoices } from '../domain/consents.ts';

export interface KeyValueStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  deleteItem(key: string): Promise<void>;
}

export interface ConsentStore {
  read(ownerId: string): Promise<ConsentChoices>;
  write(ownerId: string, choices: ConsentChoices): Promise<void>;
  clear(ownerId: string): Promise<void>;
  /** Guarda lo elegido en el registro hasta que exista una cuenta a la que asignarlo. */
  savePending(choices: ConsentChoices): Promise<void>;
  /** Pasa lo elegido en el registro a la cuenta y borra el valor temporal; sin él no hace nada. */
  adoptPending(ownerId: string): Promise<void>;
}

const KEY_PREFIX = 'duocmind.consents.v1.';
const PENDING_KEY = 'duocmind.consents.pending.v1';
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Solo se aceptan UUID: el identificador forma parte de la clave de almacenamiento.
function keyFor(ownerId: string): string {
  if (typeof ownerId !== 'string' || !UUID_PATTERN.test(ownerId)) throw new Error('Identificador de cuenta no válido.');
  return `${KEY_PREFIX}${ownerId.toLowerCase()}`;
}

/** Estado de los consentimientos opcionales, aislado por cuenta. */
export function createConsentStore(storage: KeyValueStorage): ConsentStore {
  return {
    async read(ownerId) {
      return parseConsentChoices(await storage.getItem(keyFor(ownerId)));
    },
    async write(ownerId, choices) {
      await storage.setItem(keyFor(ownerId), JSON.stringify(choices));
    },
    async clear(ownerId) {
      await storage.deleteItem(keyFor(ownerId));
    },
    async savePending(choices) {
      await storage.setItem(PENDING_KEY, JSON.stringify(choices));
    },
    async adoptPending(ownerId) {
      const key = keyFor(ownerId);
      const raw = await storage.getItem(PENDING_KEY);
      if (raw === null) return;
      await storage.setItem(key, JSON.stringify(parseConsentChoices(raw)));
      await storage.deleteItem(PENDING_KEY);
    },
  };
}

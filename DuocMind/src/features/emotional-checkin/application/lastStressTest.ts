import type { KeyValueStorage } from '../../../shared/consents/application/consentStore.ts';

/** Última aplicación del test: solo fecha y nivel, nunca las respuestas. */
export interface LastStressTestRecord {
  appliedAt: string;
  level: string;
}

export interface LastStressTestStore {
  read(ownerId: string): Promise<LastStressTestRecord | null>;
  write(ownerId: string, record: LastStressTestRecord): Promise<void>;
  clear(ownerId: string): Promise<void>;
}

const KEY_PREFIX = 'duocmind.stress-test.last.v1.';
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_LEVEL = 40;

function keyFor(ownerId: string): string {
  if (!UUID_PATTERN.test(ownerId)) throw new Error('Identificador de cuenta no válido.');
  return `${KEY_PREFIX}${ownerId.toLowerCase()}`;
}

/** Valida lo guardado; cualquier dato inválido equivale a «sin registro». */
export function parseLastStressTest(raw: string | null): LastStressTestRecord | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    const { appliedAt, level } = value as Record<string, unknown>;
    if (typeof appliedAt !== 'string' || Number.isNaN(Date.parse(appliedAt))) return null;
    if (typeof level !== 'string' || !level || level.length > MAX_LEVEL) return null;
    return { appliedAt, level };
  } catch {
    return null;
  }
}

/**
 * Copia en el dispositivo de la última aplicación, por cuenta. Permite avisar que el test ya se
 * respondió aunque el resultado no se haya enviado (sin consentimientos o sin conexión).
 */
export function createLastStressTestStore(storage: KeyValueStorage): LastStressTestStore {
  return {
    async read(ownerId) {
      return parseLastStressTest(await storage.getItem(keyFor(ownerId)));
    },
    async write(ownerId, record) {
      await storage.setItem(keyFor(ownerId), JSON.stringify(record));
    },
    async clear(ownerId) {
      await storage.deleteItem(keyFor(ownerId));
    },
  };
}

/** La más reciente entre el servidor y el dispositivo; null si no hay ninguna. */
export function latestStressTest(
  ...records: (LastStressTestRecord | null)[]
): LastStressTestRecord | null {
  let latest: LastStressTestRecord | null = null;
  for (const record of records) {
    if (record && (!latest || Date.parse(record.appliedAt) > Date.parse(latest.appliedAt))) latest = record;
  }
  return latest;
}

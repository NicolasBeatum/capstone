import type { KeyValueStorage } from '../../consents/application/consentStore.ts';

/**
 * Cuentas de este dispositivo con eliminación pendiente y su fecha. Los datos locales se
 * conservan (sin enviarse) durante el plazo, para que cancelar devuelva todo, y se borran la
 * primera vez que la app se abre después del vencimiento.
 */
export interface LocalDeletionSchedule {
  remember(ownerId: string, executesAt: string): Promise<void>;
  forget(ownerId: string): Promise<void>;
  /** Cuentas cuyo plazo ya venció. */
  due(now: Date): Promise<string[]>;
}

const KEY = 'duocmind.account-deletion.v1';
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Valida lo guardado; descarta entradas que no sean un UUID con una fecha válida. */
export function parseLocalDeletionSchedule(raw: string | null): Record<string, string> {
  if (!raw) return {};
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    const result: Record<string, string> = {};
    for (const [ownerId, executesAt] of Object.entries(value as Record<string, unknown>)) {
      if (UUID_PATTERN.test(ownerId) && typeof executesAt === 'string' && !Number.isNaN(Date.parse(executesAt))) {
        result[ownerId.toLowerCase()] = executesAt;
      }
    }
    return result;
  } catch {
    return {};
  }
}

function checkOwner(ownerId: string): string {
  if (!UUID_PATTERN.test(ownerId)) throw new Error('Identificador de cuenta no válido.');
  return ownerId.toLowerCase();
}

export function createLocalDeletionSchedule(storage: KeyValueStorage): LocalDeletionSchedule {
  const read = async () => parseLocalDeletionSchedule(await storage.getItem(KEY));
  const write = async (entries: Record<string, string>) => {
    if (Object.keys(entries).length === 0) await storage.deleteItem(KEY);
    else await storage.setItem(KEY, JSON.stringify(entries));
  };
  return {
    async remember(ownerId, executesAt) {
      if (Number.isNaN(Date.parse(executesAt))) throw new Error('Fecha de eliminación no válida.');
      await write({ ...(await read()), [checkOwner(ownerId)]: executesAt });
    },
    async forget(ownerId) {
      const entries = await read();
      delete entries[checkOwner(ownerId)];
      await write(entries);
    },
    async due(now) {
      return Object.entries(await read())
        .filter(([, executesAt]) => Date.parse(executesAt) <= now.getTime())
        .map(([ownerId]) => ownerId);
    },
  };
}

/**
 * Borra los datos locales de las cuentas vencidas. Nunca lanza: si una falla, su fecha se
 * conserva y se reintenta la próxima vez.
 */
export async function purgeExpiredAccounts(deps: {
  schedule: LocalDeletionSchedule;
  clearLocalData(ownerId: string): Promise<void>;
  now(): Date;
}): Promise<void> {
  let due: string[];
  try {
    due = await deps.schedule.due(deps.now());
  } catch {
    return;
  }
  for (const ownerId of due) {
    try {
      await deps.clearLocalData(ownerId);
      await deps.schedule.forget(ownerId);
    } catch {
      // Sin registrar el error: contiene el identificador de la cuenta.
    }
  }
}

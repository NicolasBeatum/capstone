import {
  LocalCheckinStore,
  type CheckinDatabase,
  type CheckinMood,
  type LocalCheckin,
} from '../application/localCheckinStore.ts';

interface MemoryRow {
  client_request_id: string;
  mood: CheckinMood;
  created_at: string;
  sync_status: 'pending' | 'synced';
}

class MemoryCheckinDatabase implements CheckinDatabase {
  private readonly rows = new Map<string, MemoryRow>();

  async execAsync(): Promise<void> {}

  async runAsync(source: string, ...params: (string | number | null)[]): Promise<void> {
    if (source.includes('INSERT INTO emotional_checkins')) {
      const [clientRequestId, mood, createdAt] = params as [string, CheckinMood, string];
      if (!this.rows.has(clientRequestId)) {
        this.rows.set(clientRequestId, {
          client_request_id: clientRequestId,
          mood,
          created_at: createdAt,
          sync_status: 'pending',
        });
      }
      return;
    }

    if (source.includes('UPDATE emotional_checkins')) {
      const [clientRequestId] = params as [string];
      const row = this.rows.get(clientRequestId);
      if (row) row.sync_status = 'synced';
      return;
    }

    if (source.includes('DELETE FROM emotional_checkins')) {
      const [clientRequestId] = params as [string];
      this.rows.delete(clientRequestId);
    }
  }

  async getAllAsync<T>(source: string): Promise<T[]> {
    const rows = [...this.rows.values()]
      .filter((row) => !source.includes("WHERE sync_status = 'pending'") || row.sync_status === 'pending')
      .sort((left, right) => source.includes('created_at DESC')
        ? right.created_at.localeCompare(left.created_at)
        : left.created_at.localeCompare(right.created_at))
      .map((row) => ({
        clientRequestId: row.client_request_id,
        mood: row.mood,
        createdAt: row.created_at,
        syncStatus: row.sync_status,
      } satisfies Pick<LocalCheckin, 'clientRequestId' | 'mood' | 'createdAt' | 'syncStatus'>));

    return rows as T[];
  }
}

const stores = new Map<string, Promise<LocalCheckinStore>>();

export function getLocalCheckinStore(userId: string): Promise<LocalCheckinStore> {
  if (!/^[0-9a-f-]{36}$/i.test(userId)) {
    return Promise.reject(new Error('No se pudo identificar la cuenta para el almacenamiento local.'));
  }

  let store = stores.get(userId);
  if (!store) {
    const localStore = new LocalCheckinStore(new MemoryCheckinDatabase());
    store = localStore.initialize().then(() => localStore);
    stores.set(userId, store);
  }
  return store;
}

export async function deleteLocalCheckinData(userId: string): Promise<void> {
  stores.delete(userId);
}

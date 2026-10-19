import {
  emptyPlanner,
  parsePlanner,
  parsePlannerJson,
  PlannerStore,
} from '../application/plannerStore.ts';
import { identifier } from '../domain/schedule.ts';
export interface PlannerWebStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}
export type PlannerLock = <T>(name: string, action: () => Promise<T>) => Promise<T>;
export function createWebPlannerStore(
  userId: string,
  storage: () => PlannerWebStorage,
  lock: PlannerLock,
): PlannerStore {
  const key = `duocmind.planner.v1.${identifier(userId)}`;
  const read = () => {
    const raw = storage().getItem(key);
    return raw === null ? emptyPlanner() : parsePlanner(parsePlannerJson(raw));
  };
  return new PlannerStore({
    async read() {
      return lock(key, async () => read());
    },
    async update(transform) {
      return lock(key, async () => {
        const next = parsePlanner(transform(read()));
        storage().setItem(key, JSON.stringify(next));
        return parsePlanner(next);
      });
    },
    async remove() {
      await lock(key, async () => storage().removeItem(key));
    },
  });
}
const stores = new Map<string, PlannerStore>();
export async function getPlannerStore(userId: string): Promise<PlannerStore> {
  identifier(userId);
  let store = stores.get(userId);
  if (!store) {
    store = createWebPlannerStore(userId, () => {
      if (typeof window === 'undefined') throw new Error('El almacenamiento no está disponible.');
      return window.localStorage;
    }, async (name, action) => {
      if (typeof navigator === 'undefined' || !navigator.locks) {
        throw new Error(
          'Este navegador necesita Web Locks para guardar. Usa un navegador actualizado.',
        );
      }
      return navigator.locks.request(name, action);
    });
    stores.set(userId, store);
  }
  return store;
}
export async function deletePlannerData(userId: string): Promise<void> {
  const store = await getPlannerStore(userId);
  await store.destroy();
  stores.delete(userId);
}
export async function closePlannerData(userId: string): Promise<void> {
  const id = identifier(userId);
  await stores.get(id)?.close();
  stores.delete(id);
}

import { EventStore, emptyEventDocument, parseEventDocument, type EventPersistence } from '../application/eventStore.ts';
import { UUID_PATTERN } from '../domain/institutionalEvent.ts';
export interface EventWebStorage { getItem(key: string): string | null; setItem(key: string, value: string): void; removeItem(key: string): void }
export function createWebEventStore(userId: string, storage: () => EventWebStorage): EventStore {
  if (!UUID_PATTERN.test(userId)) throw new Error('No se pudo identificar la cuenta.');
  const key = `duocmind.events.v1.${userId}`;
  const persistence: EventPersistence = {
    async read() {
      const value = storage().getItem(key);
      return value === null ? emptyEventDocument() : parseEventDocument(JSON.parse(value));
    },
    async write(document) { storage().setItem(key, JSON.stringify(parseEventDocument(document))); },
    async remove() { storage().removeItem(key); },
  };
  return new EventStore(persistence);
}
const stores = new Map<string, EventStore>();
export async function getEventStore(userId: string): Promise<EventStore> {
  let store = stores.get(userId);
  if (!store) {
    store = createWebEventStore(userId, () => {
      if (typeof window === 'undefined') throw new Error('El almacenamiento de eventos no está disponible.');
      return window.sessionStorage;
    });
    stores.set(userId, store);
  }
  return store;
}
export async function deleteEventData(userId: string): Promise<void> {
  const store = await getEventStore(userId);
  await store.destroy(); stores.delete(userId);
}

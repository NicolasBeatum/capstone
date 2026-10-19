import { eventInstant, eventObject, parseCatalog, parseEvent, parseInterest, type EventCatalog, type EventInterest, type InstitutionalEvent } from '../domain/institutionalEvent.ts';
export interface EventDocument { schema: 1; catalog: EventCatalog | null; downloadedAt: string | null; interests: EventInterest[] }
export const emptyEventDocument = (): EventDocument => ({ schema: 1, catalog: null, downloadedAt: null, interests: [] });
export function parseEventDocument(value: unknown): EventDocument {
  const v = eventObject(value);
  if (v.schema !== 1 || !Array.isArray(v.interests)) throw new Error('No se pudieron leer los eventos guardados.');
  const interests = v.interests.map(parseInterest);
  if (new Set(interests.map(i => i.event.id)).size !== interests.length) throw new Error('Intereses duplicados.');
  return { schema: 1, catalog: v.catalog === null ? null : parseCatalog(v.catalog), downloadedAt: v.downloadedAt === null ? null : eventInstant(v.downloadedAt), interests };
}
export interface EventPersistence {
  read(): Promise<EventDocument>;
  write(document: EventDocument, scope: 'catalog' | 'interests'): Promise<void>;
  remove(): Promise<void>;
}
export interface EventCatalogGateway { load(eventId?: string): Promise<EventCatalog> }
export interface EventLinkGateway { open(url: string): Promise<void> }
export interface Clock { now(): Date }
export interface EventSession { userId: string; generation: number }
export interface EventSessionGateway {
  current(): Promise<EventSession | null>;
  isCurrent(session: EventSession): Promise<boolean>;
  subscribe(listener: () => void): () => void;
}
export class EventStore {
  private persistence: EventPersistence;
  private queue: Promise<void> = Promise.resolve();
  private disposed = false;
  constructor(persistence: EventPersistence) { this.persistence = persistence; }
  private change<T>(action: () => Promise<T>): Promise<T> {
    if (this.disposed) return Promise.reject(new Error('El almacenamiento de esta cuenta está cerrado.'));
    const result = this.queue.then(action);
    this.queue = result.then(() => undefined, () => undefined);
    return result;
  }
  async read(): Promise<EventDocument> {
    return this.change(async () => parseEventDocument(await this.persistence.read()));
  }
  replaceCatalog(catalog: EventCatalog, downloadedAt: string): Promise<void> {
    const validated = parseCatalog(catalog), date = eventInstant(downloadedAt);
    return this.change(async () => {
      const doc = await this.persistence.read();
      // Una respuesta anterior no reemplaza una descarga más reciente.
      if (doc.catalog && doc.catalog.serverTime > validated.serverTime) return;
      await this.persistence.write({ ...doc, catalog: validated, downloadedAt: date }, 'catalog');
    });
  }
  add(event: InstitutionalEvent, savedAt: string): Promise<void> {
    const validated = parseEvent(event), date = eventInstant(savedAt);
    return this.change(async () => {
      const doc = await this.persistence.read();
      if (doc.interests.some(i => i.event.id === validated.id)) return;
      const current = doc.catalog?.events.find(e => e.id === validated.id);
      if (doc.catalog && (!current || current.revision !== validated.revision)) throw new Error('El evento cambió. Revisa su información antes de agregarlo.');
      await this.persistence.write({ ...doc, interests: [...doc.interests, { event: validated, savedAt: date, version: 1 }] }, 'interests');
    });
  }
  remove(id: string): Promise<void> {
    return this.change(async () => {
      const doc = await this.persistence.read();
      await this.persistence.write({ ...doc, interests: doc.interests.filter(i => i.event.id !== id) }, 'interests');
    });
  }
  accept(event: InstitutionalEvent, version: number): Promise<void> {
    const validated = parseEvent(event);
    return this.change(async () => {
      const doc = await this.persistence.read();
      const interest = doc.interests.find(i => i.event.id === validated.id);
      const current = doc.catalog?.events.find(e => e.id === validated.id);
      if (!interest || interest.version !== version || !current || current.revision !== validated.revision) throw new Error('El evento o tu agenda cambiaron. Revisa la información nuevamente.');
      await this.persistence.write({ ...doc, interests: doc.interests.map(i => i.event.id === validated.id ? { ...i, event: validated, version: i.version + 1 } : i) }, 'interests');
    });
  }
  async destroy(): Promise<void> {
    this.disposed = true;
    await this.queue;
    await this.persistence.remove();
  }
}

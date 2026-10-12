import { canAddEvent, isRegistrationUrl, registrationInfo, type InstitutionalEvent } from '../domain/institutionalEvent.ts';
import type { Clock, EventCatalogGateway, EventDocument, EventLinkGateway, EventSession, EventSessionGateway, EventStore } from './eventStore.ts';
export interface EventSnapshot { document: EventDocument; session: EventSession; offline: boolean; warning: string | null }
interface EventServices {
  catalog: EventCatalogGateway; session: EventSessionGateway; link: EventLinkGateway; clock: Clock;
  store(userId: string): Promise<EventStore>;
}
export class EventService {
  private services: EventServices;
  private listeners = new Set<(reason: 'session' | 'data') => void>();
  constructor(services: EventServices) { this.services = services; }
  subscribe(listener: (reason: 'session' | 'data') => void): () => void {
    this.listeners.add(listener);
    const unsubscribe = this.services.session.subscribe(() => listener('session'));
    return () => { this.listeners.delete(listener); unsubscribe(); };
  }
  private notify(): void { for (const listener of this.listeners) listener('data'); }
  private async scope(expected?: EventSession) {
    const session = await this.services.session.current();
    if (!session) throw new Error('Inicia sesión para consultar tus eventos.');
    if (expected && (session.userId !== expected.userId || session.generation !== expected.generation)) throw new Error('La sesión cambió. Vuelve a abrir Eventos.');
    const store = await this.services.store(session.userId);
    await this.check(session);
    return { session, store };
  }
  private async check(session: EventSession): Promise<void> {
    if (!await this.services.session.isCurrent(session)) throw new Error('La sesión cambió. Vuelve a abrir Eventos.');
  }
  async load(refresh = true): Promise<EventSnapshot> {
    const { session, store } = await this.scope();
    let offline = false, warning: string | null = null;
    if (refresh) {
      try {
        const catalog = await this.services.catalog.load(); await this.check(session);
        await store.replaceCatalog(catalog, this.services.clock.now().toISOString());
      } catch {
        await this.check(session); offline = true;
        warning = 'No pudimos actualizar los eventos. Se muestra la última información disponible.';
      }
    }
    const document = await store.read(); await this.check(session);
    if (!document.catalog && offline) warning = 'Conéctate para descargar los eventos por primera vez.';
    return { document, session, offline, warning };
  }
  async add(event: InstitutionalEvent, expected: EventSession): Promise<string> {
    const { session, store } = await this.scope(expected);
    if (!canAddEvent(event, this.services.clock.now())) throw new Error('El evento finalizó o fue cancelado.');
    await this.check(session); await store.add(event, this.services.clock.now().toISOString()); await this.check(session); this.notify();
    return event.requiresRegistration ? 'Evento agregado a tu agenda. Guardarlo no confirma inscripción; revisa las condiciones para participar.' : 'Evento agregado a tu agenda.';
  }
  async remove(id: string, expected: EventSession): Promise<string> {
    const { session, store } = await this.scope(expected);
    await this.check(session); await store.remove(id); await this.check(session); this.notify();
    return 'Evento quitado de tu agenda. Una inscripción externa se gestiona por separado.';
  }
  async accept(event: InstitutionalEvent, version: number, expected: EventSession): Promise<string> {
    const { session, store } = await this.scope(expected);
    const catalog = await this.services.catalog.load(); await this.check(session);
    const current = catalog.events.find(e => e.id === event.id);
    await store.replaceCatalog(catalog, this.services.clock.now().toISOString());
    if (!current || current.revision !== event.revision) { this.notify(); throw new Error('El evento volvió a cambiar. Revisa sus nuevos datos.'); }
    await this.check(session); await store.accept(current, version); await this.check(session); this.notify();
    return 'Evento actualizado en tu agenda.';
  }
  async register(event: InstitutionalEvent, expected: EventSession): Promise<string> {
    const { session } = await this.scope(expected);
    const catalog = await this.services.catalog.load(event.id); await this.check(session);
    const current = catalog.events.find(e => e.id === event.id);
    if (!current) throw new Error('El evento ya no está disponible.');
    const info = registrationInfo(current, new Date(catalog.serverTime));
    if (info.state !== 'open' || !isRegistrationUrl(current.registrationUrl)) throw new Error(info.reason || 'Este evento no requiere inscripción.');
    await this.check(session); await this.services.link.open(current.registrationUrl);
    return 'Se abrió el sitio de inscripción. Completa el formulario para inscribirte.';
  }
}

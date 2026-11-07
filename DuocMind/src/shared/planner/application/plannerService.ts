import { invalid, parseSchedule, sameSchedule, type ScheduleDocument } from '../domain/schedule.ts';
import { type PersonalActivity, type PlannerDocument, PlannerStore } from './plannerStore.ts';
import {
  type ActivityTransfer,
  removePersonalActivity,
  savePersonalActivity,
  transferActivities,
} from './personalActivities.ts';
import type {
  PlannerAccountGateway,
  PlannerSession,
  PlannerSessionGateway,
} from './plannerContracts.ts';
export interface PlannerSnapshot {
  document: PlannerDocument;
  session: PlannerSession;
}
interface Services {
  session: PlannerSessionGateway;
  account: PlannerAccountGateway;
  store(userId: string): Promise<PlannerStore>;
}
export class PlannerService {
  private services: Services;
  private listeners = new Set<() => void>();
  constructor(services: Services) {
    this.services = services;
  }
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
  private notify(): void {
    for (const listener of this.listeners) listener();
  }
  private async check(session: PlannerSession): Promise<void> {
    if (!await this.services.session.isCurrent(session)) {
      throw new Error('La sesión cambió. Vuelve a abrir la agenda.');
    }
  }
  private async scope(expected?: PlannerSession) {
    const session = await this.services.session.current();
    if (!session) throw new Error('Inicia sesión y completa tu perfil para consultar tu agenda.');
    if (
      expected && (expected.userId !== session.userId || expected.generation !== session.generation)
    ) throw new Error('La sesión cambió. Vuelve a abrir la agenda.');
    const store = await this.services.store(session.userId);
    await this.check(session);
    return { session, store };
  }
  async snapshot(expected?: PlannerSession): Promise<PlannerSnapshot> {
    const { session, store } = await this.scope(expected), document = await store.read();
    await this.check(session);
    return { document, session };
  }
  async editSchedule(
    session: PlannerSession,
    expected: ScheduleDocument,
    edit: (doc: ScheduleDocument) => ScheduleDocument,
  ): Promise<void> {
    const { store } = await this.scope(session);
    await this.check(session);
    await store.update((doc) => {
      if (!sameSchedule(doc.schedule, expected)) {
        invalid('El horario cambió. Revisa la versión actual antes de guardar.');
      }
      const schedule = parseSchedule(edit(doc.schedule));
      if (doc.schedule.semesters.some((s) => !schedule.semesters.some((next) => next.id === s.id))) {
        invalid('Los semestres anteriores deben conservarse.');
      }
      return { ...doc, schedule };
    });
    await this.check(session);
    this.notify();
  }
  private async local(
    session: PlannerSession,
    action: (doc: PlannerDocument) => PlannerDocument,
  ): Promise<void> {
    const { store } = await this.scope(session);
    await this.check(session);
    await store.update(action);
    await this.check(session);
    this.notify();
  }
  saveActivity(session: PlannerSession, activity: PersonalActivity): Promise<void> {
    return this.local(session, (doc) => savePersonalActivity(doc, activity));
  }
  removeActivity(session: PlannerSession, id: string, version: number): Promise<void> {
    return this.local(session, (doc) => removePersonalActivity(doc, id, version));
  }
  transfer(session: PlannerSession, request: ActivityTransfer): Promise<void> {
    return this.local(session, (doc) => transferActivities(doc, request));
  }
  async verifyAccount(session: PlannerSession): Promise<void> {
    if (!await this.services.session.isCurrent(session)) return;
    let error: { code?: string } | null;
    try {
      error = await this.services.account.lookup(session);
    } catch {
      return; // Sin respuesta del servidor no se sabe nada de la cuenta: se reintenta después.
    }
    if (error?.code !== 'user_not_found') return;
    if (!await this.services.session.isCurrent(session)) return;
    await this.services.account.erase(session.userId);
    this.notify();
  }
}

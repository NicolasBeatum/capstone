import { invalid, parseSchedule, sameSchedule, type ScheduleDocument } from '../domain/schedule.ts';
import { type PersonalActivity, type PlannerDocument, PlannerStore } from './plannerStore.ts';
import {
  importLegacyActivities,
  type LegacyEntry,
  type LegacyGateway,
} from './legacyActivities.ts';
import {
  type ActivityTransfer,
  removePersonalActivity,
  savePersonalActivity,
  transferActivities,
} from './personalActivities.ts';
import type {
  PlannerSession,
  PlannerSessionGateway,
  RemoteSchedule,
  ScheduleGateway,
} from './plannerContracts.ts';
export interface PlannerSnapshot {
  document: PlannerDocument;
  session: PlannerSession;
}
export type PlannerStatus = 'local' | 'pending' | 'synced' | 'conflict';
export function plannerStatus(doc: PlannerDocument): PlannerStatus {
  return doc.conflict
    ? 'conflict'
    : doc.inFlight || !sameSchedule(doc.working, doc.base.document)
    ? 'pending'
    : doc.initialized
    ? 'synced'
    : 'local';
}
interface Services {
  session: PlannerSessionGateway;
  remote: ScheduleGateway;
  store(userId: string): Promise<PlannerStore>;
  newId(): string;
  legacy: LegacyGateway;
}
export class PlannerService {
  private services: Services;
  private listeners = new Set<() => void>();
  private syncing = new Map<string, Promise<void>>();
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
      if (!sameSchedule(doc.working, expected)) {
        invalid('El horario cambió. Revisa la versión actual antes de guardar.');
      }
      const working = parseSchedule(edit(doc.working));
      if (
        doc.base.document.semesters.some((s) => !working.semesters.some((next) => next.id === s.id))
      ) invalid('Los semestres anteriores deben conservarse.');
      return { ...doc, working };
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
  async listLegacy(session: PlannerSession, acceptedWarning: boolean) {
    if (!acceptedWarning) {
      invalid('Confirma la advertencia antes de consultar actividades anteriores.');
    }
    await this.scope(session);
    const result = await this.services.legacy.list();
    await this.check(session);
    return result;
  }
  importLegacy(
    session: PlannerSession,
    entries: { entry: LegacyEntry; newId: string }[],
  ): Promise<void> {
    return this.local(session, (doc) => importLegacyActivities(doc, entries));
  }
  private async receive(
    store: PlannerStore,
    remote: RemoteSchedule,
    session: PlannerSession,
  ): Promise<void> {
    await this.check(session);
    await store.update((doc) => {
      if (doc.inFlight || remote.revision < doc.base.revision) return doc;
      if (
        remote.revision === doc.base.revision && !sameSchedule(remote.document, doc.base.document)
      ) {
        invalid(
          'El servidor devolvió una revisión inconsistente. Tus cambios locales se conservan.',
        );
      }
      if (sameSchedule(doc.working, doc.base.document)) {
        return {
          ...doc,
          base: remote,
          working: remote.document,
          initialized: true,
          conflict: null,
        };
      }
      return {
        ...doc,
        initialized: true,
        conflict: remote.revision !== doc.base.revision ? remote : doc.conflict,
      };
    });
    await this.check(session);
    this.notify();
  }
  async sync(expected: PlannerSession): Promise<void> {
    const key = `${expected.userId}/${expected.generation}`;
    const existing = this.syncing.get(key);
    if (existing) return existing;
    const work = this.synchronize(expected);
    this.syncing.set(key, work);
    try {
      await work;
    } finally {
      if (this.syncing.get(key) === work) this.syncing.delete(key);
    }
  }
  private async synchronize(session: PlannerSession): Promise<void> {
    const { store } = await this.scope(session);
    let local = await store.read();
    if (local.conflict) return;
    if (!local.inFlight) {
      const remote = await this.services.remote.load(session);
      await this.check(session);
      await this.receive(store, remote, session);
      local = await store.read();
      if (local.conflict) return;
    }
    if (!local.inFlight && !sameSchedule(local.working, local.base.document)) {
      const requestId = this.services.newId();
      await this.check(session);
      local = await store.update((doc) =>
        doc.inFlight || doc.conflict || sameSchedule(doc.working, doc.base.document) ? doc : {
          ...doc,
          inFlight: { requestId, expectedRevision: doc.base.revision, document: doc.working },
        }
      );
    }
    const submission = local.inFlight;
    if (!submission) return;
    await this.check(session);
    const result = await this.services.remote.save(session, submission);
    await this.check(session);
    await store.update((doc) => {
      if (doc.inFlight?.requestId !== submission.requestId) return doc;
      if (result.status === 'conflict') {
        return { ...doc, inFlight: null, conflict: result.remote, initialized: true };
      }
      return {
        ...doc,
        base: { revision: result.revision, document: submission.document },
        inFlight: null,
        initialized: true,
      };
    });
    await this.check(session);
    this.notify();
    if (result.status === 'applied') {
      const remote = await this.services.remote.load(session);
      await this.check(session);
      await this.receive(store, remote, session);
    }
  }
  async resolve(
    session: PlannerSession,
    expected: ScheduleDocument,
    remoteRevision: number,
    choice: 'local' | 'remote',
  ): Promise<void> {
    await this.local(session, (doc) => {
      if (
        !doc.conflict || doc.conflict.revision !== remoteRevision ||
        !sameSchedule(doc.working, expected)
      ) invalid('Las versiones cambiaron. Vuelve a revisar el conflicto.');
      const remote = doc.conflict;
      let working = remote.document;
      if (choice === 'local') {
        const missing = remote.document.semesters.filter((s) =>
          !doc.working.semesters.some((own) => own.id === s.id)
        );
        const subjects = remote.document.subjects.filter((s) =>
          missing.some((semester) => semester.id === s.semesterId)
        );
        working = parseSchedule({
          ...doc.working,
          semesters: [...doc.working.semesters, ...missing],
          subjects: [...doc.working.subjects, ...subjects],
          blocks: [
            ...doc.working.blocks,
            ...remote.document.blocks.filter((b) => subjects.some((s) => s.id === b.subjectId)),
          ],
        });
      }
      return { ...doc, base: remote, working, conflict: null, inFlight: null };
    });
  }
}

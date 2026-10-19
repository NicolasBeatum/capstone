import {
  emptySchedule,
  identifier,
  invalid,
  isDate,
  parseSchedule,
  record,
  type ScheduleDocument,
  textField,
  timeMinutes,
} from '../domain/schedule.ts';
import type { RemoteSchedule, ScheduleSubmission } from './plannerContracts.ts';
export type ActivityKind = 'exam' | 'task' | 'personal';
export const ACTIVITY_LABELS: Record<ActivityKind, string> = {
  exam: 'Prueba',
  task: 'Tarea',
  personal: 'Personal',
};
export interface PersonalActivity {
  id: string;
  kind: ActivityKind;
  date: string;
  time: string;
  endTime?: string;
  title: string;
  subjectName: string | null;
  semesterId: string | null;
  semesterName: string | null;
  version: number;
}
export interface LocalReceipt {
  requestId: string;
  fingerprint: string;
}
export interface PlannerDocument {
  schema: 1;
  base: RemoteSchedule;
  working: ScheduleDocument;
  inFlight: ScheduleSubmission | null;
  conflict: RemoteSchedule | null;
  initialized: boolean;
  activities: PersonalActivity[];
  receipts: LocalReceipt[];
  imports: string[];
}
export interface PlannerPersistence {
  read(): Promise<PlannerDocument>;
  update(transform: (document: PlannerDocument) => PlannerDocument): Promise<PlannerDocument>;
  remove(): Promise<void>;
  close?(): Promise<void>;
}
export function emptyPlanner(): PlannerDocument {
  return {
    schema: 1,
    base: { revision: 0, document: emptySchedule() },
    working: emptySchedule(),
    inFlight: null,
    conflict: null,
    initialized: false,
    activities: [],
    receipts: [],
    imports: [],
  };
}
export function parsePlannerJson(raw: string): unknown {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw new Error('No se pudieron leer los datos guardados. La copia existente se conserva.');
  }
}
function revision(v: unknown): number {
  if (!Number.isSafeInteger(v) || Number(v) < 0) invalid();
  return Number(v);
}
export function parseRemote(value: unknown): RemoteSchedule {
  const v = record(value, ['revision', 'document']);
  return { revision: revision(v.revision), document: parseSchedule(v.document) };
}
export function parseActivity(value: unknown): PersonalActivity {
  const v = record(value, [
    'id',
    'kind',
    'date',
    'time',
    'title',
    'subjectName',
    'semesterId',
    'semesterName',
    'version',
    ...(value && typeof value === 'object' && 'endTime' in value ? ['endTime'] : []),
  ]);
  if (
    !['exam', 'task', 'personal'].includes(String(v.kind)) || !isDate(v.date) ||
    revision(v.version) < 1
  ) invalid('Revisa la actividad.');
  timeMinutes(v.time);
  if (v.endTime !== undefined && timeMinutes(v.endTime) <= timeMinutes(v.time)) {
    invalid('La hora de término debe ser posterior al inicio dentro del mismo día.');
  }
  return {
    id: identifier(v.id),
    kind: v.kind as ActivityKind,
    date: v.date,
    time: String(v.time),
    ...(v.endTime === undefined ? {} : { endTime: String(v.endTime) }),
    title: textField(v.title, 120)!,
    subjectName: textField(v.subjectName, 120, true),
    semesterId: v.semesterId === null ? null : identifier(v.semesterId),
    semesterName: textField(v.semesterName, 80, true),
    version: Number(v.version),
  };
}
export function parseSubmission(value: unknown): ScheduleSubmission {
  const v = record(value, ['requestId', 'expectedRevision', 'document']);
  return {
    requestId: identifier(v.requestId),
    expectedRevision: revision(v.expectedRevision),
    document: parseSchedule(v.document),
  };
}
export function parsePlanner(value: unknown): PlannerDocument {
  const v = record(value, [
    'schema',
    'base',
    'working',
    'inFlight',
    'conflict',
    'initialized',
    'activities',
    'receipts',
    'imports',
  ]);
  if (
    v.schema !== 1 || typeof v.initialized !== 'boolean' || !Array.isArray(v.activities) ||
    !Array.isArray(v.receipts) || !Array.isArray(v.imports)
  ) invalid('No se pudieron leer tus datos locales.');
  const activities = v.activities.map(parseActivity);
  if (new Set(activities.map((a) => a.id)).size !== activities.length) invalid();
  const receipts = v.receipts.map((value) => {
    const r = record(value, ['requestId', 'fingerprint']);
    if (typeof r.fingerprint !== 'string' || r.fingerprint.length > 100000) invalid();
    return { requestId: identifier(r.requestId), fingerprint: r.fingerprint };
  });
  if (
    new Set(receipts.map((r) => r.requestId)).size !== receipts.length ||
    v.imports.some((i) => typeof i !== 'string' || i.length > 300)
  ) invalid();
  return {
    schema: 1,
    base: parseRemote(v.base),
    working: parseSchedule(v.working),
    inFlight: v.inFlight === null ? null : parseSubmission(v.inFlight),
    conflict: v.conflict === null ? null : parseRemote(v.conflict),
    initialized: v.initialized,
    activities,
    receipts,
    imports: [...v.imports] as string[],
  };
}
export class PlannerStore {
  private persistence: PlannerPersistence;
  private queue: Promise<unknown> = Promise.resolve();
  private disposed = false;
  constructor(persistence: PlannerPersistence) {
    this.persistence = persistence;
  }
  private run<T>(action: () => Promise<T>): Promise<T> {
    if (this.disposed) return Promise.reject(new Error('Los datos de esta cuenta están cerrados.'));
    const result = this.queue.then(action);
    this.queue = result.catch(() => undefined);
    return result;
  }
  read(): Promise<PlannerDocument> {
    return this.run(async () => parsePlanner(await this.persistence.read()));
  }
  update(transform: (doc: PlannerDocument) => PlannerDocument): Promise<PlannerDocument> {
    return this.run(() =>
      this.persistence.update((raw) => parsePlanner(transform(parsePlanner(raw))))
    );
  }
  async destroy(): Promise<void> {
    this.disposed = true;
    await this.queue;
    await this.persistence.remove();
  }
  async close(): Promise<void> {
    this.disposed = true;
    await this.queue;
    await this.persistence.close?.();
  }
}

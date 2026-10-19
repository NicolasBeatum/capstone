import type { ScheduleDocument } from '../domain/schedule';
export interface PlannerSession {
  userId: string;
  generation: number;
}
export interface PlannerSessionGateway {
  current(): Promise<PlannerSession | null>;
  isCurrent(session: PlannerSession): Promise<boolean>;
  subscribe(listener: () => void): () => void;
}
export interface RemoteSchedule {
  revision: number;
  document: ScheduleDocument;
}
export interface ScheduleSubmission {
  requestId: string;
  expectedRevision: number;
  document: ScheduleDocument;
}
export type ScheduleResult = { status: 'applied'; revision: number; requestId: string } | {
  status: 'conflict';
  remote: RemoteSchedule;
};
export interface ScheduleGateway {
  load(session: PlannerSession): Promise<RemoteSchedule>;
  save(session: PlannerSession, submission: ScheduleSubmission): Promise<ScheduleResult>;
}
export class PlannerAuthError extends Error {
  constructor() {
    super('Renueva tu sesión para sincronizar el horario.');
  }
}

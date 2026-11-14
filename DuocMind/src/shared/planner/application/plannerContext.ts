import { createContext } from 'react';
import type { ScheduleDocument } from '../domain/schedule';
import type { PlannerSnapshot } from './plannerService';
import type { PersonalActivity, PlannerDocument } from './plannerStore';
import type { ActivityTransfer } from './personalActivities';
export interface PlannerModel {
  snapshot: PlannerSnapshot | null;
  loading: boolean;
  busy: boolean;
  error: string | null;
  now: Date;
  refresh(): Promise<void>;
  editSchedule(
    expected: ScheduleDocument,
    edit: (doc: ScheduleDocument) => ScheduleDocument,
  ): Promise<void>;
  applyImport(
    expected: ScheduleDocument,
    transform: (doc: PlannerDocument) => PlannerDocument,
  ): Promise<void>;
  saveActivity(activity: PersonalActivity): Promise<void>;
  removeActivity(id: string, version: number): Promise<void>;
  setActivityDone(id: string, version: number, done: boolean): Promise<void>;
  transfer(request: ActivityTransfer): Promise<void>;
}
export const PlannerContext = createContext<PlannerModel | null>(null);

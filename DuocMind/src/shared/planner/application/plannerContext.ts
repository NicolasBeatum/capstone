import { createContext } from 'react';
import type { ScheduleDocument } from '../domain/schedule';
import type { PlannerSnapshot, PlannerStatus } from './plannerService';
import type { PersonalActivity } from './plannerStore';
import type { ActivityTransfer } from './personalActivities';
import type { LegacyCatalog, LegacyEntry } from './legacyActivities';
export interface PlannerModel {
  snapshot: PlannerSnapshot | null;
  loading: boolean;
  busy: boolean;
  syncing: boolean;
  error: string | null;
  syncError: string | null;
  now: Date;
  status: PlannerStatus;
  refresh(): Promise<void>;
  editSchedule(
    expected: ScheduleDocument,
    edit: (doc: ScheduleDocument) => ScheduleDocument,
  ): Promise<void>;
  saveActivity(activity: PersonalActivity): Promise<void>;
  removeActivity(id: string, version: number): Promise<void>;
  transfer(request: ActivityTransfer): Promise<void>;
  listLegacy(accepted: boolean): Promise<LegacyCatalog>;
  importLegacy(entries: { entry: LegacyEntry; newId: string }[]): Promise<void>;
  resolve(expected: ScheduleDocument, revision: number, choice: 'local' | 'remote'): Promise<void>;
}
export const PlannerContext = createContext<PlannerModel | null>(null);

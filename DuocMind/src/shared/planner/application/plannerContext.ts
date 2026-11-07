import { createContext } from 'react';
import type { ScheduleDocument } from '../domain/schedule';
import type { PlannerSnapshot } from './plannerService';
import type { PersonalActivity } from './plannerStore';
import type { ActivityTransfer } from './personalActivities';
import type { LegacyCatalog, LegacyEntry } from './legacyActivities';
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
  saveActivity(activity: PersonalActivity): Promise<void>;
  removeActivity(id: string, version: number): Promise<void>;
  transfer(request: ActivityTransfer): Promise<void>;
  listLegacy(accepted: boolean): Promise<LegacyCatalog>;
  importLegacy(entries: { entry: LegacyEntry; newId: string }[]): Promise<void>;
}
export const PlannerContext = createContext<PlannerModel | null>(null);

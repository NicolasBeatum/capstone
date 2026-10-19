import { identifier, invalid, isDate, textField, timeMinutes } from '../domain/schedule.ts';
import { parsePlanner, type PlannerDocument } from './plannerStore.ts';
export interface LegacyActivity {
  legacyId: string;
  date: string;
  time: string;
  title: string;
  subjectName: string | null;
}
export interface LegacyEntry {
  fingerprint: string;
  activity: LegacyActivity;
}
export interface LegacyCatalog {
  entries: LegacyEntry[];
  invalidCount: number;
}
export interface LegacyGateway {
  list(): Promise<LegacyCatalog>;
}
export function parseLegacyActivity(value: unknown): LegacyActivity {
  if (!value || typeof value !== 'object') invalid();
  const v = value as Record<string, unknown>;
  if (typeof v.id !== 'string' || !v.id || v.id.length > 150 || !isDate(v.date)) invalid();
  timeMinutes(v.time);
  return {
    legacyId: v.id,
    date: v.date,
    time: String(v.time),
    title: textField(v.title, 120)!,
    subjectName: textField(v.subject, 120, true),
  };
}
export async function legacyCatalog(
  values: unknown,
  hash: (value: string) => Promise<string>,
): Promise<LegacyCatalog> {
  if (!Array.isArray(values)) invalid('No se pudieron leer las actividades anteriores.');
  const entries: LegacyEntry[] = [];
  let invalidCount = 0;
  for (const value of values) {
    let activity: LegacyActivity;
    try {
      activity = parseLegacyActivity(value);
    } catch {
      invalidCount += 1;
      continue;
    }
    const fingerprint = await hash(JSON.stringify(activity));
    if (!/^[a-f0-9]{64}$/.test(fingerprint)) invalid();
    entries.push({ fingerprint, activity });
  }
  return { entries, invalidCount };
}
export function importLegacyActivities(
  doc: PlannerDocument,
  entries: { entry: LegacyEntry; newId: string }[],
): PlannerDocument {
  const next = parsePlanner(doc);
  for (const { entry, newId } of entries) {
    if (!/^[a-f0-9]{64}$/.test(entry.fingerprint)) invalid();
    if (next.imports.includes(entry.fingerprint)) continue;
    next.activities.push({
      id: identifier(newId),
      kind: 'personal',
      date: entry.activity.date,
      time: entry.activity.time,
      title: entry.activity.title,
      subjectName: entry.activity.subjectName,
      semesterId: null,
      semesterName: null,
      version: 1,
    });
    next.imports.push(entry.fingerprint);
  }
  return parsePlanner(next);
}

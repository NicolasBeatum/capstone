import { identifier, invalid, isDate } from '../domain/schedule.ts';
import {
  parseActivity,
  parsePlanner,
  type PersonalActivity,
  type PlannerDocument,
} from './plannerStore.ts';
export function savePersonalActivity(
  doc: PlannerDocument,
  value: PersonalActivity,
): PlannerDocument {
  const activity = parseActivity(value),
    previous = doc.activities.find((a) => a.id === activity.id);
  if (previous && previous.version !== activity.version || !previous && activity.version !== 1) {
    invalid('La actividad cambió. Vuelve a abrirla.');
  }
  if (
    activity.semesterId && !doc.working.semesters.some((s) => s.id === activity.semesterId) &&
    previous?.semesterId !== activity.semesterId
  ) invalid('Ese semestre no está disponible.');
  return parsePlanner({
    ...doc,
    activities: [...doc.activities.filter((a) => a.id !== activity.id), {
      ...activity,
      version: previous ? previous.version + 1 : 1,
    }],
  });
}
export function removePersonalActivity(
  doc: PlannerDocument,
  id: string,
  version: number,
): PlannerDocument {
  if (!doc.activities.some((a) => a.id === id && a.version === version)) {
    invalid('La actividad cambió. Vuelve a abrirla.');
  }
  return { ...doc, activities: doc.activities.filter((a) => a.id !== id) };
}
export interface ActivityTransfer {
  requestId: string;
  mode: 'copy' | 'move';
  targetSemesterId: string | null;
  sources: { id: string; version: number; copyId: string | null; date: string }[];
}
export function transferActivities(
  doc: PlannerDocument,
  request: ActivityTransfer,
): PlannerDocument {
  identifier(request.requestId);
  if (
    !['copy', 'move'].includes(request.mode) || !request.sources.length ||
    new Set(request.sources.map((s) => s.id)).size !== request.sources.length
  ) invalid('Selecciona actividades válidas.');
  const fingerprint = JSON.stringify(request),
    receipt = doc.receipts.find((r) => r.requestId === request.requestId);
  if (receipt) {
    if (receipt.fingerprint !== fingerprint) {
      invalid('La operación ya fue utilizada con otros datos.');
    }
    return doc;
  }
  const target = request.targetSemesterId === null
    ? null
    : doc.working.semesters.find((s) => s.id === request.targetSemesterId);
  if (target === undefined) invalid('El semestre de destino no está disponible.');
  const copies: PersonalActivity[] = [];
  const changes = new Map<string, PersonalActivity>();
  for (const source of request.sources) {
    const original = doc.activities.find((a) => a.id === source.id && a.version === source.version);
    if (!original) invalid('Una actividad cambió. Revisa la selección.');
    if (!isDate(source.date)) invalid('Selecciona una fecha válida.');
    if (original.semesterId === request.targetSemesterId) {
      invalid('Elige un destino distinto del origen.');
    }
    const next = {
      ...original,
      semesterId: target?.id ?? null,
      semesterName: target?.name ?? null,
      date: source.date,
    };
    if (request.mode === 'copy') {
      copies.push({ ...next, id: identifier(source.copyId), version: 1 });
    } else changes.set(original.id, { ...next, version: original.version + 1 });
  }
  return parsePlanner({
    ...doc,
    activities: [...doc.activities.map((a) => changes.get(a.id) ?? a), ...copies],
    receipts: [...doc.receipts, { requestId: request.requestId, fingerprint }],
  });
}

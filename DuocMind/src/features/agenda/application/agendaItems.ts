import { getVisibleAgendaActivities, type AgendaActivity } from '../domain/agendaActivity.ts';
import { eventDateKey, eventIntervalLabel, eventOccupiesDate, eventTime, getEventState, isDateKey, projectInterest, type EventCatalog, type EventInterest } from '../../../shared/events/domain/institutionalEvent.ts';
export type AgendaItem =
  | { kind: 'activity'; id: string; time: string; activity: AgendaActivity }
  | { kind: 'event'; id: string; time: string; projection: ReturnType<typeof projectInterest>; interval: string; continuation: boolean; state: ReturnType<typeof getEventState> };
export function composeAgendaItems(activities: AgendaActivity[], interests: EventInterest[], catalog: EventCatalog | null, date: string, now: Date): AgendaItem[] {
  if (!isDateKey(date)) throw new Error('Selecciona una fecha válida.');
  const personal: AgendaItem[] = getVisibleAgendaActivities(activities, date, now).map(activity => ({ kind: 'activity', id: activity.id, time: activity.time, activity }));
  const institutional: AgendaItem[] = interests.map(interest => projectInterest(interest, catalog))
    .filter(projection => eventOccupiesDate(projection.event, date))
    .map(projection => {
      const continuation = eventDateKey(projection.event.startsAt) < date;
      return { kind: 'event', id: projection.event.id, time: continuation ? '00:00' : eventTime(projection.event.startsAt), projection, continuation, interval: eventIntervalLabel(projection.event), state: getEventState(projection.event, now) };
    });
  return [...personal, ...institutional].sort((a, b) => a.time.localeCompare(b.time) || a.id.localeCompare(b.id) || a.kind.localeCompare(b.kind));
}
export interface AgendaActivitiesGateway {
  load(): Promise<AgendaActivity[]>;
  save(activity: AgendaActivity): Promise<void>;
  remove(id: string): Promise<void>;
}

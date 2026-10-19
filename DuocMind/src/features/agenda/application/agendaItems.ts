import type { PersonalActivity } from '../../../shared/planner/application/plannerStore.ts';
import type { ClassOccurrence } from '../../../shared/planner/domain/weeklySchedule.ts';
import { eventDateKey, eventIntervalLabel, eventOccupiesDate, eventTime, getEventState, isDateKey, projectInterest, type EventCatalog, type EventInterest } from '../../../shared/events/domain/institutionalEvent.ts';
export type AgendaItem =
  | { kind: 'activity'; id: string; time: string; activity: PersonalActivity }
  | { kind: 'class'; id: string; time: string; occurrence: ClassOccurrence }
  | { kind: 'event'; id: string; time: string; projection: ReturnType<typeof projectInterest>; interval: string; continuation: boolean; state: ReturnType<typeof getEventState> };
export function composeAgendaItems(activities: PersonalActivity[], interests: EventInterest[], catalog: EventCatalog | null, date: string, now: Date, classes: ClassOccurrence[] = []): AgendaItem[] {
  if (!isDateKey(date)) throw new Error('Selecciona una fecha válida.');
  const personal: AgendaItem[] = activities.filter(activity=>activity.date===date).map(activity => ({ kind: 'activity', id: activity.id, time: activity.time, activity }));
  const institutional: AgendaItem[] = interests.map(interest => projectInterest(interest, catalog))
    .filter(projection => eventOccupiesDate(projection.event, date))
    .map(projection => {
      const continuation = eventDateKey(projection.event.startsAt) < date;
      return { kind: 'event', id: projection.event.id, time: continuation ? '00:00' : eventTime(projection.event.startsAt), projection, continuation, interval: eventIntervalLabel(projection.event), state: getEventState(projection.event, now) };
    });
  const academic: AgendaItem[] = classes.filter(occurrence=>occurrence.date===date).map(occurrence=>({kind:'class',id:occurrence.id,time:occurrence.block.startsAt,occurrence}));
  return [...personal, ...academic, ...institutional].sort((a, b) => a.time.localeCompare(b.time) || a.kind.localeCompare(b.kind) || a.id.localeCompare(b.id));
}

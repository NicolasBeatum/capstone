export interface AgendaActivity {
  id: string;
  date: string;
  title: string;
  subject: string | null;
  time: string;
}

export type AgendaActivityStatus = 'upcoming' | 'in-progress' | 'ended';

export function getAgendaActivityEndTime(startTime: string): string {
  const [hour, minute] = startTime.split(':').map(Number);
  const endTime = new Date(2000, 0, 1, hour, minute + 60);
  return `${String(endTime.getHours()).padStart(2, '0')}:${String(endTime.getMinutes()).padStart(2, '0')}`;
}

export function getAgendaActivityStatus(
  activity: Pick<AgendaActivity, 'date' | 'time'>,
  now: Date,
): AgendaActivityStatus {
  const [year, month, day] = activity.date.split('-').map(Number);
  const [hour, minute] = activity.time.split(':').map(Number);
  const startsAt = new Date(year, month - 1, day, hour, minute);
  const endsAt = new Date(startsAt.getTime() + 60 * 60 * 1000);

  if (now.getTime() >= endsAt.getTime()) return 'ended';
  if (now.getTime() >= startsAt.getTime()) return 'in-progress';
  return 'upcoming';
}

export function getVisibleAgendaActivities(
  activities: AgendaActivity[],
  selectedDate: string,
  now: Date,
): AgendaActivity[] {
  return activities
    .filter(
      (activity) =>
        activity.date === selectedDate &&
        getAgendaActivityStatus(activity, now) !== 'ended',
    )
    .sort((left, right) => left.time.localeCompare(right.time));
}

import type { ScheduleDocument } from '../domain/schedule.ts';
import { civilNow, classesOnDate, dateWeekday, WEEKDAYS } from '../domain/weeklySchedule.ts';
import { personalActivityEnd, personalActivityState } from '../domain/personalActivityTime.ts';
import type { PersonalActivity } from './plannerStore.ts';
export function projectPlannerDashboard(
  document: ScheduleDocument,
  activities: PersonalActivity[],
  now: Date,
) {
  const { date } = civilNow(now),
    semester = document.semesters.find((s) => s.id === document.activeSemesterId) ?? null;
  const classes = classesOnDate(document, date, now),
    current = classes.filter((c) => c.state === 'in-progress'),
    next = classes.find((c) => c.state === 'upcoming') ?? null;
  const outside = semester &&
    (semester.startsOn && date < semester.startsOn || semester.endsOn && date > semester.endsOn);
  const emptyLabel = !semester
    ? 'Configura tu horario'
    : outside
    ? 'Fuera de las fechas del semestre'
    : !classes.length
    ? 'Hoy no tienes clases'
    : next
    ? 'Tu próxima clase'
    : 'Tus clases de hoy terminaron';
  const upcoming = activities.filter((a) => personalActivityState(a, now) !== 'ended').sort((
    a,
    b,
  ) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time) || a.id.localeCompare(b.id))
    .slice(0, 3).map((activity) => {
      const distance = Math.round(
        (Date.parse(`${activity.date}T12:00:00Z`) - Date.parse(`${date}T12:00:00Z`)) / 86400000,
      );
      return {
        ...activity,
        weekday: WEEKDAYS[dateWeekday(activity.date) - 1].slice(0, 3).toUpperCase(),
        day: Number(activity.date.slice(8)),
        detail: [
          `${activity.time}–${personalActivityEnd(activity.time, activity.endTime)}`,
          activity.subjectName,
        ].filter(Boolean).join(' · '),
        when: distance === 0 ? 'Hoy' : distance === 1 ? 'Mañana' : `En ${distance} días`,
        urgent: distance <= 1,
      };
    });
  return { date, semester, current, next, emptyLabel, upcoming };
}

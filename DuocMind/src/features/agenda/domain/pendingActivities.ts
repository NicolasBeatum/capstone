import {
  ACTIVITY_LABELS,
  type ActivityKind,
  type PersonalActivity,
} from '../../../shared/planner/application/plannerStore.ts';
import { timeMinutes } from '../../../shared/planner/domain/schedule.ts';
import { personalActivityState } from '../../../shared/planner/domain/personalActivityTime.ts';
import { addDays, civilNow, dateWeekday, WEEKDAYS } from '../../../shared/planner/domain/weeklySchedule.ts';

export type KindFilter = 'all' | ActivityKind;
export type SemesterFilter = { kind: 'all' } | { kind: 'general' } | { kind: 'semester'; id: string };
export interface PendingFilters {
  kind: KindFilter;
  semester: SemesterFilter;
}
export type PendingGroupId = 'late' | 'today' | 'soon' | 'later';
export interface PendingItem {
  activity: PersonalActivity;
  /** «18:00» para hoy; «Lun 16» para otros días. */
  when: string;
  /** «en 3 h», «mañana», «hace 2 días», «Ahora». */
  countdown: string;
  /** Nombre para el lector de pantalla: «Prueba 2, prueba, lunes 16, en 2 días». */
  a11y: string;
}
export interface PendingGroup {
  id: PendingGroupId;
  label: string;
  items: PendingItem[];
}
export interface PendingProjection {
  /** Solo los grupos con actividades, en orden de urgencia. */
  groups: PendingGroup[];
  /** Hechas, primero la marcada más recientemente. */
  done: PendingItem[];
  /** Pendientes por tipo, con el filtro de semestre aplicado. */
  counts: Record<KindFilter, number>;
  summary: string;
  /** Lunes a domingo de la semana actual; null si no hay actividades en ella. */
  week: { done: number; total: number } | null;
}

export const INITIAL_FILTERS: PendingFilters = { kind: 'all', semester: { kind: 'all' } };
const GROUP_LABELS: Record<PendingGroupId, string> = {
  late: 'Atrasadas',
  today: 'Hoy',
  soon: 'Próximos 7 días',
  later: 'Más adelante',
};
const DAY = 1440;
const dayStart = (date: string) => Date.parse(`${date}T00:00:00Z`) / 60000;
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const byDate = (a: PersonalActivity, b: PersonalActivity) =>
  a.date.localeCompare(b.date) || a.time.localeCompare(b.time) || a.id.localeCompare(b.id);

function bounds(activity: PersonalActivity) {
  const start = dayStart(activity.date) + timeMinutes(activity.time);
  const end = activity.endTime === undefined
    ? start + 60
    : dayStart(activity.date) + timeMinutes(activity.endTime);
  return { start, end };
}

/** Cuánto falta o cuánto pasó, en días y horas civiles de Chile. */
export function countdownLabel(activity: PersonalActivity, now: Date): string {
  const civil = civilNow(now), current = dayStart(civil.date) + civil.minutes;
  const state = personalActivityState(activity, now), { start, end } = bounds(activity);
  if (state === 'in-progress') return 'Ahora';
  const days = Math.round((dayStart(activity.date) - dayStart(civil.date)) / DAY);
  if (state === 'upcoming') {
    if (days > 1) return `en ${days} días`;
    if (days === 1) return 'mañana';
    const minutes = start - current;
    return minutes < 60 ? `en ${minutes} min` : `en ${Math.floor(minutes / 60)} h`;
  }
  if (days < -1) return `hace ${-days} días`;
  if (days === -1) return 'ayer';
  const minutes = current - end;
  return minutes < 60 ? `hace ${minutes} min` : `hace ${Math.floor(minutes / 60)} h`;
}

/** Día corto con su número: «Lun 16». */
export function shortDayLabel(date: string): string {
  return `${WEEKDAYS[dateWeekday(date) - 1].slice(0, 3)} ${Number(date.slice(8))}`;
}

/** Fecha larga para la hoja de acciones: «Lunes 16 de noviembre». */
export function longDayLabel(date: string): string {
  const month = new Intl.DateTimeFormat('es-CL', { month: 'long', timeZone: 'UTC' })
    .format(new Date(`${date}T12:00:00Z`));
  return `${WEEKDAYS[dateWeekday(date) - 1]} ${Number(date.slice(8))} de ${month}`;
}

function matches(activity: PersonalActivity, filters: PendingFilters, kind = true): boolean {
  const { semester } = filters;
  if (semester.kind === 'general' && activity.semesterId !== null) return false;
  if (semester.kind === 'semester' && activity.semesterId !== semester.id) return false;
  return !kind || filters.kind === 'all' || activity.kind === filters.kind;
}

function groupOf(activity: PersonalActivity, now: Date, today: string): PendingGroupId {
  if (personalActivityState(activity, now) === 'ended') return 'late';
  if (activity.date <= today) return 'today';
  return activity.date <= addDays(today, 7) ? 'soon' : 'later';
}

function item(activity: PersonalActivity, now: Date, today: string): PendingItem {
  const countdown = countdownLabel(activity, now), isToday = activity.date === today;
  const pending = !activity.doneAt && personalActivityState(activity, now) !== 'ended';
  const when = isToday && pending ? activity.time : shortDayLabel(activity.date);
  const spoken = isToday
    ? `hoy a las ${activity.time}`
    : longDayLabel(activity.date).split(' de ')[0].toLowerCase();
  return {
    activity,
    when,
    countdown,
    a11y: [
      activity.title,
      ACTIVITY_LABELS[activity.kind].toLowerCase(),
      spoken,
      activity.doneAt ? 'hecha' : countdown,
    ].join(', '),
  };
}

export function projectPending(
  activities: PersonalActivity[],
  now: Date,
  filters: PendingFilters,
): PendingProjection {
  const today = civilNow(now).date;
  const inSemester = activities.filter((a) => matches(a, filters, false));
  const pending = inSemester.filter((a) => !a.doneAt);
  const counts: Record<KindFilter, number> = { all: pending.length, exam: 0, task: 0, personal: 0 };
  for (const a of pending) counts[a.kind] += 1;

  const buckets: Record<PendingGroupId, PersonalActivity[]> = { late: [], today: [], soon: [], later: [] };
  for (const a of pending) if (matches(a, filters)) buckets[groupOf(a, now, today)].push(a);
  buckets.late.sort((a, b) => bounds(b).end - bounds(a).end || a.id.localeCompare(b.id));
  for (const id of ['today', 'soon', 'later'] as const) buckets[id].sort(byDate);
  const groups = (Object.keys(GROUP_LABELS) as PendingGroupId[])
    .filter((id) => buckets[id].length)
    .map((id) => ({ id, label: GROUP_LABELS[id], items: buckets[id].map((a) => item(a, now, today)) }));

  const done = inSemester.filter((a) => a.doneAt && matches(a, filters))
    .sort((a, b) => b.doneAt!.localeCompare(a.doneAt!) || a.id.localeCompare(b.id))
    .map((a) => item(a, now, today));

  const late = buckets.late.length, near = buckets.today.length + buckets.soon.length;
  const parts = [
    late ? plural(late, 'atrasada', 'atrasadas') : '',
    near ? `${near} en los próximos 7 días` : '',
  ].filter(Boolean);
  if (!parts.length && buckets.later.length) parts.push(`${buckets.later.length} más adelante`);

  // La semana usa los mismos filtros que la lista, para que la barra describa lo que se ve.
  const monday = addDays(today, 1 - dateWeekday(today)), sunday = addDays(monday, 6);
  const week = inSemester.filter((a) => matches(a, filters) && a.date >= monday && a.date <= sunday);

  return {
    groups,
    done,
    counts,
    summary: parts.length ? parts.join(' · ') : 'Todo al día',
    week: week.length ? { done: week.filter((a) => a.doneAt).length, total: week.length } : null,
  };
}

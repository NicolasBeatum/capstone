import {
  invalid,
  isDate,
  parseBlock,
  parseSchedule,
  PLANNER_TIME_ZONE,
  type ScheduleDocument,
  type ScheduleSubject,
  timeMinutes,
  type WeeklyBlock,
} from './schedule.ts';
export const WEEKDAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
export interface ClassOccurrence {
  id: string;
  date: string;
  block: WeeklyBlock;
  subject: ScheduleSubject;
  state: 'upcoming' | 'in-progress' | 'ended';
  progress: number;
  minutesLeft: number;
}
export function civilNow(now: Date): { date: string; minutes: number } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: PLANNER_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const part = (type: string) => parts.find((p) => p.type === type)!.value;
  return {
    date: `${part('year')}-${part('month')}-${part('day')}`,
    minutes: Number(part('hour')) * 60 + Number(part('minute')),
  };
}
export function dateWeekday(date: string): number {
  if (!isDate(date)) invalid('Selecciona una fecha válida.');
  return (new Date(`${date}T12:00:00Z`).getUTCDay() + 6) % 7 + 1;
}
export function addDays(date: string, days: number): string {
  if (!isDate(date)) invalid();
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}
export function findBlockOverlaps(document: ScheduleDocument, value: WeeklyBlock): WeeklyBlock[] {
  const block = parseBlock(value),
    subject = document.subjects.find((s) => s.id === block.subjectId);
  if (!subject) invalid('El ramo no está disponible.');
  return document.blocks.filter((b) =>
    b.id !== block.id && b.weekday === block.weekday && document.subjects.find((s) =>
        s.id === b.subjectId
      )?.semesterId === subject.semesterId &&
    b.startsAt < block.endsAt && block.startsAt < b.endsAt
  );
}
export function putBlock(
  document: ScheduleDocument,
  block: WeeklyBlock,
  acceptOverlap = false,
): ScheduleDocument {
  const next = parseSchedule({
    ...document,
    blocks: [...document.blocks.filter((b) => b.id !== block.id), parseBlock(block)],
  });
  const overlaps = findBlockOverlaps(document, block);
  if (overlaps.length && !acceptOverlap) {
    invalid('Este horario se cruza con otro bloque. Revisa y confirma para conservar ambos.');
  }
  return next;
}
export function removeBlock(document: ScheduleDocument, id: string): ScheduleDocument {
  return parseSchedule({ ...document, blocks: document.blocks.filter((b) => b.id !== id) });
}
export function classesOnDate(
  document: ScheduleDocument,
  date: string,
  now: Date,
  semesterId = document.activeSemesterId,
): ClassOccurrence[] {
  const weekday = dateWeekday(date), semester = document.semesters.find((s) => s.id === semesterId);
  if (
    !semester || semester.startsOn && date < semester.startsOn ||
    semester.endsOn && date > semester.endsOn
  ) return [];
  const civil = civilNow(now);
  return document.blocks.flatMap((block) => {
    const subject = document.subjects.find((s) =>
      s.id === block.subjectId && s.semesterId === semester.id
    );
    if (!subject || block.weekday !== weekday) return [];
    const start = timeMinutes(block.startsAt), end = timeMinutes(block.endsAt);
    const elapsed = date < civil.date ? end - start : date > civil.date ? 0 : civil.minutes - start;
    const state = date < civil.date || date === civil.date && civil.minutes >= end
      ? 'ended'
      : date === civil.date && civil.minutes >= start
      ? 'in-progress'
      : 'upcoming';
    return [
      {
        id: `${block.id}/${date}`,
        date,
        block,
        subject,
        state,
        progress: Math.max(0, Math.min(100, elapsed / (end - start) * 100)),
        minutesLeft: state === 'ended'
          ? 0
          : state === 'upcoming'
          ? end - start
          : end - civil.minutes,
      } as ClassOccurrence,
    ];
  }).sort((a, b) => a.block.startsAt.localeCompare(b.block.startsAt) || a.id.localeCompare(b.id));
}
export interface WeekDayClasses {
  weekday: number;
  classes: { block: WeeklyBlock; subject: ScheduleSubject }[];
}
export function semesterWeek(doc: ScheduleDocument, semesterId: string): WeekDayClasses[] {
  const classes = doc.blocks.flatMap((block) => {
    const subject = doc.subjects.find((s) => s.id === block.subjectId);
    return subject?.semesterId === semesterId ? [{ block, subject }] : [];
  }).sort((a, b) =>
    a.block.startsAt.localeCompare(b.block.startsAt) ||
    a.subject.name.localeCompare(b.subject.name, 'es') || a.block.id.localeCompare(b.block.id)
  );
  return [1, 2, 3, 4, 5, 6, 7].map((weekday) => ({
    weekday,
    classes: classes.filter(({ block }) => block.weekday === weekday),
  })).filter((day) => day.classes.length);
}
export function addMonths(date: string, months: number): string {
  const [year, month, day] = date.split('-').map(Number);
  const target = new Date(Date.UTC(year, month - 1 + months, 1)),
    lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(day, lastDay));
  return target.toISOString().slice(0, 10);
}
/** Días del mes en semanas de lunes a domingo; null marca las celdas fuera del mes. */
export function monthGrid(date: string): (string | null)[][] {
  const first = `${date.slice(0, 7)}-01`,
    days = Number(addDays(addMonths(first, 1), -1).slice(8)),
    cells = [
      ...Array<null>(dateWeekday(first) - 1).fill(null),
      ...Array.from({ length: days }, (_, index) => addDays(first, index)),
    ];
  return Array.from({ length: Math.ceil(cells.length / 7) }, (_, week) =>
    Array.from({ length: 7 }, (_, day) => cells[week * 7 + day] ?? null));
}

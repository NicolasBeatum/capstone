import { invalid, isDate, timeMinutes } from './schedule.ts';
import { civilNow } from './weeklySchedule.ts';
export function personalActivityState(
  activity: { date: string; time: string; endTime?: string },
  now: Date,
): 'upcoming' | 'in-progress' | 'ended' {
  if (!isDate(activity.date)) invalid();
  const civil = civilNow(now), day = (date: string) => Date.parse(`${date}T00:00:00Z`) / 60000;
  const start = day(activity.date) + timeMinutes(activity.time),
    current = day(civil.date) + civil.minutes;
  const end = activity.endTime === undefined
    ? start + 60
    : day(activity.date) + timeMinutes(activity.endTime);
  return current >= end ? 'ended' : current >= start ? 'in-progress' : 'upcoming';
}
export function personalActivityEnd(time: string, endTime?: string): string {
  if (endTime !== undefined) return endTime;
  const minutes = (timeMinutes(time) + 60) % 1440;
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${
    String(minutes % 60).padStart(2, '0')
  }`;
}
/** Reemplaza la hora o los minutos, o devuelve null si el texto aún no es válido. */
export function changeTimePart(time: string, part: 'hour' | 'minute', text: string): string | null {
  const value = Number(text);
  if (!/^\d{1,2}$/.test(text) || value > (part === 'hour' ? 23 : 59)) return null;
  const digits = String(value).padStart(2, '0');
  return part === 'hour' ? `${digits}:${time.slice(3, 5)}` : `${time.slice(0, 2)}:${digits}`;
}

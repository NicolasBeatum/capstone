export interface InstitutionalEvent {
  id: string;
  title: string;
  description: string;
  location: string;
  startsAt: string;
  endsAt: string;
  status: 'published' | 'cancelled';
  publishedAt: string;
  revision: number;
  requiresRegistration: boolean;
  registrationUrl: string | null;
  registrationDeadline: string | null;
  registrationClosed: boolean;
}
export interface EventCatalog { events: InstitutionalEvent[]; serverTime: string }
export interface EventInterest { event: InstitutionalEvent; savedAt: string; version: number }
export type EventState = 'upcoming' | 'in-progress' | 'ended' | 'cancelled';
export const EVENT_TIME_ZONE = 'America/Santiago';
export const EVENT_STATE_LABELS: Record<EventState, string> = {
  upcoming: 'Próximo', 'in-progress': 'En curso', ended: 'Finalizado', cancelled: 'Cancelado',
};
export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isDateKey(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
export function isRegistrationUrl(value: unknown): value is string {
  if (typeof value !== 'string' || value.length > 2048 || /[\\\s\u0000-\u001f\u007f]/.test(value)) return false;
  try {
    const url = new URL(value);
    return /^https:\/\//i.test(value) && url.protocol === 'https:' && !!url.hostname && !url.username && !url.password;
  } catch { return false; }
}
function fail(): never { throw new Error('La información de eventos no es válida.'); }
export function eventInstant(value: unknown): string {
  if (typeof value !== 'string' || !isDateKey(value.slice(0, 10)) ||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/.test(value) ||
      !Number.isFinite(Date.parse(value))) fail();
  return new Date(value).toISOString();
}
export function eventObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail();
  return value as Record<string, unknown>;
}
export function parseEvent(value: unknown): InstitutionalEvent {
  const v = eventObject(value);
  if (typeof v.id !== 'string' || !UUID_PATTERN.test(v.id) ||
      typeof v.title !== 'string' || !v.title.trim() || v.title.length > 160 ||
      typeof v.description !== 'string' || v.description.length > 5000 ||
      typeof v.location !== 'string' || !v.location.trim() || v.location.length > 160 ||
      (v.status !== 'published' && v.status !== 'cancelled') ||
      typeof v.revision !== 'number' || !Number.isSafeInteger(v.revision) || v.revision < 1 ||
      typeof v.requiresRegistration !== 'boolean' || typeof v.registrationClosed !== 'boolean') fail();
  const startsAt = eventInstant(v.startsAt), endsAt = eventInstant(v.endsAt);
  const registrationDeadline = v.registrationDeadline === null ? null : eventInstant(v.registrationDeadline);
  if (endsAt < startsAt) fail();
  if (v.requiresRegistration) {
    if (!isRegistrationUrl(v.registrationUrl) || !registrationDeadline || registrationDeadline > startsAt) fail();
  } else if (v.registrationUrl !== null || registrationDeadline !== null || v.registrationClosed) fail();
  return {
    id: v.id.toLowerCase(), title: v.title, description: v.description, location: v.location,
    startsAt, endsAt, status: v.status, publishedAt: eventInstant(v.publishedAt), revision: v.revision,
    requiresRegistration: v.requiresRegistration, registrationUrl: v.registrationUrl as string | null,
    registrationDeadline, registrationClosed: v.registrationClosed,
  };
}
export function parseCatalog(value: unknown): EventCatalog {
  const v = eventObject(value);
  if (!Array.isArray(v.events)) fail();
  const events = v.events.map(parseEvent);
  if (new Set(events.map(e => e.id)).size !== events.length) fail();
  return { serverTime: eventInstant(v.serverTime), events: sortEvents(events) };
}
export function parseInterest(value: unknown): EventInterest {
  const v = eventObject(value);
  if (typeof v.version !== 'number' || !Number.isSafeInteger(v.version) || v.version < 1) fail();
  return { event: parseEvent(v.event), savedAt: eventInstant(v.savedAt), version: v.version };
}
const dateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: EVENT_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
});
export function eventDateKey(date: Date | string): string {
  const parts = Object.fromEntries(dateFormatter.formatToParts(new Date(date)).map(p => [p.type, p.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}
export function eventTime(instant: string): string {
  return new Intl.DateTimeFormat('es-CL', { timeZone: EVENT_TIME_ZONE, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(instant));
}
export function eventDateLabel(instant: string): string {
  return new Intl.DateTimeFormat('es-CL', { timeZone: EVENT_TIME_ZONE, day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(instant));
}
export function eventIntervalLabel(event: Pick<InstitutionalEvent, 'startsAt' | 'endsAt'>): string {
  return eventDateKey(event.startsAt) === eventDateKey(event.endsAt)
    ? `${eventDateLabel(event.startsAt)} · ${eventTime(event.startsAt)}–${eventTime(event.endsAt)}`
    : `${eventDateLabel(event.startsAt)} ${eventTime(event.startsAt)} → ${eventDateLabel(event.endsAt)} ${eventTime(event.endsAt)}`;
}
export function eventOccupiesDate(event: Pick<InstitutionalEvent, 'startsAt' | 'endsAt'>, date: string): boolean {
  const last = new Date(Math.max(Date.parse(event.startsAt), Date.parse(event.endsAt) - 1));
  return isDateKey(date) && date >= eventDateKey(event.startsAt) && date <= eventDateKey(last);
}
export function getEventState(event: InstitutionalEvent, now: Date): EventState {
  if (event.status === 'cancelled') return 'cancelled';
  if (now.getTime() >= Date.parse(event.endsAt)) return 'ended';
  return now.getTime() >= Date.parse(event.startsAt) ? 'in-progress' : 'upcoming';
}
export function registrationInfo(event: InstitutionalEvent, now: Date): { state: 'free' | 'open' | 'closed'; label: string; reason: string } {
  if (!event.requiresRegistration) return { state: 'free', label: 'No requiere inscripción', reason: '' };
  const state = getEventState(event, now);
  let reason = '';
  if (state === 'cancelled') reason = 'Evento cancelado';
  else if (state === 'ended') reason = 'El evento finalizó';
  else if (state === 'in-progress') reason = 'El evento ya comenzó';
  else if (!event.registrationDeadline || now.getTime() >= Date.parse(event.registrationDeadline)) reason = 'El plazo de inscripción terminó';
  else if (event.registrationClosed) reason = 'Cerrada por la organización';
  return reason ? { state: 'closed', label: 'Inscripciones cerradas', reason }
    : { state: 'open', label: 'Inscripciones abiertas', reason: '' };
}
export function canAddEvent(event: InstitutionalEvent, now: Date): boolean {
  return event.status !== 'cancelled' && now.getTime() < Date.parse(event.endsAt);
}
export function sortEvents(events: InstitutionalEvent[]): InstitutionalEvent[] {
  return [...events].sort((a, b) => a.startsAt.localeCompare(b.startsAt) || a.id.localeCompare(b.id));
}
export function eventScheduleChanged(saved: InstitutionalEvent, current: InstitutionalEvent): boolean {
  return saved.startsAt !== current.startsAt || saved.endsAt !== current.endsAt || saved.location !== current.location;
}
export function projectInterest(interest: EventInterest, catalog: EventCatalog | null) {
  const current = catalog?.events.find(e => e.id === interest.event.id);
  const changed = !!current && eventScheduleChanged(interest.event, current);
  return {
    interest, current, changed, unavailable: !!catalog && !current,
    event: current ? { ...current, startsAt: interest.event.startsAt, endsAt: interest.event.endsAt, location: interest.event.location } : interest.event,
  };
}
export function shiftDate(date: string, days: number): string {
  if (!isDateKey(date)) fail();
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}
export function monthCells(month: string): (string | null)[] {
  if (!isDateKey(`${month}-01`)) fail();
  const first = new Date(`${month}-01T12:00:00Z`);
  const offset = (first.getUTCDay() + 6) % 7;
  const next = new Date(first); next.setUTCMonth(next.getUTCMonth() + 1);
  const days = Math.round((next.getTime() - first.getTime()) / 86400000);
  return [...Array.from({ length: offset }, () => null), ...Array.from({ length: days }, (_, i) => shiftDate(`${month}-01`, i))];
}
export function shiftMonth(month: string, offset: number): string {
  if (!isDateKey(`${month}-01`)) fail();
  const date = new Date(`${month}-01T12:00:00Z`); date.setUTCMonth(date.getUTCMonth() + offset);
  return date.toISOString().slice(0, 7);
}

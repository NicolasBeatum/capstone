export const PLANNER_TIME_ZONE = 'America/Santiago';
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export interface Semester {
  id: string;
  name: string;
  startsOn: string | null;
  endsOn: string | null;
}
export interface ScheduleSubject {
  id: string;
  semesterId: string;
  name: string;
  code: string | null;
  section: string | null;
}
export interface WeeklyBlock {
  id: string;
  subjectId: string;
  weekday: number;
  startsAt: string;
  endsAt: string;
  room: string | null;
  teacher: string | null;
}
export interface ScheduleDocument {
  schema: 1;
  activeSemesterId: string | null;
  semesters: Semester[];
  subjects: ScheduleSubject[];
  blocks: WeeklyBlock[];
}
export function emptySchedule(): ScheduleDocument {
  return { schema: 1, activeSemesterId: null, semesters: [], subjects: [], blocks: [] };
}
export function invalid(message = 'La información del horario no es válida.'): never {
  throw new Error(message);
}
export function record(value: unknown, keys: string[]): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) invalid();
  const object = value as Record<string, unknown>;
  if (
    Object.keys(object).some((key) => !keys.includes(key)) || keys.some((key) => !(key in object))
  ) invalid();
  return object;
}
export function identifier(value: unknown): string {
  if (typeof value !== 'string' || !UUID.test(value)) invalid();
  return value.toLowerCase();
}
export function textField(value: unknown, max: number, optional = false): string | null {
  if (optional && (value === null || value === '')) return null;
  if (typeof value !== 'string' || /[\u0000-\u001f\u007f]/.test(value)) invalid();
  const text = value.trim();
  if (optional && !text) return null;
  if (!text || text.length > max) invalid(`Escribe un texto de entre 1 y ${max} caracteres.`);
  return text;
}
export function isDate(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number(value.slice(0, 4)) >= 1 && Number.isFinite(Date.parse(`${value}T12:00:00Z`)) &&
    new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) === value;
}
export function timeMinutes(value: unknown): number {
  if (typeof value !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) {
    invalid('Escribe una hora válida en formato HH:mm.');
  }
  return Number(value.slice(0, 2)) * 60 + Number(value.slice(3));
}
export function parseSemester(value: unknown): Semester {
  const v = record(value, ['id', 'name', 'startsOn', 'endsOn']);
  if (v.startsOn !== null && !isDate(v.startsOn) || v.endsOn !== null && !isDate(v.endsOn)) {
    invalid('Revisa las fechas del semestre.');
  }
  if (v.startsOn && v.endsOn && String(v.startsOn) > String(v.endsOn)) {
    invalid('El término no puede ser anterior al inicio.');
  }
  return {
    id: identifier(v.id),
    name: textField(v.name, 80)!,
    startsOn: v.startsOn as string | null,
    endsOn: v.endsOn as string | null,
  };
}
export function parseSubject(value: unknown): ScheduleSubject {
  const v = record(value, ['id', 'semesterId', 'name', 'code', 'section']);
  return {
    id: identifier(v.id),
    semesterId: identifier(v.semesterId),
    name: textField(v.name, 120)!,
    code: textField(v.code, 40, true),
    section: textField(v.section, 40, true),
  };
}
export function parseBlock(value: unknown): WeeklyBlock {
  const v = record(value, ['id', 'subjectId', 'weekday', 'startsAt', 'endsAt', 'room', 'teacher']);
  if (!Number.isInteger(v.weekday) || Number(v.weekday) < 1 || Number(v.weekday) > 7) {
    invalid('Selecciona un día de la semana.');
  }
  if (timeMinutes(v.startsAt) >= timeMinutes(v.endsAt)) {
    invalid('La hora de término debe ser posterior al inicio.');
  }
  return {
    id: identifier(v.id),
    subjectId: identifier(v.subjectId),
    weekday: Number(v.weekday),
    startsAt: v.startsAt as string,
    endsAt: v.endsAt as string,
    room: textField(v.room, 120, true),
    teacher: textField(v.teacher, 160, true),
  };
}
function items<T extends { id: string }>(
  value: unknown,
  max: number,
  parse: (value: unknown) => T,
): T[] {
  if (!Array.isArray(value) || value.length > max) {
    invalid('El horario supera el límite permitido.');
  }
  const rows = value.map(parse);
  if (new Set(rows.map((row) => row.id)).size !== rows.length) {
    invalid('Hay identificadores repetidos.');
  }
  return rows.sort((a, b) => a.id.localeCompare(b.id));
}
export function parseSchedule(value: unknown): ScheduleDocument {
  const v = record(value, ['schema', 'activeSemesterId', 'semesters', 'subjects', 'blocks']);
  if (v.schema !== 1 || new TextEncoder().encode(JSON.stringify(value)).length > 2 * 1024 * 1024) {
    invalid();
  }
  const semesters = items(v.semesters, 50, parseSemester),
    subjects = items(v.subjects, 1000, parseSubject),
    blocks = items(v.blocks, 10000, parseBlock);
  const activeSemesterId = v.activeSemesterId === null ? null : identifier(v.activeSemesterId);
  if (
    semesters.length ? !semesters.some((s) => s.id === activeSemesterId) : activeSemesterId !== null
  ) invalid('Selecciona un semestre activo.');
  if (
    subjects.some((s) => !semesters.some((semester) => semester.id === s.semesterId)) ||
    blocks.some((b) => !subjects.some((subject) => subject.id === b.subjectId))
  ) invalid('El ramo o semestre no pertenece a este horario.');
  const keys = blocks.map((b) => `${b.subjectId}/${b.weekday}/${b.startsAt}/${b.endsAt}`);
  if (new Set(keys).size !== keys.length) invalid('Ese bloque ya existe en el ramo.');
  return { schema: 1, activeSemesterId, semesters, subjects, blocks };
}
export function putSemester(document: ScheduleDocument, semester: Semester): ScheduleDocument {
  const row = parseSemester(semester);
  return parseSchedule({
    ...document,
    activeSemesterId: document.activeSemesterId ?? row.id,
    semesters: [...document.semesters.filter((s) => s.id !== row.id), row],
  });
}
export function activateSemester(document: ScheduleDocument, id: string): ScheduleDocument {
  return parseSchedule({ ...document, activeSemesterId: identifier(id) });
}
export function putSubject(document: ScheduleDocument, subject: ScheduleSubject): ScheduleDocument {
  const row = parseSubject(subject);
  return parseSchedule({
    ...document,
    subjects: [...document.subjects.filter((s) => s.id !== row.id), row],
  });
}
export function removeSubject(document: ScheduleDocument, id: string): ScheduleDocument {
  return parseSchedule({
    ...document,
    subjects: document.subjects.filter((s) => s.id !== id),
    blocks: document.blocks.filter((b) => b.subjectId !== id),
  });
}
export function sameSchedule(a: ScheduleDocument, b: ScheduleDocument): boolean {
  return JSON.stringify(parseSchedule(a)) === JSON.stringify(parseSchedule(b));
}

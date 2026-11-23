import { extractPdfText, type PdfText } from './pdfText.ts';

export type DuocTimetableErrorCode = 'too_large' | 'not_timetable' | 'unreadable';

const ERROR_MESSAGES: Record<DuocTimetableErrorCode, string> = {
  too_large: 'Ese archivo es muy grande para ser un boletín de Duoc.',
  not_timetable:
    'No pudimos leer este archivo. Descarga el boletín de carga académica desde el portal de Duoc e inténtalo de nuevo.',
  unreadable:
    'No pudimos leer este archivo. Descarga el boletín de carga académica desde el portal de Duoc e inténtalo de nuevo.',
};

/** Error de lectura. Su mensaje nunca incluye texto del archivo. */
export class DuocTimetableError extends Error {
  readonly code: DuocTimetableErrorCode;
  constructor(code: DuocTimetableErrorCode) {
    super(ERROR_MESSAGES[code]);
    this.name = 'DuocTimetableError';
    this.code = code;
  }
}

export interface ParsedSubject {
  key: string;
  code: string;
  section: string;
  name: string;
}
export interface ParsedBlock {
  subjectKey: string;
  weekday: number;
  startsAt: string;
  endsAt: string;
  room: string;
}
export interface ParsedSession {
  subjectKey: string;
  date: string;
  startsAt: string;
  endsAt: string;
  room: string;
}
export interface DuocTimetable {
  semesterName: string;
  subjects: ParsedSubject[];
  /** Clases semanales; no incluye las asignaturas con detalle de clases puntuales. */
  blocks: ParsedBlock[];
  /** Clases puntuales, ya unidas cuando son seguidas en el mismo día. */
  sessions: ParsedSession[];
}

export const MAX_TIMETABLE_BYTES = 2 * 1024 * 1024;
/** Recreo máximo entre dos módulos para considerarlos la misma clase. */
export const MAX_BREAK_MINUTES = 15;

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const COLUMN_TOLERANCE = 4;
const CELL = /^(.+?)\s*([A-Z]{3}\d{4})-(\d{3}[A-Z])\/([A-Z]{2})-(\S+)$/;
const DETAIL_KEY = /"([A-Z]{3}\d{4})-[A-Z]{3}\d{4}-(\d{3}[A-Z])-([^"]+)"/;
const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];
const CONNECTORS = new Set(['a', 'al', 'de', 'del', 'el', 'en', 'la', 'las', 'los', 'para', 'por', 'y', 'e', 'o', 'u', 'con']);
const ROMAN = /^(i|ii|iii|iv|v|vi|vii|viii|ix|x)$/;

function fail(code: DuocTimetableErrorCode): never {
  throw new DuocTimetableError(code);
}

function minutes(time: string): number {
  return Number(time.slice(0, 2)) * 60 + Number(time.slice(3));
}

function isTime(text: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(text);
}

function readingOrder(a: PdfText, b: PdfText): number {
  return a.page - b.page || a.y - b.y || a.x - b.x;
}

/** Une líneas de una celda; tras un guion final no va espacio («ASY6131-004D/PM-» + «W608»). */
function joinLines(texts: PdfText[]): string {
  return texts.reduce((out, t) => (!out || out.endsWith('-') ? out + t.text : `${out} ${t.text}`), '');
}

/** «SEGURIDAD EN SISTEMAS» → «Seguridad en Sistemas»; los números romanos quedan en mayúscula. */
export function readableName(value: string): string {
  return value.trim().toLocaleLowerCase('es').split(/\s+/).map((word, i) => {
    if (ROMAN.test(word)) return word.toUpperCase();
    if (i > 0 && CONNECTORS.has(word)) return word;
    return word.charAt(0).toLocaleUpperCase('es') + word.slice(1);
  }).join(' ');
}

function semesterName(texts: PdfText[]): string {
  const lines = new Map<string, PdfText[]>();
  for (const t of texts) {
    const key = `${t.page}/${t.y}`;
    lines.set(key, [...lines.get(key) ?? [], t]);
  }
  for (const line of lines.values()) {
    const text = line.sort((a, b) => a.x - b.x).map((t) => t.text).join(' ');
    const match = /\b([12])\s*(?:do|ro|er|ero|°|º)?\s*Sem\.?\s+(\d{4})\b/i.exec(text);
    if (match) return `${match[1] === '1' ? '1.er' : '2.º'} semestre ${match[2]}`;
  }
  return 'Horario Duoc';
}

interface Module {
  subjectKey: string;
  weekday: number;
  startsAt: string;
  endsAt: string;
  room: string;
}

interface Grid {
  modules: Module[];
  subjects: Map<string, ParsedSubject>;
  /** Encabezado de días de cada página, para descartar la cabecera repetida en el detalle. */
  headerTop: Map<number, number>;
}

function readGrid(pages: PdfText[][]): Grid {
  const cells = new Map<string, PdfText[]>();
  const rows: { start: string; end: string }[] = [];
  const headerTop = new Map<number, number>();
  let ended = false;
  for (const texts of pages) {
    const headers = DAYS.map((day) => texts.find((t) => t.text === day));
    if (headers.some((h) => !h)) continue;
    const first = headers[0]!, top = first.y, page = first.page;
    headerTop.set(page, top);
    if (ended) continue;
    const stop = texts.find((t) => t.text.startsWith('El Detalle'))?.y ?? Infinity;
    if (stop !== Infinity) ended = true;
    const labels = texts
      .filter((t) => t.x < first.x - COLUMN_TOLERANCE && t.y > top && t.y < stop && isTime(t.text))
      .sort((a, b) => a.y - b.y);
    if (labels.length % 2) fail('not_timetable');
    const pageRows: { index: number; top: number }[] = [];
    for (let i = 0; i < labels.length; i += 2) {
      const start = labels[i].text, end = labels[i + 1].text;
      if (minutes(start) >= minutes(end)) fail('not_timetable');
      pageRows.push({ index: rows.length, top: labels[i].y - 2 });
      rows.push({ start, end });
    }
    const previous = pageRows.length ? pageRows[0].index - 1 : rows.length - 1;
    for (const t of texts) {
      if (t.y <= top + 1 || t.y >= stop || t.x < first.x - COLUMN_TOLERANCE) continue;
      let column = 0;
      headers.forEach((h, i) => {
        if (t.x >= h!.x - COLUMN_TOLERANCE) column = i;
      });
      // Lo que queda sobre la primera hora de la página continúa una celda cortada.
      const row = [...pageRows].reverse().find((r) => t.y >= r.top)?.index ?? previous;
      if (row < 0) fail('not_timetable');
      const key = `${row}/${column}`;
      cells.set(key, [...cells.get(key) ?? [], t]);
    }
  }
  if (!headerTop.size) fail('not_timetable');
  const modules: Module[] = [], subjects = new Map<string, ParsedSubject>();
  for (const [key, texts] of cells) {
    const [row, column] = key.split('/').map(Number);
    const match = CELL.exec(joinLines(texts.sort(readingOrder)));
    if (!match) fail('not_timetable');
    const subjectKey = `${match[2]}-${match[3]}`;
    if (!subjects.has(subjectKey)) {
      subjects.set(subjectKey, {
        key: subjectKey, code: match[2], section: match[3], name: readableName(match[1]),
      });
    }
    modules.push({
      subjectKey, weekday: column + 1, startsAt: rows[row].start, endsAt: rows[row].end, room: match[5],
    });
  }
  return { modules, subjects, headerTop };
}

/** Une módulos seguidos de la misma clase separados por un recreo corto. */
function mergeConsecutive<T extends { startsAt: string; endsAt: string }>(
  items: T[],
  sameGroup: (a: T, b: T) => boolean,
  order: (a: T, b: T) => number,
): T[] {
  const merged: T[] = [];
  for (const item of [...items].sort((a, b) => order(a, b) || minutes(a.startsAt) - minutes(b.startsAt))) {
    const last = merged.at(-1);
    const gap = last ? minutes(item.startsAt) - minutes(last.endsAt) : -1;
    if (last && sameGroup(last, item) && gap >= 0 && gap <= MAX_BREAK_MINUTES) {
      merged[merged.length - 1] = { ...last, endsAt: item.endsAt };
    } else merged.push({ ...item });
  }
  return merged;
}

function parseDate(text: string): string | null {
  const match = /(\d{1,2})\s+de\s+([a-záéíóú]+)\s+de\s+(\d{4})/i.exec(text);
  if (!match) return null;
  const month = MONTHS.indexOf(match[2].toLocaleLowerCase('es')) + 1;
  if (!month) return null;
  const date = `${match[3]}-${String(month).padStart(2, '0')}-${match[1].padStart(2, '0')}`;
  const parsed = new Date(`${date}T12:00:00Z`);
  return Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date ? null : date;
}

function readDetails(pages: PdfText[][], grid: Grid): ParsedSession[] {
  const texts = pages.flat().sort(readingOrder);
  const start = texts.findIndex((t) => t.text.startsWith('El Detalle'));
  if (start < 0) return [];
  // En páginas siguientes se descarta la cabecera repetida (datos personales y días).
  const body = texts.slice(start).filter((t) =>
    t.page === texts[start].page || t.y > (grid.headerTop.get(t.page) ?? -Infinity) + 13
  );
  const sections: PdfText[][] = [];
  for (const t of body) {
    if (t.text.startsWith('El Detalle')) sections.push([]);
    sections.at(-1)!.push(t);
  }
  const sessions: ParsedSession[] = [];
  for (const section of sections) {
    const end = section.findIndex((t) => t.text.endsWith('es:'));
    const key = DETAIL_KEY.exec(joinLines(section.slice(0, end + 1)));
    if (end < 0 || !key) fail('not_timetable');
    const subjectKey = `${key[1]}-${key[2]}`;
    if (!grid.subjects.has(subjectKey)) {
      grid.subjects.set(subjectKey, {
        key: subjectKey, code: key[1], section: key[2], name: readableName(key[3]),
      });
    }
    const gridRoom = grid.modules.find((m) => m.subjectKey === subjectKey)?.room;
    const rows: PdfText[][] = [];
    for (const t of section.slice(end + 1)) {
      if (/^Clase\s+\d+$/.test(t.text)) rows.push([]);
      else rows.at(-1)?.push(t);
    }
    for (const row of rows) {
      const columns = new Map<number, PdfText[]>();
      for (const t of row) {
        const x = Math.round(t.x);
        columns.set(x, [...columns.get(x) ?? [], t]);
      }
      const values = [...columns.entries()].sort((a, b) => a[0] - b[0])
        .map(([, column]) => column.map((t) => t.text).join(' '));
      const timeAt = values.findIndex((v) => /^\d{2}:\d{2}\s+a\s+\d{2}:\d{2}$/.test(v));
      const date = timeAt > 0 ? parseDate(values.slice(0, timeAt).join(' ')) : null;
      if (!date) fail('not_timetable');
      const [startsAt, , endsAt] = values[timeAt].split(/\s+/);
      if (!isTime(startsAt) || !isTime(endsAt) || minutes(startsAt) >= minutes(endsAt)) {
        fail('not_timetable');
      }
      const room = gridRoom ?? values.slice(timeAt + 1).join(' ').replace(/\s*\(\d+\)$/, '').trim();
      sessions.push({ subjectKey, date, startsAt, endsAt, room });
    }
  }
  return mergeConsecutive(
    sessions,
    (a, b) => a.subjectKey === b.subjectKey && a.date === b.date,
    (a, b) => a.subjectKey.localeCompare(b.subjectKey) || a.date.localeCompare(b.date),
  );
}

/**
 * Lee el boletín de carga académica de Duoc. Ignora nombre, RUT y carrera: solo devuelve
 * semestre, ramos, bloques semanales y clases puntuales.
 */
export function parseDuocTimetable(bytes: Uint8Array): DuocTimetable {
  if (bytes.byteLength > MAX_TIMETABLE_BYTES) fail('too_large');
  if (String.fromCharCode(...bytes.subarray(0, 5)) !== '%PDF-') fail('unreadable');
  const texts = extractPdfText(bytes);
  if (!texts.length) fail('unreadable');
  const pages: PdfText[][] = [];
  for (const t of texts) (pages[t.page] ??= []).push(t);
  const grid = readGrid(pages);
  const sessions = readDetails(pages, grid);
  const punctual = new Set(sessions.map((s) => s.subjectKey));
  const blocks = mergeConsecutive(
    grid.modules.filter((m) => !punctual.has(m.subjectKey)),
    (a, b) => a.subjectKey === b.subjectKey && a.weekday === b.weekday && a.room === b.room,
    (a, b) => a.weekday - b.weekday || a.subjectKey.localeCompare(b.subjectKey) ||
      a.room.localeCompare(b.room),
  ).sort((a, b) => a.weekday - b.weekday || minutes(a.startsAt) - minutes(b.startsAt));
  if (!blocks.length && !sessions.length) fail('not_timetable');
  const subjects = [...grid.subjects.values()].sort((a, b) => a.name.localeCompare(b.name, 'es'));
  return { semesterName: semesterName(texts), subjects, blocks, sessions };
}

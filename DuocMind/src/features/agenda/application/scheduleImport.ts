import { savePersonalActivity } from '../../../shared/planner/application/personalActivities.ts';
import type { PlannerDocument } from '../../../shared/planner/application/plannerStore.ts';
import {
  activateSemester,
  invalid,
  putSemester,
  putSubject,
  removeSubject,
  type ScheduleDocument,
  type Semester,
} from '../../../shared/planner/domain/schedule.ts';
import { putBlock } from '../../../shared/planner/domain/weeklySchedule.ts';
import type { DuocTimetable } from '../domain/duocTimetable.ts';

/** Lo que la persona ajustó en la vista previa. */
export interface ImportSelection {
  semesterName: string;
  /** Nombre editado por clave de ramo (`CÓDIGO-SECCIÓN`). */
  subjectNames: Record<string, string>;
  /** Claves quitadas: de ramo, `blockKey(i)` o `sessionKey(i)`. */
  excluded: ReadonlySet<string>;
}

export type ImportMode = { kind: 'new' } | { kind: 'replace'; semesterId: string };

export const blockKey = (index: number) => `block:${index}`;
export const sessionKey = (index: number) => `session:${index}`;

const ACTIVITY_TITLE_MAX = 120;

function normalized(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toLocaleLowerCase('es');
}

export function findSameSemester(doc: ScheduleDocument, name: string): Semester | null {
  return doc.semesters.find((s) => normalized(s.name) === normalized(name)) ?? null;
}

/** Devuelve el nombre si está libre; si no, el primero libre entre «(2)», «(3)», etc. */
export function nextFreeSemesterName(doc: ScheduleDocument, name: string): string {
  const base = name.trim().replace(/\s+/g, ' ');
  if (!findSameSemester(doc, base)) return base;
  for (let n = 2; ; n += 1) {
    const candidate = `${base} (${n})`;
    if (!findSameSemester(doc, candidate)) return candidate;
  }
}

export function sessionTitle(subjectName: string, room: string): string {
  const title = room ? `${subjectName} · Sala ${room}` : subjectName;
  return title.length > ACTIVITY_TITLE_MAX ? title.slice(0, ACTIVITY_TITLE_MAX).trimEnd() : title;
}

/**
 * Construye la transformación que guarda el horario importado: semestre activo, ramos,
 * bloques semanales y una actividad por clase puntual. Reemplazar quita los ramos y
 * bloques del semestre elegido, pero conserva sus actividades.
 */
export function buildImport(
  parsed: DuocTimetable,
  selection: ImportSelection,
  mode: ImportMode,
  newId: () => string,
): (doc: PlannerDocument) => PlannerDocument {
  return (doc) => {
    const included = (key: string) => !selection.excluded.has(key);
    const blocks = parsed.blocks.filter((b, i) => included(blockKey(i)) && included(b.subjectKey));
    const sessions = parsed.sessions.filter((s, i) =>
      included(sessionKey(i)) && included(s.subjectKey)
    );
    if (!blocks.length && !sessions.length) invalid('Elige al menos una clase para importar.');

    let schedule = doc.schedule, semester: Semester;
    if (mode.kind === 'replace') {
      const existing = schedule.semesters.find((s) => s.id === mode.semesterId);
      if (!existing) invalid('Ese semestre no está disponible.');
      semester = existing;
      for (const subject of schedule.subjects.filter((s) => s.semesterId === existing.id)) {
        schedule = removeSubject(schedule, subject.id);
      }
    } else {
      semester = {
        id: newId(),
        name: nextFreeSemesterName(schedule, selection.semesterName),
        startsOn: null,
        endsOn: null,
      };
      schedule = putSemester(schedule, semester);
    }

    const subjectIds = new Map<string, string>(), names = new Map<string, string>();
    for (const subject of parsed.subjects) {
      if (!included(subject.key)) continue;
      const used = [...blocks, ...sessions].some((item) => item.subjectKey === subject.key);
      if (!used) continue;
      const id = newId(), name = selection.subjectNames[subject.key]?.trim() || subject.name;
      subjectIds.set(subject.key, id);
      names.set(subject.key, name);
      schedule = putSubject(schedule, {
        id, semesterId: semester.id, name, code: subject.code, section: subject.section,
      });
    }
    for (const block of blocks) {
      schedule = putBlock(schedule, {
        id: newId(),
        subjectId: subjectIds.get(block.subjectKey)!,
        weekday: block.weekday,
        startsAt: block.startsAt,
        endsAt: block.endsAt,
        room: block.room || null,
        teacher: null,
      }, true);
    }
    schedule = activateSemester(schedule, semester.id);

    let next: PlannerDocument = { ...doc, schedule };
    for (const session of sessions) {
      const subjectName = names.get(session.subjectKey)!;
      next = savePersonalActivity(next, {
        id: newId(),
        kind: 'personal',
        date: session.date,
        time: session.startsAt,
        endTime: session.endsAt,
        title: sessionTitle(subjectName, session.room),
        subjectName,
        semesterId: semester.id,
        semesterName: semester.name,
        version: 1,
      });
    }
    return next;
  };
}

export interface AgendaSubject {
  id: string;
  name: string;
  code: string;
}

export interface SubjectOption {
  key: string;
  label: string;
  /** Texto que se guarda en la actividad. */
  value: string;
}

const MAX_SUBJECTS = 100;
const MAX_NAME = 120;
const MAX_CODE = 40;

function fail(): never {
  throw new Error('La información de asignaturas no es válida.');
}

/** Valida en el límite los datos que llegan del backend o de la copia local. */
export function parseSubjects(value: unknown): AgendaSubject[] {
  if (!Array.isArray(value) || value.length > MAX_SUBJECTS) fail();
  const seen = new Set<string>();
  const subjects: AgendaSubject[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) fail();
    const { id, name, code } = item as Record<string, unknown>;
    if (typeof id !== 'string' || !id.trim() ||
        typeof name !== 'string' || !name.trim() || name.length > MAX_NAME ||
        typeof code !== 'string' || !code.trim() || code.length > MAX_CODE) fail();
    if (seen.has(id)) continue;
    seen.add(id);
    subjects.push({ id, name: name.trim(), code: code.trim() });
  }
  return subjects;
}

/** Opciones ordenadas por nombre; el código solo aparece cuando dos asignaturas comparten nombre. */
export function subjectOptions(subjects: AgendaSubject[]): SubjectOption[] {
  const nameCount = new Map<string, number>();
  for (const subject of subjects) nameCount.set(subject.name, (nameCount.get(subject.name) ?? 0) + 1);
  return [...subjects]
    .sort((a, b) => a.name.localeCompare(b.name, 'es') || a.code.localeCompare(b.code, 'es'))
    .map((subject) => ({
      key: subject.id,
      label: (nameCount.get(subject.name) ?? 0) > 1 ? `${subject.name} (${subject.code})` : subject.name,
      value: subject.name,
    }));
}

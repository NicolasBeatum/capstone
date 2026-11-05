export interface Career {
  id: string;
  name: string;
}

export interface SelectOption {
  key: string;
  label: string;
}

export interface AcademicSelection {
  careerId: string | null;
  semester: number | null;
}

const MAX_ITEMS = 1000;
const MAX_NAME = 160;

/** Semestres que ofrece el registro: del 1 al 13. */
export const SEMESTERS: readonly number[] = Array.from({ length: 13 }, (_, index) => index + 1);

function fail(): never {
  throw new Error('La información de carreras no es válida.');
}

function readRows(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value) || value.length > MAX_ITEMS) fail();
  return value.map((item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) fail();
    return item as Record<string, unknown>;
  });
}

function readId(value: unknown): string {
  if (typeof value === 'number' && Number.isSafeInteger(value) && value > 0) return String(value);
  if (typeof value === 'string' && /^\d+$/.test(value)) return value;
  return fail();
}

function readName(value: unknown): string {
  if (typeof value !== 'string' || !value.trim() || value.length > MAX_NAME) fail();
  return value.trim();
}

/** Valida en el límite las carreras que llegan del backend. */
export function parseCareers(value: unknown): Career[] {
  return readRows(value).map((row) => ({
    id: readId(row.id_carrera),
    name: readName(row.nombre_carrera),
  }));
}

function byName(a: { name: string }, b: { name: string }): number {
  return a.name.localeCompare(b.name, 'es');
}

/** Carreras ordenadas por nombre. */
export function careerOptions(careers: Career[]): SelectOption[] {
  return [...careers]
    .sort(byName)
    .map((career) => ({ key: career.id, label: career.name }));
}

export function semesterOptions(): SelectOption[] {
  return SEMESTERS.map((semester) => ({ key: String(semester), label: `Semestre ${semester}` }));
}

/** Mensaje en español de lo que falta elegir, o null si la selección está completa y es coherente. */
export function validateAcademicSelection(selection: AcademicSelection, careers: Career[]): string | null {
  if (!selection.careerId) return 'Elige tu carrera para continuar.';
  const career = careers.find((item) => item.id === selection.careerId);
  if (!career) return 'Elige una carrera válida.';
  if (selection.semester === null) return 'Elige tu semestre para continuar.';
  if (!SEMESTERS.includes(selection.semester)) return 'Elige un semestre válido.';
  return null;
}

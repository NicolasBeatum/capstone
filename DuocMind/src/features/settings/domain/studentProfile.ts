/** Datos del estudiante que se muestran en «Mi perfil». Los ausentes quedan en null. */
export interface StudentProfileDetails {
  fullName: string;
  /** Primer y segundo nombre, para editarlos juntos. */
  names: string;
  /** Primer y segundo apellido, para editarlos juntos. */
  surnames: string;
  email: string | null;
  phone: string | null;
  career: string | null;
  rut: string | null;
}

export const MISSING_VALUE = 'No registrado';

const MAX_TEXT = 200;

function readText(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  return text && text.length <= MAX_TEXT ? text : null;
}

/** Nombre de la carrera vigente, venga como objeto o como lista de una fila embebida. */
export function parseCareerName(row: unknown): string | null {
  if (!row || typeof row !== 'object' || Array.isArray(row)) return null;
  const career = (row as { carrera?: unknown }).carrera;
  const record = Array.isArray(career) ? career[0] : career;
  if (!record || typeof record !== 'object') return null;
  return readText((record as { nombre_carrera?: unknown }).nombre_carrera);
}

/** Valida en el límite la fila del estudiante; sin nombre ni apellido no hay perfil que mostrar. */
export function parseStudentProfile(
  row: unknown,
  career: string | null,
  sessionEmail: string | null,
): StudentProfileDetails | null {
  if (!row || typeof row !== 'object' || Array.isArray(row)) return null;
  const data = row as Record<string, unknown>;
  const joinParts = (...parts: unknown[]) =>
    parts
      .map(readText)
      .filter((part): part is string => part !== null)
      .join(' ');
  const names = joinParts(data.primer_nombre, data.segundo_nombre);
  const surnames = joinParts(data.primer_apellido, data.segundo_apellido);
  const fullName = joinParts(names, surnames);
  if (!fullName) return null;
  return {
    fullName,
    names,
    surnames,
    // El correo de la cuenta de acceso manda sobre el copiado en el perfil.
    email: readText(sessionEmail) ?? readText(data.correo),
    phone: readText(data.numero_telefonico),
    career,
    rut: readText(data.rut),
  };
}

/** Texto para mostrar un dato que puede faltar. */
export function displayValue(value: string | null): string {
  return value ?? MISSING_VALUE;
}

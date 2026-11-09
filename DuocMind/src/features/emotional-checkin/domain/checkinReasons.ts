/** Motivo que la persona puede asociar a su check-in; viene de la tabla `motivo`. */
export interface CheckinReason {
  id: number;
  name: string;
}

interface ReasonRow {
  id: number;
  name: string;
  order: number;
  active: boolean;
}

function parseRow(value: unknown): ReasonRow | null {
  if (typeof value !== 'object' || value === null) return null;
  const row = value as Record<string, unknown>;
  const { id_motivo: id, nombre_motivo: name, orden: order, activo: active } = row;
  if (typeof id !== 'number' || !Number.isSafeInteger(id) || id <= 0) return null;
  if (typeof name !== 'string' || name.trim().length === 0) return null;
  return {
    id,
    name: name.trim(),
    order: typeof order === 'number' && Number.isFinite(order) ? order : 0,
    // Si la columna no viene, se asume activo, como su valor por defecto en la base.
    active: active !== false,
  };
}

/**
 * Valida las filas de `motivo` y devuelve solo los activos, por `orden` y nombre.
 * Si la respuesta no es una lista o alguna fila no tiene la forma esperada, devuelve null
 * para que no reemplace una copia local válida.
 */
export function parseReasonCatalog(raw: unknown): CheckinReason[] | null {
  if (!Array.isArray(raw)) return null;
  const rows: ReasonRow[] = [];
  const seen = new Set<number>();
  for (const value of raw) {
    const row = parseRow(value);
    if (!row) return null;
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    rows.push(row);
  }
  return rows
    .filter((row) => row.active)
    .sort((left, right) => left.order - right.order || left.name.localeCompare(right.name, 'es'))
    .map(({ id, name }) => ({ id, name }));
}

/** Agrega el motivo si no estaba elegido o lo quita si ya lo estaba. */
export function toggleReason(selected: readonly number[], id: number): number[] {
  return selected.includes(id) ? selected.filter((value) => value !== id) : [...selected, id];
}

/**
 * Indica si falta elegir un motivo antes de registrar. Es obligatorio elegir al menos uno
 * de los mostrados; si no hay catálogo (primera vez sin conexión) no se bloquea el registro.
 */
export function requiresReason(reasons: readonly CheckinReason[], selectedIds: readonly number[]): boolean {
  if (reasons.length === 0) return false;
  return !selectedIds.some((id) => reasons.some((reason) => reason.id === id));
}

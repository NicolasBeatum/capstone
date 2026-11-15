/** `data`: check-in, motivos y tests subidos (7 días). `account`: cuenta completa (30 días). */
export type DeletionKind = 'data' | 'account';

/** Fecha ISO en que se ejecuta cada solicitud pendiente; null si no hay. */
export interface DeletionStatus {
  data: string | null;
  account: string | null;
}

export const NO_PENDING_DELETION: DeletionStatus = { data: null, account: null };

/** Días que espera cada solicitud antes de ejecutarse; el servidor aplica los mismos. */
export const DELETION_DELAY_DAYS: Record<DeletionKind, number> = { data: 7, account: 30 };

export interface DeletionGateway {
  /** Solicitudes pendientes de la cuenta con sesión. Lanza si no se pudo consultar. */
  status(): Promise<DeletionStatus>;
  /** Pide la eliminación y devuelve cuándo se ejecuta; si ya estaba pedida, la fecha original. */
  request(kind: DeletionKind): Promise<string>;
  cancel(kind: DeletionKind): Promise<void>;
}

const SERVER_KIND: Record<DeletionKind, string> = { data: 'datos', account: 'cuenta' };

export function serverDeletionKind(kind: DeletionKind): string {
  return SERVER_KIND[kind];
}

/** Valida las filas de `solicitud_eliminacion`; ignora lo que no reconoce. */
export function parseDeletionStatus(rows: unknown): DeletionStatus {
  if (!Array.isArray(rows)) throw new Error('Respuesta de eliminación no válida.');
  const status: DeletionStatus = { ...NO_PENDING_DELETION };
  for (const row of rows) {
    if (!row || typeof row !== 'object') continue;
    const { tipo, ejecutar_en } = row as Record<string, unknown>;
    if (typeof ejecutar_en !== 'string' || Number.isNaN(Date.parse(ejecutar_en))) continue;
    if (tipo === 'datos') status.data = ejecutar_en;
    if (tipo === 'cuenta') status.account = ejecutar_en;
  }
  return status;
}

const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

/** «22 de noviembre» en la hora de Chile del dispositivo. */
export function formatDeletionDate(iso: string): string {
  const date = new Date(iso);
  return `${date.getDate()} de ${MONTHS[date.getMonth()]}`;
}

export interface AccountDeletionSteps {
  requestRemote(): Promise<string>;
  /** Anota en el dispositivo cuándo borrar sus datos locales. */
  rememberLocally(executesAt: string): Promise<void>;
  clearLocalSession(): Promise<void>;
}

/**
 * Programa la eliminación de la cuenta. Primero se registra en el servidor: si falla, no se
 * toca nada del dispositivo. Después se anota la fecha en el dispositivo y se cierra la sesión.
 * Los datos locales se conservan sin enviarse para que cancelar devuelva todo, incluido el
 * horario, que solo existe en el teléfono; se borran al abrir la app después del plazo.
 */
export async function scheduleAccountDeletion(steps: AccountDeletionSteps): Promise<string> {
  const executesAt = await steps.requestRemote();
  await steps.rememberLocally(executesAt);
  await steps.clearLocalSession();
  return executesAt;
}

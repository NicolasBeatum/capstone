import type { CheckinReason } from '../domain/checkinReasons';

export type CheckinMood = 'Muy mal' | 'Mal' | 'Neutro' | 'Bien' | 'Muy bien';
export type CheckinSyncStatus = 'pending' | 'synced';

export interface LocalCheckin {
  clientRequestId: string;
  mood: CheckinMood;
  createdAt: string;
  syncStatus: CheckinSyncStatus;
  /** IDs de `motivo` elegidos al registrar; vacío si no se eligió ninguno. */
  reasonIds: number[];
}

/** Datos para guardar un check-in; los motivos son opcionales. */
export type NewLocalCheckin = Omit<LocalCheckin, 'syncStatus' | 'reasonIds'> & { reasonIds?: number[] };

export interface CheckinDatabase {
  execAsync(source: string): Promise<void>;
  runAsync(source: string, ...params: (string | number | null)[]): Promise<unknown>;
  getAllAsync<T>(source: string, ...params: (string | number | null)[]): Promise<T[]>;
  closeAsync?(): Promise<void>;
}

// Las tablas de motivos se crean con IF NOT EXISTS: en bases antiguas aparecen vacías
// y los check-ins pendientes previos se sincronizan sin motivos.
const CREATE_TABLES = `
  CREATE TABLE IF NOT EXISTS emotional_checkins (
    client_request_id TEXT PRIMARY KEY NOT NULL,
    mood TEXT NOT NULL CHECK (mood IN ('Muy mal', 'Mal', 'Neutro', 'Bien', 'Muy bien')),
    created_at TEXT NOT NULL,
    sync_status TEXT NOT NULL CHECK (sync_status IN ('pending', 'synced'))
  );
  CREATE INDEX IF NOT EXISTS emotional_checkins_created_at_idx
  ON emotional_checkins(created_at DESC);
  CREATE TABLE IF NOT EXISTS emotional_checkin_reasons (
    client_request_id TEXT NOT NULL,
    reason_id INTEGER NOT NULL,
    PRIMARY KEY (client_request_id, reason_id)
  );
  CREATE TABLE IF NOT EXISTS reason_catalog (
    id INTEGER PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    position INTEGER NOT NULL
  );
`;

type CheckinRow = Omit<LocalCheckin, 'reasonIds'>;

interface ReasonLinkRow {
  clientRequestId: string;
  reasonId: number;
}

export class LocalCheckinStore {
  private readonly database: CheckinDatabase;

  constructor(database: CheckinDatabase) {
    this.database = database;
  }

  async initialize(): Promise<void> {
    await this.database.execAsync(CREATE_TABLES);
  }

  private async inTransaction(work: () => Promise<void>): Promise<void> {
    await this.database.execAsync('BEGIN');
    try {
      await work();
      await this.database.execAsync('COMMIT');
    } catch (error) {
      await this.database.execAsync('ROLLBACK');
      throw error;
    }
  }

  private async withReasons(rows: CheckinRow[]): Promise<LocalCheckin[]> {
    const links = await this.database.getAllAsync<ReasonLinkRow>(
      `SELECT client_request_id AS clientRequestId, reason_id AS reasonId
       FROM emotional_checkin_reasons
       ORDER BY reason_id ASC`,
    );
    const byCheckin = new Map<string, number[]>();
    for (const link of links) {
      const ids = byCheckin.get(link.clientRequestId) ?? [];
      ids.push(Number(link.reasonId));
      byCheckin.set(link.clientRequestId, ids);
    }
    return rows.map((row) => ({ ...row, reasonIds: byCheckin.get(row.clientRequestId) ?? [] }));
  }

  /** Guarda el check-in y sus motivos juntos: o quedan los dos o ninguno. */
  async savePending(checkin: NewLocalCheckin): Promise<void> {
    const reasonIds = [...new Set(checkin.reasonIds ?? [])];
    await this.inTransaction(async () => {
      await this.database.runAsync(
        `INSERT INTO emotional_checkins (client_request_id, mood, created_at, sync_status)
         VALUES (?, ?, ?, 'pending')
         ON CONFLICT(client_request_id) DO NOTHING`,
        checkin.clientRequestId,
        checkin.mood,
        checkin.createdAt,
      );
      for (const reasonId of reasonIds) {
        await this.database.runAsync(
          `INSERT INTO emotional_checkin_reasons (client_request_id, reason_id)
           VALUES (?, ?)
           ON CONFLICT(client_request_id, reason_id) DO NOTHING`,
          checkin.clientRequestId,
          reasonId,
        );
      }
    });
  }

  async listAll(): Promise<LocalCheckin[]> {
    const rows = await this.database.getAllAsync<CheckinRow>(
      `SELECT client_request_id AS clientRequestId,
              mood,
              created_at AS createdAt,
              sync_status AS syncStatus
       FROM emotional_checkins
       ORDER BY created_at DESC`,
    );
    return this.withReasons(rows);
  }

  async listPending(): Promise<LocalCheckin[]> {
    const rows = await this.database.getAllAsync<CheckinRow>(
      `SELECT client_request_id AS clientRequestId,
              mood,
              created_at AS createdAt,
              sync_status AS syncStatus
       FROM emotional_checkins
       WHERE sync_status = 'pending'
       ORDER BY created_at ASC`,
    );
    return this.withReasons(rows);
  }

  async markSynced(clientRequestId: string): Promise<void> {
    await this.database.runAsync(
      `UPDATE emotional_checkins SET sync_status = 'synced' WHERE client_request_id = ?`,
      clientRequestId,
    );
  }

  async remove(clientRequestId: string): Promise<void> {
    await this.inTransaction(async () => {
      await this.database.runAsync(
        `DELETE FROM emotional_checkin_reasons WHERE client_request_id = ?`,
        clientRequestId,
      );
      await this.database.runAsync(
        `DELETE FROM emotional_checkins WHERE client_request_id = ?`,
        clientRequestId,
      );
    });
  }

  /** Reemplaza la copia local del catálogo por la última descarga válida. */
  async saveReasonCatalog(reasons: readonly CheckinReason[]): Promise<void> {
    await this.inTransaction(async () => {
      await this.database.runAsync(`DELETE FROM reason_catalog`);
      for (const [position, reason] of reasons.entries()) {
        await this.database.runAsync(
          `INSERT INTO reason_catalog (id, name, position) VALUES (?, ?, ?)`,
          reason.id,
          reason.name,
          position,
        );
      }
    });
  }

  async listReasonCatalog(): Promise<CheckinReason[]> {
    const rows = await this.database.getAllAsync<CheckinReason>(
      `SELECT id, name FROM reason_catalog ORDER BY position ASC`,
    );
    return rows.map((row) => ({ id: Number(row.id), name: row.name }));
  }

  async close(): Promise<void> {
    await this.database.closeAsync?.();
  }
}

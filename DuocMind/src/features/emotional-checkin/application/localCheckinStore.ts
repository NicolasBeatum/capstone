import type { SQLiteDatabase } from 'expo-sqlite';

export type CheckinMood = 'Muy mal' | 'Mal' | 'Neutro' | 'Bien' | 'Muy bien';
export type CheckinSyncStatus = 'pending' | 'synced';

export interface LocalCheckin {
  clientRequestId: string;
  mood: CheckinMood;
  createdAt: string;
  syncStatus: CheckinSyncStatus;
}

export interface CheckinDatabase {
  execAsync(source: string): Promise<void>;
  runAsync(source: string, ...params: (string | number | null)[]): Promise<unknown>;
  getAllAsync<T>(source: string, ...params: (string | number | null)[]): Promise<T[]>;
  closeAsync?(): Promise<void>;
}

const CREATE_CHECKINS_TABLE = `
  CREATE TABLE IF NOT EXISTS emotional_checkins (
    client_request_id TEXT PRIMARY KEY NOT NULL,
    mood TEXT NOT NULL CHECK (mood IN ('Muy mal', 'Mal', 'Neutro', 'Bien', 'Muy bien')),
    created_at TEXT NOT NULL,
    sync_status TEXT NOT NULL CHECK (sync_status IN ('pending', 'synced'))
  );
  CREATE INDEX IF NOT EXISTS emotional_checkins_created_at_idx
  ON emotional_checkins(created_at DESC);
`;

export class LocalCheckinStore {
  private readonly database: CheckinDatabase;

  constructor(database: CheckinDatabase) {
    this.database = database;
  }

  async initialize(): Promise<void> {
    await this.database.execAsync(CREATE_CHECKINS_TABLE);
  }

  async savePending(checkin: Omit<LocalCheckin, 'syncStatus'>): Promise<void> {
    await this.database.runAsync(
      `INSERT INTO emotional_checkins (client_request_id, mood, created_at, sync_status)
       VALUES (?, ?, ?, 'pending')
       ON CONFLICT(client_request_id) DO NOTHING`,
      checkin.clientRequestId,
      checkin.mood,
      checkin.createdAt,
    );
  }

  async listAll(): Promise<LocalCheckin[]> {
    return this.database.getAllAsync<LocalCheckin>(
      `SELECT client_request_id AS clientRequestId,
              mood,
              created_at AS createdAt,
              sync_status AS syncStatus
       FROM emotional_checkins
       ORDER BY created_at DESC`,
    );
  }

  async listPending(): Promise<LocalCheckin[]> {
    return this.database.getAllAsync<LocalCheckin>(
      `SELECT client_request_id AS clientRequestId,
              mood,
              created_at AS createdAt,
              sync_status AS syncStatus
       FROM emotional_checkins
       WHERE sync_status = 'pending'
       ORDER BY created_at ASC`,
    );
  }

  async markSynced(clientRequestId: string): Promise<void> {
    await this.database.runAsync(
      `UPDATE emotional_checkins SET sync_status = 'synced' WHERE client_request_id = ?`,
      clientRequestId,
    );
  }

  async remove(clientRequestId: string): Promise<void> {
    await this.database.runAsync(
      `DELETE FROM emotional_checkins WHERE client_request_id = ?`,
      clientRequestId,
    );
  }

  async close(): Promise<void> {
    await this.database.closeAsync?.();
  }
}
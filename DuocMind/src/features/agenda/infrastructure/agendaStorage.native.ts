import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';
import type { AgendaActivity } from '../domain/agendaActivity';

const DATABASE_NAME = 'duocmind-agenda.db';
let databasePromise: Promise<SQLiteDatabase> | undefined;

async function getDatabase(): Promise<SQLiteDatabase> {
  if (!databasePromise) {
    databasePromise = openDatabaseAsync(DATABASE_NAME).then(async (database) => {
      await database.execAsync(`
        CREATE TABLE IF NOT EXISTS agenda_activities (
          id TEXT PRIMARY KEY NOT NULL,
          date TEXT NOT NULL,
          title TEXT NOT NULL,
          subject TEXT NOT NULL,
          time TEXT NOT NULL
        );
      `);
      return database;
    }).catch((error: unknown) => {
      databasePromise = undefined;
      throw error;
    });
  }
  return databasePromise;
}

export async function getAgendaActivities(): Promise<AgendaActivity[]> {
  const database = await getDatabase();
  return database.getAllAsync<AgendaActivity>(
    `SELECT id, date, title, subject, time
     FROM agenda_activities
     ORDER BY date ASC, time ASC`,
  );
}

export async function saveAgendaActivity(activity: AgendaActivity): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT INTO agenda_activities (id, date, title, subject, time)
     VALUES (?, ?, ?, ?, ?)`,
    activity.id,
    activity.date,
    activity.title,
    activity.subject,
    activity.time,
  );
}

export async function deleteAgendaActivity(id: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM agenda_activities WHERE id = ?', id);
}

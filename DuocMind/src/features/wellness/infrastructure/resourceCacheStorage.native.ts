import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';
import type { ResourceCache } from '../application/resourceCatalog';
import { decodeCacheDocument, encodeCacheDocument } from './resourceCacheDocument';

/* El catálogo es público y sin datos personales: va en SQLite sin cifrar y sin asociarse a una
 * cuenta. No usa SecureStore, que limita cada valor a unos 2 KB. */
const DATABASE_NAME = 'duocmind-wellness-resources.db';

let opening: Promise<SQLiteDatabase> | null = null;

function openDatabase(): Promise<SQLiteDatabase> {
  opening ??= (async () => {
    const database = await openDatabaseAsync(DATABASE_NAME);
    try {
      await database.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS resource_catalog (
          id INTEGER PRIMARY KEY NOT NULL CHECK (id = 1),
          payload TEXT NOT NULL,
          fetched_at TEXT NOT NULL
        );
      `);
    } catch (error) {
      await database.closeAsync();
      throw error;
    }
    return database;
  })().catch((error: unknown) => {
    opening = null;
    throw error;
  });
  return opening;
}

export const resourceCache: ResourceCache = {
  async read() {
    try {
      const database = await openDatabase();
      const row = await database.getFirstAsync<{ payload: string }>(
        'SELECT payload FROM resource_catalog WHERE id = 1',
      );
      return row ? decodeCacheDocument(row.payload) : null;
    } catch {
      // Una base ilegible se trata como copia inexistente.
      return null;
    }
  },

  async write(catalog, fetchedAt) {
    const database = await openDatabase();
    const payload = encodeCacheDocument(catalog, fetchedAt);
    await database.withExclusiveTransactionAsync(async (transaction) => {
      await transaction.runAsync(
        'INSERT OR REPLACE INTO resource_catalog (id, payload, fetched_at) VALUES (1, ?, ?)',
        payload,
        fetchedAt,
      );
    });
  },
};

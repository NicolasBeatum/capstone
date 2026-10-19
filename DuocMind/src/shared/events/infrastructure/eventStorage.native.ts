import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { deleteDatabaseAsync, openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';
import { EventStore, parseEventDocument, type EventDocument, type EventPersistence } from '../application/eventStore';
import { UUID_PATTERN } from '../domain/institutionalEvent';
const stores = new Map<string, Promise<EventStore>>();
const databaseName = (id: string) => `duocmind-events-${id}.db`;
const keyName = (id: string) => `duocmind.events.sqlcipher.key.v1.${id}`;
async function openStore(userId: string): Promise<EventStore> {
  const storedKey = await SecureStore.getItemAsync(keyName(userId));
  const key = storedKey ?? Array.from(Crypto.getRandomBytes(32), b => b.toString(16).padStart(2, '0')).join('');
  if (!/^[a-f0-9]{64}$/i.test(key)) throw new Error('No se pudo leer la clave del almacenamiento cifrado.');
  const db = await openDatabaseAsync(databaseName(userId));
  try {
    const cipher = await db.getFirstAsync<{ cipher_version: string }>('PRAGMA cipher_version;');
    if (!cipher?.cipher_version) throw new Error('Eventos requiere un development build Android con SQLCipher.');
    await db.execAsync(`PRAGMA key = "x'${key}'";`);
    // Sin una clave válida, falla antes de modificar una base existente.
    await db.getFirstAsync('SELECT count(*) FROM sqlite_master;');
    if (!storedKey) await SecureStore.setItemAsync(keyName(userId), key);
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS event_catalog (id TEXT PRIMARY KEY NOT NULL, content TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS event_catalog_meta (id INTEGER PRIMARY KEY CHECK(id=1), server_time TEXT NOT NULL, downloaded_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS event_interests (id TEXT PRIMARY KEY NOT NULL, content TEXT NOT NULL);
    `);
  } catch (error) { await db.closeAsync(); throw error; }
  let closed = false, deleted = false;
  const persistence: EventPersistence = {
    async read() {
      const meta = await db.getFirstAsync<{ server_time: string; downloaded_at: string }>('SELECT server_time,downloaded_at FROM event_catalog_meta WHERE id=1');
      const events = await db.getAllAsync<{ content: string }>('SELECT content FROM event_catalog');
      const interests = await db.getAllAsync<{ content: string }>('SELECT content FROM event_interests');
      return parseEventDocument({ schema: 1, catalog: meta ? { serverTime: meta.server_time, events: events.map(e => JSON.parse(e.content)) } : null,
        downloadedAt: meta?.downloaded_at ?? null, interests: interests.map(i => JSON.parse(i.content)) });
    },
    async write(document: EventDocument, scope) {
      const doc = parseEventDocument(document);
      await db.withExclusiveTransactionAsync(async (transaction: SQLiteDatabase) => {
        if (scope === 'catalog' && doc.catalog && doc.downloadedAt) {
          await transaction.runAsync('DELETE FROM event_catalog');
          for (const event of doc.catalog.events) await transaction.runAsync('INSERT INTO event_catalog(id,content) VALUES(?,?)', event.id, JSON.stringify(event));
          await transaction.runAsync('INSERT OR REPLACE INTO event_catalog_meta(id,server_time,downloaded_at) VALUES(1,?,?)', doc.catalog.serverTime, doc.downloadedAt);
        } else if (scope === 'interests') {
          await transaction.runAsync('DELETE FROM event_interests');
          for (const interest of doc.interests) await transaction.runAsync('INSERT INTO event_interests(id,content) VALUES(?,?)', interest.event.id, JSON.stringify(interest));
        }
      });
    },
    async remove() {
      if (!closed) { await db.closeAsync(); closed = true; }
      if (!deleted) { await deleteDatabaseAsync(databaseName(userId)); deleted = true; }
      await SecureStore.deleteItemAsync(keyName(userId));
    },
  };
  return new EventStore(persistence);
}
export function getEventStore(userId: string): Promise<EventStore> {
  if (!UUID_PATTERN.test(userId)) return Promise.reject(new Error('No se pudo identificar la cuenta.'));
  let promise = stores.get(userId);
  if (!promise) {
    promise = openStore(userId).catch((error: unknown) => { stores.delete(userId); throw error; });
    stores.set(userId, promise);
  }
  return promise;
}
export async function deleteEventData(userId: string): Promise<void> {
  if (!UUID_PATTERN.test(userId)) throw new Error('No se pudo identificar la cuenta.');
  const pending = stores.get(userId);
  if (pending) await (await pending).destroy();
  else {
    try { await deleteDatabaseAsync(databaseName(userId)); }
    catch (error) {
      if (!error || typeof error !== 'object' || !('code' in error) || error.code !== 'ERR_DATABASE_NOT_FOUND') throw error;
    }
    await SecureStore.deleteItemAsync(keyName(userId));
  }
  stores.delete(userId);
}

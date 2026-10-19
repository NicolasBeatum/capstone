import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { deleteDatabaseAsync, openDatabaseAsync } from 'expo-sqlite';
import { PlannerStore } from '../application/plannerStore';
import { identifier } from '../domain/schedule';
import { createPlannerSqlitePersistence, unlockPlannerDatabase } from './plannerSqlite';
const stores = new Map<string, Promise<PlannerStore>>();
const databaseName = (id: string) => `duocmind-planner-${id}.db`;
const keyName = (id: string) => `duocmind.planner.key.v1.${id}`;
async function openStore(id: string): Promise<PlannerStore> {
  const stored = await SecureStore.getItemAsync(keyName(id));
  const key = stored ??
    Array.from(Crypto.getRandomBytes(32), (b) => b.toString(16).padStart(2, '0')).join('');
  const db = await openDatabaseAsync(databaseName(id));
  try {
    await unlockPlannerDatabase(db, key);
    if (!stored) await SecureStore.setItemAsync(keyName(id), key);
    await db.execAsync('PRAGMA journal_mode = WAL;');
    let closed = false, deleted = false;
    const persistence = await createPlannerSqlitePersistence(db, async () => {
      if (!closed) {
        await db.closeAsync();
        closed = true;
      }
      if (!deleted) {
        await deleteDatabaseAsync(databaseName(id));
        deleted = true;
      }
      await SecureStore.deleteItemAsync(keyName(id));
    }, async () => {
      if (!closed) {
        await db.closeAsync();
        closed = true;
      }
    });
    return new PlannerStore(persistence);
  } catch (error) {
    await db.closeAsync();
    if (
      error instanceof Error &&
      error.message === 'El horario necesita un development build Android con SQLCipher.'
    ) throw error;
    throw new Error('No se pudo abrir tu almacenamiento cifrado. La copia existente se conserva.');
  }
}
export function getPlannerStore(userId: string): Promise<PlannerStore> {
  const id = identifier(userId);
  let promise = stores.get(id);
  if (!promise) {
    promise = openStore(id).catch((error: unknown) => {
      stores.delete(id);
      throw error;
    });
    stores.set(id, promise);
  }
  return promise;
}
export async function deletePlannerData(userId: string): Promise<void> {
  const id = identifier(userId), existing = stores.get(id);
  if (existing) await (await existing).destroy();
  else {
    try {
      await deleteDatabaseAsync(databaseName(id));
    } catch (error) {
      if (
        !error || typeof error !== 'object' || !('code' in error) ||
        error.code !== 'ERR_DATABASE_NOT_FOUND'
      ) throw error;
    }
    await SecureStore.deleteItemAsync(keyName(id));
  }
  stores.delete(id);
}
export async function closePlannerData(userId: string): Promise<void> {
  const id = identifier(userId), existing = stores.get(id);
  if (existing) await (await existing).close();
  stores.delete(id);
}

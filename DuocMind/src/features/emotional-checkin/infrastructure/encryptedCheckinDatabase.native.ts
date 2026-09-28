import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { deleteDatabaseAsync, openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';

import { LocalCheckinStore } from '../application/localCheckinStore';
import { getOrCreateSecureDatabaseKey } from './secureDatabaseKey';

const DATABASE_PREFIX = 'duocmind-emotional-checkins';
const DATABASE_KEY_PREFIX = 'duocmind.sqlcipher.key.v1';
const storePromises = new Map<string, Promise<LocalCheckinStore>>();

async function openEncryptedDatabase(userId: string): Promise<SQLiteDatabase> {
  const database = await openDatabaseAsync(`${DATABASE_PREFIX}-${userId}.db`);
  const key = await getOrCreateSecureDatabaseKey(
    SecureStore,
    () => Array.from(Crypto.getRandomBytes(32), (byte) => byte.toString(16).padStart(2, '0')).join(''),
    `${DATABASE_KEY_PREFIX}.${userId}`,
  );
  await database.execAsync(`PRAGMA key = "x'${key}'";`);

  const cipher = await database.getFirstAsync<{ cipher_version: string }>('PRAGMA cipher_version;');
  if (!cipher?.cipher_version) {
    await database.closeAsync();
    throw new Error('El almacenamiento cifrado requiere un build nativo con SQLCipher.');
  }

  await database.execAsync('PRAGMA journal_mode = WAL;');
  return database;
}

export function getLocalCheckinStore(userId: string): Promise<LocalCheckinStore> {
  if (!/^[0-9a-f-]{36}$/i.test(userId)) {
    return Promise.reject(new Error('No se pudo identificar la cuenta para el almacenamiento local.'));
  }

  let storePromise = storePromises.get(userId);
  if (!storePromise) {
    storePromise = openEncryptedDatabase(userId)
      .then(async (database) => {
        const store = new LocalCheckinStore(database);
        await store.initialize();
        return store;
      })
      .catch((error: unknown) => {
        storePromises.delete(userId);
        throw error;
      });
    storePromises.set(userId, storePromise);
  }

  return storePromise;
}

export async function deleteLocalCheckinData(userId: string): Promise<void> {
  if (!/^[0-9a-f-]{36}$/i.test(userId)) {
    throw new Error('No se pudo identificar la cuenta para eliminar los datos locales.');
  }

  const storePromise = storePromises.get(userId);
  if (storePromise) await (await storePromise).close();
  await deleteDatabaseAsync(`${DATABASE_PREFIX}-${userId}.db`);
  await SecureStore.deleteItemAsync(`${DATABASE_KEY_PREFIX}.${userId}`);
  await SecureStore.deleteItemAsync(`duocmind.student-profile-verified.v1.${userId}`);
  storePromises.delete(userId);
}
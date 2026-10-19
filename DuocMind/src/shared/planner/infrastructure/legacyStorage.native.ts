import * as Crypto from 'expo-crypto';
import { openDatabaseAsync } from 'expo-sqlite';
import { legacyCatalog, type LegacyGateway } from '../application/legacyActivities';
export const legacyGateway: LegacyGateway = {
  async list() {
    const db = await openDatabaseAsync('duocmind-agenda.db');
    try {
      const table = await db.getFirstAsync(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='agenda_activities'",
      );
      const values = table
        ? await db.getAllAsync('SELECT id,date,title,subject,time FROM agenda_activities')
        : [];
      return await legacyCatalog(
        values,
        (value) => Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, value),
      );
    } finally {
      await db.closeAsync();
    }
  },
};

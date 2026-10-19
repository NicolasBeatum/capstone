import * as Crypto from 'expo-crypto';
import { legacyCatalog, type LegacyGateway } from '../application/legacyActivities';
export const legacyGateway: LegacyGateway = {
  async list() {
    const raw = window.localStorage.getItem('duocmind.agenda.activities.v1');
    return legacyCatalog(
      raw ? JSON.parse(raw) as unknown : [],
      (value) => Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, value),
    );
  },
};

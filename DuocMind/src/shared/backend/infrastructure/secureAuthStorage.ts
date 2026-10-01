import type { SupportedStorage } from '@supabase/supabase-js';

export interface SecureStoreAdapter {
  getItemAsync(key: string): Promise<string | null>;
  setItemAsync(key: string, value: string): Promise<void>;
  deleteItemAsync(key: string): Promise<void>;
}

const MAX_SECURE_VALUE_BYTES = 1600;
let nextVersion = 0;
type SecureManifest = { version: string; count: number };

function utf8ByteLength(character: string): number {
  const codePoint = character.codePointAt(0) ?? 0;
  if (codePoint <= 0x7f) return 1;
  if (codePoint <= 0x7ff) return 2;
  if (codePoint <= 0xffff) return 3;
  return 4;
}

function splitValue(value: string): string[] {
  const chunks: string[] = [];
  let chunk = '';
  let chunkBytes = 0;

  for (const character of value) {
    const characterBytes = utf8ByteLength(character);
    if (chunkBytes + characterBytes > MAX_SECURE_VALUE_BYTES) {
      chunks.push(chunk);
      chunk = '';
      chunkBytes = 0;
    }
    chunk += character;
    chunkBytes += characterBytes;
  }

  if (chunk || chunks.length === 0) chunks.push(chunk);
  return chunks;
}

function parseManifest(value: string | null): { version: string; count: number } | null {
  const match = value?.match(/^v1:([a-z0-9-]+):(\d+)$/i);
  if (!match) return null;
  const count = Number(match[2]);
  return Number.isSafeInteger(count) && count > 0 ? { version: match[1], count } : null;
}

function parseRetiredManifests(value: string | null): SecureManifest[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((entry): entry is SecureManifest =>
      typeof entry === 'object' && entry !== null &&
      'version' in entry && typeof entry.version === 'string' &&
      'count' in entry && typeof entry.count === 'number' &&
      Number.isSafeInteger(entry.count) && entry.count > 0,
    );
  } catch {
    return [];
  }
}

async function deleteChunks(
  adapter: SecureStoreAdapter,
  key: string,
  manifest: { version: string; count: number } | null,
): Promise<void> {
  if (!manifest) return;
  await Promise.all(Array.from({ length: manifest.count }, (_, index) =>
    adapter.deleteItemAsync(`${key}.chunk.${manifest.version}.${index}`),
  ));
}

export function createSecureAuthStorage(adapter: SecureStoreAdapter): SupportedStorage {
  return {
    async getItem(key) {
      const manifest = parseManifest(await adapter.getItemAsync(`${key}.manifest`));
      if (!manifest) return adapter.getItemAsync(key);

      const chunks = await Promise.all(
        Array.from({ length: manifest.count }, (_, index) =>
          adapter.getItemAsync(`${key}.chunk.${manifest.version}.${index}`),
        ),
      );
      if (chunks.some((chunk) => chunk === null)) {
        throw new Error('La sesión segura está incompleta y no se puede restaurar.');
      }
      return chunks.join('');
    },
    async setItem(key, value) {
      const manifestKey = `${key}.manifest`;
      const pendingKey = `${key}.pending`;
      const retiredKey = `${key}.retired`;
      const previousManifest = parseManifest(await adapter.getItemAsync(manifestKey));
      const pendingManifest = parseManifest(await adapter.getItemAsync(pendingKey));
      const retiredManifests = parseRetiredManifests(await adapter.getItemAsync(retiredKey));
      if (pendingManifest && pendingManifest.version !== previousManifest?.version) {
        await deleteChunks(adapter, key, pendingManifest);
      }
      await adapter.deleteItemAsync(pendingKey);

      const version = `${Date.now().toString(36)}-${(++nextVersion).toString(36)}`;
      const chunks = splitValue(value);

      await adapter.setItemAsync(pendingKey, `v1:${version}:${chunks.length}`);
      await Promise.all(chunks.map((chunk, index) =>
        adapter.setItemAsync(`${key}.chunk.${version}.${index}`, chunk),
      ));
      const manifestsToRetire = [...retiredManifests, ...(previousManifest ? [previousManifest] : [])]
        .filter((manifest, index, manifests) =>
          manifest.version !== version && manifests.findIndex((item) => item.version === manifest.version) === index,
        );
      if (manifestsToRetire.length > 0) {
        await adapter.setItemAsync(retiredKey, JSON.stringify(manifestsToRetire));
      }
      await adapter.setItemAsync(manifestKey, `v1:${version}:${chunks.length}`);
      await adapter.deleteItemAsync(pendingKey);
      await adapter.deleteItemAsync(key);

      for (const retired of manifestsToRetire) await deleteChunks(adapter, key, retired);
      await adapter.deleteItemAsync(retiredKey);
    },
    async removeItem(key) {
      const manifestKey = `${key}.manifest`;
      const pendingKey = `${key}.pending`;
      const retiredKey = `${key}.retired`;
      const manifest = parseManifest(await adapter.getItemAsync(manifestKey));
      const pendingManifest = parseManifest(await adapter.getItemAsync(pendingKey));
      const retiredManifests = parseRetiredManifests(await adapter.getItemAsync(retiredKey));
      await deleteChunks(adapter, key, manifest);
      if (pendingManifest?.version !== manifest?.version) {
        await deleteChunks(adapter, key, pendingManifest);
      }
      for (const retired of retiredManifests) {
        if (retired.version !== manifest?.version && retired.version !== pendingManifest?.version) {
          await deleteChunks(adapter, key, retired);
        }
      }
      await adapter.deleteItemAsync(manifestKey);
      await adapter.deleteItemAsync(pendingKey);
      await adapter.deleteItemAsync(retiredKey);
      await adapter.deleteItemAsync(key);
    },
  };
}
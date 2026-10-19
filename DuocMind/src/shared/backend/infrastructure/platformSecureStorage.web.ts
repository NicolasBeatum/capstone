import type { SupportedStorage } from '@supabase/supabase-js';

export interface WebKeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const fallbackMemoryStorage = new Map<string, string>();

export function createWebSessionStorage(storage: WebKeyValueStorage | undefined) {
  return {
    getItem: async (key: string) => storage?.getItem(key) ?? fallbackMemoryStorage.get(key) ?? null,
    setItem: async (key: string, value: string) => {
      if (storage) storage.setItem(key, value);
      else fallbackMemoryStorage.set(key, value);
    },
    deleteItem: async (key: string) => {
      storage?.removeItem(key);
      fallbackMemoryStorage.delete(key);
    },
  };
}

function getBrowserSessionStorage(): WebKeyValueStorage | undefined {
  try {
    return typeof window === 'undefined' ? undefined : window.sessionStorage;
  } catch {
    return undefined;
  }
}

export const webSessionStorage = createWebSessionStorage(getBrowserSessionStorage());

export const platformAuthStorage: SupportedStorage = {
  getItem: webSessionStorage.getItem,
  setItem: webSessionStorage.setItem,
  removeItem: webSessionStorage.deleteItem,
};

export const platformSecureKeyValueStorage = {
  getItem: webSessionStorage.getItem,
  setItem: webSessionStorage.setItem,
  deleteItem: webSessionStorage.deleteItem,
};
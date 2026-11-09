import type { ResourceCache } from '../application/resourceCatalog.ts';
import { decodeCacheDocument, encodeCacheDocument } from './resourceCacheDocument.ts';

export interface ResourceWebStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const STORAGE_KEY = 'duocmind.wellness.resources.v1';

/**
 * Copia local para la previsualización web. El contenido es público y no tiene datos
 * personales, así que no se asocia a una cuenta. Sin almacenamiento disponible se comporta
 * como vacía: leer devuelve null y escribir falla, y el caso de uso ignora ese fallo.
 */
export function createWebResourceCache(storage: () => ResourceWebStorage | null): ResourceCache {
  return {
    async read() {
      try {
        const store = storage();
        return store ? decodeCacheDocument(store.getItem(STORAGE_KEY)) : null;
      } catch {
        return null;
      }
    },
    async write(catalog, fetchedAt) {
      const store = storage();
      if (!store) throw new Error('El almacenamiento de recursos no está disponible.');
      // Si setItem falla (p. ej. cuota llena), el valor anterior queda intacto.
      store.setItem(STORAGE_KEY, encodeCacheDocument(catalog, fetchedAt));
    },
  };
}

export const resourceCache: ResourceCache = createWebResourceCache(() => {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
});

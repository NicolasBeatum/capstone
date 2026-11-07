import { REFRESH_MIN_INTERVAL_MS, shouldRefresh } from '../application/resourceCatalog.ts';
import type { CatalogResult } from '../application/resourceCatalog.ts';

export interface CatalogState {
  /** Último resultado; null hasta que termina la primera carga. */
  result: CatalogResult | null;
  loading: boolean;
}

export interface ResourceCatalogStore {
  subscribe(listener: () => void): () => void;
  getSnapshot(): CatalogState;
  /**
   * Descarga si hace falta. Reutiliza la descarga en curso y, sin `force`, respeta el intervalo
   * mínimo desde el último intento (con éxito o no) para no repetirla al volver del detalle o
   * mientras no hay conexión.
   */
  refresh(options?: { force?: boolean }): Promise<void>;
}

/**
 * Estado compartido en memoria entre la lista y el detalle. Mientras se actualiza se conserva el
 * último resultado, y un error nunca reemplaza un resultado ya disponible.
 */
export function createResourceCatalogStore(deps: {
  load: () => Promise<CatalogResult>;
  now: () => number;
  minIntervalMs?: number;
}): ResourceCatalogStore {
  const { load, now, minIntervalMs = REFRESH_MIN_INTERVAL_MS } = deps;
  let state: CatalogState = { result: null, loading: false };
  let lastAttemptAtMs: number | null = null;
  let inFlight: Promise<void> | null = null;
  const listeners = new Set<() => void>();

  const publish = (next: CatalogState) => {
    state = next;
    for (const listener of [...listeners]) listener();
  };

  const run = async (): Promise<void> => {
    publish({ ...state, loading: true });
    let result: CatalogResult;
    try {
      result = await load();
    } catch {
      result = { status: 'error' };
    }
    lastAttemptAtMs = now();
    const keepPrevious = result.status === 'error' && state.result !== null && state.result.status !== 'error';
    publish({ result: keepPrevious ? state.result : result, loading: false });
  };

  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot: () => state,
    refresh(options) {
      if (inFlight) return inFlight;
      if (!options?.force && state.result !== null && !shouldRefresh(lastAttemptAtMs, now(), minIntervalMs)) {
        return Promise.resolve();
      }
      inFlight = run().finally(() => {
        inFlight = null;
      });
      return inFlight;
    },
  };
}

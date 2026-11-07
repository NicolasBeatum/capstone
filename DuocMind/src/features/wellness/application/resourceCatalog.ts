import type { ResourceCatalog } from '../domain/wellnessResource.ts';

/** Obtiene el catálogo ya validado; lanza ante un fallo de red o una respuesta malformada. */
export interface ResourceGateway {
  fetchCatalog(): Promise<ResourceCatalog>;
}

export interface StoredCatalog {
  catalog: ResourceCatalog;
  /** Momento de la descarga que originó la copia (ISO 8601). */
  fetchedAt: string;
}

export interface ResourceCache {
  /** Devuelve la copia o null si no hay o es ilegible. */
  read(): Promise<StoredCatalog | null>;
  write(catalog: ResourceCatalog, fetchedAt: string): Promise<void>;
}

export type CatalogSource = 'remote' | 'cache';

export type CatalogResult =
  | { status: 'ready'; catalog: ResourceCatalog; source: CatalogSource; fetchedAt: string }
  | { status: 'empty'; source: CatalogSource; fetchedAt: string }
  | { status: 'error' };

/** Un enfoque dentro de este margen no vuelve a descargar (p. ej. al volver del detalle). */
export const REFRESH_MIN_INTERVAL_MS = 60_000;

/**
 * Tiempo máximo de espera de la descarga. Si una red se cuelga en lugar de fallar, pasado este plazo
 * se usa la copia en vez de dejar la sección cargando indefinidamente.
 */
export const REQUEST_TIMEOUT_MS = 8_000;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Tiempo de espera agotado.')), timeoutMs);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

function isCatalog(value: unknown): value is ResourceCatalog {
  return (
    typeof value === 'object' &&
    value !== null &&
    Array.isArray((value as ResourceCatalog).categories) &&
    Array.isArray((value as ResourceCatalog).resources)
  );
}

function toResult(catalog: ResourceCatalog, source: CatalogSource, fetchedAt: string): CatalogResult {
  return catalog.resources.length === 0
    ? { status: 'empty', source, fetchedAt }
    : { status: 'ready', catalog, source, fetchedAt };
}

/**
 * Descarga el catálogo y lo guarda como copia local. Si la descarga falla, o devuelve algo que
 * no es un catálogo, usa la última copia válida. Ningún fallo borra ni reemplaza la copia, y un
 * error al escribirla no invalida lo descargado. No registra nada de lo que ocurre.
 */
export async function loadResourceCatalog(deps: {
  gateway: ResourceGateway;
  cache: ResourceCache;
  now: () => Date;
  timeoutMs?: number;
}): Promise<CatalogResult> {
  const { gateway, cache, now, timeoutMs = REQUEST_TIMEOUT_MS } = deps;

  let downloaded: ResourceCatalog | null = null;
  try {
    const candidate: unknown = await withTimeout(gateway.fetchCatalog(), timeoutMs);
    if (isCatalog(candidate)) downloaded = candidate;
  } catch {
    // Sin red, red colgada o respuesta malformada: se usa la copia, si existe.
  }

  if (downloaded) {
    const fetchedAt = now().toISOString();
    try {
      await cache.write(downloaded, fetchedAt);
    } catch {
      // La copia es un respaldo: lo descargado se muestra igual.
    }
    return toResult(downloaded, 'remote', fetchedAt);
  }

  try {
    const stored = await cache.read();
    if (stored && isCatalog(stored.catalog) && typeof stored.fetchedAt === 'string') {
      return toResult(stored.catalog, 'cache', stored.fetchedAt);
    }
  } catch {
    // Copia ilegible: se trata como inexistente.
  }
  return { status: 'error' };
}

/**
 * Decide si un enfoque debe volver a descargar. Sin descarga previa, o con un reloj que se
 * movió hacia atrás o un valor inválido, descarga.
 */
export function shouldRefresh(
  lastFetchedAtMs: number | null,
  nowMs: number,
  minIntervalMs: number = REFRESH_MIN_INTERVAL_MS,
): boolean {
  if (lastFetchedAtMs === null || !Number.isFinite(lastFetchedAtMs) || !Number.isFinite(nowMs)) return true;
  const elapsed = nowMs - lastFetchedAtMs;
  return elapsed < 0 || elapsed >= minIntervalMs;
}

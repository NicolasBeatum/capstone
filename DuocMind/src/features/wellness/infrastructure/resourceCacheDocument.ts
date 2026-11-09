import type { StoredCatalog } from '../application/resourceCatalog.ts';
import { parseCatalog, serializeCatalog } from '../domain/wellnessResource.ts';
import type { ResourceCatalog } from '../domain/wellnessResource.ts';

/* Formato de la copia local, común a Android (SQLite) y web (localStorage): un único documento
 * JSON con la forma del servidor, validado al leer con el mismo `parseCatalog` que la descarga. */
const SCHEMA = 1;

export function encodeCacheDocument(catalog: ResourceCatalog, fetchedAt: string): string {
  return JSON.stringify({ schema: SCHEMA, fetchedAt, catalog: serializeCatalog(catalog) });
}

/** Devuelve la copia, o null si el texto es ilegible, de otra versión o tiene un catálogo inválido. */
export function decodeCacheDocument(text: unknown): StoredCatalog | null {
  if (typeof text !== 'string') return null;
  try {
    const document: unknown = JSON.parse(text);
    if (typeof document !== 'object' || document === null) return null;
    const { schema, fetchedAt, catalog } = document as Record<string, unknown>;
    if (schema !== SCHEMA) return null;
    if (typeof fetchedAt !== 'string' || Number.isNaN(Date.parse(fetchedAt))) return null;
    return { catalog: parseCatalog(catalog), fetchedAt };
  } catch {
    return null;
  }
}

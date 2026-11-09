import { parseReasonCatalog, type CheckinReason } from '../domain/checkinReasons.ts';

/** Lee las filas crudas de `motivo`; la validación ocurre en el dominio. */
export interface ReasonCatalogGateway {
  fetchReasonCatalog(): Promise<unknown>;
}

export interface ReasonCatalogCache {
  saveReasonCatalog(reasons: readonly CheckinReason[]): Promise<void>;
  listReasonCatalog(): Promise<CheckinReason[]>;
}

/**
 * Descarga el catálogo y actualiza la copia local. Si no hay red o la respuesta no es
 * válida, devuelve la última copia; sin copia, una lista vacía (el check-in sigue sin motivos).
 */
export async function loadReasonCatalog(
  local: ReasonCatalogCache,
  remote: ReasonCatalogGateway,
): Promise<CheckinReason[]> {
  try {
    const reasons = parseReasonCatalog(await remote.fetchReasonCatalog());
    if (reasons) {
      await local.saveReasonCatalog(reasons);
      return reasons;
    }
  } catch {
    // Sin conexión se usa la copia local.
  }
  try {
    return await local.listReasonCatalog();
  } catch {
    return [];
  }
}

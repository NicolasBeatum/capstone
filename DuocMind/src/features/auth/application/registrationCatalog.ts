import type { Career } from '../domain/registration.ts';

export interface RegistrationCatalogGateway {
  /** Carreras del catálogo institucional; lanza si no se pudieron obtener. */
  fetch(): Promise<{ careers: Career[] }>;
}

export interface RegistrationCatalog {
  careers: Career[];
  /** No se pudo obtener el catálogo, o llegó vacío y no hay nada que elegir. */
  failed: boolean;
}

/** Catálogo para el registro. Nunca lanza: un fallo se informa con `failed` para poder reintentar. */
export async function loadRegistrationCatalog(gateway: RegistrationCatalogGateway): Promise<RegistrationCatalog> {
  try {
    const { careers } = await gateway.fetch();
    return { careers, failed: careers.length === 0 };
  } catch {
    return { careers: [], failed: true };
  }
}

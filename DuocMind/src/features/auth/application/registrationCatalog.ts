import type { Campus, Career } from '../domain/registration.ts';

export interface RegistrationCatalogGateway {
  /** Sedes y carreras del catálogo institucional; lanza si no se pudieron obtener. */
  fetch(): Promise<{ campuses: Campus[]; careers: Career[] }>;
}

export interface RegistrationCatalog {
  campuses: Campus[];
  careers: Career[];
  /** No se pudo obtener el catálogo, o llegó vacío y no hay nada que elegir. */
  failed: boolean;
}

/** Catálogo para el registro. Nunca lanza: un fallo se informa con `failed` para poder reintentar. */
export async function loadRegistrationCatalog(gateway: RegistrationCatalogGateway): Promise<RegistrationCatalog> {
  try {
    const { campuses, careers } = await gateway.fetch();
    return { campuses, careers, failed: campuses.length === 0 || careers.length === 0 };
  } catch {
    return { campuses: [], careers: [], failed: true };
  }
}

import type { SubjectCache } from '../../../shared/subjects/application/subjectCache.ts';
import type { AgendaSubject } from '../../../shared/subjects/domain/subject.ts';

export interface SubjectGateway {
  /** Cuenta con sesión, leída localmente; null sin sesión. */
  getOwnerId(): Promise<string | null>;
  /** Asignaturas de la carrera vigente de la cuenta; lanza si no se pudieron obtener. */
  fetch(): Promise<AgendaSubject[]>;
}

export interface SubjectCatalog {
  subjects: AgendaSubject[];
  /** La lista viene de la copia local porque no hubo conexión: puede no estar al día. */
  stale: boolean;
  /** No se pudo obtener ni había copia. */
  failed: boolean;
}

/**
 * Asignaturas de la cuenta con sesión. Con conexión actualiza la copia local; sin ella
 * usa la última copia. Un fallo de red nunca borra la copia previa.
 */
export async function loadSubjectCatalog(deps: { gateway: SubjectGateway; cache: SubjectCache }): Promise<SubjectCatalog> {
  const { gateway, cache } = deps;
  let ownerId: string | null;
  try {
    ownerId = await gateway.getOwnerId();
  } catch {
    return { subjects: [], stale: false, failed: true };
  }
  if (!ownerId) return { subjects: [], stale: false, failed: false };

  try {
    const subjects = await gateway.fetch();
    try {
      await cache.write(ownerId, subjects);
    } catch {
      // Sin copia local no se pierde la lista recién descargada.
    }
    return { subjects, stale: false, failed: false };
  } catch {
    try {
      const saved = await cache.read(ownerId);
      if (saved) return { subjects: saved, stale: true, failed: false };
    } catch {
      // Una copia ilegible se trata como ausente.
    }
    return { subjects: [], stale: false, failed: true };
  }
}

import { parseSubjects, type AgendaSubject } from '../domain/subject.ts';

export interface KeyValueStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  deleteItem(key: string): Promise<void>;
}

export interface SubjectCache {
  read(ownerId: string): Promise<AgendaSubject[] | null>;
  write(ownerId: string, subjects: AgendaSubject[]): Promise<void>;
  clear(ownerId: string): Promise<void>;
}

const KEY_PREFIX = 'duocmind.agenda.subjects.v1.';
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Solo se aceptan UUID: el identificador forma parte de la clave de almacenamiento.
function keyFor(ownerId: string): string {
  if (typeof ownerId !== 'string' || !UUID_PATTERN.test(ownerId)) throw new Error('Identificador de cuenta no válido.');
  return `${KEY_PREFIX}${ownerId.toLowerCase()}`;
}

/** Última lista de asignaturas descargada, una por cuenta. Un dato corrupto se lee como ausente. */
export function createSubjectCache(storage: KeyValueStorage): SubjectCache {
  return {
    async read(ownerId) {
      const raw = await storage.getItem(keyFor(ownerId));
      if (raw === null) return null;
      try {
        return parseSubjects(JSON.parse(raw));
      } catch {
        return null;
      }
    },
    async write(ownerId, subjects) {
      await storage.setItem(keyFor(ownerId), JSON.stringify(parseSubjects(subjects)));
    },
    async clear(ownerId) {
      await storage.deleteItem(keyFor(ownerId));
    },
  };
}

export interface KeyValueStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  deleteItem(key: string): Promise<void>;
}

/** Entrega la cuenta con sesión; lanza si no puede leerla. */
export interface TutorialOwnerGateway {
  currentOwner(): Promise<string | null>;
}

export interface TutorialProgressStore {
  isSeen(ownerId: string): Promise<boolean>;
  markSeen(ownerId: string): Promise<void>;
  clear(ownerId: string): Promise<void>;
}

const KEY_PREFIX = 'duocmind.tutorial.seen.v1.';
const SEEN_VALUE = 'seen';
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Devuelve el identificador normalizado, o null si no es un UUID. */
export function normalizeOwnerId(ownerId: unknown): string | null {
  return typeof ownerId === 'string' && UUID_PATTERN.test(ownerId) ? ownerId.toLowerCase() : null;
}

// Solo se aceptan UUID: el identificador forma parte de la clave de almacenamiento.
function keyFor(ownerId: string): string {
  const owner = normalizeOwnerId(ownerId);
  if (!owner) throw new Error('Identificador de cuenta no válido.');
  return `${KEY_PREFIX}${owner}`;
}

/** Guarda únicamente si cada cuenta ya vio el tutorial; no conserva ningún otro dato. */
export function createTutorialProgressStore(storage: KeyValueStorage): TutorialProgressStore {
  return {
    async isSeen(ownerId) {
      return (await storage.getItem(keyFor(ownerId))) === SEEN_VALUE;
    },
    async markSeen(ownerId) {
      await storage.setItem(keyFor(ownerId), SEEN_VALUE);
    },
    async clear(ownerId) {
      await storage.deleteItem(keyFor(ownerId));
    },
  };
}

/**
 * Decide si el tutorial se ofrece de forma automática. Devuelve la cuenta a la que
 * pertenece el recorrido o null si no debe mostrarse: sin cuenta, identificador
 * inválido, ya visto o cualquier error de lectura. Ante la duda no se muestra;
 * la persona puede iniciarlo a mano.
 */
export async function resolveTutorialOffer(
  owners: TutorialOwnerGateway,
  store: TutorialProgressStore,
): Promise<string | null> {
  try {
    const owner = normalizeOwnerId(await owners.currentOwner());
    if (!owner) return null;
    return (await store.isSeen(owner)) ? null : owner;
  } catch {
    return null;
  }
}

/**
 * Registra que la cuenta indicada ya vio el tutorial. Un fallo de escritura no se
 * propaga: el recorrido se cierra igual y se ofrecerá de nuevo en el siguiente acceso.
 */
export async function completeTutorial(store: TutorialProgressStore, ownerId: string): Promise<void> {
  try {
    await store.markSeen(ownerId);
  } catch {
    // Sin registrar el error: contiene el identificador de la cuenta.
  }
}

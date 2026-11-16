import { platformSecureKeyValueStorage } from '@/shared/backend/infrastructure/platformSecureStorage';
import { createLastStressTestStore } from '../application/lastStressTest';

export const lastStressTestStore = createLastStressTestStore(platformSecureKeyValueStorage);

/** Borra la copia local al eliminar la cuenta; es de mejor esfuerzo. */
export async function deleteLastStressTest(ownerId: string): Promise<void> {
  try {
    await lastStressTestStore.clear(ownerId);
  } catch {
    // Sin registrar el error: contiene el identificador de la cuenta.
  }
}

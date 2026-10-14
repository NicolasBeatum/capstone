import { platformSecureKeyValueStorage } from '@/shared/backend/infrastructure/platformSecureStorage';
import { createTutorialProgressStore } from '../application/tutorialProgress';

/* SecureStore en Android; sessionStorage en la previsualización web. */
export const tutorialProgressStore = createTutorialProgressStore(platformSecureKeyValueStorage);

/**
 * Elimina la marca de una cuenta al borrarla. Es de mejor esfuerzo: la marca no es
 * sensible y su fallo no debe abortar la eliminación de la cuenta.
 */
export async function deleteTutorialProgress(ownerId: string): Promise<void> {
  try {
    await tutorialProgressStore.clear(ownerId);
  } catch {
    // Sin registrar el error: contiene el identificador de la cuenta.
  }
}

import { platformSecureKeyValueStorage } from '@/shared/backend/infrastructure/platformSecureStorage';
import { createSubjectCache } from '../application/subjectCache';

/* SecureStore en Android; sessionStorage en la previsualización web. */
export const subjectCache = createSubjectCache(platformSecureKeyValueStorage);

/**
 * Elimina la lista de una cuenta al borrarla. Es de mejor esfuerzo: la lista no es
 * sensible y su fallo no debe abortar la eliminación de la cuenta.
 */
export async function deleteSubjectCache(ownerId: string): Promise<void> {
  try {
    await subjectCache.clear(ownerId);
  } catch {
    // Sin registrar el error: contiene el identificador de la cuenta.
  }
}

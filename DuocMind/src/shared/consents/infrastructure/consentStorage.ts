import { platformSecureKeyValueStorage } from '@/shared/backend/infrastructure/platformSecureStorage';
import { createConsentStore } from '../application/consentStore';

/* SecureStore en Android; almacenamiento de sesión en la previsualización web. */
export const consentStore = createConsentStore(platformSecureKeyValueStorage);

/**
 * Elimina el estado de una cuenta al borrarla. Es de mejor esfuerzo: un fallo local no
 * debe abortar la eliminación de la cuenta.
 */
export async function deleteConsentData(ownerId: string): Promise<void> {
  try {
    await consentStore.clear(ownerId);
  } catch {
    // Sin registrar el error: contiene el identificador de la cuenta.
  }
}

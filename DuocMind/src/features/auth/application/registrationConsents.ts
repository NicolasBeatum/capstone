import type { ConsentStore } from '../../../shared/consents/application/consentStore.ts';
import type { ConsentChoices } from '../../../shared/consents/domain/consents.ts';

/**
 * Conserva en el dispositivo lo elegido en el registro, que ocurre antes de tener cuenta
 * activa. Es de mejor esfuerzo: un fallo no debe impedir que la persona se registre.
 */
export async function rememberRegistrationConsents(store: ConsentStore, choices: ConsentChoices): Promise<void> {
  try {
    await store.savePending(choices);
  } catch {
    // Sin registrar el error: la configuración quedará desactivada.
  }
}

/**
 * Al completar el perfil pasa lo elegido en el registro a la cuenta. Es de mejor
 * esfuerzo: si falla, la configuración queda desactivada y la persona puede cambiarla.
 */
export async function adoptRegistrationConsents(
  gateway: { getCurrentUserId(): Promise<string | null> },
  store: ConsentStore,
): Promise<void> {
  try {
    const ownerId = await gateway.getCurrentUserId();
    if (ownerId) await store.adoptPending(ownerId);
  } catch {
    // Sin registrar el error: contiene el identificador de la cuenta.
  }
}

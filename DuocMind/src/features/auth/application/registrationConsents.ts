import { loadConsents, type RemoteConsentGateway } from '../../../shared/consents/application/consentSettings.ts';
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
 * Al completar el perfil pasa lo elegido en el registro a la cuenta y lo envía al servidor
 * mediante la reconciliación. Es de mejor esfuerzo: si falla, el registro continúa y lo
 * aceptado se reintenta al volver a entrar a la app.
 */
export async function adoptRegistrationConsents(
  gateway: { getCurrentUserId(): Promise<string | null> },
  store: ConsentStore,
  remote: RemoteConsentGateway,
): Promise<void> {
  try {
    const ownerId = await gateway.getCurrentUserId();
    if (!ownerId) return;
    await store.adoptPending(ownerId);
    await loadConsents({ owners: { currentOwner: async () => ownerId }, store, remote });
  } catch {
    // Sin registrar el error: contiene el identificador de la cuenta.
  }
}

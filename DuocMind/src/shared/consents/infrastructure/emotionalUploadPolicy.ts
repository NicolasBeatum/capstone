import { canUploadEmotionalData } from '../application/consentSettings';
import { consentOwnerGateway } from './consentOwnerGateway';
import { consentStore } from './consentStorage';

/** Permiso vigente para enviar check-in y tests al servidor, según los consentimientos de la cuenta. */
export function canUploadEmotionalDataNow(): Promise<boolean> {
  return canUploadEmotionalData({ owners: consentOwnerGateway, store: consentStore });
}

export interface ConsentChoices {
  /** Entregar datos de forma anónima para dashboards de estrés por carrera y semestre. */
  shareAnonymousData: boolean;
  /** Ser contactado con los datos registrados en caso de emergencia. */
  allowEmergencyContact: boolean;
}

export type ConsentKey = keyof ConsentChoices;

export const NO_CONSENTS: ConsentChoices = { shareAnonymousData: false, allowEmergencyContact: false };

/** Textos de cada consentimiento, compartidos por el registro y la configuración. */
export const CONSENT_TEXT: Record<ConsentKey, string> = {
  shareAnonymousData:
    'Acepto entregar mis datos de forma anónima para generar información no personal sobre el nivel de estrés por carrera y semestre.',
  allowEmergencyContact:
    'Autorizo que me contacten con los datos que registré en caso de emergencia, por niveles de estrés peligrosos.',
};

/** Versión breve de cada consentimiento para la casilla del registro; el detalle está en el documento de consentimientos. */
export const CONSENT_SHORT_TEXT: Record<ConsentKey, string> = {
  shareAnonymousData: 'Aceptar compartir datos anónimos',
  allowEmergencyContact: 'Aceptar que se le contacte en caso de emergencia',
};

/** Valida lo guardado en el dispositivo: cualquier dato inválido equivale a «desactivado». */
export function parseConsentChoices(raw: string | null): ConsentChoices {
  if (!raw) return NO_CONSENTS;
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object' || Array.isArray(value)) return NO_CONSENTS;
    const { shareAnonymousData, allowEmergencyContact } = value as Record<string, unknown>;
    return {
      shareAnonymousData: shareAnonymousData === true,
      allowEmergencyContact: allowEmergencyContact === true,
    };
  } catch {
    return NO_CONSENTS;
  }
}

export interface ConsentChoices {
  /** Entregar datos de forma anónima a Bienestar (código `analitica_anonima`). */
  shareAnonymousData: boolean;
  /** Ser contactado con los datos registrados en caso de emergencia. */
  allowEmergencyContact: boolean;
}

export type ConsentKey = keyof ConsentChoices;

/** Versión del texto de consentimiento que acepta la persona; se guarda con cada cambio. */
export const CONSENT_TEXT_VERSION = 'v1';

/** Código de cada consentimiento en el catálogo `consentimiento`; el id nunca se escribe a mano. */
export const CONSENT_CODES: Record<ConsentKey, string> = {
  shareAnonymousData: 'analitica_anonima',
  allowEmergencyContact: 'contacto',
};

export const NO_CONSENTS: ConsentChoices = { shareAnonymousData: false, allowEmergencyContact: false };

/** Texto breve de cada consentimiento, compartido por el registro y Mi perfil; el detalle está en el documento de consentimientos. */
export const CONSENT_TEXT: Record<ConsentKey, string> = {
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

/** Estado remoto vigente: solo las claves con fila; sin fila significa no otorgado. */
export type RemoteConsents = Partial<Record<ConsentKey, boolean>>;

/** Valida las filas de `estudiante_consentimiento_actual`; ignora lo que no reconoce. */
export function parseRemoteConsents(rows: unknown): RemoteConsents {
  if (!Array.isArray(rows)) throw new Error('Respuesta de consentimientos no válida.');
  const result: RemoteConsents = {};
  for (const row of rows) {
    if (!row || typeof row !== 'object') continue;
    const { codigo, otorgado } = row as Record<string, unknown>;
    if (typeof otorgado !== 'boolean') continue;
    for (const key of Object.keys(CONSENT_CODES) as ConsentKey[]) {
      if (CONSENT_CODES[key] === codigo) result[key] = otorgado;
    }
  }
  return result;
}
